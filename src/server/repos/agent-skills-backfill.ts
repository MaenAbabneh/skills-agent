import { eq, sql } from "drizzle-orm";

import {
	classifyAgentSkillCategory,
	generateAgentSkillInstallCommands,
	generateAgentSkillSlug,
} from "@/lib/agent-skills-utils";
import type { AgentSkillMetadata } from "@/lib/validations/repo-metadata";
import { db } from "@/server/db";
import {
	agentSkillFiles,
	repoSections,
	repositories,
} from "@/server/db/schema";
import type { DetectedAgentSkillFile } from "./agent-skills-detection";

export async function backfillAgentSkillFilesFromRepoSections({
	limit = 100,
}: {
	limit?: number;
} = {}) {
	const rows = await db
		.select({
			repoSectionId: repoSections.id,
			repoId: repoSections.repoId,
			metadata: repoSections.metadata,

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
		.limit(limit);

	let repoSectionsChecked = 0;
	let skillsUpserted = 0;
	let skipped = 0;
	let failed = 0;

	for (const row of rows) {
		try {
			repoSectionsChecked++;
			const meta = row.metadata as AgentSkillMetadata & {
				skillFiles?: DetectedAgentSkillFile[];
				skillFileUrl?: string;
				skillFileName?: string;
				skillName?: string;
			};

			const files = meta.skillFiles || [];

			if (files.length === 0) {
				skipped++;
				continue;
			}

			for (const file of files) {
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
				const installCommands = generateAgentSkillInstallCommands({
					owner: row.owner,
					repo: row.name,
					defaultBranch: row.defaultBranch,
					filePath: file.path,
					skillName: file.skillName,
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
							skillFileCountInRepo: files.length,
							installCommands,
							skillFolderPath: installCommands.skillFolderPath,
							rawFileUrl: installCommands.rawFileUrl,
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
								skillFileCountInRepo: files.length,
								installCommands,
								skillFolderPath: installCommands.skillFolderPath,
								rawFileUrl: installCommands.rawFileUrl,
							},
							updatedAt: new Date(),
						},
					});
				skillsUpserted++;
			}
		} catch (error) {
			console.error(
				`Failed to backfill repo section ${row.repoSectionId}`,
				error,
			);
			failed++;
		}
	}

	return {
		repoSectionsChecked,
		skillsUpserted,
		skipped,
		failed,
	};
}
