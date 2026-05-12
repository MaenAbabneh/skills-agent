import { z } from "zod";

import { fetchWithTimeout, getGitHubHeaders } from "./client";

const GitHubRateLimitResourceSchema = z.object({
	limit: z.number(),
	used: z.number(),
	remaining: z.number(),
	reset: z.number(),
});

const GitHubRateLimitResponseSchema = z.object({
	resources: z.object({
		core: GitHubRateLimitResourceSchema.optional(),
		search: GitHubRateLimitResourceSchema.optional(),
		graphql: GitHubRateLimitResourceSchema.optional(),
		integration_manifest: GitHubRateLimitResourceSchema.optional(),
		source_import: GitHubRateLimitResourceSchema.optional(),
		code_scanning_upload: GitHubRateLimitResourceSchema.optional(),
		actions_runner_registration: GitHubRateLimitResourceSchema.optional(),
		scim: GitHubRateLimitResourceSchema.optional(),
		dependency_snapshots: GitHubRateLimitResourceSchema.optional(),
		code_search: GitHubRateLimitResourceSchema.optional(),
	}),
	rate: GitHubRateLimitResourceSchema,
});

export type GitHubRateLimitBucket = {
	limit: number;
	used: number;
	remaining: number;
	resetAt: string;
	retryAfterSeconds: number;
};

export type GitHubRateLimitStatus = {
	core: GitHubRateLimitBucket | null;
	search: GitHubRateLimitBucket | null;
	raw: unknown;
};

function mapBucket(
	bucket: z.infer<typeof GitHubRateLimitResourceSchema> | undefined,
): GitHubRateLimitBucket | null {
	if (!bucket) {
		return null;
	}

	const resetMs = bucket.reset * 1000;

	return {
		limit: bucket.limit,
		used: bucket.used,
		remaining: bucket.remaining,
		resetAt: new Date(resetMs).toISOString(),
		retryAfterSeconds: Math.max(0, Math.ceil((resetMs - Date.now()) / 1000)),
	};
}

export async function getGitHubRateLimitStatus({
	timeoutMs = 10_000,
}: {
	timeoutMs?: number;
} = {}): Promise<GitHubRateLimitStatus> {
	const res = await fetchWithTimeout(
		"https://api.github.com/rate_limit",
		{
			headers: getGitHubHeaders(),
		},
		timeoutMs,
	);

	if (!res.ok) {
		const body = await res.text().catch(() => "");

		throw new Error(
			`Failed to read GitHub rate limit. Status: ${res.status}.${body ? ` ${body}` : ""}`,
		);
	}

	const raw = await res.json();
	const parsed = GitHubRateLimitResponseSchema.parse(raw);

	return {
		core: mapBucket(parsed.resources.core),
		search: mapBucket(parsed.resources.search),
		raw,
	};
}

export function hasEnoughSearchBudget({
	remaining,
	minSearchRemaining,
}: {
	remaining: number | null | undefined;
	minSearchRemaining: number;
}) {
	if (typeof remaining !== "number") {
		return false;
	}

	return remaining > minSearchRemaining;
}

export function getSearchBudget({
	remaining,
	minSearchRemaining,
	maxVariantsPerRun,
}: {
	remaining: number | null | undefined;
	minSearchRemaining: number;
	maxVariantsPerRun: number;
}) {
	if (typeof remaining !== "number") {
		return 0;
	}

	const usable = Math.max(0, remaining - minSearchRemaining);

	return Math.min(usable, maxVariantsPerRun);
}
