import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AdminLayout } from "#/components/admin/layout/AdminLayout";

export const Route = createFileRoute("/(dashboard)/admin")({
	component: AdminRoute,
});

function AdminRoute() {
	return (
		<AdminLayout>
			<Outlet />
		</AdminLayout>
	);
}
