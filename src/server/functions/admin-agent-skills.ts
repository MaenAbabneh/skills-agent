import { createServerFn } from "@tanstack/react-start";
import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db";
import { agentSkillFiles, repositories } from "@/server/db/schema";

export const getAgentSkillReviewItems = createServerFn({
	method: "GET",
})
	.inputValidator(
		z.object({
			status: z
				.enum(["pending", "approved", "rejected", "all"])
				.default("pending"),
			category: z.string().optional(),
			search: z.string().optional(),
			limit: z.number().default(50),
			offset: z.number().default(0),
			cursor: z.string().optional(),
		}),
	)
	.handler(async ({ data }) => {
		const items = await db
			.select({
				id: agentSkillFiles.id,
				skillName: agentSkillFiles.skillName,
				slug: agentSkillFiles.slug,
				category: agentSkillFiles.category,
				filePath: agentSkillFiles.filePath,
				fileUrl: agentSkillFiles.fileUrl,
				fileName: agentSkillFiles.fileName,
				confidence: agentSkillFiles.confidence,
				status: agentSkillFiles.status,
				isAccepted: agentSkillFiles.isAccepted,
				description: agentSkillFiles.description,
				metadata: agentSkillFiles.metadata,
				repoFullName: repositories.fullName,
				repoUrl: repositories.url,
				repoDescription: repositories.description,
				repoStars: repositories.stars,
				repoForks: repositories.forks,
				repoLanguage: repositories.language,
				repoAvatarUrl: repositories.avatarUrl,
				repoUpdatedAt: repositories.githubUpdatedAt,
				repoPushedAt: repositories.pushedAt,
				createdAt: agentSkillFiles.createdAt,
			})
			.from(agentSkillFiles)
			.innerJoin(repositories, eq(agentSkillFiles.repoId, repositories.id))
			.where(
				and(
					eq(agentSkillFiles.section, "agent-skills"),
					data.status !== "all"
						? eq(agentSkillFiles.status, data.status)
						: undefined,
					data.category
						? eq(agentSkillFiles.category, data.category)
						: undefined,
					data.search
						? sql`(${agentSkillFiles.skillName} ILIKE ${`%${data.search}%`} OR ${repositories.fullName} ILIKE ${`%${data.search}%`})`
						: undefined,
				),
			)
			.orderBy(desc(agentSkillFiles.createdAt), asc(agentSkillFiles.id))
			.limit(data.limit)
			.offset(data.offset);

		const totalCount = await db
			.select({ count: count() })
			.from(agentSkillFiles)
			.innerJoin(repositories, eq(agentSkillFiles.repoId, repositories.id))
			.where(
				and(
					eq(agentSkillFiles.section, "agent-skills"),
					data.status !== "all"
						? eq(agentSkillFiles.status, data.status)
						: undefined,
					data.category
						? eq(agentSkillFiles.category, data.category)
						: undefined,
					data.search
						? sql`(${agentSkillFiles.skillName} ILIKE ${`%${data.search}%`} OR ${repositories.fullName} ILIKE ${`%${data.search}%`})`
						: undefined,
				),
			);

		return {
			items: items.map((item) => ({
				...item,
				createdAt: item.createdAt?.toISOString?.() ?? null,
				repoUpdatedAt: item.repoUpdatedAt?.toISOString?.() ?? null,
				repoPushedAt: item.repoPushedAt?.toISOString?.() ?? null,
				metadata: item.metadata as any,
			})),
			total: totalCount[0]?.count ?? 0,
		};
	});

export const approveAgentSkillFileAction = createServerFn({
	method: "POST",
})
	.inputValidator(z.object({ skillFileId: z.string() }))
	.handler(async ({ data }) => {
		await db
			.update(agentSkillFiles)
			.set({ status: "approved" })
			.where(eq(agentSkillFiles.id, data.skillFileId));

		return { success: true };
	});

export const rejectAgentSkillFileAction = createServerFn({
	method: "POST",
})
	.inputValidator(z.object({ skillFileId: z.string() }))
	.handler(async ({ data }) => {
		await db
			.update(agentSkillFiles)
			.set({ status: "rejected" })
			.where(eq(agentSkillFiles.id, data.skillFileId));

		return { success: true };
	});

export const updateAgentSkillFileStatusAction = createServerFn({
	method: "POST",
})
	.inputValidator(z.object({ skillFileId: z.string(), status: z.string() }))
	.handler(async ({ data }) => {
		await db
			.update(agentSkillFiles)
			.set({ status: data.status })
			.where(eq(agentSkillFiles.id, data.skillFileId));

		return { success: true };
	});

export const enrichAgentSkillFilesAction = createServerFn({
	method: "POST",
})
	.inputValidator(z.object({ limit: z.number().default(50) }))
	.handler(async ({ data }) => {
		const { enrichAgentSkillFilesBatch } = await import(
			"@/server/repos/agent-skills-enrichment"
		);

		const result = await enrichAgentSkillFilesBatch({ limit: data.limit });

		return result;
	});

export const refreshAgentSkillDerivedMetadataAction = createServerFn({
	method: "POST",
})
	.inputValidator(z.object({ limit: z.number().default(500) }))
	.handler(async ({ data }) => {
		const { refreshAgentSkillDerivedMetadata } = await import(
			"@/server/repos/agent-skills-enrichment"
		);

		const result = await refreshAgentSkillDerivedMetadata({
			limit: data.limit,
		});

		return result;
	});
