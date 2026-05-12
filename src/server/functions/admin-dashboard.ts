import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getAdminDashboardOverview } from "@/server/admin/admin-dashboard.query";
import { SECTION_IDS } from "@/server/sections/sections.config";

const GetAdminDashboardInputSchema = z
	.object({
		recentRunsSection: z.enum(SECTION_IDS).optional(),
	})
	.optional();

export const getAdminDashboard = createServerFn({
	method: "GET",
})
	.inputValidator(GetAdminDashboardInputSchema)
	.handler(async ({ data }) => {
		return getAdminDashboardOverview({
			recentRunsSection: data?.recentRunsSection,
		});
	});
