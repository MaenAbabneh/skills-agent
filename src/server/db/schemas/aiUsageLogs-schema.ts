import {
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { repoSectionEnum } from "./enums.schema";

export const aiUsageStatusEnum = pgEnum("ai_usage_status", [
	"success",
	"failed",
	"skipped",
]);

export const aiUsageLogs = pgTable(
	"ai_usage_logs",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		feature: text("feature").notNull(),
		section: repoSectionEnum("section").notNull(),

		provider: text("provider").notNull(),
		model: text("model").notNull(),

		status: aiUsageStatusEnum("status").notNull(),

		reason: text("reason"),

		inputTokens: integer("input_tokens").default(0).notNull(),
		outputTokens: integer("output_tokens").default(0).notNull(),
		estimatedCostCents: integer("estimated_cost_cents").default(0).notNull(),

		createdAt: timestamp("created_at", {
			withTimezone: true,
		})
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		sectionCreatedAtIdx: index("ai_usage_logs_section_created_at_idx").on(
			table.section,
			table.createdAt,
		),
		featureCreatedAtIdx: index("ai_usage_logs_feature_created_at_idx").on(
			table.feature,
			table.createdAt,
		),
		createdAtIdx: index("ai_usage_logs_created_at_idx").on(table.createdAt),
		statusIdx: index("ai_usage_logs_status_idx").on(table.status),
	}),
);
