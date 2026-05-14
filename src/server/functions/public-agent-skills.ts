import { createServerFn } from "@tanstack/react-start";
import {
	and,
	asc,
	count,
	desc,
	eq,
	ilike,
	isNull,
	ne,
	or,
	type SQL,
	sql,
} from "drizzle-orm";
import { z } from "zod";

import { db } from "@/server/db";
import {
	agentSkillCategories,
	agentSkillFiles,
	agentSkillSubcategories,
	repositories,
} from "@/server/db/schema";
import { getPublicAgentSkillInstallCommand } from "./public-agent-skills.helpers";
import { withSafePublicQuery } from "./public-query-safety";

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
		or(isNull(agentSkillFiles.status), ne(agentSkillFiles.status, "hidden")),
	);
}

function getCategoryLabelExpr() {
	return sql<string>`coalesce(${agentSkillSubcategories.name}, ${agentSkillCategories.name}, ${agentSkillFiles.category})`;
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
	const categoryLabelExpr = getCategoryLabelExpr();

	if (cleanCategory && cleanCategory !== "all") {
		conditions.push(sql`${categoryLabelExpr} = ${cleanCategory}`);
	}

	if (cleanQuery) {
		const pattern = `%${cleanQuery}%`;
		const searchCondition = or(
			ilike(agentSkillFiles.skillName, pattern),
			ilike(agentSkillFiles.description, pattern),
			sql`${categoryLabelExpr} ILIKE ${pattern}`,
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
		return withSafePublicQuery(
			"getPublicAgentSkillsPageData",
			async () => {
				const q = data.q?.trim() ?? "";
				const category = data.category?.trim() || "all";
				const sort = data.sort;
				const page = data.page;
				const pageSize = data.pageSize;
				const offset = (page - 1) * pageSize;
				const baseWhere = buildPublicAgentSkillsBaseWhere();
				const filteredWhere = buildPublicAgentSkillsWhere({ category, q });
				const categoryLabelExpr = getCategoryLabelExpr();

				const [itemRows, totalRows, categoryRows, statsRows] =
					await Promise.all([
						db
							.select({
								id: agentSkillFiles.id,
								skillName: agentSkillFiles.skillName,
								slug: agentSkillFiles.slug,
								category: categoryLabelExpr,
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
							.innerJoin(
								repositories,
								eq(agentSkillFiles.repoId, repositories.id),
							)
							.leftJoin(
								agentSkillSubcategories,
								eq(agentSkillFiles.subcategoryId, agentSkillSubcategories.id),
							)
							.leftJoin(
								agentSkillCategories,
								eq(agentSkillFiles.categoryId, agentSkillCategories.id),
							)
							.where(filteredWhere)
							.orderBy(...getOrderBy(sort))
							.limit(pageSize)
							.offset(offset),

						db
							.select({ count: count() })
							.from(agentSkillFiles)
							.innerJoin(
								repositories,
								eq(agentSkillFiles.repoId, repositories.id),
							)
							.leftJoin(
								agentSkillSubcategories,
								eq(agentSkillFiles.subcategoryId, agentSkillSubcategories.id),
							)
							.leftJoin(
								agentSkillCategories,
								eq(agentSkillFiles.categoryId, agentSkillCategories.id),
							)
							.where(filteredWhere),

						db
							.select({
								category: categoryLabelExpr,
								count: count(),
							})
							.from(agentSkillFiles)
							.leftJoin(
								agentSkillSubcategories,
								eq(agentSkillFiles.subcategoryId, agentSkillSubcategories.id),
							)
							.leftJoin(
								agentSkillCategories,
								eq(agentSkillFiles.categoryId, agentSkillCategories.id),
							)
							.where(baseWhere)
							.groupBy(categoryLabelExpr)
							.orderBy(desc(count()), asc(categoryLabelExpr)),

						db
							.select({
								totalSkills: count(),
								totalSources: sql<number>`count(distinct ${agentSkillFiles.repoId})`,
								categories: sql<number>`count(distinct ${categoryLabelExpr})`,
							})
							.from(agentSkillFiles)
							.leftJoin(
								agentSkillSubcategories,
								eq(agentSkillFiles.subcategoryId, agentSkillSubcategories.id),
							)
							.leftJoin(
								agentSkillCategories,
								eq(agentSkillFiles.categoryId, agentSkillCategories.id),
							)
							.where(baseWhere),
					]);

				const totalItems = toNumber(totalRows[0]?.count);
				const totalPages =
					totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);

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
			},
			() => ({
				items: [],
				categories: [],
				stats: {
					totalSkills: 0,
					totalSources: 0,
					categories: 0,
				},
				pagination: {
					page: data.page,
					pageSize: data.pageSize,
					totalItems: 0,
					totalPages: 0,
					hasNextPage: false,
					hasPreviousPage: false,
				},
			}),
		);
	});
