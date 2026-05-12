import { z } from "zod";

import {
	fetchWithTimeout,
	getGitHubHeaders,
	getRateLimitInfoFromResponse,
} from "./client";

export type DetectedAgentSkillFile = {
	path: string;
	url: string;
	fileName: string;
	skillName: string;
	confidence: "high" | "medium";
};

export type DetectAgentSkillFilesResult = {
	found: boolean;
	files: DetectedAgentSkillFile[];
	truncated?: boolean;
	debugError?: string;
};

export type DetectAgentSkillFilesInput = {
	owner: string;
	repo: string;
	defaultBranch: string;
	timeoutMs?: number;
};

const GitHubTreeItemSchema = z.object({
	path: z.string(),
	type: z.string(),
});

const GitHubTreeResponseSchema = z.object({
	tree: z.array(GitHubTreeItemSchema),
	truncated: z.boolean().optional().default(false),
});

const GitHubBranchResponseSchema = z.object({
	commit: z.object({
		sha: z.string(),
	}),
});

const SKILL_FILE_ORDER = new Map([
	["SKILL.md", 0],
	["skill.md", 1],
	["skills.md", 2],
]);

function getErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : "Unknown GitHub tree error";
}

function basename(path: string) {
	const parts = path.split("/");

	return parts[parts.length - 1] ?? path;
}

function getSkillName({ path, repo }: { path: string; repo: string }) {
	const parts = path.split("/");

	if (parts.length <= 1) {
		return repo || "root";
	}

	return parts[parts.length - 2] || repo || "root";
}

function getFileConfidence(fileName: string): "high" | "medium" {
	return fileName === "skills.md" ? "medium" : "high";
}

function compareDetectedFiles(
	first: DetectedAgentSkillFile,
	second: DetectedAgentSkillFile,
) {
	const firstRank = SKILL_FILE_ORDER.get(first.fileName) ?? 99;
	const secondRank = SKILL_FILE_ORDER.get(second.fileName) ?? 99;

	if (firstRank !== secondRank) {
		return firstRank - secondRank;
	}

	return first.path.localeCompare(second.path);
}

function buildTreeUrl({
	owner,
	repo,
	ref,
}: {
	owner: string;
	repo: string;
	ref: string;
}) {
	return `https://api.github.com/repos/${encodeURIComponent(
		owner,
	)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(
		ref,
	)}?recursive=1`;
}

async function fetchJsonOrThrow<T>({
	url,
	schema,
	timeoutMs,
}: {
	url: string;
	schema: z.ZodType<T>;
	timeoutMs: number;
}) {
	const res = await fetchWithTimeout(
		url,
		{
			headers: getGitHubHeaders(),
		},
		timeoutMs,
	);

	if (!res.ok) {
		const rateLimit = getRateLimitInfoFromResponse(res);
		const body = await res.text().catch(() => "");

		throw new Error(
			`GitHub API failed with status ${res.status}. Remaining: ${
				rateLimit.remaining ?? "unknown"
			}.${body ? ` ${body}` : ""}`,
		);
	}

	return schema.parse(await res.json());
}

async function fetchRecursiveTree({
	owner,
	repo,
	ref,
	timeoutMs,
}: {
	owner: string;
	repo: string;
	ref: string;
	timeoutMs: number;
}) {
	return fetchJsonOrThrow({
		url: buildTreeUrl({ owner, repo, ref }),
		schema: GitHubTreeResponseSchema,
		timeoutMs,
	});
}

async function fetchBranchSha({
	owner,
	repo,
	defaultBranch,
	timeoutMs,
}: {
	owner: string;
	repo: string;
	defaultBranch: string;
	timeoutMs: number;
}) {
	const branch = await fetchJsonOrThrow({
		url: `https://api.github.com/repos/${encodeURIComponent(
			owner,
		)}/${encodeURIComponent(repo)}/branches/${encodeURIComponent(defaultBranch)}`,
		schema: GitHubBranchResponseSchema,
		timeoutMs,
	});

	return branch.commit.sha;
}

function mapTreeToSkillFiles({
	owner,
	repo,
	defaultBranch,
	tree,
}: {
	owner: string;
	repo: string;
	defaultBranch: string;
	tree: z.infer<typeof GitHubTreeResponseSchema>["tree"];
}) {
	return tree
		.filter((item) => item.type === "blob")
		.map((item) => {
			const fileName = basename(item.path);

			if (!SKILL_FILE_ORDER.has(fileName)) {
				return null;
			}

			return {
				path: item.path,
				url: `https://github.com/${owner}/${repo}/blob/${defaultBranch}/${item.path}`,
				fileName,
				skillName: getSkillName({ path: item.path, repo }),
				confidence: getFileConfidence(fileName),
			} satisfies DetectedAgentSkillFile;
		})
		.filter((item): item is DetectedAgentSkillFile => item !== null)
		.sort(compareDetectedFiles);
}

export async function detectAgentSkillFiles({
	owner,
	repo,
	defaultBranch,
	timeoutMs = Number(process.env.AGENT_SKILL_TREE_TIMEOUT_MS) || 8000,
}: DetectAgentSkillFilesInput): Promise<DetectAgentSkillFilesResult> {
	const cleanDefaultBranch = defaultBranch.trim() || "main";

	try {
		let treeResult: z.infer<typeof GitHubTreeResponseSchema>;

		try {
			treeResult = await fetchRecursiveTree({
				owner,
				repo,
				ref: cleanDefaultBranch,
				timeoutMs,
			});
		} catch (branchRefError) {
			const branchSha = await fetchBranchSha({
				owner,
				repo,
				defaultBranch: cleanDefaultBranch,
				timeoutMs,
			});

			try {
				treeResult = await fetchRecursiveTree({
					owner,
					repo,
					ref: branchSha,
					timeoutMs,
				});
			} catch (shaRefError) {
				throw new Error(getErrorMessage(shaRefError), {
					cause: branchRefError,
				});
			}
		}

		const files = mapTreeToSkillFiles({
			owner,
			repo,
			defaultBranch: cleanDefaultBranch,
			tree: treeResult.tree,
		});

		return {
			found: files.length > 0,
			files,
			truncated: treeResult.truncated,
		};
	} catch (error) {
		const errorMessage = getErrorMessage(error);
		const isTimeout =
			(error instanceof Error && error.name === "AbortError") ||
			errorMessage.includes("timeout") ||
			errorMessage.includes("aborted") ||
			errorMessage.includes("signal is aborted");

		return {
			found: false,
			files: [],
			debugError: isTimeout ? "timeout" : errorMessage,
		};
	}
}

export async function fetchAgentSkillFileContent({
	owner,
	repo,
	defaultBranch,
	filePath,
	timeoutMs = Number(process.env.AGENT_SKILL_CONTENT_TIMEOUT_MS) || 8000,
}: {
	owner: string;
	repo: string;
	defaultBranch: string;
	filePath: string;
	timeoutMs?: number;
}): Promise<{ ok: boolean; content?: string; error?: string }> {
	try {
		// Use raw.githubusercontent.com for fast raw content fetching
		const cleanDefaultBranch = defaultBranch.trim() || "main";
		const url = `https://raw.githubusercontent.com/${owner}/${repo}/${cleanDefaultBranch}/${filePath}`;

		const res = await fetchWithTimeout(
			url,
			{
				headers: getGitHubHeaders(),
			},
			timeoutMs,
		);

		if (!res.ok) {
			const rateLimit = getRateLimitInfoFromResponse(res);
			const body = await res.text().catch(() => "");
			return {
				ok: false,
				error: `GitHub Raw API failed with status ${res.status}. Remaining: ${
					rateLimit.remaining ?? "unknown"
				}.${body ? ` ${body}` : ""}`,
			};
		}

		const content = await res.text();
		return {
			ok: true,
			content,
		};
	} catch (error) {
		const errorMessage = getErrorMessage(error);
		const isTimeout =
			(error instanceof Error && error.name === "AbortError") ||
			errorMessage.includes("timeout") ||
			errorMessage.includes("aborted") ||
			errorMessage.includes("signal is aborted");

		return {
			ok: false,
			error: isTimeout ? "timeout" : errorMessage,
		};
	}
}
