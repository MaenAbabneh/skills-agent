import type {
	GitHubRepo,
	GitHubSearchResponse,
} from "@/lib/validations/github";
import type { RepoSection } from "@/lib/validations/repos";

import { searchGitHubRepos } from "@/server/github";
import { getSectionStrategy } from "@/server/sections/registry";
import { createAgentSkillDetectionContext } from "./agent-skills-detection";
import {
	createSyncLog,
	upsertRepoSection,
	upsertRepository,
} from "./repo.repository";
import { processGitHubRepoForSection } from "./repo.service";

export type SyncSectionReposInput = {
	section: RepoSection;
};

export type SyncSectionReposResult = {
	section: RepoSection;

	totalFetched: number;
	totalUnique: number;
	totalAccepted: number;
	totalRejected: number;
	totalFailed: number;
	totalReturned: number;

	partialErrors: {
		query: string;
		error: string;
	}[];

	failedRepos: {
		fullName: string;
		error: string;
	}[];
};

export async function syncSectionRepos({
	section,
}: SyncSectionReposInput): Promise<SyncSectionReposResult> {
	const strategy = getSectionStrategy(section);

	const partialErrors: {
		query: string;
		error: string;
	}[] = [];

	const failedRepos: {
		fullName: string;
		error: string;
	}[] = [];

	try {
		const perPage = Math.max(strategy.perPage ?? 20, 20);

		const settled = await Promise.allSettled(
			strategy.queries.map((query) => searchGitHubRepos(query, { perPage })),
		);

		const results = settled
			.map((result, index) => ({
				result,
				query: strategy.queries[index] ?? "unknown_query",
			}))
			.filter(
				(
					item,
				): item is {
					result: PromiseFulfilledResult<GitHubSearchResponse>;
					query: string;
				} => item.result.status === "fulfilled",
			)
			.map((item) => item.result.value);

		for (const item of settled.map((result, index) => ({
			result,
			query: strategy.queries[index] ?? "unknown_query",
		}))) {
			if (item.result.status === "rejected") {
				partialErrors.push({
					query: item.query,
					error:
						item.result.reason instanceof Error
							? item.result.reason.message
							: "Unknown GitHub query error",
				});
			}
		}

		const rawRepos = results.flatMap((result) => result.items ?? []);

		const uniqueReposMap = new Map<number, GitHubRepo>();
		const querySourcesByRepoId = new Map<number, Set<string>>();

		for (const item of settled.map((result, index) => ({
			result,
			query: strategy.queries[index] ?? "unknown_query",
		}))) {
			if (item.result.status !== "fulfilled") {
				continue;
			}

			for (const repo of item.result.value.items ?? []) {
				uniqueReposMap.set(repo.id, repo);

				const existing = querySourcesByRepoId.get(repo.id);

				if (existing) {
					existing.add(item.query);
				} else {
					querySourcesByRepoId.set(repo.id, new Set([item.query]));
				}
			}
		}

		const uniqueRepos = Array.from(uniqueReposMap.values());
		const agentSkillDetectionContext = createAgentSkillDetectionContext();

		let totalAccepted = 0;
		let totalRejected = 0;

		for (const repo of uniqueRepos) {
			try {
				const processed = await processGitHubRepoForSection({
					repo,
					strategy,
					agentSkillDetectionContext,
					querySources: Array.from(querySourcesByRepoId.get(repo.id) ?? []),
				});

				if (processed.isAccepted) {
					totalAccepted += 1;
				} else {
					totalRejected += 1;
				}

				const repositoryId = await upsertRepository(repo);

				await upsertRepoSection({
					repoId: repositoryId,
					section: processed.section,
					repoType: processed.repoType,
					score: processed.score,
					scoreBreakdown: processed.scoreBreakdown,
					rejectionReasons: processed.rejectionReasons,
					isAccepted: processed.isAccepted,
					metadata: processed.metadata,
				});
			} catch (error) {
				failedRepos.push({
					fullName: repo.full_name,
					error:
						error instanceof Error ? error.message : "Unknown repo sync error",
				});
			}
		}

		const status =
			partialErrors.length > 0 || failedRepos.length > 0 ? "failed" : "success";

		await createSyncLog({
			section: strategy.id,
			totalFetched: rawRepos.length,
			totalUnique: uniqueRepos.length,
			totalAccepted,
			totalRejected,
			status,
			error:
				partialErrors.length > 0 || failedRepos.length > 0
					? JSON.stringify({
							partialErrors,
							failedRepos,
						})
					: null,
		});

		return {
			section: strategy.id,

			totalFetched: rawRepos.length,
			totalUnique: uniqueRepos.length,
			totalAccepted,
			totalRejected,
			totalFailed: failedRepos.length,
			totalReturned: uniqueRepos.length,

			partialErrors,
			failedRepos,
		};
	} catch (error) {
		await createSyncLog({
			section: strategy.id,
			totalFetched: 0,
			totalUnique: 0,
			totalAccepted: 0,
			totalRejected: 0,
			status: "failed",
			error:
				error instanceof Error ? error.message : "Unknown section sync error",
		});

		throw error;
	}
}
