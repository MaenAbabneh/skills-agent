import { relations } from "drizzle-orm";
import { agentSkillFiles } from "./agent-skill-files.schema";
import {
	agentSkillCategories,
	agentSkillSubcategories,
} from "./agent-skill-taxonomy.schema";
import { collectionRepos, collections } from "./collections.schema";
import { profiles } from "./profiles.schema";
import { repoSections } from "./repo-sections.schema";
import { repositories } from "./repositories.schema";
import { repositoryReadmes } from "./repository-readmes.schema";
import { agentSkillSaves, repoSaves } from "./saves.schema";
import { submissions } from "./submissions.schema";

/**
 * Repositories relations
 */
export const repositoriesRelations = relations(repositories, ({ many }) => ({
	repoSections: many(repoSections),
	agentSkillFiles: many(agentSkillFiles),
	repositoryReadmes: many(repositoryReadmes),
}));

/**
 * Repo sections relations
 */
export const repoSectionsRelations = relations(
	repoSections,
	({ one, many }) => ({
		repository: one(repositories, {
			fields: [repoSections.repoId],
			references: [repositories.id],
		}),
		agentSkillFiles: many(agentSkillFiles),
		saves: many(repoSaves),
		collectionRepos: many(collectionRepos),
	}),
);

/**
 * Agent skill categories relations
 */
export const agentSkillCategoriesRelations = relations(
	agentSkillCategories,
	({ many }) => ({
		subcategories: many(agentSkillSubcategories),
		agentSkillFiles: many(agentSkillFiles),
		submissions: many(submissions),
	}),
);

/**
 * Agent skill subcategories relations
 */
export const agentSkillSubcategoriesRelations = relations(
	agentSkillSubcategories,
	({ one, many }) => ({
		category: one(agentSkillCategories, {
			fields: [agentSkillSubcategories.categoryId],
			references: [agentSkillCategories.id],
		}),
		agentSkillFiles: many(agentSkillFiles),
		submissions: many(submissions),
	}),
);

/**
 * Agent skill files relations
 */
export const agentSkillFilesRelations = relations(
	agentSkillFiles,
	({ one, many }) => ({
		repository: one(repositories, {
			fields: [agentSkillFiles.repoId],
			references: [repositories.id],
		}),
		repoSection: one(repoSections, {
			fields: [agentSkillFiles.repoSectionId],
			references: [repoSections.id],
		}),
		category: one(agentSkillCategories, {
			fields: [agentSkillFiles.categoryId],
			references: [agentSkillCategories.id],
		}),
		subcategory: one(agentSkillSubcategories, {
			fields: [agentSkillFiles.subcategoryId],
			references: [agentSkillSubcategories.id],
		}),
		saves: many(agentSkillSaves),
	}),
);

/**
 * Repository readmes relations
 */
export const repositoryReadmesRelations = relations(
	repositoryReadmes,
	({ one }) => ({
		repository: one(repositories, {
			fields: [repositoryReadmes.repoId],
			references: [repositories.id],
		}),
	}),
);

/**
 * Agent skill saves relations
 */
export const agentSkillSavesRelations = relations(
	agentSkillSaves,
	({ one }) => ({
		agentSkillFile: one(agentSkillFiles, {
			fields: [agentSkillSaves.agentSkillFileId],
			references: [agentSkillFiles.id],
		}),
	}),
);

/**
 * Repo saves relations
 */
export const repoSavesRelations = relations(repoSaves, ({ one }) => ({
	repoSection: one(repoSections, {
		fields: [repoSaves.repoSectionId],
		references: [repoSections.id],
	}),
}));

/**
 * Submissions relations
 */
export const submissionsRelations = relations(submissions, ({ one }) => ({
	suggestedCategory: one(agentSkillCategories, {
		fields: [submissions.suggestedCategoryId],
		references: [agentSkillCategories.id],
	}),
	suggestedSubcategory: one(agentSkillSubcategories, {
		fields: [submissions.suggestedSubcategoryId],
		references: [agentSkillSubcategories.id],
	}),
}));

/**
 * Collections relations
 */
export const collectionsRelations = relations(collections, ({ many }) => ({
	collectionRepos: many(collectionRepos),
}));

/**
 * Collection repos relations
 */
export const collectionReposRelations = relations(
	collectionRepos,
	({ one }) => ({
		collection: one(collections, {
			fields: [collectionRepos.collectionId],
			references: [collections.id],
		}),
		repoSection: one(repoSections, {
			fields: [collectionRepos.repoSectionId],
			references: [repoSections.id],
		}),
	}),
);

/**
 * Profiles relations
 */
export const profilesRelations = relations(profiles, () => ({
	// Future: add relations to saves, submissions, collections, etc.
}));
