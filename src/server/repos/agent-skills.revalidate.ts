import { desc, eq, sql } from "drizzle-orm";
import {
	classifyAgentSkillCategory,
	generateAgentSkillSlug,
} from "@/lib/agent-skills-utils";
import type { AgentSkillMetadata } from "@/lib/validations/repo-metadata";
import { db } from "@/server/db";
import {
	agentSkillFiles,
	repoSections,
	repositories,
} from "@/server/db/schema";
import {
	addMissingAgentSkillFileReason,
	createAgentSkillDetectionContext,
	mergeAgentSkillMetadata,
	removeMissingAgentSkillFileReason,
} from "./agent-skills-detection";

export type RevalidateAgentSkillsReposInput = {
	limit?: number;
};

export type RevalidateAgentSkillsReposResult = {
	processed: number;
	detected: number;
	rejected: number;
	failed: number;
	truncated: number;
	errors: {
		repoSectionId: string;
		fullName: string;
		error: string;
	}[];
};

function getErrorMessage(error: unknown) {
	return error instanceof Error
		? error.message
		: "Unknown agent-skills revalidation error";
}

function normalizeLimit(limit: number | undefined) {
	if (typeof limit !== "number" || !Number.isFinite(limit)) {
		return 25;
	}

	return Math.max(1, Math.min(Math.trunc(limit), 100));
}

function normalizeRejectionReasons(value: unknown) {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter((item): item is string => typeof item === "string");
}

function normalizeAgentSkillMetadata(value: unknown): AgentSkillMetadata {
	if (
		value &&
		typeof value === "object" &&
		"kind" in value &&
		value.kind === "agent-skills"
	) {
		return value as AgentSkillMetadata;
	}

	return {
		kind: "agent-skills",
		skill: {
			exists: false,
		},
		commands: {
			clone: "",
		},
		zipUrl: "https://github.com/unknown/unknown/archive/refs/heads/main.zip",
		requiredFiles: [],
	};
}

export async function revalidateAgentSkillsRepos({
	limit,
}: RevalidateAgentSkillsReposInput = {}): Promise<RevalidateAgentSkillsReposResult> {
	const rows = await db
		.select({
			repoSectionId: repoSections.id,
			repoId: repoSections.repoId,
			metadata: repoSections.metadata,
			rejectionReasons: repoSections.rejectionReasons,

			owner: repositories.owner,
			name: repositories.name,
			fullName: repositories.fullName,
			description: repositories.description,
			topics: repositories.topics,
			defaultBranch: repositories.defaultBranch,
		})
		.from(repoSections)
		.innerJoin(repositories, eq(repoSections.repoId, repositories.id))
		.where(eq(repoSections.section, "agent-skills"))
		.orderBy(desc(repoSections.updatedAt))
		.limit(normalizeLimit(limit));

	const detectionContext = createAgentSkillDetectionContext();
	const result: RevalidateAgentSkillsReposResult = {
		processed: 0,
		detected: 0,
		rejected: 0,
		failed: 0,
		truncated: 0,
		errors: [],
	};

	await Promise.all(
		rows.map(async (row) => {
			try {
				const detection = await detectionContext.detectForRepo({
					repo: {
						owner: {
							login: row.owner,
						},
						name: row.name,
						full_name: row.fullName,
						description: row.description,
						topics: row.topics ?? [],
						default_branch: row.defaultBranch,
					},
					force: true,
				});
				const metadata = mergeAgentSkillMetadata({
					metadata: normalizeAgentSkillMetadata(row.metadata),
					detection,
				});
				const existingReasons = normalizeRejectionReasons(row.rejectionReasons);
				const rejectionReasons = detection.found
					? removeMissingAgentSkillFileReason(existingReasons)
					: addMissingAgentSkillFileReason(existingReasons);

				await db
					.update(repoSections)
					.set({
						isAccepted: detection.found,
						rejectionReasons,
						metadata,
						updatedAt: new Date(),
					})
					.where(eq(repoSections.id, row.repoSectionId));

				if (detection.found && detection.files.length > 0) {
					for (const file of detection.files) {
						const slug = generateAgentSkillSlug({
							owner: row.owner,
							repo: row.name,
							filePath: file.path,
						});
						const category = classifyAgentSkillCategory({
							skillName: file.skillName,
							filePath: file.path,
							repoName: row.name,
							repoDescription: row.description,
							topics: row.topics || [],
						});

						await db
							.insert(agentSkillFiles)
							.values({
								repoId: row.repoId,
								repoSectionId: row.repoSectionId,
								section: "agent-skills",
								skillName: file.skillName,
								slug,
								filePath: file.path,
								fileUrl: file.url,
								fileName: file.fileName,
								confidence: file.confidence,
								category,
								description: row.description,
								status: "pending",
								isAccepted: true,
								metadata: {
									sourceRepoFullName: row.fullName,
									sourceRepoUrl: `https://github.com/${row.fullName}`,
									sourceDefaultBranch: row.defaultBranch,
									detectedAt: new Date().toISOString(),
									skillFileCountInRepo: detection.files.length,
								},
							})
							.onConflictDoUpdate({
								target: [
									agentSkillFiles.repoId,
									agentSkillFiles.section,
									agentSkillFiles.filePath,
								],
								set: {
									skillName: file.skillName,
									slug,
									fileUrl: file.url,
									fileName: file.fileName,
									confidence: file.confidence,
									category,
									description: row.description,
									// Status logic: preserve if approved or rejected
									status: sql`CASE WHEN agent_skill_files.status IN ('approved', 'rejected') THEN agent_skill_files.status ELSE excluded.status END`,
									metadata: {
										sourceRepoFullName: row.fullName,
										sourceRepoUrl: `https://github.com/${row.fullName}`,
										sourceDefaultBranch: row.defaultBranch,
										detectedAt: new Date().toISOString(),
										skillFileCountInRepo: detection.files.length,
									},
									updatedAt: new Date(),
								},
							});
					}
				}

				result.processed += 1;

				if (detection.found) {
					result.detected += 1;
				} else {
					result.rejected += 1;
				}

				if (detection.truncated) {
					result.truncated += 1;
				}
			} catch (error) {
				result.failed += 1;
				result.errors.push({
					repoSectionId: row.repoSectionId,
					fullName: row.fullName,
					error: getErrorMessage(error),
				});
			}
		}),
	);

	return result;
}
