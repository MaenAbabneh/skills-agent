import type { SearchGitHubReposOptions } from "./types";

export function buildGitHubSearchCacheKey(
	query: string,
	{
		perPage = 30,
		page = 1,
		sort,
		order = "desc",
	}: SearchGitHubReposOptions = {},
) {
	return [
		"github-search",
		query,
		`perPage:${perPage}`,
		`page:${page}`,
		`sort:${sort ?? "best-match"}`,
		`order:${order}`,
	].join(":");
}
