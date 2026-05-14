import { z } from "zod";

export const GitHubOwnerSchema = z.object({
	login: z.string(),
	avatar_url: z.string().url(),
	html_url: z.string().url(),
});

export const GitHubLicenseSchema = z
	.object({
		key: z.string().nullable().optional(),
		name: z.string().nullable().optional(),
		spdx_id: z.string().nullable().optional(),
	})
	.nullable();

export const GitHubRepoSchema = z.object({
	id: z.number(),

	name: z.string(),
	full_name: z.string(),
	description: z.string().nullable(),

	html_url: z.string().url(),
	homepage: z.string().nullable().optional(),

	stargazers_count: z.number(),
	forks_count: z.number(),
	open_issues_count: z.number(),

	language: z.string().nullable(),
	topics: z.array(z.string()).optional().default([]),

	archived: z.boolean(),
	fork: z.boolean(),

	license: GitHubLicenseSchema,
	owner: GitHubOwnerSchema,

	default_branch: z.string(),

	created_at: z.string(),
	updated_at: z.string(),
	pushed_at: z.string(),
});

export const GitHubSearchResponseSchema = z.object({
	total_count: z.number(),
	incomplete_results: z.boolean(),
	items: z.array(GitHubRepoSchema),
});

function assertGithubHost(url: URL) {
	if (url.hostname !== "github.com") {
		throw new Error("Must be a github.com URL");
	}
}

function getPathSegments(pathname: string) {
	return pathname.replace(/\/+$/, "").split("/").filter(Boolean);
}

export function normalizeGitHubRepoUrl(value: string) {
	const url = new URL(value);
	assertGithubHost(url);

	const segments = getPathSegments(url.pathname);

	if (segments.length !== 2) {
		throw new Error("Invalid GitHub repo URL format");
	}

	const [owner, rawRepo] = segments;
	const repo = rawRepo.replace(/\.git$/i, "");

	if (!owner || !repo) {
		throw new Error("Invalid GitHub repo URL format");
	}

	return `https://github.com/${owner.toLowerCase()}/${repo.toLowerCase()}`;
}

function isValidGitHubRepoUrl(value: string) {
	try {
		normalizeGitHubRepoUrl(value);
		return true;
	} catch {
		return false;
	}
}

export function normalizeGitHubSkillFileUrl(value: string) {
	const url = new URL(value);
	assertGithubHost(url);

	const segments = getPathSegments(url.pathname);

	if (segments.length < 5 || segments[2] !== "blob") {
		throw new Error("Invalid GitHub skill file URL format");
	}

	if (segments.some((segment) => segment === "." || segment === "..")) {
		throw new Error("Invalid GitHub skill file URL format");
	}

	const [owner, rawRepo, , branch, ...fileSegments] = segments;
	const repo = rawRepo.replace(/\.git$/i, "");
	const filePath = fileSegments.join("/");

	if (!owner || !repo || !branch || !filePath) {
		throw new Error("Invalid GitHub skill file URL format");
	}

	if (!/skill\.md$/i.test(filePath)) {
		throw new Error("Must end with SKILL.md or skill.md");
	}

	return `https://github.com/${owner.toLowerCase()}/${repo.toLowerCase()}/blob/${branch}/${filePath}`;
}

function isValidGitHubSkillFileUrl(value: string) {
	try {
		normalizeGitHubSkillFileUrl(value);
		return true;
	} catch {
		return false;
	}
}

/**
 * GitHub repo URL validation schema.
 * Accepts URLs like: https://github.com/owner/repo
 */
export const gitHubRepoUrlSchema = z
	.string()
	.url()
	.refine(isValidGitHubRepoUrl, "Must be a github.com URL")
	.transform((url) => normalizeGitHubRepoUrl(url));

/**
 * Parsed GitHub repo URL.
 */
export const parsedGitHubRepoSchema = z.object({
	owner: z.string().min(1),
	repo: z.string().min(1),
	url: z.string(),
});

/**
 * GitHub skill file URL validation schema.
 * Accepts URLs like: https://github.com/owner/repo/blob/branch/path/to/SKILL.md
 */
export const gitHubSkillFileUrlSchema = z
	.string()
	.url()
	.refine(
		isValidGitHubSkillFileUrl,
		"Must be a github.com blob URL ending in SKILL.md",
	)
	.transform((url) => normalizeGitHubSkillFileUrl(url));

/**
 * Parsed GitHub skill file URL.
 */
export const parsedGitHubSkillFileSchema = z.object({
	owner: z.string().min(1),
	repo: z.string().min(1),
	branch: z.string().min(1),
	filePath: z.string().min(1),
	url: z.string(),
});

/**
 * Parse GitHub repository URL.
 * Returns owner and repo, or throws validation error.
 */
export function parseGitHubRepoUrl(
	value: string,
): z.infer<typeof parsedGitHubRepoSchema> {
	const validated = normalizeGitHubRepoUrl(value);
	const pathSegments = new URL(validated).pathname.split("/").filter(Boolean);
	const [owner, repo] = pathSegments;

	if (!owner || !repo) {
		throw new Error("Invalid GitHub repo URL format");
	}

	return {
		owner,
		repo,
		url: validated,
	};
}

/**
 * Parse GitHub skill file URL.
 * Returns owner, repo, branch, and filePath, or throws validation error.
 */
export function parseGitHubSkillFileUrl(
	value: string,
): z.infer<typeof parsedGitHubSkillFileSchema> {
	const validated = normalizeGitHubSkillFileUrl(value);
	const pathSegments = new URL(validated).pathname.split("/").filter(Boolean);
	const [owner, repo, , branch, ...fileSegments] = pathSegments;
	const filePath = fileSegments.join("/");

	if (!owner || !repo || !branch || !filePath) {
		throw new Error("Invalid GitHub skill file URL format");
	}

	return {
		owner,
		repo,
		branch,
		filePath,
		url: validated,
	};
}

export type GitHubOwner = z.infer<typeof GitHubOwnerSchema>;
export type GitHubLicense = z.infer<typeof GitHubLicenseSchema>;
export type GitHubRepo = z.infer<typeof GitHubRepoSchema>;
export type GitHubSearchResponse = z.infer<typeof GitHubSearchResponseSchema>;
export type ParsedGitHubRepo = z.infer<typeof parsedGitHubRepoSchema>;
export type ParsedGitHubSkillFile = z.infer<typeof parsedGitHubSkillFileSchema>;
