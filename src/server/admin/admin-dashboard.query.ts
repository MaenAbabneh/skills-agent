import { count, desc, eq, sql } from "drizzle-orm";

import { db } from "@/server/db";
import { agentSkillFiles, repoSections, syncLogs } from "@/server/db/schema";
import type { SectionId } from "@/server/sections/sections.config";

type RepoSectionStatus = "pending" | "approved" | "rejected" | "hidden";

type RecentDiscoveryRun = {
	section: string;
	status: string;

	totalFetched: number;
	totalUnique: number;
	totalExisting: number;
	totalNew: number;
	totalAccepted: number;
	totalRejected: number;
	totalFailed: number;

	rateLimitHit: boolean;
	searchRequestsBudget: number;
	totalVariantsTried: number;

	discoveryPlanMode: string | null;
	discoveryPlanDiagnosis: string | null;
	discoveryPlanConfidence: string | null;
	discoveryPlanSummary: string | null;
	discoveryPlanReason: string | null;
	discoveryPlanQuerySelection: string | null;
	discoveryPlanSaturationBps: number | null;
	discoveryPlanNewBps: number | null;
	discoveryPlanFailureBps: number | null;

	error: string | null;
	createdAt: string;
};

type SectionHealth = {
	section: string;

	pendingTotal: number;
	pendingAccepted: number;
	pendingRejected: number;

	approvedTotal: number;
	rejectedTotal: number;
	hiddenTotal: number;

	total: number;

	lastRun: RecentDiscoveryRun | null;
};

function toNumber(value: unknown) {
	return Number(value ?? 0);
}

function createEmptySectionHealth(section: string): SectionHealth {
	return {
		section,

		pendingTotal: 0,
		pendingAccepted: 0,
		pendingRejected: 0,

		approvedTotal: 0,
		rejectedTotal: 0,
		hiddenTotal: 0,

		total: 0,

		lastRun: null,
	};
}

export async function getAdminDashboardOverview({
	recentRunsSection,
}: {
	recentRunsSection?: SectionId;
} = {}) {
	let recentRunsQuery = db
		.select({
			section: syncLogs.section,
			status: syncLogs.status,

			totalFetched: syncLogs.totalFetched,
			totalUnique: syncLogs.totalUnique,
			totalExisting: syncLogs.totalExisting,
			totalNew: syncLogs.totalNew,
			totalAccepted: syncLogs.totalAccepted,
			totalRejected: syncLogs.totalRejected,
			totalFailed: syncLogs.totalFailed,

			rateLimitHit: syncLogs.rateLimitHit,
			searchRequestsBudget: syncLogs.searchRequestsBudget,
			totalVariantsTried: syncLogs.totalVariantsTried,

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
		.$dynamic();

	if (recentRunsSection) {
		recentRunsQuery = recentRunsQuery.where(
			eq(syncLogs.section, recentRunsSection),
		);
	}

	const [statusRows, skillStatusRows, recentRuns] = await Promise.all([
		db
			.select({
				section: repoSections.section,
				status: repoSections.status,
				isAccepted: repoSections.isAccepted,
				total: count(),
			})
			.from(repoSections)
			.where(sql`${repoSections.section} != 'agent-skills'`)
			.groupBy(
				repoSections.section,
				repoSections.status,
				repoSections.isAccepted,
			),

		db
			.select({
				section: agentSkillFiles.section,
				status: agentSkillFiles.status,
				isAccepted: agentSkillFiles.isAccepted,
				total: count(),
			})
			.from(agentSkillFiles)
			.groupBy(
				agentSkillFiles.section,
				agentSkillFiles.status,
				agentSkillFiles.isAccepted,
			),

		recentRunsQuery.orderBy(desc(syncLogs.createdAt)).limit(10),
	]);

	const allStatusRows = [...statusRows, ...skillStatusRows];

	const sectionMap = new Map<string, SectionHealth>();

	for (const row of allStatusRows) {
		const section = row.section;
		const status = row.status as RepoSectionStatus;
		const total = toNumber(row.total);

		const current =
			sectionMap.get(section) ?? createEmptySectionHealth(section);

		current.total += total;

		if (status === "pending") {
			current.pendingTotal += total;

			if (row.isAccepted) {
				current.pendingAccepted += total;
			} else {
				current.pendingRejected += total;
			}
		}

		if (status === "approved") {
			current.approvedTotal += total;
		}

		if (status === "rejected") {
			current.rejectedTotal += total;
		}

		if (status === "hidden") {
			current.hiddenTotal += total;
		}

		sectionMap.set(section, current);
	}

	const mappedRecentRuns: RecentDiscoveryRun[] = recentRuns.map((run) => ({
		section: run.section,
		status: run.status,

		totalFetched: run.totalFetched,
		totalUnique: run.totalUnique,
		totalExisting: run.totalExisting,
		totalNew: run.totalNew,
		totalAccepted: run.totalAccepted,
		totalRejected: run.totalRejected,
		totalFailed: run.totalFailed,

		rateLimitHit: run.rateLimitHit,
		searchRequestsBudget: run.searchRequestsBudget,
		totalVariantsTried: run.totalVariantsTried,

		discoveryPlanMode: run.discoveryPlanMode,
		discoveryPlanDiagnosis: run.discoveryPlanDiagnosis,
		discoveryPlanConfidence: run.discoveryPlanConfidence,
		discoveryPlanSummary: run.discoveryPlanSummary,
		discoveryPlanReason: run.discoveryPlanReason,
		discoveryPlanQuerySelection: run.discoveryPlanQuerySelection,
		discoveryPlanSaturationBps: run.discoveryPlanSaturationBps,
		discoveryPlanNewBps: run.discoveryPlanNewBps,
		discoveryPlanFailureBps: run.discoveryPlanFailureBps,

		error: run.error,
		createdAt: run.createdAt.toISOString(),
	}));

	for (const run of mappedRecentRuns) {
		const section = run.section;
		const current =
			sectionMap.get(section) ?? createEmptySectionHealth(section);

		if (!current.lastRun) {
			current.lastRun = run;
		}

		sectionMap.set(section, current);
	}

	const sections = Array.from(sectionMap.values()).sort((a, b) =>
		a.section.localeCompare(b.section),
	);

	const totals = sections.reduce(
		(acc, section) => {
			acc.pendingTotal += section.pendingTotal;
			acc.pendingAccepted += section.pendingAccepted;
			acc.pendingRejected += section.pendingRejected;

			acc.approvedTotal += section.approvedTotal;
			acc.rejectedTotal += section.rejectedTotal;
			acc.hiddenTotal += section.hiddenTotal;

			acc.total += section.total;

			return acc;
		},
		{
			pendingTotal: 0,
			pendingAccepted: 0,
			pendingRejected: 0,

			approvedTotal: 0,
			rejectedTotal: 0,
			hiddenTotal: 0,

			total: 0,
		},
	);

	return {
		totals,

		sections,

		recentRuns: mappedRecentRuns,
	};
}
