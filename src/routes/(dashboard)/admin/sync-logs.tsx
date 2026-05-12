import { createFileRoute } from "@tanstack/react-router";

import { AdminSyncLogsPage } from "#/components/admin/sync-logs";
import { normalizeSectionId } from "#/lib/sections";
import { getAdminSyncLogsList } from "#/server/functions/admin-sync-logs";

export const Route = createFileRoute("/(dashboard)/admin/sync-logs")({
	component: AdminSyncLogsRoute,

	validateSearch: (search) => ({
		section: normalizeSectionId(search.section),
	}),

	loaderDeps: ({ search }) => ({
		section: search.section,
	}),

	loader: async () => {
		const logs = await getAdminSyncLogsList({
			data: {
				limit: 50,
			},
		});

		return {
			logs,
		};
	},
});

function AdminSyncLogsRoute() {
	const search = Route.useSearch();
	const { logs } = Route.useLoaderData();

	return <AdminSyncLogsPage section={search.section} logs={logs} />;
}
