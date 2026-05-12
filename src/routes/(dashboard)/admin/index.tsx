import { createFileRoute } from "@tanstack/react-router";

import {
	AdminOverviewPage,
	AdminOverviewPending,
} from "#/components/admin/overview";
import { normalizeSectionId } from "#/lib/sections";
import { getAdminDashboard } from "#/server/functions/admin-dashboard";
import { getAdminDiscoveryIntelligenceAction } from "#/server/functions/admin-discovery-intelligence";

export const Route = createFileRoute("/(dashboard)/admin/")({
	component: AdminOverviewRoute,
	pendingComponent: AdminOverviewPending,

	validateSearch: (search) => ({
		section: normalizeSectionId(search.section),
	}),

	loaderDeps: ({ search }) => ({
		section: search.section,
	}),

	loader: async ({ deps }) => {
		const [dashboard, discoveryIntelligence] = await Promise.all([
			getAdminDashboard({
				data: {
					recentRunsSection: deps.section,
				},
			}),
			getAdminDiscoveryIntelligenceAction({
				data: {
					section: deps.section,
				},
			}),
		]);

		return {
			dashboard,
			discoveryIntelligence,
		};
	},
});

function AdminOverviewRoute() {
	const search = Route.useSearch();
	const { dashboard, discoveryIntelligence } = Route.useLoaderData();

	return (
		<AdminOverviewPage
			selectedSection={search.section}
			dashboard={dashboard}
			discoveryIntelligence={discoveryIntelligence}
		/>
	);
}
