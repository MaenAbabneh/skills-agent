import {
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { repoSections } from "./repo-sections.schema";

/**
 * Collections.
 *
 * User can create folders/playlists of repo sections.
 * Same user cannot create two collections with the same title.
 */
export const collections = pgTable(
	"collections",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		userId: text("user_id").notNull(),

		title: text("title").notNull(),
		description: text("description"),

		isPublic: boolean("is_public").notNull().default(false),

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
		userTitleUnique: uniqueIndex("collections_user_title_unique").on(
			table.userId,
			table.title,
		),

		userIdIdx: index("collections_user_id_idx").on(table.userId),
	}),
);

/**
 * Repos inside collections.
 *
 * Same repo section cannot be added twice to the same collection.
 */
export const collectionRepos = pgTable(
	"collection_repos",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		collectionId: uuid("collection_id")
			.notNull()
			.references(() => collections.id, {
				onDelete: "cascade",
			}),

		repoSectionId: uuid("repo_section_id")
			.notNull()
			.references(() => repoSections.id, {
				onDelete: "cascade",
			}),

		createdAt: timestamp("created_at", {
			withTimezone: true,
		})
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		collectionRepoUnique: uniqueIndex(
			"collection_repos_collection_repo_unique",
		).on(table.collectionId, table.repoSectionId),

		collectionIdIdx: index("collection_repos_collection_id_idx").on(
			table.collectionId,
		),

		repoSectionIdIdx: index("collection_repos_repo_section_id_idx").on(
			table.repoSectionId,
		),
	}),
);
