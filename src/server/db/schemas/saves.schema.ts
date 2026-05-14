import {
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { agentSkillFiles } from "./agent-skill-files.schema";
import { user } from "./auth-schema";
import { repoSections } from "./repo-sections.schema";

/**
 * Agent Skill Saves/Bookmarks.
 *
 * Users can save/bookmark agent skills.
 * One user can only save each skill once.
 */
export const agentSkillSaves = pgTable(
	"agent_skill_saves",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),

		agentSkillFileId: uuid("agent_skill_file_id")
			.notNull()
			.references(() => agentSkillFiles.id, {
				onDelete: "cascade",
			}),

		createdAt: timestamp("created_at", {
			withTimezone: true,
		})
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		userSkillUnique: uniqueIndex("agent_skill_saves_user_skill_unique").on(
			table.userId,
			table.agentSkillFileId,
		),

		userIdIdx: index("agent_skill_saves_user_id_idx").on(table.userId),

		agentSkillFileIdIdx: index("agent_skill_saves_skill_id_idx").on(
			table.agentSkillFileId,
		),
	}),
);

/**
 * Repository Saves/Bookmarks.
 *
 * Users can save/bookmark repositories within sections.
 * One user can only save each repo section once.
 */
export const repoSaves = pgTable(
	"repo_saves",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),

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
		userRepoUnique: uniqueIndex("repo_saves_user_repo_unique").on(
			table.userId,
			table.repoSectionId,
		),

		userIdIdx: index("repo_saves_user_id_idx").on(table.userId),

		repoSectionIdIdx: index("repo_saves_repo_section_id_idx").on(
			table.repoSectionId,
		),
	}),
);
