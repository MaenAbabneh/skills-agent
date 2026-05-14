import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

import { syncLogs } from "./logs.schema";
import { sectionSearchQueries } from "./sectionSearchQueries.schema";

export const sectionSearchQueryRuns = pgTable(
	"section_search_query_runs",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		syncLogId: uuid("sync_log_id").references(() => syncLogs.id, {
			onDelete: "set null",
		}),

		sectionSearchQueryId: uuid("section_search_query_id").references(
			() => sectionSearchQueries.id,
			{
				onDelete: "set null",
			},
		),

		section: text("section").notNull(),

		query: text("query").notNull(),

		queryType: text("query_type").default("db").notNull(),

		totalFetched: integer("total_fetched").default(0).notNull(),

		totalCandidates: integer("total_candidates").default(0).notNull(),

		totalNew: integer("total_new").default(0).notNull(),

		totalAccepted: integer("total_accepted").default(0).notNull(),

		totalRejected: integer("total_rejected").default(0).notNull(),

		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		syncLogIdx: index("section_search_query_runs_sync_log_idx").on(
			table.syncLogId,
		),
		sectionCreatedAtIdx: index(
			"section_search_query_runs_section_created_at_idx",
		).on(table.section, table.createdAt),
		sectionQueryIdx: index("section_search_query_runs_section_query_idx").on(
			table.section,
			table.query,
		),
	}),
);
