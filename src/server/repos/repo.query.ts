import type { RepoSection } from "@/lib/validations/repos";

import { getSectionStrategy } from "@/server/sections/registry";

import { getLatestSyncLog, getRepoRowsBySection } from "./repo.repository";

import { mapRepoRowToProcessedRepo, sortProcessedRepos } from "./repo.service";

export type GetReposBySectionQueryInput = {
	section: RepoSection;
	limit: number;
	includeRejected: boolean;
};

export async function getReposBySectionQuery({
	section,
	limit,
	includeRejected,
}: GetReposBySectionQueryInput) {
	const strategy = getSectionStrategy(section);

	const [rows, latestSyncLog] = await Promise.all([
		getRepoRowsBySection({
			section: strategy.id,
			includeRejected,
		}),

		getLatestSyncLog(strategy.id),
	]);

	const repos = sortProcessedRepos(
		rows.map((row) =>
			mapRepoRowToProcessedRepo({
				...row,
				topics: row.topics ?? [],
				rejectionReasons: row.rejectionReasons ?? [],
			}),
		),
	).slice(0, limit);

	return {
		section: strategy.id,
		label: strategy.label,
		description: strategy.description,

		totalFetched: latestSyncLog?.totalFetched ?? rows.length,
		totalUnique: latestSyncLog?.totalUnique ?? rows.length,
		totalReturned: repos.length,

		sync: latestSyncLog ?? null,

		repos,
	};
}
