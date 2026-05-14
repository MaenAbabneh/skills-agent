import { and, count, desc, eq, or, sql } from "drizzle-orm";
import { parseAgentSkillMarkdown } from "@/lib/agent-skills-parser";
import {
	classifyAgentSkillCategory,
	generateAgentSkillInstallCommands,
} from "@/lib/agent-skills-utils";
import { db } from "@/server/db";
import { agentSkillFiles, repositories } from "@/server/db/schema";
import { fetchAgentSkillFileContent } from "@/server/github/agent-skill-files";

export async function enrichAgentSkillFilesBatch({
	limit = 20,
}: {
	limit?: number;
} = {}) {
	const skillsToEnrich = await db
		.select({
			id: agentSkillFiles.id,
			skillName: agentSkillFiles.skillName,
			filePath: agentSkillFiles.filePath,
			metadata: agentSkillFiles.metadata,
			repoOwner: repositories.owner,
			repoName: repositories.name,
			repoDefaultBranch: repositories.defaultBranch,
			repoDescription: repositories.description,
			repoTopics: repositories.topics,
		})
		.from(agentSkillFiles)
		.innerJoin(repositories, eq(agentSkillFiles.repoId, repositories.id))
		.where(eq(agentSkillFiles.section, "agent-skills"))
		.orderBy(desc(agentSkillFiles.createdAt))
		.limit(limit);

	let processed = 0;
	let enriched = 0;
	let failed = 0;

	const concurrency = 4;
	for (let i = 0; i < skillsToEnrich.length; i += concurrency) {
		const batch = skillsToEnrich.slice(i, i + concurrency);

		await Promise.all(
			batch.map(async (skill) => {
				processed++;
				try {
					// Always generate install commands — they only need repo + path data.
					const installCommands = generateAgentSkillInstallCommands({
						owner: skill.repoOwner,
						repo: skill.repoName,
						defaultBranch: skill.repoDefaultBranch,
						filePath: skill.filePath,
						skillName: skill.skillName,
					});

					const existingMetadata =
						(skill.metadata as Record<string, unknown> | null) ?? {};

					// Attempt to fetch and parse SKILL.md content.
					const fetchResult = await fetchAgentSkillFileContent({
						owner: skill.repoOwner,
						repo: skill.repoName,
						defaultBranch: skill.repoDefaultBranch,
						filePath: skill.filePath,
						timeoutMs: 8000,
					});

					if (!fetchResult.ok || !fetchResult.content) {
						// Save install commands even when content fetch fails.
						const metadata = {
							...existingMetadata,
							installCommands,
							skillFolderPath: installCommands.skillFolderPath,
							rawFileUrl: installCommands.rawFileUrl,
							derivedMetadataRefreshedAt: new Date().toISOString(),
							derivedMetadataVersion: 1,
						} satisfies Record<string, unknown>;

						await db
							.update(agentSkillFiles)
							.set({
								metadata,
								updatedAt: new Date(),
							})
							.where(eq(agentSkillFiles.id, skill.id));
						failed++;
						return;
					}

					const parsed = parseAgentSkillMarkdown(fetchResult.content);

					const finalSkillName = parsed.name || skill.skillName;

					const newCategory = classifyAgentSkillCategory({
						skillName: finalSkillName,
						filePath: skill.filePath,
						repoName: skill.repoName,
						repoDescription: skill.repoDescription,
						topics: skill.repoTopics,
						skillContent: fetchResult.content,
						extractedDescription: parsed.description,
					});
					const metadata = {
						...existingMetadata,
						installCommands,
						skillFolderPath: installCommands.skillFolderPath,
						rawFileUrl: installCommands.rawFileUrl,
						derivedMetadataRefreshedAt: new Date().toISOString(),
						derivedMetadataVersion: 1,
					} satisfies Record<string, unknown>;

					await db
						.update(agentSkillFiles)
						.set({
							skillName: finalSkillName,
							description: parsed.description,
							category: newCategory,
							allowedTools: parsed.allowedTools || null,
							userInvocable: parsed.userInvocable ?? null,
							metadata,
							updatedAt: new Date(),
						})
						.where(eq(agentSkillFiles.id, skill.id));

					enriched++;
				} catch (error) {
					console.error(`Failed to enrich skill file ${skill.id}:`, error);
					failed++;
				}
			}),
		);
	}

	return {
		processed,
		enriched,
		failed,
	};
}

export async function refreshAgentSkillDerivedMetadata({
	limit = 500,
	onlyMissing = true,
}: {
	limit?: number;
	onlyMissing?: boolean;
} = {}) {
	const skillsToRefresh = await db
		.select({
			id: agentSkillFiles.id,
			skillName: agentSkillFiles.skillName,
			filePath: agentSkillFiles.filePath,
			metadata: agentSkillFiles.metadata,
			repoOwner: repositories.owner,
			repoName: repositories.name,
			repoFullName: repositories.fullName,
			repoDefaultBranch: repositories.defaultBranch,
			repoUrl: repositories.url,
		})
		.from(agentSkillFiles)
		.innerJoin(repositories, eq(agentSkillFiles.repoId, repositories.id))
		.where(
			and(
				eq(agentSkillFiles.section, "agent-skills"),
				onlyMissing
					? or(
							sql`${agentSkillFiles.metadata}->'installCommands' IS NULL`,
							sql`${agentSkillFiles.metadata}->>'skillFolderPath' IS NULL`,
							sql`${agentSkillFiles.metadata}->>'rawFileUrl' IS NULL`,
						)
					: undefined,
			),
		)
		.limit(limit);

	let checked = 0;
	let updated = 0;
	let failed = 0;
	const skipped = 0;

	for (const skill of skillsToRefresh) {
		checked++;
		try {
			// Derive skillFolderPath from filePath
			const pathParts = skill.filePath.split("/");
			const skillFolderPath =
				pathParts.length <= 1 ? "." : pathParts.slice(0, -1).join("/");

			// build rawFileUrl
			const rawFileUrl = `https://raw.githubusercontent.com/${skill.repoOwner}/${skill.repoName}/${skill.repoDefaultBranch}/${skill.filePath}`;

			// call generateAgentSkillInstallCommands
			const installCommands = generateAgentSkillInstallCommands({
				owner: skill.repoOwner,
				repo: skill.repoName,
				defaultBranch: skill.repoDefaultBranch,
				filePath: skill.filePath,
				skillName: skill.skillName,
			});

			const existingMetadata =
				(skill.metadata as Record<string, unknown> | null) ?? {};
			const metadata = {
				...existingMetadata,
				skillFolderPath,
				rawFileUrl,
				installCommands,
				derivedMetadataRefreshedAt: new Date().toISOString(),
				derivedMetadataVersion: 1,
			} satisfies Record<string, unknown>;

			await db
				.update(agentSkillFiles)
				.set({
					metadata,
					updatedAt: new Date(),
				})
				.where(eq(agentSkillFiles.id, skill.id));

			updated++;
		} catch (error) {
			console.error(`Failed to refresh skill file ${skill.id}:`, error);
			failed++;
		}
	}

	// Calculate remaining missing
	const remainingMissingResult = await db
		.select({ count: count() })
		.from(agentSkillFiles)
		.where(
			and(
				eq(agentSkillFiles.section, "agent-skills"),
				or(
					sql`${agentSkillFiles.metadata}->'installCommands' IS NULL`,
					sql`${agentSkillFiles.metadata}->>'skillFolderPath' IS NULL`,
					sql`${agentSkillFiles.metadata}->>'rawFileUrl' IS NULL`,
				),
			),
		);

	return {
		checked,
		updated,
		skipped,
		failed,
		remainingMissing: remainingMissingResult[0]?.count ?? 0,
	};
}
