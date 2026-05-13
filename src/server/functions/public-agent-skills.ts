import { createServerFn } from "@tanstack/react-start";
import {
	and,
	asc,
	count,
	desc,
	eq,
	ilike,
	or,
	type SQL,
	sql,
} from "drizzle-orm";
import { z } from "zod";

import { db } from "@/server/db";
import { agentSkillFiles, repositories } from "@/server/db/schema";
import { getPublicAgentSkillInstallCommand } from "./public-agent-skills.helpers";

export type PublicAgentSkillsSort = "stars" | "recent" | "name";

export type AgentSkillListItem = {
	id: string;
	skillName: string;
	slug: string;
	category: string;
	description: string | null;
	fileUrl: string;
	repoFullName: string;
	repoUrl: string;
	repoStars: number;
	repoUpdatedAt: string;
	installCommand: string;
};

export type CategoryCount = {
	category: string;
	count: number;
};

export type PublicAgentSkillsPageData = {
	items: AgentSkillListItem[];
	categories: CategoryCount[];
	stats: {
		totalSkills: number;
		totalSources: number;
		categories: number;
	};
	pagination: {
		page: number;
		pageSize: number;
		totalItems: number;
		totalPages: number;
		hasNextPage: boolean;
		hasPreviousPage: boolean;
	};
};

const PublicAgentSkillsInputSchema = z.object({
	q: z.string().optional(),
	category: z.string().optional(),
	sort: z.enum(["stars", "recent", "name"]).default("stars"),
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(96).default(24),
});

function toNumber(value: unknown) {
	return Number(value ?? 0);
}

function toIsoDate(value: Date | string | null) {
	if (!value) {
		return "";
	}

	return value instanceof Date ? value.toISOString() : value;
}

function buildPublicAgentSkillsBaseWhere() {
	// TODO before public launch:
	// Require agent_skill_files.status = "approved".
	return and(
		eq(agentSkillFiles.section, "agent-skills"),
		eq(agentSkillFiles.isAccepted, true),
		sql`${agentSkillFiles.status} != 'hidden'`,
	);
}

function buildPublicAgentSkillsWhere({
	category,
	q,
}: {
	category?: string;
	q?: string;
}) {
	const cleanQuery = q?.trim();
	const cleanCategory = category?.trim();
	const conditions: SQL[] = [buildPublicAgentSkillsBaseWhere() as SQL];

	if (cleanCategory && cleanCategory !== "all") {
		conditions.push(eq(agentSkillFiles.category, cleanCategory));
	}

	if (cleanQuery) {
		const pattern = `%${cleanQuery}%`;
		const searchCondition = or(
			ilike(agentSkillFiles.skillName, pattern),
			ilike(agentSkillFiles.description, pattern),
			ilike(agentSkillFiles.category, pattern),
			ilike(repositories.fullName, pattern),
			ilike(repositories.description, pattern),
		);

		if (searchCondition) {
			conditions.push(searchCondition);
		}
	}

	return and(...conditions);
}

function getOrderBy(sort: PublicAgentSkillsSort) {
	if (sort === "recent") {
		return [
			desc(
				sql`coalesce(${repositories.githubUpdatedAt}, ${repositories.pushedAt})`,
			),
			desc(agentSkillFiles.updatedAt),
		] as const;
	}

	if (sort === "name") {
		return [asc(agentSkillFiles.skillName)] as const;
	}

	return [desc(repositories.stars), desc(agentSkillFiles.updatedAt)] as const;
}

export const getPublicAgentSkillsPageData = createServerFn({
	method: "GET",
})
	.inputValidator(PublicAgentSkillsInputSchema)
	.handler(async ({ data }): Promise<PublicAgentSkillsPageData> => {
		const q = data.q?.trim() ?? "";
		const category = data.category?.trim() || "all";
		const sort = data.sort;
		const page = data.page;
		const pageSize = data.pageSize;
		const offset = (page - 1) * pageSize;
		const baseWhere = buildPublicAgentSkillsBaseWhere();
		const filteredWhere = buildPublicAgentSkillsWhere({ category, q });

		const [itemRows, totalRows, categoryRows, statsRows] = await Promise.all([
			db
				.select({
					id: agentSkillFiles.id,
					skillName: agentSkillFiles.skillName,
					slug: agentSkillFiles.slug,
					category: agentSkillFiles.category,
					filePath: agentSkillFiles.filePath,
					fileUrl: agentSkillFiles.fileUrl,
					description: agentSkillFiles.description,
					metadata: agentSkillFiles.metadata,
					repoFullName: repositories.fullName,
					repoUrl: repositories.url,
					repoStars: repositories.stars,
					repoUpdatedAt: repositories.githubUpdatedAt,
				})
				.from(agentSkillFiles)
				.innerJoin(repositories, eq(agentSkillFiles.repoId, repositories.id))
				.where(filteredWhere)
				.orderBy(...getOrderBy(sort))
				.limit(pageSize)
				.offset(offset),

			db
				.select({ count: count() })
				.from(agentSkillFiles)
				.innerJoin(repositories, eq(agentSkillFiles.repoId, repositories.id))
				.where(filteredWhere),

			db
				.select({
					category: agentSkillFiles.category,
					count: count(),
				})
				.from(agentSkillFiles)
				.where(baseWhere)
				.groupBy(agentSkillFiles.category)
				.orderBy(desc(count()), asc(agentSkillFiles.category)),

			db
				.select({
					totalSkills: count(),
					totalSources: sql<number>`count(distinct ${agentSkillFiles.repoId})`,
					categories: sql<number>`count(distinct ${agentSkillFiles.category})`,
				})
				.from(agentSkillFiles)
				.where(baseWhere),
		]);

		const totalItems = toNumber(totalRows[0]?.count);
		const totalPages = Math.ceil(totalItems / pageSize);

		return {
			items: itemRows.map((item) => ({
				id: item.id,
				skillName: item.skillName,
				slug: item.slug,
				category: item.category,
				description: item.description,
				fileUrl: item.fileUrl,
				repoFullName: item.repoFullName,
				repoUrl: item.repoUrl,
				repoStars: item.repoStars,
				repoUpdatedAt: toIsoDate(item.repoUpdatedAt),
				installCommand: getPublicAgentSkillInstallCommand({
					filePath: item.filePath,
					metadata: item.metadata,
					repoFullName: item.repoFullName,
				}),
			})),
			categories: categoryRows.map((row) => ({
				category: row.category,
				count: toNumber(row.count),
			})),
			stats: {
				totalSkills: toNumber(statsRows[0]?.totalSkills),
				totalSources: toNumber(statsRows[0]?.totalSources),
				categories: toNumber(statsRows[0]?.categories),
			},
			pagination: {
				page,
				pageSize,
				totalItems,
				totalPages,
				hasNextPage: page < totalPages,
				hasPreviousPage: page > 1,
			},
		};
	});
