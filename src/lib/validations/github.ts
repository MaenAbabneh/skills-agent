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

export type GitHubOwner = z.infer<typeof GitHubOwnerSchema>;
export type GitHubLicense = z.infer<typeof GitHubLicenseSchema>;
export type GitHubRepo = z.infer<typeof GitHubRepoSchema>;
export type GitHubSearchResponse = z.infer<typeof GitHubSearchResponseSchema>;
