import {
	boolean,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

export const sectionSearchQueries = pgTable(
	"section_search_queries",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		section: text("section").notNull(),

		query: text("query").notNull(),

		type: text("type").default("seed").notNull(),

		enabled: boolean("enabled").default(true).notNull(),

		priority: integer("priority").default(10).notNull(),

		totalRuns: integer("total_runs").default(0).notNull(),

		totalFetched: integer("total_fetched").default(0).notNull(),

		totalCandidates: integer("total_candidates").default(0).notNull(),

		totalNew: integer("total_new").default(0).notNull(),

		totalAccepted: integer("total_accepted").default(0).notNull(),

		totalRejected: integer("total_rejected").default(0).notNull(),

		lastUsedAt: timestamp("last_used_at"),

		createdAt: timestamp("created_at").defaultNow().notNull(),

		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => ({
		sectionQueryUnique: uniqueIndex(
			"section_search_queries_section_query_idx",
		).on(table.section, table.query),
	}),
);
