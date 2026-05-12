export type GitHubRepoSearchSort =
	| "stars"
	| "forks"
	| "help-wanted-issues"
	| "updated";

export type GitHubRepoSearchOrder = "asc" | "desc";

export type SearchGitHubReposOptions = {
	perPage?: number;
	page?: number;
	sort?: GitHubRepoSearchSort;
	order?: GitHubRepoSearchOrder;
	cacheTtlMs?: number;
	timeoutMs?: number;
};
