import {
	index,
	jsonb,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { repositories } from "./repositories.schema";

/**
 * Repository README enrichment.
 *
 * One row per repository. Stores fetched README content.
 * Only populated via manual admin enrichment — never during discovery.
 * Only applicable to repository-level sections (e.g. 3d-motion).
 * Must not be used for agent-skills (which uses agent_skill_files).
 */
export const repositoryReadmes = pgTable(
	"repository_readmes",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		repoId: uuid("repo_id")
			.notNull()
			.references(() => repositories.id, {
				onDelete: "cascade",
			}),

		owner: text("owner").notNull(),
		repoName: text("repo_name").notNull(),
		defaultBranch: text("default_branch").notNull(),

		readmePath: text("readme_path"),
		readmeUrl: text("readme_url"),
		rawReadmeUrl: text("raw_readme_url"),

		content: text("content"),
		contentPreview: text("content_preview"),
		contentSha: text("content_sha"),

		contentFetchedAt: timestamp("content_fetched_at", {
			withTimezone: true,
		}),

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
		repoIdUnique: uniqueIndex("repository_readmes_repo_id_unique").on(
			table.repoId,
		),

		contentFetchedAtIdx: index("repository_readmes_content_fetched_at_idx").on(
			table.contentFetchedAt,
		),

		updatedAtIdx: index("repository_readmes_updated_at_idx").on(
			table.updatedAt,
		),
	}),
);
