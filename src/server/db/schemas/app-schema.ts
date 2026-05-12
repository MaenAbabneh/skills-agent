import { sql } from "drizzle-orm";
import {
	bigint,
	boolean,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import type { RepoSectionMetadata } from "@/lib/validations/repo-metadata";
import type { ScoreBreakdown } from "@/lib/validations/repos";

/**
 * Enums
 */

export const repoSectionEnum = pgEnum("repo_section", [
	"3d-motion",
	"agent-skills",
]);

export const repoTypeEnum = pgEnum("repo_type", [
	"portfolio",
	"showcase",
	"interactive-experience",
	"visualization",
	"creative-coding",
	"starter",
	"learning",
	"game",

	"agent-skill",
	"mcp-server",
	"prompt-pack",
	"workflow",
	"agent-tool",
	"workflow-agent",
	"browser-agent",
	"coding-agent",
	"agent-framework",
	"automation-tool",
	"llm-tool",

	"ui-resource",
	"library",
	"tool",
	"unknown",
]);

export const repoSectionStatusEnum = pgEnum("repo_section_status", [
	"approved",
	"pending",
	"rejected",
	"hidden",
]);

export const syncStatusEnum = pgEnum("sync_status", ["success", "failed"]);

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

export const repoVoteTypeEnum = pgEnum("repo_vote_type", ["upvote", "like"]);

export const submissionStatusEnum = pgEnum("submission_status", [
	"pending",
	"approved",
	"rejected",
]);

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
	}),
);

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

		rejectionReasons: text("rejection_reasons")
			.array()
			.notNull()
			.default(sql`ARRAY[]::text[]`),

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
	}),
);

/**
 * Sync logs.
 */

export const syncLogs = pgTable("sync_logs", {
	id: uuid("id").defaultRandom().primaryKey(),

	section: repoSectionEnum("section").notNull(),

	totalFetched: integer("total_fetched").notNull().default(0),
	totalUnique: integer("total_unique").notNull().default(0),
	totalAccepted: integer("total_accepted").notNull().default(0),
	totalRejected: integer("total_rejected").notNull().default(0),
	totalExisting: integer("total_existing").default(0).notNull(),

	totalNew: integer("total_new").default(0).notNull(),

	totalFailed: integer("total_failed").default(0).notNull(),

	rateLimitHit: boolean("rate_limit_hit").default(false).notNull(),

	searchRequestsBudget: integer("search_requests_budget").default(0).notNull(),

	totalVariantsTried: integer("total_variants_tried").default(0).notNull(),

	discoveryPlanMode: text("discovery_plan_mode"),

	discoveryPlanDiagnosis: text("discovery_plan_diagnosis"),

	discoveryPlanConfidence: text("discovery_plan_confidence"),

	discoveryPlanSummary: text("discovery_plan_summary"),

	discoveryPlanReason: text("discovery_plan_reason"),

	discoveryPlanQuerySelection: text("discovery_plan_query_selection"),

	discoveryPlanSaturationBps: integer("discovery_plan_saturation_bps"),

	discoveryPlanNewBps: integer("discovery_plan_new_bps"),

	discoveryPlanFailureBps: integer("discovery_plan_failure_bps"),

	status: syncStatusEnum("status").notNull(),

	error: text("error"),

	createdAt: timestamp("created_at", {
		withTimezone: true,
	})
		.defaultNow()
		.notNull(),
});

/**
 * App profile linked to Better Auth user.id.
 */

export const profiles = pgTable(
	"profiles",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		userId: text("user_id").notNull(),

		username: text("username"),
		avatarUrl: text("avatar_url"),

		role: userRoleEnum("role").notNull().default("user"),

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
		userIdUnique: uniqueIndex("profiles_user_id_unique").on(table.userId),

		usernameUnique: uniqueIndex("profiles_username_unique").on(table.username),

		roleIdx: index("profiles_role_idx").on(table.role),
	}),
);

/**
 * Votes / likes.
 *
 * One user can only vote once per repo section per vote type.
 */

export const repoVotes = pgTable(
	"repo_votes",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		userId: text("user_id").notNull(),

		repoSectionId: uuid("repo_section_id")
			.notNull()
			.references(() => repoSections.id, {
				onDelete: "cascade",
			}),

		type: repoVoteTypeEnum("type").notNull(),

		createdAt: timestamp("created_at", {
			withTimezone: true,
		})
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		userSectionVoteUnique: uniqueIndex(
			"repo_votes_user_section_type_unique",
		).on(table.userId, table.repoSectionId, table.type),

		userIdx: index("repo_votes_user_id_idx").on(table.userId),

		sectionIdx: index("repo_votes_repo_section_id_idx").on(table.repoSectionId),
	}),
);

/**
 * User submissions.
 *
 * Same GitHub URL cannot be submitted twice to the same section.
 */

export const submissions = pgTable(
	"submissions",
	{
		id: uuid("id").defaultRandom().primaryKey(),

		userId: text("user_id").notNull(),

		githubUrl: text("github_url").notNull(),

		suggestedSection: repoSectionEnum("suggested_section").notNull(),

		reason: text("reason"),

		status: submissionStatusEnum("status").notNull().default("pending"),

		adminNote: text("admin_note"),

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
		submissionGithubSectionUnique: uniqueIndex(
			"submissions_github_section_unique",
		).on(table.githubUrl, table.suggestedSection),

		userIdx: index("submissions_user_id_idx").on(table.userId),

		statusIdx: index("submissions_status_idx").on(table.status),
	}),
);

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

		userIdx: index("collections_user_id_idx").on(table.userId),
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

		collectionIdx: index("collection_repos_collection_id_idx").on(
			table.collectionId,
		),

		repoSectionIdx: index("collection_repos_repo_section_id_idx").on(
			table.repoSectionId,
		),
	}),
);

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

		repoIdIdx: index("repository_readmes_repo_id_idx").on(table.repoId),

		contentFetchedAtIdx: index("repository_readmes_content_fetched_at_idx").on(
			table.contentFetchedAt,
		),

		updatedAtIdx: index("repository_readmes_updated_at_idx").on(
			table.updatedAt,
		),
	}),
);

/**
 * Agent Skill Files.
 *
 * One row per skill file discovered inside a repo.
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
		category: text("category").notNull().default("Other"),
		description: text("description"),

		allowedTools: jsonb("allowed_tools"),
		userInvocable: boolean("user_invocable"),

		status: text("status").notNull().default("pending"),
		isAccepted: boolean("is_accepted").notNull().default(true),

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

		sectionIdx: index("agent_skill_files_section_idx").on(table.section),
		statusIdx: index("agent_skill_files_status_idx").on(table.status),
		categoryIdx: index("agent_skill_files_category_idx").on(table.category),
		slugIdx: index("agent_skill_files_slug_idx").on(table.slug),
	}),
);
