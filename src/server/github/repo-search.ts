import type { GitHubSearchResponse } from "@/lib/validations/github";
import { GitHubSearchResponseSchema } from "@/lib/validations/github";

import { getCache, setCache } from "@/server/memory-cache";
import { buildGitHubSearchCacheKey } from "./cache";
import {
	fetchWithTimeout,
	GitHubApiError,
	GitHubRateLimitError,
	getGitHubHeaders,
	getRateLimitInfoFromResponse,
	shouldRetryStatus,
	shouldTreatAsRateLimit,
	wait,
} from "./client";
import type { SearchGitHubReposOptions } from "./types";

function buildGitHubSearchUrl(
	query: string,
	{
		perPage = 30,
		page = 1,
		sort,
		order = "desc",
	}: SearchGitHubReposOptions = {},
) {
	const params = new URLSearchParams();

	params.set("q", query);
	params.set("per_page", String(perPage));
	params.set("page", String(page));

	if (sort) {
		params.set("sort", sort);
		params.set("order", order);
	}

	return `https://api.github.com/search/repositories?${params.toString()}`;
}

async function createGitHubErrorFromResponse(res: Response) {
	const body = await res.text().catch(() => "");
	const rateLimit = getRateLimitInfoFromResponse(res);

	if (shouldTreatAsRateLimit(res)) {
		return new GitHubRateLimitError({
			status: res.status,
			rateLimit,
			body,
		});
	}

	return new GitHubApiError({
		status: res.status,
		rateLimit,
		body,
	});
}

export async function searchGitHubRepos(
	query: string,
	options: SearchGitHubReposOptions = {},
): Promise<GitHubSearchResponse> {
	const {
		perPage = 30,
		page = 1,
		sort,
		order = "desc",
		cacheTtlMs = 1000 * 60 * 10,
		timeoutMs = 10_000,
	} = options;

	const cacheKey = buildGitHubSearchCacheKey(query, {
		perPage,
		page,
		sort,
		order,
	});

	const cached = getCache<GitHubSearchResponse>(cacheKey);

	if (cached) {
		return cached;
	}

	const url = buildGitHubSearchUrl(query, {
		perPage,
		page,
		sort,
		order,
	});

	const headers = getGitHubHeaders();

	const maxAttempts = 3;
	let lastError: unknown = null;

	for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
		try {
			const res = await fetchWithTimeout(url, { headers }, timeoutMs);

			if (!res.ok) {
				const error = await createGitHubErrorFromResponse(res);

				/**
				 * Rate limit errors should not be retried immediately.
				 * The caller should stop discovery and wait until resetAt.
				 */
				if (error instanceof GitHubRateLimitError) {
					throw error;
				}

				if (shouldRetryStatus(res.status) && attempt < maxAttempts) {
					lastError = error;
					await wait(2 ** attempt * 500);
					continue;
				}

				throw error;
			}

			const rawData = await res.json();
			const parsed = GitHubSearchResponseSchema.parse(rawData);

			setCache(cacheKey, parsed, cacheTtlMs);

			return parsed;
		} catch (error) {
			lastError = error;

			/**
			 * Do not retry rate limit errors.
			 */
			if (error instanceof GitHubRateLimitError) {
				throw error;
			}

			if (attempt < maxAttempts) {
				await wait(2 ** attempt * 500);
			}
		}
	}

	throw lastError instanceof Error
		? lastError
		: new Error("GitHub fetch failed");
}
