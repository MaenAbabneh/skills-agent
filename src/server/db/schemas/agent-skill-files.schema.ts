import {
	boolean,
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
import { repoSections } from "./repo-sections.schema";
import { repositories } from "./repositories.schema";

/**
 * Agent Skill Files.
 *
 * One row per skill file discovered inside a repo.
 * Includes detail page content fields and normalized taxonomy references.
 */
export const agentSkillFiles = pgTable(
	"agent_skill_files",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		repoId: uuid("repo_id")
			.notNull()
			.references(() => repositories.id, {
				onDelete: "cascade",
			}),

		repoSectionId: uuid("repo_section_id").references(() => repoSections.id, {
			onDelete: "set null",
		}),

		section: text("section").notNull().default("agent-skills"),

		skillName: text("skill_name").notNull(),
		slug: text("slug").notNull(),
		filePath: text("file_path").notNull(),
		fileUrl: text("file_url").notNull(),
		fileName: text("file_name").notNull(),
		confidence: text("confidence").notNull(),

		// Legacy category field (text) for fallback
		category: text("category").notNull().default("Other"),

		// Normalized taxonomy references
		categoryId: uuid("category_id").references(() => agentSkillCategories.id, {
			onDelete: "set null",
		}),

		subcategoryId: uuid("subcategory_id").references(
			() => agentSkillSubcategories.id,
			{
				onDelete: "set null",
			},
		),

		description: text("description"),

		allowedTools: jsonb("allowed_tools"),
		userInvocable: boolean("user_invocable"),

		status: text("status").notNull().default("pending"),
		isAccepted: boolean("is_accepted").notNull().default(true),

		// Detail page content fields
		content: text("content"),
		contentPreview: text("content_preview"),
		rawFileUrl: text("raw_file_url"),
		contentSha: text("content_sha"),
		contentFetchedAt: timestamp("content_fetched_at", {
			withTimezone: true,
		}),

		skillFolderPath: text("skill_folder_path"),
		downloadZipUrl: text("download_zip_url"),

		metadata: jsonb("metadata").notNull().default({}),

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
		repoSectionFilePathUnique: uniqueIndex(
			"agent_skill_files_repo_section_path_unique",
		).on(table.repoId, table.section, table.filePath),

		slugUnique: uniqueIndex("agent_skill_files_slug_unique").on(table.slug),

		sectionIdx: index("agent_skill_files_section_idx").on(table.section),
		statusIdx: index("agent_skill_files_status_idx").on(table.status),
		categoryIdx: index("agent_skill_files_category_idx").on(table.category),
		slugIdx: index("agent_skill_files_slug_idx").on(table.slug),

		isAcceptedIdx: index("agent_skill_files_is_accepted_idx").on(
			table.isAccepted,
		),

		categoryIdIdx: index("agent_skill_files_category_id_idx").on(
			table.categoryId,
		),

		subcategoryIdIdx: index("agent_skill_files_subcategory_id_idx").on(
			table.subcategoryId,
		),

		sectionStatusIdx: index("agent_skill_files_section_status_idx").on(
			table.section,
			table.status,
		),

		sectionAcceptedIdx: index("agent_skill_files_section_accepted_idx").on(
			table.section,
			table.isAccepted,
		),

		sectionCategoryIdIdx: index("agent_skill_files_section_category_id_idx").on(
			table.section,
			table.categoryId,
		),

		sectionSubcategoryIdIdx: index(
			"agent_skill_files_section_subcategory_id_idx",
		).on(table.section, table.subcategoryId),

		categorySubcategoryIdIdx: index(
			"agent_skill_files_category_subcategory_id_idx",
		).on(table.categoryId, table.subcategoryId),

		repoIdIdx: index("agent_skill_files_repo_id_idx").on(table.repoId),

		contentFetchedAtIdx: index("agent_skill_files_content_fetched_at_idx").on(
			table.contentFetchedAt,
		),
	}),
);
