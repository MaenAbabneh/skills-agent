import {
	boolean,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { repoSectionEnum, syncStatusEnum } from "./enums.schema";

/**
 * Sync logs.
 *
 * Tracks sync/discovery runs for each section.
 */
export const syncLogs = pgTable("sync_logs", {
	id: uuid("id").defaultRandom().primaryKey(),

	section: repoSectionEnum("section").notNull(),

	totalFetched: integer("total_fetched").notNull().default(0),
	totalUnique: integer("total_unique").notNull().default(0),
	totalAccepted: integer("total_accepted").notNull().default(0),
	totalRejected: integer("total_rejected").notNull().default(0),
	totalExisting: integer("total_existing").default(0).notNull(),

	totalNew: integer("total_new").default(0).notNull(),

	totalFailed: integer("total_failed").default(0).notNull(),

	rateLimitHit: boolean("rate_limit_hit").default(false).notNull(),

	searchRequestsBudget: integer("search_requests_budget").default(0).notNull(),

	totalVariantsTried: integer("total_variants_tried").default(0).notNull(),

	discoveryPlanMode: text("discovery_plan_mode"),

	discoveryPlanDiagnosis: text("discovery_plan_diagnosis"),

	discoveryPlanConfidence: text("discovery_plan_confidence"),

	discoveryPlanSummary: text("discovery_plan_summary"),

	discoveryPlanReason: text("discovery_plan_reason"),

	discoveryPlanQuerySelection: text("discovery_plan_query_selection"),

	discoveryPlanSaturationBps: integer("discovery_plan_saturation_bps"),

	discoveryPlanNewBps: integer("discovery_plan_new_bps"),

	discoveryPlanFailureBps: integer("discovery_plan_failure_bps"),

	status: syncStatusEnum("status").notNull(),

	error: text("error"),

	metadata: jsonb("metadata").notNull().default({}),

	createdAt: timestamp("created_at", {
		withTimezone: true,
	})
		.defaultNow()
		.notNull(),
});
