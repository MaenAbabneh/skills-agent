import { Link } from "@tanstack/react-router";
import { SearchX } from "lucide-react";

import AdminRepoReviewCard from "#/components/admin/AdminRepoReviewCard";
import { AdminEmptyState } from "#/components/admin/common";
import { Button } from "#/components/ui/button";
import { SECTION_CONFIGS, type SectionId } from "#/lib/sections";
import {
	buildSearchParams,
	normalizeScoreBreakdown,
} from "./admin-repos.helpers";
import type { AdminReposSearch } from "./admin-repos.schema";
import type { AdminRepo, UpdatingAction } from "./admin-repos.types";

type AdminReposGridProps = {
	repos: AdminRepo[];
	search: AdminReposSearch;
	section: SectionId;
	updatingRepoId: string | null;
	updatingAction: UpdatingAction | null;
	onApprove: (repoSectionId: string) => void | Promise<void>;
	onReject: (repoSectionId: string) => void | Promise<void>;
	onHide: (repoSectionId: string) => void | Promise<void>;
};

function toReviewCardRepo(repo: AdminRepo) {
	return {
		repoSectionId: repo.repoSectionId,

		fullName: repo.fullName,
		owner: repo.owner,
		name: repo.name,
		description: repo.description,

		url: repo.url,
		homepage: repo.homepage,

		stars: repo.stars,
		forks: repo.forks,
		openIssues: repo.openIssues,

		language: repo.language,
		topics: repo.topics,

		repoType: repo.repoType,
		score: repo.score,

		isAccepted: repo.isAccepted,
		status: repo.status,

		rejectionReasons: repo.rejectionReasons,
		scoreBreakdown: normalizeScoreBreakdown(repo.scoreBreakdown),
		metadata: repo.metadata,
	};
}

export function AdminReposGrid({
	repos,
	search,
	section,
	updatingRepoId,
	updatingAction,
	onApprove,
	onReject,
	onHide,
}: AdminReposGridProps) {
	if (repos.length === 0) {
		return (
			<AdminEmptyState
				icon={<SearchX className="h-10 w-10" />}
				title={`No repositories waiting for review in ${SECTION_CONFIGS[section].label}.`}
				description={
					search.query
						? `No results found for "${search.query}". Reset filters or try a broader search.`
						: "Reset filters or try a different status or algorithm decision."
				}
				action={
					<Button variant="outline" asChild>
						<Link
							to="/admin/repos"
							search={buildSearchParams(search, {
								status: "pending",
								algorithm: "all",
								query: "",
								page: 1,
								pageSize: 24,
							})}
						>
							Reset filters
						</Link>
					</Button>
				}
			/>
		);
	}

	return (
		<div className="grid gap-4 xl:grid-cols-2">
			{repos.map((repo) => (
				<AdminRepoReviewCard
					key={repo.repoSectionId}
					repo={toReviewCardRepo(repo)}
					section={section}
					isUpdating={updatingRepoId === repo.repoSectionId}
					updatingAction={
						updatingRepoId === repo.repoSectionId ? updatingAction : null
					}
					onApprove={onApprove}
					onReject={onReject}
					onHide={onHide}
				/>
			))}
		</div>
	);
}
