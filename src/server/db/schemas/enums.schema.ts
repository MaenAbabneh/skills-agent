import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Repository sections enum.
 */
export const repoSectionEnum = pgEnum("repo_section", [
	"3d-motion",
	"agent-skills",
]);

/**
 * Repository type enum.
 */
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

/**
 * Repository section status enum.
 */
export const repoSectionStatusEnum = pgEnum("repo_section_status", [
	"approved",
	"pending",
	"rejected",
	"hidden",
]);

/**
 * Sync status enum.
 */
export const syncStatusEnum = pgEnum("sync_status", ["success", "failed"]);

/**
 * User role enum.
 */
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

/**
 * Submission type enum.
 */
export const submissionTypeEnum = pgEnum("submission_type", [
	"repo",
	"skill_file",
]);

/**
 * Submission status enum.
 */
export const submissionStatusEnum = pgEnum("submission_status", [
	"pending",
	"processing",
	"approved",
	"rejected",
	"failed",
]);
