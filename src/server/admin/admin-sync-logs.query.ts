import { desc } from "drizzle-orm";

import { db } from "@/server/db";
import { syncLogs } from "@/server/db/schema";

export async function getAdminSyncLogs({
	limit = 50,
}: {
	limit?: number;
} = {}) {
	const rows = await db
		.select({
			id: syncLogs.id,
			section: syncLogs.section,
			status: syncLogs.status,
			totalFetched: syncLogs.totalFetched,
			totalUnique: syncLogs.totalUnique,
			totalAccepted: syncLogs.totalAccepted,
			totalRejected: syncLogs.totalRejected,
			discoveryPlanMode: syncLogs.discoveryPlanMode,
			discoveryPlanDiagnosis: syncLogs.discoveryPlanDiagnosis,
			discoveryPlanConfidence: syncLogs.discoveryPlanConfidence,
			discoveryPlanSummary: syncLogs.discoveryPlanSummary,
			discoveryPlanReason: syncLogs.discoveryPlanReason,
			discoveryPlanQuerySelection: syncLogs.discoveryPlanQuerySelection,
			discoveryPlanSaturationBps: syncLogs.discoveryPlanSaturationBps,
			discoveryPlanNewBps: syncLogs.discoveryPlanNewBps,
			discoveryPlanFailureBps: syncLogs.discoveryPlanFailureBps,
			error: syncLogs.error,
			createdAt: syncLogs.createdAt,
		})
		.from(syncLogs)
		.orderBy(desc(syncLogs.createdAt))
		.limit(limit);

	return rows.map((row) => ({
		...row,
		createdAt: row.createdAt.toISOString(),
	}));
}
