import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import type { RepoSectionMetadata } from "@/lib/validations/repo-metadata";
import type { ScoreBreakdown } from "@/lib/validations/repos";
import {
	repoSectionEnum,
	repoSectionStatusEnum,
	repoTypeEnum,
} from "./enums.schema";
import { repositories } from "./repositories.schema";

/**
 * Repo inside a section.
 *
 * Same GitHub repo can appear in multiple sections.
 * But the same repo cannot appear twice in the same section.
 */
export const repoSections = pgTable(
	"repo_sections",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		repoId: uuid("repo_id")
			.notNull()
			.references(() => repositories.id, {
				onDelete: "cascade",
			}),

		section: repoSectionEnum("section").notNull(),

		repoType: repoTypeEnum("repo_type").notNull().default("unknown"),

		score: integer("score").notNull().default(0),

		scoreBreakdown: jsonb("score_breakdown").$type<ScoreBreakdown>().notNull(),

		rejectionReasons: text("rejection_reasons").array().notNull().default([]),

		isAccepted: boolean("is_accepted").notNull().default(false),

		status: repoSectionStatusEnum("status").notNull().default("pending"),

		metadata: jsonb("metadata").$type<RepoSectionMetadata>().notNull(),

		createdAt: timestamp("created_at", {
			withTimezone: true,
		})
			.defaultNow()
			.notNull(),

		updatedAt: timestamp("updated_at", {
			withTimezone: true,
		})
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		repoSectionUnique: uniqueIndex("repo_sections_repo_section_unique").on(
			table.repoId,
			table.section,
		),

		sectionStatusIdx: index("repo_sections_section_status_idx").on(
			table.section,
			table.status,
		),

		sectionScoreIdx: index("repo_sections_section_score_idx").on(
			table.section,
			table.score,
		),

		sectionAcceptedIdx: index("repo_sections_section_accepted_idx").on(
			table.section,
			table.isAccepted,
		),

		repoIdIdx: index("repo_sections_repo_id_idx").on(table.repoId),

		statusIdx: index("repo_sections_status_idx").on(table.status),
	}),
);
