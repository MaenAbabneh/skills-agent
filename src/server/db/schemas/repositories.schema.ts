import { sql } from "drizzle-orm";
import {
	bigint,
	boolean,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

/**
 * GitHub repositories.
 *
 * One row per GitHub repository.
 * Do not store section-specific data here.
 */
export const repositories = pgTable(
	"repositories",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		githubId: bigint("github_id", { mode: "number" }).notNull(),

		owner: text("owner").notNull(),
		name: text("name").notNull(),
		fullName: text("full_name").notNull(),

		description: text("description").notNull(),

		url: text("url").notNull(),
		homepage: text("homepage"),
		avatarUrl: text("avatar_url").notNull(),

		language: text("language"),

		topics: text("topics").array().notNull().default(sql`ARRAY[]::text[]`),

		stars: integer("stars").notNull().default(0),
		forks: integer("forks").notNull().default(0),
		openIssues: integer("open_issues").notNull().default(0),

		archived: boolean("archived").notNull().default(false),
		fork: boolean("fork").notNull().default(false),

		license: text("license"),

		defaultBranch: text("default_branch").notNull().default("main"),

		githubCreatedAt: timestamp("github_created_at", {
			withTimezone: true,
		}).notNull(),

		githubUpdatedAt: timestamp("github_updated_at", {
			withTimezone: true,
		}).notNull(),

		pushedAt: timestamp("pushed_at", {
			withTimezone: true,
		}).notNull(),

		syncedAt: timestamp("synced_at", {
			withTimezone: true,
		})
			.defaultNow()
			.notNull(),

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
		githubIdUnique: uniqueIndex("repositories_github_id_unique").on(
			table.githubId,
		),

		fullNameUnique: uniqueIndex("repositories_full_name_unique").on(
			table.fullName,
		),

		ownerNameUnique: uniqueIndex("repositories_owner_name_unique").on(
			table.owner,
			table.name,
		),

		ownerNameIdx: index("repositories_owner_name_idx").on(
			table.owner,
			table.name,
		),

		starsIdx: index("repositories_stars_idx").on(table.stars),

		githubCreatedAtIdx: index("repositories_github_created_at_idx").on(
			table.githubCreatedAt,
		),

		githubUpdatedAtIdx: index("repositories_github_updated_at_idx").on(
			table.githubUpdatedAt,
		),

		pushedAtIdx: index("repositories_pushed_at_idx").on(table.pushedAt),

		languageIdx: index("repositories_language_idx").on(table.language),

		archivedIdx: index("repositories_archived_idx").on(table.archived),

		forkIdx: index("repositories_fork_idx").on(table.fork),
	}),
);
