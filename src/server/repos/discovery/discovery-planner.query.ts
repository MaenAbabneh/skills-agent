import { desc, eq } from "drizzle-orm";

import type { RepoSection } from "@/lib/validations/repos";
import { db } from "@/server/db";
import { syncLogs } from "@/server/db/schema";

import type { DiscoveryPlanningRun } from "./discovery.planner";

export async function getRecentDiscoveryRunsForPlanning({
	section,
	limit = 5,
}: {
	section: RepoSection;
	limit?: number;
}): Promise<DiscoveryPlanningRun[]> {
	const rows = await db
		.select({
			totalFetched: syncLogs.totalFetched,
			totalCandidates: syncLogs.totalUnique,
			totalExisting: syncLogs.totalExisting,
			totalNew: syncLogs.totalNew,
			totalFailed: syncLogs.totalFailed,
			rateLimitHit: syncLogs.rateLimitHit,
			searchRequestsBudget: syncLogs.searchRequestsBudget,
			totalVariantsTried: syncLogs.totalVariantsTried,
			discoveryPlanMode: syncLogs.discoveryPlanMode,
			discoveryPlanDiagnosis: syncLogs.discoveryPlanDiagnosis,
			createdAt: syncLogs.createdAt,
		})
		.from(syncLogs)
		.where(eq(syncLogs.section, section))
		.orderBy(desc(syncLogs.createdAt))
		.limit(limit);

	return rows.map((row) => ({
		...row,
		discoveryPlanMode:
			row.discoveryPlanMode as DiscoveryPlanningRun["discoveryPlanMode"],
		discoveryPlanDiagnosis:
			row.discoveryPlanDiagnosis as DiscoveryPlanningRun["discoveryPlanDiagnosis"],
		createdAt: row.createdAt.toISOString(),
	}));
}
