import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import type { RepoSection } from "@/lib/validations/repos";
import { db } from "@/server/db";
import { repoSections, repositories } from "@/server/db/schema";

export type AdminRepoStatusFilter =
	| "pending"
	| "approved"
	| "rejected"
	| "hidden"
	| "all";

export type AdminRepoAlgorithmFilter = "all" | "accepted" | "rejected";

export type GetAdminReposInput = {
	section: RepoSection;
	status?: AdminRepoStatusFilter;
	algorithm?: AdminRepoAlgorithmFilter;
	query?: string;
	limit?: number;
	offset?: number;
};

function normalizeStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter((item): item is string => typeof item === "string");
}

function buildAdminRepoWhere({
	section,
	status = "pending",
	algorithm = "all",
	query,
}: GetAdminReposInput) {
	const conditions = [eq(repoSections.section, section)];

	if (status !== "all") {
		conditions.push(eq(repoSections.status, status));
	}

	if (algorithm === "accepted") {
		conditions.push(eq(repoSections.isAccepted, true));
	}

	if (algorithm === "rejected") {
		conditions.push(eq(repoSections.isAccepted, false));
	}

	const cleanQuery = query?.trim();

	if (cleanQuery) {
		const pattern = `%${cleanQuery}%`;
		const queryCondition = or(
			ilike(repositories.fullName, pattern),
			ilike(repositories.name, pattern),
			ilike(repositories.owner, pattern),
			ilike(repositories.description, pattern),
		);

		if (queryCondition) {
			conditions.push(queryCondition);
		}
	}

	return and(...conditions);
}

export async function getAdminReposQuery({
	section,
	status = "pending",
	algorithm = "all",
	query = "",
	limit = 24,
	offset = 0,
}: GetAdminReposInput) {
	const whereCondition = buildAdminRepoWhere({
		section,
		status,
		algorithm,
		query,
	});

	const [rows, totalRows] = await Promise.all([
		db
			.select({
				repoSectionId: repoSections.id,

				section: repoSections.section,
				repoType: repoSections.repoType,
				score: repoSections.score,
				scoreBreakdown: repoSections.scoreBreakdown,
				rejectionReasons: repoSections.rejectionReasons,
				isAccepted: repoSections.isAccepted,
				status: repoSections.status,
				metadata: repoSections.metadata,

				dbId: repositories.id,
				githubId: repositories.githubId,

				owner: repositories.owner,
				name: repositories.name,
				fullName: repositories.fullName,

				description: repositories.description,
				url: repositories.url,
				homepage: repositories.homepage,

				avatarUrl: repositories.avatarUrl,
				language: repositories.language,
				topics: repositories.topics,

				stars: repositories.stars,
				forks: repositories.forks,
				openIssues: repositories.openIssues,

				archived: repositories.archived,
				fork: repositories.fork,
				license: repositories.license,

				defaultBranch: repositories.defaultBranch,

				githubCreatedAt: repositories.githubCreatedAt,
				githubUpdatedAt: repositories.githubUpdatedAt,
				pushedAt: repositories.pushedAt,

				syncedAt: repositories.syncedAt,
			})
			.from(repoSections)
			.innerJoin(repositories, eq(repoSections.repoId, repositories.id))
			.where(whereCondition)
			.orderBy(desc(repoSections.score), desc(repositories.stars))
			.limit(limit)
			.offset(offset),

		db
			.select({
				total: count(),
			})
			.from(repoSections)
			.innerJoin(repositories, eq(repoSections.repoId, repositories.id))
			.where(whereCondition),
	]);

	const total = Number(totalRows[0]?.total ?? 0);

	return {
		section,
		status,
		algorithm,
		query: query.trim(),
		limit,
		offset,
		total,
		totalReturned: rows.length,

		repos: rows.map((row) => ({
			...row,

			description: row.description ?? "",
			homepage: row.homepage ?? null,
			language: row.language ?? null,

			topics: normalizeStringArray(row.topics),
			rejectionReasons: normalizeStringArray(row.rejectionReasons),

			scoreBreakdown: row.scoreBreakdown ?? null,
			metadata: row.metadata ?? null,

			githubCreatedAt: row.githubCreatedAt?.toISOString?.() ?? null,
			githubUpdatedAt: row.githubUpdatedAt?.toISOString?.() ?? null,
			pushedAt: row.pushedAt?.toISOString?.() ?? null,
			syncedAt: row.syncedAt?.toISOString?.() ?? null,
		})),
	};
}

export async function updateRepoSectionStatus({
	section,
	repoSectionId,
	status,
}: {
	section: RepoSection;
	repoSectionId: string;
	status: "approved" | "rejected" | "hidden" | "pending";
}) {
	const rows = await db
		.update(repoSections)
		.set({
			status,
			updatedAt: new Date(),
		})
		.where(
			and(
				eq(repoSections.id, repoSectionId),
				eq(repoSections.section, section),
			),
		)
		.returning({
			id: repoSections.id,
			status: repoSections.status,
		});

	const updated = rows[0];

	if (!updated) {
		throw new Error("Repo section not found.");
	}

	return updated;
}
