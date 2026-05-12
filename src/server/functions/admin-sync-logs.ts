import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getAdminSyncLogs } from "@/server/admin/admin-sync-logs.query";

const GetAdminSyncLogsInputSchema = z.object({
	limit: z.number().min(1).max(100).default(50),
});

export const getAdminSyncLogsList = createServerFn({
	method: "GET",
})
	.inputValidator(GetAdminSyncLogsInputSchema)
	.handler(async ({ data }) => {
		return getAdminSyncLogs({
			limit: data.limit,
		});
	});
