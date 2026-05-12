import { createFileRoute, useNavigate } from "@tanstack/react-router";

import {
	AdminDiscoveryHeader,
	AdminDiscoveryNextStepCard,
	AdminDiscoveryResultTable,
	AdminDiscoveryRunCard,
	AdminGitHubRateLimitCard,
	AdminSectionSelector,
	AdminSyncResultSummary,
	AdminSyncRunCard,
	useAdminDiscoveryActions,
} from "#/components/admin/discovery";
import { normalizeSectionId, type SectionId } from "#/lib/sections";
import { getAdminGitHubRateLimit } from "#/server/functions/admin-rate-limit";

export const Route = createFileRoute("/(dashboard)/admin/discovery")({
	component: AdminDiscoveryPage,

	validateSearch: (search) => ({
		section: normalizeSectionId(search.section),
	}),

	loaderDeps: ({ search }) => ({
		section: search.section,
	}),

	loader: async () => {
		const rateLimit = await getAdminGitHubRateLimit();

		return {
			rateLimit,
		};
	},
});

function AdminDiscoveryPage() {
	const navigate = useNavigate({ from: "/admin/discovery" });
	const search = Route.useSearch();
	const { rateLimit } = Route.useLoaderData();
	const selectedSection = search.section;

	const isRateLimitBlocked =
		rateLimit.search !== null && rateLimit.search.remaining <= 3;

	const {
		isRunning,
		runningAction,
		lastDiscoveryResult,
		lastSyncResult,
		resetLastResults,
		runDiscovery,
		runSync,
	} = useAdminDiscoveryActions({
		section: selectedSection,
	});

	function handleSectionChange(section: SectionId) {
		navigate({
			search: {
				section,
			},
		});
		resetLastResults();
	}

	return (
		<div className="space-y-6">
			<AdminDiscoveryHeader section={selectedSection} />

			<AdminGitHubRateLimitCard
				search={rateLimit.search}
				core={rateLimit.core}
			/>

			<AdminSectionSelector
				section={selectedSection}
				onSectionChange={handleSectionChange}
			/>

			<div className="grid gap-6 lg:grid-cols-2">
				<AdminDiscoveryRunCard
					section={selectedSection}
					isRunning={isRunning}
					runningAction={runningAction}
					isRateLimitBlocked={isRateLimitBlocked}
					onRunDiscovery={runDiscovery}
				/>

				<AdminSyncRunCard
					section={selectedSection}
					isRunning={isRunning}
					runningAction={runningAction}
					isRateLimitBlocked={isRateLimitBlocked}
					onRunSync={runSync}
				/>
			</div>

			<AdminDiscoveryResultTable result={lastDiscoveryResult} />

			<AdminSyncResultSummary result={lastSyncResult} />

			<AdminDiscoveryNextStepCard />
		</div>
	);
}
