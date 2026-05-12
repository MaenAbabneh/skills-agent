import {
	boolean,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

export const sectionDiscoverySettings = pgTable("section_discovery_settings", {
	id: uuid("id").primaryKey().defaultRandom(),

	section: text("section").notNull().unique(),

	enabled: boolean("enabled").default(true).notNull(),

	perPage: integer("per_page").default(20).notNull(),

	maxVariantsPerRun: integer("max_variants_per_run").default(12).notNull(),

	minSearchRemaining: integer("min_search_remaining").default(3).notNull(),

	maxCandidateMultiplier: integer("max_candidate_multiplier")
		.default(3)
		.notNull(),

	pages: jsonb("pages").$type<number[]>().default([1, 2]).notNull(),

	pushedWithinDays: jsonb("pushed_within_days")
		.$type<number[]>()
		.default([7, 30])
		.notNull(),

	createdWithinDays: jsonb("created_within_days")
		.$type<number[]>()
		.default([30, 90])
		.notNull(),

	starRanges: jsonb("star_ranges")
		.$type<Array<{ min: number; max?: number }>>()
		.default([
			{ min: 1, max: 20 },
			{ min: 20, max: 100 },
			{ min: 100, max: 500 },
		])
		.notNull(),

	autoTuneQueriesEnabled: boolean("auto_tune_queries_enabled")
		.default(false)
		.notNull(),

	createdAt: timestamp("created_at").defaultNow().notNull(),

	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});
