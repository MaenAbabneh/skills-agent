import {
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

/**
 * Agent Skill Categories.
 *
 * Top-level categories for agent skills (e.g. "AI Search", "Data Processing").
 */
export const agentSkillCategories = pgTable(
	"agent_skill_categories",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		name: text("name").notNull(),
		slug: text("slug").notNull(),

		description: text("description"),
		icon: text("icon"),

		sortOrder: integer("sort_order").notNull().default(0),
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
		slugUnique: uniqueIndex("agent_skill_categories_slug_unique").on(
			table.slug,
		),

		nameIdx: index("agent_skill_categories_name_idx").on(table.name),
		sortOrderIdx: index("agent_skill_categories_sort_order_idx").on(
			table.sortOrder,
		),
	}),
);

/**
 * Agent Skill Subcategories.
 *
 * Nested categories within a parent category.
 */
export const agentSkillSubcategories = pgTable(
	"agent_skill_subcategories",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		categoryId: uuid("category_id")
			.notNull()
			.references(() => agentSkillCategories.id, {
				onDelete: "cascade",
			}),

		name: text("name").notNull(),
		slug: text("slug").notNull(),

		description: text("description"),
		fileLabel: text("file_label"),

		sortOrder: integer("sort_order").notNull().default(0),
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
		categorySlugUnique: uniqueIndex(
			"agent_skill_subcategories_category_slug_unique",
		).on(table.categoryId, table.slug),

		categoryIdIdx: index("agent_skill_subcategories_category_id_idx").on(
			table.categoryId,
		),

		slugIdx: index("agent_skill_subcategories_slug_idx").on(table.slug),
		nameIdx: index("agent_skill_subcategories_name_idx").on(table.name),
		sortOrderIdx: index("agent_skill_subcategories_sort_order_idx").on(
			table.sortOrder,
		),
	}),
);
