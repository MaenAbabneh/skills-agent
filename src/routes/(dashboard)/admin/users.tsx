import { createFileRoute } from "@tanstack/react-router";

import { AdminUsersPage } from "#/components/admin/users";

export const Route = createFileRoute("/(dashboard)/admin/users")({
	component: AdminUsersPage,
});
