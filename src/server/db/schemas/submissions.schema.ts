import {
	index,
	jsonb,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import {
	agentSkillCategories,
	agentSkillSubcategories,
} from "./agent-skill-taxonomy.schema";
import { user } from "./auth-schema";
import {
	repoSectionEnum,
	submissionStatusEnum,
	submissionTypeEnum,
} from "./enums.schema";

/**
 * User Submissions.
 *
 * Users can submit GitHub repos or skill files for review.
 * Stores minimal user input + GitHub fetch results.
 */
export const submissions = pgTable(
	"submissions",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),

		// Submission type: repo or skill_file
		submissionType: submissionTypeEnum("submission_type").notNull(),

		// GitHub URL provided by user (repo or skill file)
		githubUrl: text("github_url").notNull(),

		// Parsed from GitHub URL
		owner: text("owner"),
		repo: text("repo"),
		filePath: text("file_path"),

		// User input
		suggestedSection: repoSectionEnum("suggested_section").notNull(),

		suggestedCategoryId: uuid("suggested_category_id").references(
			() => agentSkillCategories.id,
			{
				onDelete: "set null",
			},
		),

		suggestedSubcategoryId: uuid("suggested_subcategory_id").references(
			() => agentSkillSubcategories.id,
			{
				onDelete: "set null",
			},
		),

		reason: text("reason"),

		// Status tracking
		status: submissionStatusEnum("status").notNull().default("pending"),

		// Admin only
		adminNote: text("admin_note"),

		// Fetch/process results stored in metadata
		metadata: jsonb("metadata").notNull().default({}),

		processedAt: timestamp("processed_at", {
			withTimezone: true,
		}),

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
		// githubUrl must be normalized before insert.
		submissionUrlTypeUnique: uniqueIndex(
			"submissions_github_section_type_unique",
		).on(table.githubUrl, table.suggestedSection, table.submissionType),

		userIdIdx: index("submissions_user_id_idx").on(table.userId),

		statusIdx: index("submissions_status_idx").on(table.status),

		submissionTypeIdx: index("submissions_submission_type_idx").on(
			table.submissionType,
		),

		suggestedSectionIdx: index("submissions_suggested_section_idx").on(
			table.suggestedSection,
		),

		ownerRepoIdx: index("submissions_owner_repo_idx").on(
			table.owner,
			table.repo,
		),

		createdAtIdx: index("submissions_created_at_idx").on(table.createdAt),

		processedAtIdx: index("submissions_processed_at_idx").on(table.processedAt),
	}),
);
