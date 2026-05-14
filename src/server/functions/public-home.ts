import { createServerFn } from "@tanstack/react-start";
import {
	and,
	count,
	desc,
	eq,
	inArray,
	isNull,
	ne,
	or,
	sql,
} from "drizzle-orm";

import { db } from "@/server/db";
import {
	agentSkillCategories,
	agentSkillFiles,
	agentSkillSubcategories,
	repoSections,
	repositories,
} from "@/server/db/schema";
import { getPublicAgentSkillInstallCommand } from "./public-agent-skills.helpers";
import { withSafePublicQuery } from "./public-query-safety";

export type AgentSkillHomeItem = {
	id: string;
	skillName: string;
	slug: string;
	category: string;
	filePath: string;
	fileUrl: string;
	description: string | null;
	status: string;
	confidence: string;
	repoFullName: string;
	repoUrl: string;
	repoStars: number;
	repoForks: number;
	repoUpdatedAt: string;
	installCommand: string;
};

export type RepoHomeItem = {
	repoSectionId: string;
	repoId: string;
	fullName: string;
	description: string;
	url: string;
	homepage: string | null;
	stars: number;
	forks: number;
	language: string | null;
	topics: string[];
	pushedAt: string;
	readmePreview: string | null;
	readmeUrl: string | null;
};

export type CategoryCount = {
	category: string;
	count: number;
};

export type TimelinePoint = {
	period: string;
	label: string;
	agentSkills: number;
	repos3d: number;
	cumulativeAgentSkills: number;
	cumulativeRepos3d: number;
};

export type PublicHomeData = {
	stats: {
		approved3dRepos: number;
		approvedAgentSkills: number;
		sourceRepositories: number;
		categories: number;
	};
	featuredAgentSkills: AgentSkillHomeItem[];
	featured3dRepos: RepoHomeItem[];
	agentSkillCategories: CategoryCount[];
	timeline: TimelinePoint[];
};

function toNumber(value: unknown) {
	return Number(value ?? 0);
}

function toIsoDate(value: Date | string | null) {
	if (!value) {
		return "";
	}

	return value instanceof Date ? value.toISOString() : value;
}

type Featured3dRepoRow = {
	repoSectionId: string;
	repoId: string;
	fullName: string;
	description: string;
	url: string;
	homepage: string | null;
	stars: number;
	forks: number;
	language: string | null;
	topics: string[];
	pushedAt: Date;
};

export const getPublicHomeData = createServerFn({
	method: "GET",
}).handler(async (): Promise<PublicHomeData> => {
	return withSafePublicQuery(
		"getPublicHomeData",
		async () => {
			// TODO before public launch:
			// Restore public-safe filters:
			// - agent_skill_files.status = "approved"
			// - repo_sections.status = "approved"
			const agentSkillHomeFilter = and(
				eq(agentSkillFiles.section, "agent-skills"),
				eq(agentSkillFiles.isAccepted, true),
				or(
					isNull(agentSkillFiles.status),
					ne(agentSkillFiles.status, "hidden"),
				),
			);

			// TODO before public launch:
			// Restore public-safe filters:
			// - agent_skill_files.status = "approved"
			// - repo_sections.status = "approved"
			const repoHomeFilter = and(
				eq(repoSections.section, "3d-motion"),
				eq(repoSections.isAccepted, true),
				or(isNull(repoSections.status), ne(repoSections.status, "hidden")),
			);

			const categoryLabelExpr = sql<string>`coalesce(${agentSkillSubcategories.name}, ${agentSkillCategories.name}, ${agentSkillFiles.category})`;

			const [
				agentSkillCountRows,
				repoCountRows,
				agentSkillRepoRows,
				repoSourceRows,
				categoryStatsRows,
				featuredAgentSkillRows,
				featured3dRepoRows,
				agentSkillCategoryRows,
				agentSkillDatesRows,
				repo3dDatesRows,
			] = await Promise.all([
				db
					.select({ count: count() })
					.from(agentSkillFiles)
					.where(agentSkillHomeFilter),

				db.select({ count: count() }).from(repoSections).where(repoHomeFilter),

				db
					.select({ repoId: agentSkillFiles.repoId })
					.from(agentSkillFiles)
					.where(agentSkillHomeFilter),

				db
					.select({ repoId: repoSections.repoId })
					.from(repoSections)
					.where(repoHomeFilter),

				db
					.select({
						count: sql<number>`count(distinct ${categoryLabelExpr})`,
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
					.where(agentSkillHomeFilter),

				db
					.select({
						id: agentSkillFiles.id,
						skillName: agentSkillFiles.skillName,
						slug: agentSkillFiles.slug,
						category: categoryLabelExpr,
						filePath: agentSkillFiles.filePath,
						fileUrl: agentSkillFiles.fileUrl,
						description: agentSkillFiles.description,
						status: agentSkillFiles.status,
						confidence: agentSkillFiles.confidence,
						metadata: agentSkillFiles.metadata,
						updatedAt: agentSkillFiles.updatedAt,
						repoFullName: repositories.fullName,
						repoUrl: repositories.url,
						repoStars: repositories.stars,
						repoForks: repositories.forks,
						repoUpdatedAt: repositories.githubUpdatedAt,
					})
					.from(agentSkillFiles)
					.innerJoin(repositories, eq(agentSkillFiles.repoId, repositories.id))
					.leftJoin(
						agentSkillSubcategories,
						eq(agentSkillFiles.subcategoryId, agentSkillSubcategories.id),
					)
					.leftJoin(
						agentSkillCategories,
						eq(agentSkillFiles.categoryId, agentSkillCategories.id),
					)
					.where(agentSkillHomeFilter)
					.orderBy(desc(repositories.stars), desc(agentSkillFiles.updatedAt))
					.limit(6),

				db
					.select({
						repoSectionId: repoSections.id,
						repoId: repositories.id,
						fullName: repositories.fullName,
						description: repositories.description,
						url: repositories.url,
						homepage: repositories.homepage,
						stars: repositories.stars,
						forks: repositories.forks,
						language: repositories.language,
						topics: repositories.topics,
						pushedAt: repositories.pushedAt,
					})
					.from(repoSections)
					.innerJoin(repositories, eq(repoSections.repoId, repositories.id))
					.where(repoHomeFilter)
					.orderBy(desc(repoSections.score), desc(repositories.stars))
					.limit(6),

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
					.where(agentSkillHomeFilter)
					.groupBy(categoryLabelExpr)
					.orderBy(desc(count()))
					.limit(12),

				db
					.select({
						month: sql<Date>`date_trunc('month', coalesce(${repositories.githubCreatedAt}, ${repositories.pushedAt}, ${agentSkillFiles.createdAt}))`,
						count: count(),
					})
					.from(agentSkillFiles)
					.innerJoin(repositories, eq(agentSkillFiles.repoId, repositories.id))
					.where(agentSkillHomeFilter)
					.groupBy(sql`1`),

				db
					.select({
						month: sql<Date>`date_trunc('month', coalesce(${repositories.githubCreatedAt}, ${repositories.pushedAt}, ${repoSections.createdAt}))`,
						count: count(),
					})
					.from(repoSections)
					.innerJoin(repositories, eq(repoSections.repoId, repositories.id))
					.where(repoHomeFilter)
					.groupBy(sql`1`),
			]);

			const sourceRepositoryIds = new Set([
				...agentSkillRepoRows.map((row) => row.repoId),
				...repoSourceRows.map((row) => row.repoId),
			]);
			const readmePreviewByRepoId = new Map<
				string,
				{ readmePreview: string | null; readmeUrl: string | null }
			>();

			await loadReadmePreviews({
				repos: featured3dRepoRows,
				readmePreviewByRepoId,
			});

			return {
				stats: {
					approved3dRepos: toNumber(repoCountRows[0]?.count),
					approvedAgentSkills: toNumber(agentSkillCountRows[0]?.count),
					sourceRepositories: sourceRepositoryIds.size,
					categories: toNumber(categoryStatsRows[0]?.count),
				},
				featuredAgentSkills: featuredAgentSkillRows.map((item) => ({
					id: item.id,
					skillName: item.skillName,
					slug: item.slug,
					category: item.category,
					filePath: item.filePath,
					fileUrl: item.fileUrl,
					description: item.description,
					status: item.status,
					confidence: item.confidence,
					repoFullName: item.repoFullName,
					repoUrl: item.repoUrl,
					repoStars: item.repoStars,
					repoForks: item.repoForks,
					repoUpdatedAt: toIsoDate(item.repoUpdatedAt),
					installCommand: getPublicAgentSkillInstallCommand({
						filePath: item.filePath,
						metadata: item.metadata,
						repoFullName: item.repoFullName,
					}),
				})),
				featured3dRepos: featured3dRepoRows.map((item) => {
					const readme = readmePreviewByRepoId.get(item.repoId);

					return {
						repoSectionId: item.repoSectionId,
						repoId: item.repoId,
						fullName: item.fullName,
						description: item.description,
						url: item.url,
						homepage: item.homepage,
						stars: item.stars,
						forks: item.forks,
						language: item.language,
						topics: item.topics ?? [],
						pushedAt: toIsoDate(item.pushedAt),
						readmePreview: readme?.readmePreview ?? null,
						readmeUrl: readme?.readmeUrl ?? null,
					};
				}),
				agentSkillCategories: agentSkillCategoryRows.map((row) => ({
					category: row.category,
					count: toNumber(row.count),
				})),
				timeline: buildTimeline(
					agentSkillDatesRows.map((r) => ({
						month: r.month,
						count: toNumber(r.count),
					})),
					repo3dDatesRows.map((r) => ({
						month: r.month,
						count: toNumber(r.count),
					})),
				),
			};
		},
		() => ({
			stats: {
				approved3dRepos: 0,
				approvedAgentSkills: 0,
				sourceRepositories: 0,
				categories: 0,
			},
			featuredAgentSkills: [],
			featured3dRepos: [],
			agentSkillCategories: [],
			timeline: [],
		}),
	);
});

function buildTimeline(
	skillsByMonth: { month: Date; count: number }[],
	reposByMonth: { month: Date; count: number }[],
): TimelinePoint[] {
	try {
		const timeline: TimelinePoint[] = [];
		const MONTHS = 12;
		const now = new Date();
		const currentMonthStart = new Date(
			Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
		);
		const cutoffDate = new Date(currentMonthStart);
		cutoffDate.setUTCMonth(cutoffDate.getUTCMonth() - (MONTHS - 1));

		let cumulativeSkills = 0;
		let cumulativeRepos = 0;

		const skillsMap = new Map<string, number>();
		for (const row of skillsByMonth) {
			const monthDate = new Date(row.month);
			if (monthDate >= cutoffDate) {
				skillsMap.set(getMonthKey(monthDate), row.count);
			}
		}

		const reposMap = new Map<string, number>();
		for (const row of reposByMonth) {
			const monthDate = new Date(row.month);
			if (monthDate >= cutoffDate) {
				reposMap.set(getMonthKey(monthDate), row.count);
			}
		}

		// For the homepage chart, cumulative values are calculated within the
		// visible range so the trend shows growth over the selected period instead
		// of a flat historical baseline.
		for (let i = MONTHS - 1; i >= 0; i--) {
			const d = new Date(currentMonthStart);
			d.setUTCMonth(d.getUTCMonth() - i);

			const periodStr = getMonthKey(d);

			const skillsCount = skillsMap.get(periodStr) ?? 0;
			const reposCount = reposMap.get(periodStr) ?? 0;

			cumulativeSkills += skillsCount;
			cumulativeRepos += reposCount;

			timeline.push({
				period: periodStr,
				label: d.toLocaleDateString("en-US", {
					month: "short",
					timeZone: "UTC",
				}),
				agentSkills: skillsCount,
				repos3d: reposCount,
				cumulativeAgentSkills: cumulativeSkills,
				cumulativeRepos3d: cumulativeRepos,
			});
		}

		return timeline;
	} catch (error) {
		console.error("Error building timeline:", error);
		return [];
	}
}

function getMonthKey(date: Date) {
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
		2,
		"0",
	)}-01`;
}

async function loadReadmePreviews({
	readmePreviewByRepoId,
	repos,
}: {
	readmePreviewByRepoId: Map<
		string,
		{ readmePreview: string | null; readmeUrl: string | null }
	>;
	repos: Featured3dRepoRow[];
}) {
	if (repos.length === 0) {
		return;
	}

	try {
		const { repositoryReadmes } = await import("@/server/db/schema");
		const readmeRows = await db
			.select({
				repoId: repositoryReadmes.repoId,
				readmePreview: repositoryReadmes.contentPreview,
				readmeUrl: repositoryReadmes.readmeUrl,
			})
			.from(repositoryReadmes)
			.where(
				inArray(
					repositoryReadmes.repoId,
					repos.map((repo) => repo.repoId),
				),
			);

		for (const row of readmeRows) {
			readmePreviewByRepoId.set(row.repoId, {
				readmePreview: row.readmePreview,
				readmeUrl: row.readmeUrl,
			});
		}
	} catch {
		// README enrichment is optional for the homepage. If the local database is
		// missing this table during development, repository cards fall back to the
		// repository description instead of failing the whole page.
	}
}
