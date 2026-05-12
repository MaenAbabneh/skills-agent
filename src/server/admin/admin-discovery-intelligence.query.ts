import { desc, eq } from "drizzle-orm";

import type { RepoSection } from "@/lib/validations/repos";
import { db } from "@/server/db";
import { aiUsageLogs, syncLogs } from "@/server/db/schema";
import { SECTION_CONFIGS } from "@/server/sections/sections.config";

type DiscoveryPlanMode = "normal" | "exploration" | "freshness" | "recovery";
type SyncLogRow = typeof syncLogs.$inferSelect;

function safeRate(numerator: number, denominator: number) {
	if (denominator <= 0) {
		return 0;
	}

	return numerator / denominator;
}

function formatRun(row: SyncLogRow) {
	const totalCandidates = row.totalUnique ?? 0;
	const totalExisting = row.totalExisting ?? 0;
	const totalNew = row.totalNew ?? 0;
	const totalFailed = row.totalFailed ?? 0;

	return {
		id: row.id,
		section: row.section,

		mode: (row.discoveryPlanMode ?? "unknown") as DiscoveryPlanMode | "unknown",
		diagnosis: row.discoveryPlanDiagnosis ?? "unknown",
		confidence: row.discoveryPlanConfidence ?? "unknown",
		querySelection: row.discoveryPlanQuerySelection ?? "unknown",

		totalFetched: row.totalFetched ?? 0,
		totalCandidates,
		totalExisting,
		totalNew,
		totalAccepted: row.totalAccepted ?? 0,
		totalRejected: row.totalRejected ?? 0,
		totalFailed,

		newRate: safeRate(totalNew, totalCandidates),
		saturationRate: safeRate(totalExisting, totalCandidates),
		failureRate: safeRate(totalFailed, totalCandidates),

		createdAt: row.createdAt.toISOString(),
	};
}

function isNormalSaturatedRun(run: ReturnType<typeof formatRun>) {
	return (
		run.mode === "normal" &&
		run.totalCandidates >= 100 &&
		(run.totalNew === 0 || run.newRate < 0.05)
	);
}

export async function getAdminDiscoveryIntelligence({
	section,
	limit = 5,
}: {
	section: RepoSection;
	limit?: number;
}) {
	const recentRows = await db
		.select()
		.from(syncLogs)
		.where(eq(syncLogs.section, section))
		.orderBy(desc(syncLogs.createdAt))
		.limit(limit);

	const recentRuns = recentRows.map(formatRun);
	const latestRun = recentRuns[0] ?? null;

	const recentNormalSaturated = recentRuns.some(isNormalSaturatedRun);
	const aiEnabled = process.env.AI_QUERY_SUGGESTIONS_ENABLED === "true";

	let lastAiUsage: {
		status: string;
		reason: string | null;
		provider: string | null;
		model: string | null;
		createdAt: string;
	} | null = null;

	try {
		const aiRows = await db
			.select()
			.from(aiUsageLogs)
			.where(eq(aiUsageLogs.section, section))
			.orderBy(desc(aiUsageLogs.createdAt))
			.limit(1);

		const row = aiRows[0];

		if (row) {
			lastAiUsage = {
				status: row.status,
				reason: row.reason,
				provider: row.provider,
				model: row.model,
				createdAt: row.createdAt.toISOString(),
			};
		}
	} catch {
		lastAiUsage = null;
	}

	return {
		section,
		sectionLabel: SECTION_CONFIGS[section].label,
		aiEnabled,
		aiProvider: process.env.AI_QUERY_PROVIDER?.trim() || "gemini",
		aiModel: process.env.AI_QUERY_MODEL?.trim() || "gemini-2.5-flash-lite",
		lastAiUsage,
		latestRun,
		recentRuns,
		recentNormalSaturated,
		shouldStayInExploration: recentNormalSaturated,
	};
}

export type AdminDiscoveryIntelligence = Awaited<
	ReturnType<typeof getAdminDiscoveryIntelligence>
>;
