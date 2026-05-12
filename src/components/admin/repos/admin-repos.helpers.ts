import type { AdminReposSearch } from "./admin-repos.schema";
import type { ScoreBreakdown } from "./admin-repos.types";

export function buildSearchParams(
	current: AdminReposSearch,
	next: Partial<AdminReposSearch>,
): AdminReposSearch {
	return {
		section: next.section ?? current.section,
		status: next.status ?? current.status,
		algorithm: next.algorithm ?? current.algorithm,
		query: next.query ?? current.query,
		page: next.page ?? current.page,
		pageSize: next.pageSize ?? current.pageSize,
	};
}

export function getAlgorithmLabel(algorithm: AdminReposSearch["algorithm"]) {
	if (algorithm === "accepted") return "Accepted by algorithm";
	if (algorithm === "rejected") return "Rejected by algorithm";
	return "All algorithm results";
}

export function getVisiblePages({
	currentPage,
	totalPages,
}: {
	currentPage: number;
	totalPages: number;
}) {
	const pages = new Set<number>();

	pages.add(1);
	pages.add(totalPages);
	pages.add(currentPage);

	if (currentPage > 1) pages.add(currentPage - 1);
	if (currentPage < totalPages) pages.add(currentPage + 1);

	return Array.from(pages)
		.filter((page) => page >= 1 && page <= totalPages)
		.sort((a, b) => a - b);
}

export function normalizeScoreBreakdown(
	value: unknown,
): ScoreBreakdown | undefined {
	if (!value || typeof value !== "object") {
		return undefined;
	}

	return value as ScoreBreakdown;
}
