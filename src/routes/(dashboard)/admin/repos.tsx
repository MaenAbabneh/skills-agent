import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AgentSkillReviewGrid } from "#/components/admin/agent-skills/AgentSkillReviewGrid";
import { AdminSectionSelector } from "#/components/admin/discovery";
import { AdminReposFilters } from "#/components/admin/repos/AdminReposFilters";
import { AdminReposGrid } from "#/components/admin/repos/AdminReposGrid";
import { AdminReposHeader } from "#/components/admin/repos/AdminReposHeader";
import { AdminReposPagination } from "#/components/admin/repos/AdminReposPagination";
import { AdminReposSearchSchema } from "#/components/admin/repos/admin-repos.schema";
import { useAdminRepoActions } from "#/components/admin/repos/useAdminRepoActions";
import { useAdminRepoReadmeEnrichment } from "#/components/admin/repos/useAdminRepoReadmeEnrichment";
import { normalizeSectionId, type SectionId } from "#/lib/sections";
import { getAgentSkillReviewItems } from "#/server/functions/admin-agent-skills";
import { getAdminRepos } from "#/server/functions/admin-repos";

export const Route = createFileRoute("/(dashboard)/admin/repos")({
	component: AdminReposPage,

	validateSearch: (search) =>
		AdminReposSearchSchema.parse({
			...search,
			section: normalizeSectionId(search.section),
		}),

	loaderDeps: ({ search }) => ({
		section: search.section,
		status: search.status,
		algorithm: search.algorithm,
		query: search.query,
		page: search.page,
		pageSize: search.pageSize,
	}),

	loader: async ({ deps }) => {
		const offset = (deps.page - 1) * deps.pageSize;

		if (deps.section === "agent-skills") {
			const skillResult = await getAgentSkillReviewItems({
				data: {
					status: deps.status as any,
					search: deps.query,
					limit: deps.pageSize,
					offset,
				},
			});
			return { type: "agent-skills" as const, result: skillResult };
		}

		const result = await getAdminRepos({
			data: {
				section: deps.section,
				status: deps.status,
				algorithm: deps.algorithm,
				query: deps.query,
				limit: deps.pageSize,
				offset,
			},
		});

		return { type: "repos" as const, result };
	},
});

function AdminReposPage() {
	const navigate = useNavigate({ from: "/admin/repos" });
	const search = Route.useSearch();
	const loaderData = Route.useLoaderData();
	const type = loaderData.type;
	const result = loaderData.result;
	const {
		updatingRepoId,
		updatingAction,
		isRevalidatingAgentSkills,
		runAction,
		revalidateAgentSkills,
		isEnrichingAgentSkills,
		enrichAgentSkills,
		isRefreshingDerivedMetadata,
		refreshDerivedMetadata,
	} = useAdminRepoActions(search.section);

	const {
		isEnrichingMissingReadmes,
		isRefreshingExistingReadmes,
		enrichMissingReadmes,
		refreshExistingReadmes,
		enrichResult: readmeEnrichResult,
	} = useAdminRepoReadmeEnrichment();

	function handleSectionChange(section: SectionId) {
		navigate({
			search: {
				...search,
				section,
				page: 1,
			},
		});
	}

	return (
		<div className="space-y-6">
			<AdminReposHeader
				search={search}
				isRevalidatingAgentSkills={isRevalidatingAgentSkills}
				onRevalidateAgentSkills={revalidateAgentSkills}
				isEnrichingAgentSkills={isEnrichingAgentSkills}
				onEnrichAgentSkills={enrichAgentSkills}
				isRefreshingDerivedMetadata={isRefreshingDerivedMetadata}
				onRefreshDerivedMetadata={refreshDerivedMetadata}
				isEnrichingMissingReadmes={isEnrichingMissingReadmes}
				onEnrichMissingReadmes={enrichMissingReadmes}
				isRefreshingExistingReadmes={isRefreshingExistingReadmes}
				onRefreshExistingReadmes={refreshExistingReadmes}
				readmeEnrichResult={readmeEnrichResult}
			/>

			<AdminSectionSelector
				section={search.section}
				onSectionChange={handleSectionChange}
			/>

			<AdminReposFilters
				search={search}
				result={{
					section:
						type === "agent-skills" ? "agent-skills" : (result as any).section,
					total: result.total,
					itemsCount:
						type === "agent-skills"
							? (result as any).items.length
							: (result as any).repos.length,
				}}
			/>

			<AdminReposPagination
				search={search}
				total={result.total}
				count={
					type === "agent-skills"
						? (result as any).items.length
						: (result as any).repos.length
				}
			/>

			{type === "agent-skills" ? (
				<AgentSkillReviewGrid items={(result as any).items} />
			) : (
				<AdminReposGrid
					repos={(result as any).repos}
					search={search}
					section={search.section}
					updatingRepoId={updatingRepoId}
					updatingAction={updatingAction}
					onApprove={(repoSectionId) =>
						runAction({ repoSectionId, action: "approve" })
					}
					onReject={(repoSectionId) =>
						runAction({ repoSectionId, action: "reject" })
					}
					onHide={(repoSectionId) =>
						runAction({ repoSectionId, action: "hide" })
					}
				/>
			)}

			<AdminReposPagination
				search={search}
				total={result.total}
				count={
					type === "agent-skills"
						? (result as any).items.length
						: (result as any).repos.length
				}
			/>
		</div>
	);
}
