import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db } from "@/server/db";
import { sectionSearchQueries } from "@/server/db/schema";
import type { DiscoveryPlanQuerySelection } from "@/server/repos/discovery/discovery.planner";
import {
	SECTION_CONFIGS,
	type SectionId,
} from "@/server/sections/sections.config";
import { calculateSearchQueryAutoTuneDecision } from "./admin-section-search-query-autotune";
import { getRecentDbQueryRunsForAutoTune } from "./admin-section-search-query-runs.query";

export type SectionSearchQueryType =
	| "seed"
	| "exploratory"
	| "ai_suggested"
	| "admin_added";

export type CreateSectionSearchQueryInput = {
	section: SectionId;
	query: string;
	type?: SectionSearchQueryType;
	priority?: number;
	enabled?: boolean;
};

export type UpdateSectionSearchQueryInput = {
	id: string;
	section?: SectionId;
	query?: string;
	type?: SectionSearchQueryType;
	priority?: number;
	enabled?: boolean;
};

export type UpdateSectionSearchQueryStatsInput = {
	id: string;

	totalFetched: number;
	totalCandidates: number;
	totalNew: number;
	totalAccepted: number;
	totalRejected: number;
};

function cleanQuery(value: string) {
	return value.trim().replace(/\s+/g, " ");
}

function mapSearchQueryRow(row: typeof sectionSearchQueries.$inferSelect) {
	return {
		id: row.id,

		section: row.section,
		query: row.query,
		type: row.type as SectionSearchQueryType,

		enabled: row.enabled,
		priority: row.priority,

		totalRuns: row.totalRuns,
		totalFetched: row.totalFetched,
		totalCandidates: row.totalCandidates,
		totalNew: row.totalNew,
		totalAccepted: row.totalAccepted,
		totalRejected: row.totalRejected,

		lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

export async function getEnabledSectionSearchQueries(section: SectionId) {
	const rows = await db
		.select()
		.from(sectionSearchQueries)
		.where(
			and(
				eq(sectionSearchQueries.section, section),
				eq(sectionSearchQueries.enabled, true),
			),
		)
		.orderBy(
			desc(sectionSearchQueries.priority),
			asc(sectionSearchQueries.lastUsedAt),
			desc(sectionSearchQueries.totalNew),
		);

	return rows.map(mapSearchQueryRow);
}

export async function getPlannedSectionSearchQueries({
	section,
	querySelection,
}: {
	section: SectionId;
	querySelection: DiscoveryPlanQuerySelection;
}) {
	const query = db
		.select()
		.from(sectionSearchQueries)
		.where(
			and(
				eq(sectionSearchQueries.section, section),
				eq(sectionSearchQueries.enabled, true),
			),
		);

	if (querySelection === "least-used") {
		const rows = await query.orderBy(
			asc(sectionSearchQueries.totalRuns),
			desc(sectionSearchQueries.priority),
			asc(sectionSearchQueries.query),
		);

		return rows.map(mapSearchQueryRow);
	}

	if (querySelection === "balanced") {
		const rows = await query.orderBy(
			desc(sectionSearchQueries.priority),
			asc(sectionSearchQueries.lastUsedAt),
			asc(sectionSearchQueries.totalRuns),
		);

		return rows.map(mapSearchQueryRow);
	}

	const rows = await query.orderBy(
		desc(sectionSearchQueries.priority),
		asc(sectionSearchQueries.lastUsedAt),
	);

	return rows.map(mapSearchQueryRow);
}

export async function getAdminSectionSearchQueries(section: SectionId) {
	const rows = await db
		.select()
		.from(sectionSearchQueries)
		.where(eq(sectionSearchQueries.section, section))
		.orderBy(
			desc(sectionSearchQueries.enabled),
			desc(sectionSearchQueries.priority),
			desc(sectionSearchQueries.totalNew),
			asc(sectionSearchQueries.query),
		);

	return rows.map(mapSearchQueryRow);
}

export async function seedSectionSearchQueriesFromStrategy({
	section,
	queries,
}: {
	section: SectionId;
	queries: string[];
}) {
	const cleanedQueries = Array.from(
		new Set(queries.map(cleanQuery).filter(Boolean)),
	);

	if (cleanedQueries.length === 0) {
		return {
			inserted: 0,
			queries: await getAdminSectionSearchQueries(section),
		};
	}

	const rows = await db
		.insert(sectionSearchQueries)
		.values(
			cleanedQueries.map((query, index) => ({
				section,
				query,
				type: "seed",
				enabled: true,
				priority: Math.max(1, 10 - index),
			})),
		)
		.onConflictDoNothing({
			target: [sectionSearchQueries.section, sectionSearchQueries.query],
		})
		.returning();

	return {
		inserted: rows.length,
		queries: await getAdminSectionSearchQueries(section),
	};
}

export async function ensureSectionSearchQueriesSeeded({
	section,
	fallbackQueries,
}: {
	section: SectionId;
	fallbackQueries: string[];
}) {
	const existing = await getAdminSectionSearchQueries(section);

	if (existing.length > 0) {
		return existing;
	}

	const seeded = await seedSectionSearchQueriesFromStrategy({
		section,
		queries:
			SECTION_CONFIGS[section].defaultQueries.length > 0
				? SECTION_CONFIGS[section].defaultQueries
				: fallbackQueries,
	});

	return seeded.queries;
}

export async function createSectionSearchQuery({
	section,
	query,
	type = "admin_added",
	priority = 10,
	enabled = true,
}: CreateSectionSearchQueryInput) {
	const cleanedQuery = cleanQuery(query);

	if (!cleanedQuery) {
		throw new Error("Search query cannot be empty.");
	}

	const rows = await db
		.insert(sectionSearchQueries)
		.values({
			section,
			query: cleanedQuery,
			type,
			priority,
			enabled,
		})
		.onConflictDoUpdate({
			target: [sectionSearchQueries.section, sectionSearchQueries.query],
			set: {
				type,
				priority,
				enabled,
				updatedAt: new Date(),
			},
		})
		.returning();

	const row = rows[0];

	if (!row) {
		throw new Error("Failed to create search query.");
	}

	return mapSearchQueryRow(row);
}

export async function promoteTemporarySearchQuery({
	section,
	query,
}: {
	section: SectionId;
	query: string;
}) {
	const cleanedQuery = cleanQuery(query);

	if (!cleanedQuery) {
		throw new Error("Search query cannot be empty.");
	}

	const rows = await db
		.insert(sectionSearchQueries)
		.values({
			section,
			query: cleanedQuery,
			type: "exploratory",
			priority: 8,
			enabled: true,
		})
		.onConflictDoUpdate({
			target: [sectionSearchQueries.section, sectionSearchQueries.query],
			set: {
				type: sql<SectionSearchQueryType>`case when ${sectionSearchQueries.type} = 'seed' then ${sectionSearchQueries.type} else 'exploratory' end`,
				priority: sql<number>`greatest(${sectionSearchQueries.priority}, 8)`,
				enabled: true,
				updatedAt: new Date(),
			},
		})
		.returning();

	const row = rows[0];

	if (!row) {
		throw new Error("Failed to promote temporary discovery.");
	}

	return mapSearchQueryRow(row);
}

export async function updateSectionSearchQuery({
	id,
	section,
	query,
	type,
	priority,
	enabled,
}: UpdateSectionSearchQueryInput) {
	const updateValues: Partial<typeof sectionSearchQueries.$inferInsert> = {
		updatedAt: new Date(),
	};

	if (query !== undefined) {
		const cleanedQuery = cleanQuery(query);

		if (!cleanedQuery) {
			throw new Error("Search query cannot be empty.");
		}

		updateValues.query = cleanedQuery;
	}

	if (type !== undefined) {
		updateValues.type = type;
	}

	if (priority !== undefined) {
		updateValues.priority = priority;
	}

	if (enabled !== undefined) {
		updateValues.enabled = enabled;
	}

	const rows = await db
		.update(sectionSearchQueries)
		.set(updateValues)
		.where(
			section
				? and(
						eq(sectionSearchQueries.id, id),
						eq(sectionSearchQueries.section, section),
					)
				: eq(sectionSearchQueries.id, id),
		)
		.returning();

	const row = rows[0];

	if (!row) {
		throw new Error("Search query not found.");
	}

	return mapSearchQueryRow(row);
}

export async function disableSectionSearchQuery(id: string) {
	return updateSectionSearchQuery({
		id,
		enabled: false,
	});
}

export async function updateSectionSearchQueryStats({
	id,
	totalFetched,
	totalCandidates,
	totalNew,
	totalAccepted,
	totalRejected,
}: UpdateSectionSearchQueryStatsInput) {
	const rows = await db
		.update(sectionSearchQueries)
		.set({
			totalRuns: sql`${sectionSearchQueries.totalRuns} + 1`,
			totalFetched: sql`${sectionSearchQueries.totalFetched} + ${totalFetched}`,
			totalCandidates: sql`${sectionSearchQueries.totalCandidates} + ${totalCandidates}`,
			totalNew: sql`${sectionSearchQueries.totalNew} + ${totalNew}`,
			totalAccepted: sql`${sectionSearchQueries.totalAccepted} + ${totalAccepted}`,
			totalRejected: sql`${sectionSearchQueries.totalRejected} + ${totalRejected}`,
			lastUsedAt: new Date(),
			updatedAt: new Date(),
		})
		.where(eq(sectionSearchQueries.id, id))
		.returning();

	const row = rows[0];

	if (!row) {
		throw new Error("Search query not found.");
	}

	return mapSearchQueryRow(row);
}

export async function deleteSectionSearchQuery(
	id: string,
	section?: SectionId,
) {
	const rows = await db
		.delete(sectionSearchQueries)
		.where(
			section
				? and(
						eq(sectionSearchQueries.id, id),
						eq(sectionSearchQueries.section, section),
					)
				: eq(sectionSearchQueries.id, id),
		)
		.returning();

	const deleted = rows[0];

	if (!deleted) {
		throw new Error("Search query not found.");
	}

	return mapSearchQueryRow(deleted);
}

export async function autoTuneSectionSearchQueries(
	section: SectionId,
	context?: {
		totalNew: number;
		totalCandidates: number;
		totalExistingInSection: number;
		preventBoosts?: boolean;
	},
) {
	const [queries, recentRunsByQueryId] = await Promise.all([
		getAdminSectionSearchQueries(section),
		getRecentDbQueryRunsForAutoTune({
			section,
			limitPerQuery: 5,
		}),
	]);

	const decisions = queries.map((query) => {
		const recentRuns = recentRunsByQueryId.get(query.id) ?? [];
		const recentNew = recentRuns.reduce(
			(total, run) => total + run.totalNew,
			0,
		);
		const recentAccepted = recentRuns.reduce(
			(total, run) => total + run.totalAccepted,
			0,
		);
		const recentRejected = recentRuns.reduce(
			(total, run) => total + run.totalRejected,
			0,
		);
		const recentCandidates = recentRuns.reduce(
			(total, run) => total + run.totalCandidates,
			0,
		);
		const recentStats =
			recentRuns.length > 0
				? {
						recentRuns: recentRuns.length,
						recentNew,
						recentAccepted,
						recentRejected,
						recentCandidates,
						recentAcceptanceRate:
							recentNew > 0 ? recentAccepted / recentNew : 0,
						recentNewRate:
							recentCandidates > 0 ? recentNew / recentCandidates : 0,
					}
				: undefined;

		return calculateSearchQueryAutoTuneDecision(
			{
				id: query.id,
				query: query.query,
				enabled: query.enabled,
				priority: query.priority,
				totalRuns: query.totalRuns,
				totalNew: query.totalNew,
				totalAccepted: query.totalAccepted,
				totalRejected: query.totalRejected,
			},
			context,
			recentStats,
		);
	});

	const changedDecisions = decisions.filter((decision) => decision.changed);

	await Promise.all(
		changedDecisions.map((decision) =>
			updateSectionSearchQuery({
				id: decision.id,
				priority: decision.nextPriority,
			}),
		),
	);

	return {
		totalQueries: queries.length,
		changed: changedDecisions.length,
		decisions,
	};
}
