// src/server/repos/repo.admin.ts

import type { RepoSection, RepoSectionStatus } from "@/lib/validations/repos";

import { getSectionStrategy } from "@/server/sections/registry";

import { getAdminRepoRows, updateRepoSectionStatus } from "./repo.repository";

import { mapRepoRowToProcessedRepo, sortProcessedRepos } from "./repo.service";

export type GetAdminReposQueryInput = {
	section: RepoSection;
	status: RepoSectionStatus | "all";
	limit: number;
};

export async function getAdminReposQuery({
	section,
	status,
	limit,
}: GetAdminReposQueryInput) {
	const strategy = getSectionStrategy(section);

	const rows = await getAdminRepoRows({
		section: strategy.id,
		status,
		limit,
	});

	const repos = sortProcessedRepos(
		rows.map((row) =>
			mapRepoRowToProcessedRepo({
				...row,
				topics: row.topics ?? [],
				rejectionReasons: row.rejectionReasons ?? [],
			}),
		),
	);

	return {
		section: strategy.id,
		label: strategy.label,
		description: strategy.description,

		status,
		totalReturned: repos.length,

		repos,
	};
}

export async function setRepoSectionStatusService({
	section,
	repoSectionId,
	status,
}: {
	section: RepoSection;
	repoSectionId: string;
	status: RepoSectionStatus;
}) {
	return updateRepoSectionStatus({
		section,
		repoSectionId,
		status,
	});
}

export async function approveRepoSectionService({
	section,
	repoSectionId,
}: {
	section: RepoSection;
	repoSectionId: string;
}) {
	return setRepoSectionStatusService({
		section,
		repoSectionId,
		status: "approved",
	});
}

export async function rejectRepoSectionService({
	section,
	repoSectionId,
}: {
	section: RepoSection;
	repoSectionId: string;
}) {
	return setRepoSectionStatusService({
		section,
		repoSectionId,
		status: "rejected",
	});
}

export async function hideRepoSectionService({
	section,
	repoSectionId,
}: {
	section: RepoSection;
	repoSectionId: string;
}) {
	return setRepoSectionStatusService({
		section,
		repoSectionId,
		status: "hidden",
	});
}
