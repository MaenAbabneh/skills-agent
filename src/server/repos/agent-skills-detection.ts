import type { GitHubRepo } from "@/lib/validations/github";
import type { AgentSkillMetadata } from "@/lib/validations/repo-metadata";
import {
	type DetectAgentSkillFilesResult,
	type DetectedAgentSkillFile,
	detectAgentSkillFiles,
} from "@/server/github/agent-skill-files";

export type AgentSkillDetectionStats = {
	candidatesPrefiltered: number;
	treeChecksAttempted: number;
	treeChecksSkipped: number;
	treeChecksTimedOut: number;
	treeChecksFailed: number;
	skillFilesFound: number;
};

export type AgentSkillDetectionContext = {
	detectForRepo: ({
		repo,
		querySources,
		force,
	}: {
		repo: GitHubRepo | AgentSkillDetectionRepo;
		querySources?: string[];
		force?: boolean;
	}) => Promise<DetectAgentSkillFilesResult>;
	getStats: () => AgentSkillDetectionStats;
};

export type AgentSkillDetectionRepo = {
	owner: {
		login: string;
	};
	name: string;
	full_name: string;
	description: string | null;
	topics?: string[];
	default_branch: string;
};

export type AgentSkillDetectionMetadata = AgentSkillMetadata & {
	skillDetected?: boolean;
	skillFileUrl?: string;
	skillFileName?: string;
	skillName?: string;
	skillFiles?: DetectedAgentSkillFile[];
	skillFileCount?: number;
	skillTreeTruncated?: boolean;
	skillDetectionError?: string;
};

const AGENT_SKILL_PREFILTER_TERMS = [
	"skill",
	"skills",
	"skill.md",
	"SKILL.md",
	".skills",
	".agents/skills",
	".claude/skills",
	"factory skills",
	"agent skill",
	"coding skill",
];

type LimitTask = {
	task: () => Promise<void>;
	reject: (error: unknown) => void;
};

function createConcurrencyLimiter(maxConcurrent: number) {
	const queue: LimitTask[] = [];
	let activeCount = 0;

	function runNext() {
		if (activeCount >= maxConcurrent) {
			return;
		}

		const next = queue.shift();

		if (!next) {
			return;
		}

		activeCount += 1;

		next
			.task()
			.catch(next.reject)
			.finally(() => {
				activeCount -= 1;
				runNext();
			});
	}

	return function limit<T>(task: () => Promise<T>) {
		return new Promise<T>((resolve, reject) => {
			queue.push({
				task: async () => {
					resolve(await task());
				},
				reject,
			});

			runNext();
		});
	};
}

function getRepoOwner(repo: GitHubRepo | AgentSkillDetectionRepo) {
	return repo.owner.login;
}

function getDetectionCacheKey(repo: GitHubRepo | AgentSkillDetectionRepo) {
	return `${getRepoOwner(repo)}/${repo.name}@${repo.default_branch || "main"}`;
}

function getRepoSkillSignalText({
	repo,
	querySources = [],
}: {
	repo: GitHubRepo | AgentSkillDetectionRepo;
	querySources?: string[];
}) {
	return [
		repo.name,
		repo.full_name,
		repo.description ?? "",
		...(repo.topics ?? []),
		...querySources,
	]
		.join(" ")
		.toLowerCase();
}

export function hasLikelyAgentSkillSignal({
	repo,
	querySources = [],
}: {
	repo: GitHubRepo | AgentSkillDetectionRepo;
	querySources?: string[];
}) {
	const text = getRepoSkillSignalText({ repo, querySources });

	return AGENT_SKILL_PREFILTER_TERMS.some((term) => text.includes(term));
}

export function createAgentSkillDetectionContext({
	concurrency = 4,
}: {
	concurrency?: number;
} = {}): AgentSkillDetectionContext {
	const cache = new Map<string, DetectAgentSkillFilesResult>();
	const inFlight = new Map<string, Promise<DetectAgentSkillFilesResult>>();
	const limit = createConcurrencyLimiter(Math.max(1, concurrency));

	const maxTreeChecks =
		Number(process.env.AGENT_SKILL_MAX_TREE_CHECKS_PER_RUN) || 40;
	const stats: AgentSkillDetectionStats = {
		candidatesPrefiltered: 0,
		treeChecksAttempted: 0,
		treeChecksSkipped: 0,
		treeChecksTimedOut: 0,
		treeChecksFailed: 0,
		skillFilesFound: 0,
	};

	async function detectForRepo({
		repo,
		querySources = [],
		force = false,
	}: {
		repo: GitHubRepo | AgentSkillDetectionRepo;
		querySources?: string[];
		force?: boolean;
	}) {
		if (!force && !hasLikelyAgentSkillSignal({ repo, querySources })) {
			stats.candidatesPrefiltered++;
			return {
				found: false,
				files: [],
				debugError: "Skipped tree detection: no likely agent skill signal.",
			};
		}

		const cacheKey = getDetectionCacheKey(repo);
		const cached = cache.get(cacheKey);

		if (cached) {
			return cached;
		}

		const existingInFlight = inFlight.get(cacheKey);

		if (existingInFlight) {
			return existingInFlight;
		}

		if (stats.treeChecksAttempted >= maxTreeChecks) {
			stats.treeChecksSkipped++;
			return {
				found: false,
				files: [],
				debugError: "tree_check_budget_exhausted",
			};
		}

		stats.treeChecksAttempted++;

		if (stats.treeChecksAttempted % 10 === 0) {
			console.log(
				`[Agent Skills] Tree checks in progress: ${stats.treeChecksAttempted} / ${maxTreeChecks}`,
			);
		}

		const promise = limit(() =>
			detectAgentSkillFiles({
				owner: getRepoOwner(repo),
				repo: repo.name,
				defaultBranch: repo.default_branch || "main",
			}),
		);

		inFlight.set(cacheKey, promise);

		try {
			const result = await promise;
			cache.set(cacheKey, result);

			if (result.debugError === "timeout") {
				stats.treeChecksTimedOut++;
			} else if (result.debugError) {
				stats.treeChecksFailed++;
			}

			if (result.found) {
				stats.skillFilesFound++;
			}

			return result;
		} finally {
			inFlight.delete(cacheKey);
		}
	}

	return {
		detectForRepo,
		getStats: () => stats,
	};
}

export function mergeAgentSkillMetadata({
	metadata,
	detection,
}: {
	metadata: AgentSkillMetadata;
	detection: DetectAgentSkillFilesResult;
}): AgentSkillDetectionMetadata {
	const primaryFile = detection.files[0];

	if (!detection.found || !primaryFile) {
		return {
			...metadata,
			skill: {
				...(metadata.skill ?? { exists: false }),
				exists: false,
				path: undefined,
				name: undefined,
			},
			skillDetected: false,
			skillFilePath: undefined,
			skillFileUrl: undefined,
			skillFileName: undefined,
			skillName: undefined,
			skillFiles: [],
			skillFileCount: 0,
			skillTreeTruncated: detection.truncated,
			skillDetectionError: detection.debugError,
		};
	}

	return {
		...metadata,
		skill: {
			...(metadata.skill ?? { exists: true }),
			exists: true,
			path: primaryFile.path,
			name: primaryFile.skillName,
		},
		skillDetected: true,
		skillFilePath: primaryFile.path,
		skillFileUrl: primaryFile.url,
		skillFileName: primaryFile.fileName,
		skillName: primaryFile.skillName,
		skillFiles: detection.files,
		skillFileCount: detection.files.length,
		skillTreeTruncated: detection.truncated,
		skillDetectionError: detection.debugError,
	};
}

export function hasAcceptedAgentSkillMetadata(
	metadata: AgentSkillDetectionMetadata,
) {
	return (
		metadata.skillDetected === true &&
		typeof metadata.skillFileUrl === "string" &&
		metadata.skillFileUrl.length > 0 &&
		Array.isArray(metadata.skillFiles) &&
		metadata.skillFiles.length > 0
	);
}

export function removeMissingAgentSkillFileReason(rejectionReasons: string[]) {
	return rejectionReasons.filter(
		(reason) => reason !== "missing_agent_skill_file",
	);
}

export function addMissingAgentSkillFileReason(rejectionReasons: string[]) {
	if (rejectionReasons.includes("missing_agent_skill_file")) {
		return rejectionReasons;
	}

	return [...rejectionReasons, "missing_agent_skill_file"];
}

export type { DetectedAgentSkillFile };
