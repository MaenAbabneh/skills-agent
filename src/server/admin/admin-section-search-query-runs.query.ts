import { and, desc, eq, gt, inArray, max, sql, sum } from "drizzle-orm";

import { db } from "@/server/db";
import { sectionSearchQueryRuns } from "@/server/db/schemas/sectionSearchQueryRuns.schema";
import type { SectionId } from "@/server/sections/sections.config";

export const SECTION_SEARCH_QUERY_RUN_TYPES = [
	"db",
	"temporary",
	"topic_temporary",
	"ai_temporary",
] as const;

export type SectionSearchQueryRunType =
	(typeof SECTION_SEARCH_QUERY_RUN_TYPES)[number];

const TEMPORARY_QUERY_RUN_TYPES = SECTION_SEARCH_QUERY_RUN_TYPES.filter(
	(type) => type !== "db",
);

export function normalizeQueryRunType(
	value: string,
): SectionSearchQueryRunType {
	if (
		value === "db" ||
		value === "temporary" ||
		value === "topic_temporary" ||
		value === "ai_temporary"
	) {
		return value;
	}

	return "temporary";
}

export type CreateSectionSearchQueryRunInput = {
	syncLogId?: string | null;

	sectionSearchQueryId?: string | null;

	section: SectionId;

	query: string;

	queryType: SectionSearchQueryRunType;

	totalFetched: number;

	totalCandidates: number;

	totalNew: number;

	totalAccepted: number;

	totalRejected: number;
};

function mapSectionSearchQueryRunRow(
	row: typeof sectionSearchQueryRuns.$inferSelect,
) {
	return {
		id: row.id,
		syncLogId: row.syncLogId,
		sectionSearchQueryId: row.sectionSearchQueryId,

		section: row.section,
		query: row.query,
		queryType: normalizeQueryRunType(row.queryType),

		totalFetched: row.totalFetched,
		totalCandidates: row.totalCandidates,
		totalNew: row.totalNew,
		totalAccepted: row.totalAccepted,
		totalRejected: row.totalRejected,

		createdAt: row.createdAt.toISOString(),
	};
}

export async function createSectionSearchQueryRuns(
	inputs: CreateSectionSearchQueryRunInput[],
) {
	if (inputs.length === 0) {
		return [];
	}

	return db
		.insert(sectionSearchQueryRuns)
		.values(
			inputs.map((input) => ({
				syncLogId: input.syncLogId ?? null,
				sectionSearchQueryId: input.sectionSearchQueryId ?? null,
				section: input.section,
				query: input.query,
				queryType: input.queryType,
				totalFetched: input.totalFetched,
				totalCandidates: input.totalCandidates,
				totalNew: input.totalNew,
				totalAccepted: input.totalAccepted,
				totalRejected: input.totalRejected,
			})),
		)
		.returning();
}

export async function getLatestSectionSearchQueryRuns({
	section,
	limit = 20,
}: {
	section: SectionId;
	limit?: number;
}) {
	const rows = await db
		.select()
		.from(sectionSearchQueryRuns)
		.where(eq(sectionSearchQueryRuns.section, section))
		.orderBy(desc(sectionSearchQueryRuns.createdAt))
		.limit(limit);

	return rows.map(mapSectionSearchQueryRunRow);
}

export async function getLatestTemporaryQueryRuns({
	section,
	limit = 10,
}: {
	section: SectionId;
	limit?: number;
}) {
	const rows = await db
		.select()
		.from(sectionSearchQueryRuns)
		.where(eq(sectionSearchQueryRuns.section, section))
		.orderBy(
			desc(sectionSearchQueryRuns.totalAccepted),
			desc(sectionSearchQueryRuns.totalNew),
		)
		.limit(limit);

	return rows
		.filter((row) => normalizeQueryRunType(row.queryType) !== "db")
		.map(mapSectionSearchQueryRunRow);
}

export async function getRecentDbQueryRunsForAutoTune({
	section,
	limitPerQuery = 5,
}: {
	section: SectionId;
	limitPerQuery?: number;
}) {
	const rows = await db
		.select()
		.from(sectionSearchQueryRuns)
		.where(
			and(
				eq(sectionSearchQueryRuns.section, section),
				eq(sectionSearchQueryRuns.queryType, "db"),
			),
		)
		.orderBy(desc(sectionSearchQueryRuns.createdAt));

	const grouped = new Map<string, typeof rows>();

	for (const row of rows) {
		if (!row.sectionSearchQueryId) {
			continue;
		}

		const existing = grouped.get(row.sectionSearchQueryId) ?? [];

		if (existing.length >= limitPerQuery) {
			continue;
		}

		existing.push(row);
		grouped.set(row.sectionSearchQueryId, existing);
	}

	return grouped;
}

export async function getRecentWeakTemporaryQueryTexts({
	section,
	limit = 50,
}: {
	section: SectionId;
	limit?: number;
}) {
	const rows = await db
		.select({
			section: sectionSearchQueryRuns.section,
			query: sectionSearchQueryRuns.query,
		})
		.from(sectionSearchQueryRuns)
		.where(
			and(
				eq(sectionSearchQueryRuns.section, section),
				inArray(sectionSearchQueryRuns.queryType, TEMPORARY_QUERY_RUN_TYPES),
				eq(sectionSearchQueryRuns.totalNew, 0),
			),
		)
		.orderBy(desc(sectionSearchQueryRuns.createdAt))
		.limit(limit);

	return Array.from(new Set(rows.map((row) => row.query)));
}

export async function getRecentSuccessfulQueryTexts({
	section,
	limit = 20,
}: {
	section: SectionId;
	limit?: number;
}) {
	const rows = await db
		.select({
			section: sectionSearchQueryRuns.section,
			query: sectionSearchQueryRuns.query,
		})
		.from(sectionSearchQueryRuns)
		.where(
			and(
				eq(sectionSearchQueryRuns.section, section),
				gt(sectionSearchQueryRuns.totalNew, 0),
			),
		)
		.orderBy(
			desc(sectionSearchQueryRuns.totalAccepted),
			desc(sectionSearchQueryRuns.totalNew),
			desc(sectionSearchQueryRuns.createdAt),
		)
		.limit(limit);

	return Array.from(new Set(rows.map((row) => row.query)));
}

export async function getGroupedTemporaryDiscoveries({
	section,
	limit = 20,
}: {
	section: SectionId;
	limit?: number;
}) {
	const rows = await db
		.select({
			section: sectionSearchQueryRuns.section,
			query: sectionSearchQueryRuns.query,
			queryType: sectionSearchQueryRuns.queryType,
			runs: sql<number>`count(*)::int`,
			totalNew: sum(sectionSearchQueryRuns.totalNew).mapWith(Number),
			totalAccepted: sum(sectionSearchQueryRuns.totalAccepted).mapWith(Number),
			totalRejected: sum(sectionSearchQueryRuns.totalRejected).mapWith(Number),
			latestSeenAt: max(sectionSearchQueryRuns.createdAt),
		})
		.from(sectionSearchQueryRuns)
		.where(
			and(
				eq(sectionSearchQueryRuns.section, section),
				inArray(sectionSearchQueryRuns.queryType, TEMPORARY_QUERY_RUN_TYPES),
			),
		)
		.groupBy(
			sectionSearchQueryRuns.section,
			sectionSearchQueryRuns.query,
			sectionSearchQueryRuns.queryType,
		)
		.having(gt(sum(sectionSearchQueryRuns.totalNew), 0))
		.orderBy(
			desc(sum(sectionSearchQueryRuns.totalAccepted)),
			desc(sum(sectionSearchQueryRuns.totalNew)),
			desc(max(sectionSearchQueryRuns.createdAt)),
		)
		.limit(limit);

	return rows.map((row) => ({
		section: row.section,
		query: row.query,
		queryType: normalizeQueryRunType(row.queryType),
		runs: row.runs,
		totalNew: row.totalNew ?? 0,
		totalAccepted: row.totalAccepted ?? 0,
		totalRejected: row.totalRejected ?? 0,
		latestSeenAt: row.latestSeenAt?.toISOString() ?? null,
	}));
}
