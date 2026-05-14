import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { GitHubRepo } from "@/lib/validations/github";
import type { RepoSectionMetadata } from "@/lib/validations/repo-metadata";
import type {
	RepoSection,
	RepoSectionStatus,
	RepoType,
	ScoreBreakdown,
} from "@/lib/validations/repos";
import { db } from "@/server/db";
import { repoSections, repositories, syncLogs } from "@/server/db/schema";
import {
	mapGitHubRepoToRepositoryValues,
	mapRepoSectionValues,
} from "./repo.mapper";

export async function upsertRepository(repo: GitHubRepo) {
	const values = mapGitHubRepoToRepositoryValues(repo);

	const inserted = await db
		.insert(repositories)
		.values(values)
		.onConflictDoUpdate({
			target: repositories.githubId,
			set: values,
		})
		.returning({
			id: repositories.id,
		});

	const repositoryId = inserted[0]?.id;

	if (!repositoryId) {
		throw new Error(`Failed to upsert repository: ${repo.full_name}`);
	}

	return repositoryId;
}

export async function upsertRepoSection({
	repoId,
	section,
	repoType,
	score,
	scoreBreakdown,
	rejectionReasons,
	isAccepted,
	metadata,
	status,
}: {
	repoId: string;
	section: RepoSection;
	repoType: RepoType;
	score: number;
	scoreBreakdown: ScoreBreakdown;
	rejectionReasons: string[];
	isAccepted: boolean;
	metadata: RepoSectionMetadata;
	status?: RepoSectionStatus;
}) {
	const values = mapRepoSectionValues({
		repoId,
		section,
		repoType,
		score,
		scoreBreakdown,
		rejectionReasons,
		isAccepted,
		metadata,
		status,
	});

	/**
	 * Important:
	 * On conflict, only auto-promote approved agent-skill rows.
	 * Hidden/rejected admin decisions must be preserved.
	 */
	const inserted = await db
		.insert(repoSections)
		.values(values)
		.onConflictDoUpdate({
			target: [repoSections.repoId, repoSections.section],
			set: {
				repoType,
				score,
				scoreBreakdown,
				rejectionReasons,
				isAccepted,
				metadata,
				...(status === "approved"
					? {
							status: sql`case when ${repoSections.status} in ('hidden', 'rejected') then ${repoSections.status} else 'approved' end`,
						}
					: {}),
				updatedAt: new Date(),
			},
		})
		.returning({
			id: repoSections.id,
			status: repoSections.status,
		});

	const repoSection = inserted[0];

	if (!repoSection) {
		throw new Error(`Failed to upsert repo section: ${repoId} / ${section}`);
	}

	return repoSection;
}

export async function getExistingSectionGithubIds({
	githubIds,
	section,
}: {
	githubIds: number[];
	section: RepoSection;
}) {
	if (githubIds.length === 0) {
		return new Set<number>();
	}

	const rows = await db
		.select({
			githubId: repositories.githubId,
		})
		.from(repositories)
		.innerJoin(
			repoSections,
			and(
				eq(repoSections.repoId, repositories.id),
				eq(repoSections.section, section),
			),
		)
		.where(inArray(repositories.githubId, githubIds));

	return new Set(rows.map((row) => row.githubId));
}

export async function getRepoRowsBySection({
	section,
	includeRejected,
}: {
	section: RepoSection;
	includeRejected: boolean;
}) {
	/**
	 * Important:
	 * isAccepted is the algorithm's opinion.
	 * status is the admin's final decision.
	 *
	 * Public pages should show approved repos even if the algorithm was unsure.
	 * Admin dashboard can still use isAccepted to separate:
	 * - accepted by algorithm
	 * - rejected by algorithm
	 */
	const whereCondition = includeRejected
		? eq(repoSections.section, section)
		: and(
				eq(repoSections.section, section),
				eq(repoSections.status, "approved"),
			);

	return db
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

			name: repositories.name,
			fullName: repositories.fullName,
			owner: repositories.owner,

			description: repositories.description,
			url: repositories.url,
			homepage: repositories.homepage,

			stars: repositories.stars,
			forks: repositories.forks,
			openIssues: repositories.openIssues,

			language: repositories.language,
			topics: repositories.topics,
			avatarUrl: repositories.avatarUrl,

			archived: repositories.archived,
			fork: repositories.fork,

			githubCreatedAt: repositories.githubCreatedAt,
			githubUpdatedAt: repositories.githubUpdatedAt,
			pushedAt: repositories.pushedAt,

			syncedAt: repositories.syncedAt,
		})
		.from(repoSections)
		.innerJoin(repositories, eq(repoSections.repoId, repositories.id))
		.where(whereCondition);
}

export async function getAdminRepoRows({
	section,
	status,
	limit,
}: {
	section: RepoSection;
	status: RepoSectionStatus | "all";
	limit: number;
}) {
	const whereCondition =
		status === "all"
			? eq(repoSections.section, section)
			: and(eq(repoSections.section, section), eq(repoSections.status, status));

	return db
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

			name: repositories.name,
			fullName: repositories.fullName,
			owner: repositories.owner,

			description: repositories.description,
			url: repositories.url,
			homepage: repositories.homepage,

			stars: repositories.stars,
			forks: repositories.forks,
			openIssues: repositories.openIssues,

			language: repositories.language,
			topics: repositories.topics,
			avatarUrl: repositories.avatarUrl,

			archived: repositories.archived,
			fork: repositories.fork,

			githubCreatedAt: repositories.githubCreatedAt,
			githubUpdatedAt: repositories.githubUpdatedAt,
			pushedAt: repositories.pushedAt,

			syncedAt: repositories.syncedAt,
		})
		.from(repoSections)
		.innerJoin(repositories, eq(repoSections.repoId, repositories.id))
		.where(whereCondition)
		.orderBy(desc(repoSections.score))
		.limit(limit);
}

export async function updateRepoSectionStatus({
	section,
	repoSectionId,
	status,
}: {
	section: RepoSection;
	repoSectionId: string;
	status: RepoSectionStatus;
}) {
	const updated = await db
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

	const result = updated[0];

	if (!result) {
		throw new Error("Repo section not found.");
	}

	return result;
}

export async function createSyncLog({
	section,
	totalFetched,
	totalUnique,
	totalExisting = 0,
	totalNew = 0,
	totalAccepted,
	totalRejected,
	totalFailed = 0,
	rateLimitHit = false,
	searchRequestsBudget = 0,
	totalVariantsTried = 0,
	discoveryPlanMode,
	discoveryPlanDiagnosis,
	discoveryPlanConfidence,
	discoveryPlanSummary,
	discoveryPlanReason,
	discoveryPlanQuerySelection,
	discoveryPlanSaturationBps,
	discoveryPlanNewBps,
	discoveryPlanFailureBps,
	status,
	error,
}: {
	section: RepoSection;
	totalFetched: number;
	totalUnique: number;
	totalExisting?: number;
	totalNew?: number;
	totalAccepted: number;
	totalRejected: number;
	totalFailed?: number;
	rateLimitHit?: boolean;
	searchRequestsBudget?: number;
	totalVariantsTried?: number;
	discoveryPlanMode?: string;
	discoveryPlanDiagnosis?: string;
	discoveryPlanConfidence?: string;
	discoveryPlanSummary?: string;
	discoveryPlanReason?: string;
	discoveryPlanQuerySelection?: string;
	discoveryPlanSaturationBps?: number;
	discoveryPlanNewBps?: number;
	discoveryPlanFailureBps?: number;
	status: "success" | "failed";
	error?: string | null;
}) {
	const values: typeof syncLogs.$inferInsert = {
		section,
		totalFetched,
		totalUnique,
		totalExisting,
		totalNew,
		totalAccepted,
		totalRejected,
		totalFailed,
		rateLimitHit,
		searchRequestsBudget,
		totalVariantsTried,
		status,
		error,
	};

	if (discoveryPlanMode !== undefined) {
		values.discoveryPlanMode = discoveryPlanMode;
	}

	if (discoveryPlanDiagnosis !== undefined) {
		values.discoveryPlanDiagnosis = discoveryPlanDiagnosis;
	}

	if (discoveryPlanConfidence !== undefined) {
		values.discoveryPlanConfidence = discoveryPlanConfidence;
	}

	if (discoveryPlanSummary !== undefined) {
		values.discoveryPlanSummary = discoveryPlanSummary;
	}

	if (discoveryPlanReason !== undefined) {
		values.discoveryPlanReason = discoveryPlanReason;
	}

	if (discoveryPlanQuerySelection !== undefined) {
		values.discoveryPlanQuerySelection = discoveryPlanQuerySelection;
	}

	if (discoveryPlanSaturationBps !== undefined) {
		values.discoveryPlanSaturationBps = discoveryPlanSaturationBps;
	}

	if (discoveryPlanNewBps !== undefined) {
		values.discoveryPlanNewBps = discoveryPlanNewBps;
	}

	if (discoveryPlanFailureBps !== undefined) {
		values.discoveryPlanFailureBps = discoveryPlanFailureBps;
	}

	const rows = await db.insert(syncLogs).values(values).returning({
		id: syncLogs.id,
	});

	const row = rows[0];

	if (!row) {
		throw new Error("Failed to create sync log.");
	}

	return row;
}

export async function getLatestSyncLog(section: RepoSection) {
	const rows = await db
		.select({
			totalFetched: syncLogs.totalFetched,
			totalUnique: syncLogs.totalUnique,
			totalAccepted: syncLogs.totalAccepted,
			totalRejected: syncLogs.totalRejected,
			status: syncLogs.status,
			error: syncLogs.error,
			createdAt: syncLogs.createdAt,
		})
		.from(syncLogs)
		.where(eq(syncLogs.section, section))
		.orderBy(desc(syncLogs.createdAt))
		.limit(1);

	return rows[0] ?? null;
}
