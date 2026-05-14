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

/**
 * GitHub repo URL validation schema.
 * Accepts URLs like: https://github.com/owner/repo
 */
export const gitHubRepoUrlSchema = z
	.string()
	.url()
	.refine((url) => url.includes("github.com"), "Must be a github.com URL")
	.transform((url) => url.replace(/\.git$/, ""))
	.transform((url) => url.replace(/\/$/, ""));

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
	.refine((url) => url.includes("github.com"), "Must be a github.com URL")
	.refine(
		(url) => /\/blob\/[\w\-/.]+\/.*[Ss][Kk][Ii][Ll][Ll]\.md$/.test(url),
		"Must end with SKILL.md or skill.md",
	);

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
	const validated = gitHubRepoUrlSchema.parse(value);
	const match = validated.match(/github\.com\/([^/]+)\/([^/]+)/);

	if (!match || !match[1] || !match[2]) {
		throw new Error("Invalid GitHub repo URL format");
	}

	return {
		owner: match[1],
		repo: match[2].replace(/\.git$/, ""),
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
	gitHubSkillFileUrlSchema.parse(value);

	// Extract owner/repo/branch/path from URL
	const match = value.match(
		/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/,
	);

	if (!match || !match[1] || !match[2] || !match[3] || !match[4]) {
		throw new Error("Invalid GitHub skill file URL format");
	}

	return {
		owner: match[1],
		repo: match[2],
		branch: match[3],
		filePath: match[4],
		url: value,
	};
}

export type GitHubOwner = z.infer<typeof GitHubOwnerSchema>;
export type GitHubLicense = z.infer<typeof GitHubLicenseSchema>;
export type GitHubRepo = z.infer<typeof GitHubRepoSchema>;
export type GitHubSearchResponse = z.infer<typeof GitHubSearchResponseSchema>;
export type ParsedGitHubRepo = z.infer<typeof parsedGitHubRepoSchema>;
export type ParsedGitHubSkillFile = z.infer<typeof parsedGitHubSkillFileSchema>;
