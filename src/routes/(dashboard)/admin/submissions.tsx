import { createFileRoute } from "@tanstack/react-router";

import { AdminSubmissionsPage } from "#/components/admin/submissions";

export const Route = createFileRoute("/(dashboard)/admin/submissions")({
	component: AdminSubmissionsPage,
});
