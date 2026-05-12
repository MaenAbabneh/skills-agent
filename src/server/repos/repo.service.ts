import type { GitHubRepo } from "@/lib/validations/github";
import type { RepoSectionMetadata } from "@/lib/validations/repo-metadata";
import type {
	ClassificationSignal,
	RepoSection,
	RepoType,
	ScoreBreakdown,
	TypeScores,
} from "@/lib/validations/repos";
import { getRankingScore } from "@/server/common-scoring";
import type {
	ClassificationResult,
	SectionStrategy,
} from "@/server/sections/types";
import {
	type AgentSkillDetectionContext,
	addMissingAgentSkillFileReason,
	createAgentSkillDetectionContext,
	hasAcceptedAgentSkillMetadata,
	mergeAgentSkillMetadata,
	removeMissingAgentSkillFileReason,
} from "./agent-skills-detection";
import { buildRepoSectionMetadata } from "./repo.metadata";

export type ProcessedRepoForSection = {
	githubRepo: GitHubRepo;

	section: RepoSection;
	repoType: RepoType;

	classification: ClassificationResult;

	score: number;
	rankingScore: number;
	scoreBreakdown: ScoreBreakdown;

	rejectionReasons: string[];
	isAccepted: boolean;

	metadata: RepoSectionMetadata;
};

export type RepoRowLike = {
	repoSectionId: string;

	section: RepoSection;
	repoType: RepoType;

	score: number;
	scoreBreakdown: ScoreBreakdown;

	rejectionReasons: string[];
	isAccepted: boolean;
	status: string;

	metadata: RepoSectionMetadata;

	dbId: string;
	githubId: number;

	name: string;
	fullName: string;
	owner: string;

	description: string;
	url: string;
	homepage: string | null;

	stars: number;
	forks: number;
	openIssues: number;

	language: string | null;
	topics: string[];
	avatarUrl: string;

	archived: boolean;
	fork: boolean;

	githubCreatedAt: Date;
	githubUpdatedAt: Date;
	pushedAt: Date;

	syncedAt?: Date;
};

export async function processGitHubRepoForSection({
	repo,
	strategy,
	agentSkillDetectionContext,
	querySources,
}: {
	repo: GitHubRepo;
	strategy: SectionStrategy;
	agentSkillDetectionContext?: AgentSkillDetectionContext;
	querySources?: string[];
}): Promise<ProcessedRepoForSection> {
	const classification = strategy.classifyRepo(repo);
	const repoType = classification.repoType;

	const { score, scoreBreakdown } = strategy.calculateScore(
		repo,
		classification,
	);

	let rejectionReasons = strategy.getRejectionReasons({
		repo,
		relevance: scoreBreakdown.relevance,
		repoType,
		score,
		classification,
	});

	let metadata = buildRepoSectionMetadata({
		repo,
		section: strategy.id,
		repoType,
	});

	if (strategy.id === "agent-skills" && metadata.kind === "agent-skills") {
		const detectionContext =
			agentSkillDetectionContext ?? createAgentSkillDetectionContext();
		const detection = await detectionContext.detectForRepo({
			repo,
			querySources,
		});

		metadata = mergeAgentSkillMetadata({
			metadata,
			detection,
		});

		if (hasAcceptedAgentSkillMetadata(metadata)) {
			rejectionReasons = removeMissingAgentSkillFileReason(rejectionReasons);
			rejectionReasons = [];
		} else {
			if (metadata.skillDetectionError === "tree_check_budget_exhausted") {
				if (!rejectionReasons.includes("skill_detection_not_run")) {
					rejectionReasons.push("skill_detection_not_run");
				}
			} else {
				rejectionReasons = addMissingAgentSkillFileReason(rejectionReasons);
			}
		}
	}

	const hasBlockingRejection = rejectionReasons.some(
		(reason) =>
			reason.startsWith("wrong_repo_type_") ||
			reason === "missing_strong_3d_motion_tech_signal" ||
			reason === "missing_agent_skill_file" ||
			reason === "skill_detection_not_run" ||
			reason === "low_relevance",
	);

	let isAccepted =
		!hasBlockingRejection &&
		rejectionReasons.length === 0 &&
		score >= Math.max(45, strategy.minScore - 15);

	const rankingScore = getRankingScore({
		score,
		stars: repo.stargazers_count,
		forks: repo.forks_count,
	});

	if (metadata.kind === "agent-skills") {
		isAccepted = hasAcceptedAgentSkillMetadata(metadata);
	}

	return {
		githubRepo: repo,

		section: strategy.id,
		repoType,

		classification,

		score,
		rankingScore,
		scoreBreakdown,

		rejectionReasons,
		isAccepted,

		metadata,
	};
}

function getEmptyTypeScores(): TypeScores {
	return {
		portfolio: 0,
		showcase: 0,
		"interactive-experience": 0,
		visualization: 0,
		"creative-coding": 0,
		starter: 0,
		learning: 0,
		game: 0,

		"agent-skill": 0,
		"mcp-server": 0,
		"prompt-pack": 0,
		workflow: 0,
		"agent-tool": 0,
		"workflow-agent": 0,
		"browser-agent": 0,
		"coding-agent": 0,
		"agent-framework": 0,
		"automation-tool": 0,
		"llm-tool": 0,

		"ui-resource": 0,
		library: 0,
		tool: 0,
		unknown: 0,
	};
}

export function mapRepoRowToProcessedRepo(row: RepoRowLike) {
	const rankingScore = getRankingScore({
		score: row.score,
		stars: row.stars,
		forks: row.forks,
	});

	return {
		id: row.githubId,
		dbId: row.dbId,
		repoSectionId: row.repoSectionId,

		name: row.name,
		fullName: row.fullName,
		owner: row.owner,

		description: row.description,
		url: row.url,
		homepage: row.homepage,

		stars: row.stars,
		forks: row.forks,
		openIssues: row.openIssues,

		language: row.language,
		topics: row.topics ?? [],
		avatarUrl: row.avatarUrl,

		archived: row.archived,
		fork: row.fork,

		createdAt: row.githubCreatedAt.toISOString(),
		updatedAt: row.githubUpdatedAt.toISOString(),
		pushedAt: row.pushedAt.toISOString(),

		section: row.section,
		repoType: row.repoType,

		/**
		 * These are currently not stored in repo_sections.
		 * If we later add classificationConfidence, matchedSignals, and typeScores
		 * to the DB, this mapper should read them from the row instead.
		 */
		classificationConfidence: 0,
		matchedSignals: [] as ClassificationSignal[],
		typeScores: getEmptyTypeScores(),

		score: row.score,
		rankingScore,
		scoreBreakdown: row.scoreBreakdown,

		rejectionReasons: row.rejectionReasons ?? [],
		isAccepted: row.isAccepted,

		status: row.status,
		metadata: row.metadata,

		syncedAt: row.syncedAt?.toISOString(),
	};
}

export function sortProcessedRepos<
	T extends {
		rankingScore: number;
		score: number;
		stars: number;
	},
>(repos: T[]) {
	return [...repos].sort((a, b) => {
		if (b.rankingScore !== a.rankingScore) {
			return b.rankingScore - a.rankingScore;
		}

		if (b.score !== a.score) {
			return b.score - a.score;
		}

		return b.stars - a.stars;
	});
}
