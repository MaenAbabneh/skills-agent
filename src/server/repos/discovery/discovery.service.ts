import type {
	GitHubRepo,
	GitHubSearchResponse,
} from "@/lib/validations/github";
import type { RepoSection } from "@/lib/validations/repos";
import {
	ensureSectionSearchQueriesSeeded,
	getPlannedSectionSearchQueries,
	updateSectionSearchQueryStats,
} from "@/server/admin/admin-section-search-queries.query";
import {
	createSectionSearchQueryRuns,
	getRecentSuccessfulQueryTexts,
	getRecentWeakTemporaryQueryTexts,
	normalizeQueryRunType,
	type SectionSearchQueryRunType,
} from "@/server/admin/admin-section-search-query-runs.query";
import { searchGitHubRepos } from "@/server/github";
import {
	type GitHubRateLimitError,
	isGitHubRateLimitError,
} from "@/server/github/client";
import {
	getGitHubRateLimitStatus,
	getSearchBudget,
} from "@/server/github/rate-limit";
import { createAgentSkillDetectionContext } from "@/server/repos/agent-skills-detection";
import { upsertDetectedAgentSkillFiles } from "@/server/repos/agent-skills-upsert";
import {
	createSyncLog,
	getExistingSectionGithubIds,
	upsertRepoSection,
	upsertRepository,
} from "@/server/repos/repo.repository";
import { processGitHubRepoForSection } from "@/server/repos/repo.service";
import { getSectionStrategy } from "@/server/sections/registry";
import { SECTION_CONFIGS } from "@/server/sections/sections.config";
import { resolveSectionDiscoveryConfig } from "./discovery.config";
import {
	applyDiscoveryPlanToConfig,
	createDiscoveryPlan,
	type DiscoveryPlan,
	selectTemporaryExplorationQueries,
	toBasisPoints,
} from "./discovery.planner";
import {
	buildDiscoveryVariants,
	type DiscoveryBaseQuery,
	type DiscoveryQueryVariant,
} from "./discovery.variants";
import { getAIQuerySuggestions } from "./discovery-ai-suggestions";
import { getRecentDiscoveryRunsForPlanning } from "./discovery-planner.query";
import {
	generateTopicMiningQueries,
	getTopTopicsFromAcceptedRepos,
} from "./discovery-topic-mining.query";

export type DiscoverNewReposInput = {
	section: RepoSection;

	/**
	 * Optional override.
	 * If missing, the section config decides.
	 */
	perPage?: number;
};

export type DiscoveryPartialError = {
	query: string;
	sort: string;
	page: number;
	reason: DiscoveryQueryVariant["reason"];
	error: string;
	stage?: string;
};

export type DiscoveryFailedRepo = {
	fullName: string;
	error: string;
};

export type DiscoverNewReposResult = {
	section: RepoSection;

	perPage: number;

	totalVariantsTried: number;
	totalFetched: number;
	totalCandidates: number;
	totalExistingInSection: number;

	totalNew: number;
	totalAccepted: number;
	totalRejected: number;
	totalFailed: number;

	rateLimitHit: boolean;
	rateLimitResetAt: string | null;
	rateLimitRetryAfterSeconds: number | null;
	remainingSearchRequests: number | null;
	searchRequestsBudget: number;

	discoveryPlan: DiscoveryPlan;

	partialErrors: DiscoveryPartialError[];
	failedRepos: DiscoveryFailedRepo[];

	skillDetection?: {
		candidatesPrefiltered: number;
		treeChecksAttempted: number;
		treeChecksSkipped: number;
		treeChecksTimedOut: number;
		treeChecksFailed: number;
		skillFilesFound: number;
	};
};

type QueryRunStats = {
	sourceKey: string;
	sourceQueryId: string | null;
	sourceQuery: string;
	queryType: SectionSearchQueryRunType;
	totalFetched: number;
	githubIds: Set<number>;
};

type QueryOutcomeStats = {
	totalNew: number;
	totalAccepted: number;
	totalRejected: number;
};

function shouldStopCollectingCandidates({
	candidatesCount,
	maxCandidatesPerRun,
}: {
	candidatesCount: number;
	maxCandidatesPerRun: number;
}) {
	return candidatesCount >= maxCandidatesPerRun;
}

function getRateLimitMessage(error: GitHubRateLimitError) {
	if (error.resetAt) {
		return `GitHub ${error.resource} rate limit reached. Try again after ${error.resetAt}.`;
	}

	return `GitHub ${error.resource} rate limit reached.`;
}

function getErrorMessage(error: unknown) {
	if (!(error instanceof Error)) {
		return "Unknown error";
	}

	const cause = error.cause;

	if (
		cause &&
		typeof cause === "object" &&
		"message" in cause &&
		typeof cause.message === "string"
	) {
		return `${error.message}\nCause: ${cause.message}`;
	}

	if (
		cause &&
		typeof cause === "object" &&
		"detail" in cause &&
		typeof cause.detail === "string"
	) {
		return `${error.message}\nDetail: ${cause.detail}`;
	}

	return error.message;
}

function wait(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableDatabaseError(error: unknown) {
	const message = getErrorMessage(error).toLowerCase();

	return (
		message.includes("fetch failed") ||
		message.includes("error connecting to database") ||
		message.includes("connection") ||
		message.includes("timeout") ||
		message.includes("temporarily unavailable")
	);
}

async function withDatabaseRetry<T>({
	operation,
	label,
	maxAttempts = 3,
}: {
	operation: () => Promise<T>;
	label: string;
	maxAttempts?: number;
}) {
	let lastError: unknown;

	for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
		try {
			return await operation();
		} catch (error) {
			lastError = error;

			if (!isRetryableDatabaseError(error) || attempt === maxAttempts) {
				throw error;
			}

			console.warn(
				`Retrying database operation "${label}" after failure. Attempt ${attempt}/${maxAttempts}`,
				error,
			);

			await wait(300 * attempt);
		}
	}

	throw lastError;
}

function serializeDiscoveryWarnings({
	rateLimitHit,
	rateLimitResetAt,
	rateLimitRetryAfterSeconds,
	remainingSearchRequests,
	searchRequestsBudget,
	discoveryPlan,
	partialErrors,
	failedRepos,
}: {
	rateLimitHit: boolean;
	rateLimitResetAt: string | null;
	rateLimitRetryAfterSeconds: number | null;
	remainingSearchRequests: number | null;
	searchRequestsBudget: number;
	discoveryPlan?: DiscoveryPlan;
	partialErrors: DiscoveryPartialError[];
	failedRepos: DiscoveryFailedRepo[];
}) {
	if (partialErrors.length === 0 && failedRepos.length === 0 && !rateLimitHit) {
		return null;
	}

	return JSON.stringify({
		rateLimitHit,
		rateLimitResetAt,
		rateLimitRetryAfterSeconds,
		remainingSearchRequests,
		searchRequestsBudget,
		discoveryPlan: discoveryPlan
			? {
					mode: discoveryPlan.mode,
					diagnosis: discoveryPlan.diagnosis,
					confidence: discoveryPlan.confidence,
					planSummary: discoveryPlan.planSummary,
					reason: discoveryPlan.reason,
					querySelection: discoveryPlan.querySelection,
					saturationRate: discoveryPlan.saturationRate,
					newRate: discoveryPlan.newRate,
					failureRate: discoveryPlan.failureRate,
				}
			: undefined,
		partialErrors,
		failedRepos,
	});
}

function getDiscoveryPlanSyncLogFields(discoveryPlan: DiscoveryPlan) {
	return {
		discoveryPlanMode: discoveryPlan.mode,
		discoveryPlanDiagnosis: discoveryPlan.diagnosis,
		discoveryPlanConfidence: discoveryPlan.confidence,
		discoveryPlanSummary: discoveryPlan.planSummary,
		discoveryPlanReason: discoveryPlan.reason,
		discoveryPlanQuerySelection: discoveryPlan.querySelection,
		discoveryPlanSaturationBps: toBasisPoints(discoveryPlan.saturationRate),
		discoveryPlanNewBps: toBasisPoints(discoveryPlan.newRate),
		discoveryPlanFailureBps: toBasisPoints(discoveryPlan.failureRate),
	};
}

function normalizeQueryForComparison(query: string) {
	return query.trim().replace(/\s+/g, " ").toLowerCase();
}

function filterNewQueries({
	queries,
	existingQueries,
}: {
	queries: string[];
	existingQueries: string[];
}) {
	const seen = new Set(existingQueries.map(normalizeQueryForComparison));
	const result: string[] = [];

	for (const query of queries) {
		const normalized = normalizeQueryForComparison(query);

		if (!normalized || seen.has(normalized)) {
			continue;
		}

		seen.add(normalized);
		result.push(query);
	}

	return result;
}

function buildPlannedDiscoveryVariants({
	plannedBaseQueries,
	temporaryBaseQueries,
	config,
	searchRequestsBudget,
	useExplorationBudgetSplit,
}: {
	plannedBaseQueries: DiscoveryBaseQuery[];
	temporaryBaseQueries: DiscoveryBaseQuery[];
	config: Parameters<typeof buildDiscoveryVariants>[0]["config"];
	searchRequestsBudget: number;
	useExplorationBudgetSplit: boolean;
}) {
	if (
		!useExplorationBudgetSplit ||
		temporaryBaseQueries.length === 0 ||
		searchRequestsBudget <= 1
	) {
		return buildDiscoveryVariants({
			baseQueries: [...plannedBaseQueries, ...temporaryBaseQueries],
			config,
		}).slice(0, searchRequestsBudget);
	}

	const plannedVariants = buildDiscoveryVariants({
		baseQueries: plannedBaseQueries,
		config,
	});
	const temporaryVariants = buildDiscoveryVariants({
		baseQueries: temporaryBaseQueries,
		config,
	});

	if (temporaryVariants.length === 0) {
		return plannedVariants.slice(0, searchRequestsBudget);
	}

	const temporaryBudget = Math.min(
		temporaryVariants.length,
		Math.max(1, Math.floor(searchRequestsBudget / 2)),
	);
	const plannedBudget = Math.max(0, searchRequestsBudget - temporaryBudget);

	const selectedPlannedVariants = plannedVariants.slice(0, plannedBudget);
	const selectedTemporaryVariants = temporaryVariants.slice(0, temporaryBudget);
	const selectedVariants = [
		...selectedPlannedVariants,
		...selectedTemporaryVariants,
	];

	if (selectedVariants.length >= searchRequestsBudget) {
		return selectedVariants;
	}

	const remainingBudget = searchRequestsBudget - selectedVariants.length;
	const additionalPlannedVariants = plannedVariants.slice(
		selectedPlannedVariants.length,
		selectedPlannedVariants.length + remainingBudget,
	);
	const withAdditionalPlannedVariants = [
		...selectedVariants,
		...additionalPlannedVariants,
	];

	if (withAdditionalPlannedVariants.length >= searchRequestsBudget) {
		return withAdditionalPlannedVariants;
	}

	const additionalTemporaryVariants = temporaryVariants.slice(
		selectedTemporaryVariants.length,
		selectedTemporaryVariants.length +
			(searchRequestsBudget - withAdditionalPlannedVariants.length),
	);

	return [...withAdditionalPlannedVariants, ...additionalTemporaryVariants];
}

function getVariantSourceKey(variant: DiscoveryQueryVariant) {
	if (variant.sourceQueryId) {
		return `db:${variant.sourceQueryId}`;
	}

	const queryType = normalizeQueryRunType(
		variant.sourceQueryType ?? "temporary",
	);

	return `${queryType}:${normalizeQueryForComparison(variant.sourceQuery)}`;
}

function getVariantQueryType(variant: DiscoveryQueryVariant) {
	if (variant.sourceQueryId) {
		return "db";
	}

	return normalizeQueryRunType(variant.sourceQueryType ?? "temporary");
}

function getOrCreateQueryRunStats({
	queryRunStatsByKey,
	variant,
}: {
	queryRunStatsByKey: Map<string, QueryRunStats>;
	variant: DiscoveryQueryVariant;
}) {
	const sourceKey = getVariantSourceKey(variant);
	const existing = queryRunStatsByKey.get(sourceKey);

	if (existing) {
		return existing;
	}

	const created: QueryRunStats = {
		sourceKey,
		sourceQueryId: variant.sourceQueryId ?? null,
		sourceQuery: variant.sourceQuery,
		queryType: getVariantQueryType(variant),
		totalFetched: 0,
		githubIds: new Set<number>(),
	};

	queryRunStatsByKey.set(sourceKey, created);

	return created;
}

function getOrCreateQueryOutcomeStats({
	queryOutcomeStatsByKey,
	sourceKey,
}: {
	queryOutcomeStatsByKey: Map<string, QueryOutcomeStats>;
	sourceKey: string;
}) {
	const existing = queryOutcomeStatsByKey.get(sourceKey);

	if (existing) {
		return existing;
	}

	const created: QueryOutcomeStats = {
		totalNew: 0,
		totalAccepted: 0,
		totalRejected: 0,
	};

	queryOutcomeStatsByKey.set(sourceKey, created);

	return created;
}

function buildRepoQuerySourceMap(
	queryRunStatsByKey: Map<string, QueryRunStats>,
) {
	const querySourceIdsByRepoId = new Map<number, Set<string>>();

	for (const [sourceKey, stats] of queryRunStatsByKey.entries()) {
		for (const githubId of stats.githubIds) {
			const existing = querySourceIdsByRepoId.get(githubId);

			if (existing) {
				existing.add(sourceKey);
				continue;
			}

			querySourceIdsByRepoId.set(githubId, new Set([sourceKey]));
		}
	}

	return querySourceIdsByRepoId;
}

function buildSourceQueryByKey(queryRunStatsByKey: Map<string, QueryRunStats>) {
	const sourceQueryByKey = new Map<string, string>();

	for (const [sourceKey, stats] of queryRunStatsByKey.entries()) {
		sourceQueryByKey.set(sourceKey, stats.sourceQuery);
	}

	return sourceQueryByKey;
}

function getQuerySourcesForRepo({
	repoId,
	querySourceKeysByRepoId,
	sourceQueryByKey,
}: {
	repoId: number;
	querySourceKeysByRepoId: Map<number, Set<string>>;
	sourceQueryByKey: Map<string, string>;
}) {
	const sourceKeys = querySourceKeysByRepoId.get(repoId);

	if (!sourceKeys) {
		return [];
	}

	return Array.from(sourceKeys)
		.map((sourceKey) => sourceQueryByKey.get(sourceKey))
		.filter((query): query is string => typeof query === "string");
}

async function persistQueryRunStats({
	queryRunStatsByKey,
	queryOutcomeStatsByKey,
}: {
	queryRunStatsByKey: Map<string, QueryRunStats>;
	queryOutcomeStatsByKey: Map<string, QueryOutcomeStats>;
}) {
	await Promise.all(
		Array.from(queryRunStatsByKey.values())
			.filter((runStats) => runStats.sourceQueryId !== null)
			.map((runStats) => {
				const outcomeStats = queryOutcomeStatsByKey.get(runStats.sourceKey);

				return updateSectionSearchQueryStats({
					id: runStats.sourceQueryId as string,
					totalFetched: runStats.totalFetched,
					totalCandidates: runStats.githubIds.size,
					totalNew: outcomeStats?.totalNew ?? 0,
					totalAccepted: outcomeStats?.totalAccepted ?? 0,
					totalRejected: outcomeStats?.totalRejected ?? 0,
				});
			}),
	);
}

async function persistSectionSearchQueryRunRows({
	syncLogId,
	section,
	queryRunStatsByKey,
	queryOutcomeStatsByKey,
}: {
	syncLogId: string;
	section: RepoSection;
	queryRunStatsByKey: Map<string, QueryRunStats>;
	queryOutcomeStatsByKey: Map<string, QueryOutcomeStats>;
}) {
	await createSectionSearchQueryRuns(
		Array.from(queryRunStatsByKey.values()).map((runStats) => {
			const outcomeStats = queryOutcomeStatsByKey.get(runStats.sourceKey);

			return {
				syncLogId,
				section,
				sectionSearchQueryId: runStats.sourceQueryId,
				query: runStats.sourceQuery,
				queryType: runStats.queryType,
				totalFetched: runStats.totalFetched,
				totalCandidates: runStats.githubIds.size,
				totalNew: outcomeStats?.totalNew ?? 0,
				totalAccepted: outcomeStats?.totalAccepted ?? 0,
				totalRejected: outcomeStats?.totalRejected ?? 0,
			};
		}),
	);
}

export async function discoverNewReposForSectionService({
	section,
	perPage: perPageOverride,
}: DiscoverNewReposInput): Promise<DiscoverNewReposResult> {
	const strategy = getSectionStrategy(section);

	const config = await resolveSectionDiscoveryConfig(strategy);

	if (!config.enabled) {
		throw new Error(`Discovery is disabled for section: ${strategy.id}`);
	}

	const rateLimitStatus = await getGitHubRateLimitStatus();
	const searchLimit = rateLimitStatus.search;

	const recentRuns = await getRecentDiscoveryRunsForPlanning({
		section: strategy.id,
		limit: 5,
	});

	const initialDiscoveryPlan = createDiscoveryPlan({
		section: strategy.id,
		config,
		recentRuns,
		remainingSearchRequests: searchLimit?.remaining ?? null,
	});

	const plannedConfig = applyDiscoveryPlanToConfig(
		config,
		initialDiscoveryPlan,
	);

	const perPage = perPageOverride ?? plannedConfig.perPage;

	const searchRequestsBudget = getSearchBudget({
		remaining: searchLimit?.remaining,
		minSearchRemaining: plannedConfig.minSearchRemaining,
		maxVariantsPerRun: plannedConfig.maxVariantsPerRun,
	});

	if (searchRequestsBudget <= 0) {
		const resetAt = searchLimit?.resetAt ?? null;
		const retryAfterSeconds = searchLimit?.retryAfterSeconds ?? null;

		const partialErrors: DiscoveryPartialError[] = [
			{
				query: "__rate_limit_precheck__",
				sort: "none",
				page: 0,
				reason: "base",
				error: resetAt
					? `GitHub search rate limit is too low. Remaining: ${
							searchLimit?.remaining ?? "unknown"
						}. Try again after ${resetAt}.`
					: `GitHub search rate limit is too low. Remaining: ${
							searchLimit?.remaining ?? "unknown"
						}.`,
			},
		];

		await createSyncLog({
			section: strategy.id,
			totalFetched: 0,
			totalUnique: 0,
			totalExisting: 0,
			totalNew: 0,
			totalAccepted: 0,
			totalRejected: 0,
			totalFailed: 0,
			rateLimitHit: true,
			searchRequestsBudget: 0,
			totalVariantsTried: 0,
			status: "failed",
			...getDiscoveryPlanSyncLogFields(initialDiscoveryPlan),
			error: serializeDiscoveryWarnings({
				rateLimitHit: true,
				rateLimitResetAt: resetAt,
				rateLimitRetryAfterSeconds: retryAfterSeconds,
				remainingSearchRequests: searchLimit?.remaining ?? null,
				searchRequestsBudget: 0,
				discoveryPlan: initialDiscoveryPlan,
				partialErrors,
				failedRepos: [],
			}),
		});

		return {
			section: strategy.id,

			perPage,

			totalVariantsTried: 0,
			totalFetched: 0,
			totalCandidates: 0,
			totalExistingInSection: 0,

			totalNew: 0,
			totalAccepted: 0,
			totalRejected: 0,
			totalFailed: 0,

			rateLimitHit: true,
			rateLimitResetAt: resetAt,
			rateLimitRetryAfterSeconds: retryAfterSeconds,
			remainingSearchRequests: searchLimit?.remaining ?? null,
			searchRequestsBudget: 0,

			discoveryPlan: initialDiscoveryPlan,

			partialErrors,
			failedRepos: [],
		};
	}

	const fallbackQueries =
		SECTION_CONFIGS[strategy.id].defaultQueries ??
		strategy.discoveryQueries ??
		strategy.queries;

	await ensureSectionSearchQueriesSeeded({
		section: strategy.id,
		fallbackQueries,
	});

	const partialErrors: DiscoveryPartialError[] = [];
	const failedRepos: DiscoveryFailedRepo[] = [];

	const searchQueries = await getPlannedSectionSearchQueries({
		section: strategy.id,
		querySelection: initialDiscoveryPlan.querySelection,
	});
	const [
		recentWeakTemporaryQueries,
		topicsFromAcceptedRepos,
		recentSuccessfulQueries,
	] =
		initialDiscoveryPlan.mode === "exploration"
			? await Promise.all([
					getRecentWeakTemporaryQueryTexts({
						section: strategy.id,
						limit: 50,
					}),
					getTopTopicsFromAcceptedRepos({
						section: strategy.id,
						limit: 30,
						sinceDays: 60,
					}).catch((error) => {
						partialErrors.push({
							query: "__topic_mining__",
							sort: "none",
							page: 0,
							reason: "base",
							stage: "topic_mining",
							error: getErrorMessage(error),
						});
						return [];
					}),
					getRecentSuccessfulQueryTexts({
						section: strategy.id,
						limit: 20,
					}),
				])
			: [[], [], []];

	const existingQueries = [
		...fallbackQueries,
		...searchQueries.map((item) => item.query),
	];
	const temporaryQueries =
		initialDiscoveryPlan.mode === "exploration"
			? selectTemporaryExplorationQueries({
					section: strategy.id,
					excludedQueries: [...existingQueries, ...recentWeakTemporaryQueries],
				})
			: [];
	const topicMiningQueries =
		initialDiscoveryPlan.mode === "exploration"
			? filterNewQueries({
					queries: generateTopicMiningQueries({
						section: strategy.id,
						topics: topicsFromAcceptedRepos,
						maxQueries: 10,
					}),
					existingQueries: [
						...existingQueries,
						...recentWeakTemporaryQueries,
						...temporaryQueries,
					],
				})
			: [];
	const aiTemporaryQueries =
		initialDiscoveryPlan.mode === "exploration"
			? filterNewQueries({
					queries: (
						await getAIQuerySuggestions({
							section: strategy.id,
							discoveryPlan: initialDiscoveryPlan,
							topics: topicsFromAcceptedRepos,
							weakQueries: recentWeakTemporaryQueries,
							successfulQueries: recentSuccessfulQueries,
							existingQueries: [
								...existingQueries,
								...recentWeakTemporaryQueries,
								...temporaryQueries,
								...topicMiningQueries,
							],
							availableStaticTemporaryQueriesCount: temporaryQueries.length,
							availableTopicMiningQueriesCount: topicMiningQueries.length,
							maxSuggestions: 8,
						})
					).queries,
					existingQueries: [
						...existingQueries,
						...recentWeakTemporaryQueries,
						...temporaryQueries,
						...topicMiningQueries,
					],
				})
			: [];
	const suggestedQueries = filterNewQueries({
		queries: [...initialDiscoveryPlan.suggestedQueries, ...aiTemporaryQueries],
		existingQueries,
	});
	const discoveryPlan: DiscoveryPlan = {
		...initialDiscoveryPlan,
		suggestedQueries,
		temporaryQueries: [
			...temporaryQueries,
			...topicMiningQueries,
			...aiTemporaryQueries,
		],
	};

	const plannedBaseQueries: DiscoveryBaseQuery[] =
		searchQueries.length > 0
			? searchQueries.map((item) => ({
					id: item.id,
					query: item.query,
				}))
			: fallbackQueries.map((query) => ({ query }));

	const temporaryBaseQueries: DiscoveryBaseQuery[] = temporaryQueries.map(
		(query) => ({
			query,
			queryType: "temporary",
		}),
	);
	const topicTemporaryBaseQueries: DiscoveryBaseQuery[] =
		topicMiningQueries.map((query) => ({
			query,
			queryType: "topic_temporary",
		}));
	const aiTemporaryBaseQueries: DiscoveryBaseQuery[] = aiTemporaryQueries.map(
		(query) => ({
			query,
			queryType: "ai_temporary",
		}),
	);

	const variants = buildPlannedDiscoveryVariants({
		plannedBaseQueries,
		temporaryBaseQueries: [
			...temporaryBaseQueries,
			...topicTemporaryBaseQueries,
			...aiTemporaryBaseQueries,
		],
		config: plannedConfig,
		searchRequestsBudget,
		useExplorationBudgetSplit: discoveryPlan.mode === "exploration",
	});

	const maxCandidatesPerRun = searchRequestsBudget * perPage;

	const candidatesMap = new Map<number, GitHubRepo>();
	const queryRunStatsByKey = new Map<string, QueryRunStats>();

	let totalFetched = 0;
	let totalVariantsTried = 0;

	let rateLimitHit = false;
	let rateLimitResetAt: string | null = null;
	let rateLimitRetryAfterSeconds: number | null = null;
	let remainingSearchRequests: number | null = searchLimit?.remaining ?? null;

	for (const variant of variants) {
		if (
			shouldStopCollectingCandidates({
				candidatesCount: candidatesMap.size,
				maxCandidatesPerRun,
			})
		) {
			break;
		}

		totalVariantsTried += 1;

		try {
			const result: GitHubSearchResponse = await searchGitHubRepos(
				variant.query,
				{
					perPage,
					page: variant.page,
					sort: variant.sort,
					order: "desc",
				},
			);

			const items = result.items ?? [];

			totalFetched += items.length;

			for (const repo of items) {
				candidatesMap.set(repo.id, repo);
			}

			const queryRunStats = getOrCreateQueryRunStats({
				queryRunStatsByKey,
				variant,
			});

			queryRunStats.totalFetched += items.length;

			for (const repo of items) {
				queryRunStats.githubIds.add(repo.id);
			}
		} catch (error) {
			if (isGitHubRateLimitError(error)) {
				rateLimitHit = true;
				rateLimitResetAt = error.resetAt;
				rateLimitRetryAfterSeconds = error.retryAfterSeconds;
				remainingSearchRequests = error.remaining;

				partialErrors.push({
					query: variant.query,
					sort: variant.sort,
					page: variant.page,
					reason: variant.reason,
					error: getRateLimitMessage(error),
				});

				break;
			}

			partialErrors.push({
				query: variant.query,
				sort: variant.sort,
				page: variant.page,
				reason: variant.reason,
				error: getErrorMessage(error),
			});
		}
	}

	const candidates = Array.from(candidatesMap.values());

	const existingSectionGithubIds = await getExistingSectionGithubIds({
		githubIds: candidates.map((repo) => repo.id),
		section: strategy.id,
	});

	const querySourceKeysByRepoId = buildRepoQuerySourceMap(queryRunStatsByKey);
	const sourceQueryByKey = buildSourceQueryByKey(queryRunStatsByKey);
	const queryOutcomeStatsByKey = new Map<string, QueryOutcomeStats>();
	const agentSkillDetectionContext = createAgentSkillDetectionContext();

	let totalNew = 0;
	let totalAccepted = 0;
	let totalRejected = 0;

	for (const repo of candidates) {
		if (existingSectionGithubIds.has(repo.id)) {
			continue;
		}

		try {
			const processed = await processGitHubRepoForSection({
				repo,
				strategy,
				agentSkillDetectionContext,
				querySources: getQuerySourcesForRepo({
					repoId: repo.id,
					querySourceKeysByRepoId,
					sourceQueryByKey,
				}),
			});
			const detectedAgentSkillFiles =
				processed.metadata.kind === "agent-skills"
					? (processed.metadata.skillFiles ?? [])
					: [];
			const shouldAutoApproveAgentSkills =
				strategy.id === "agent-skills" &&
				processed.metadata.kind === "agent-skills" &&
				detectedAgentSkillFiles.length > 0;

			await withDatabaseRetry({
				label: `save repo ${repo.full_name}`,
				operation: async () => {
					const repositoryId = await upsertRepository(repo);

					const repoSection = await upsertRepoSection({
						repoId: repositoryId,
						section: processed.section,
						repoType: processed.repoType,
						score: processed.score,
						scoreBreakdown: processed.scoreBreakdown,
						rejectionReasons: processed.rejectionReasons,
						isAccepted: processed.isAccepted,
						metadata: processed.metadata,
						status: shouldAutoApproveAgentSkills ? "approved" : undefined,
					});

					if (
						strategy.id === "agent-skills" &&
						processed.metadata.kind === "agent-skills" &&
						detectedAgentSkillFiles.length > 0
					) {
						await upsertDetectedAgentSkillFiles({
							repoId: repositoryId,
							repoSectionId: repoSection.id,
							repository: processed.githubRepo,
							detectedFiles: detectedAgentSkillFiles,
							querySources: getQuerySourcesForRepo({
								repoId: repo.id,
								querySourceKeysByRepoId,
								sourceQueryByKey,
							}),
						});
					}
				},
			});

			totalNew += 1;

			if (processed.isAccepted) {
				totalAccepted += 1;
			} else {
				totalRejected += 1;
			}

			const sourceKeys = querySourceKeysByRepoId.get(repo.id);

			if (sourceKeys) {
				for (const sourceKey of sourceKeys) {
					const queryOutcomeStats = getOrCreateQueryOutcomeStats({
						queryOutcomeStatsByKey,
						sourceKey,
					});

					queryOutcomeStats.totalNew += 1;

					if (processed.isAccepted) {
						queryOutcomeStats.totalAccepted += 1;
					} else {
						queryOutcomeStats.totalRejected += 1;
					}
				}
			}
		} catch (error) {
			failedRepos.push({
				fullName: repo.full_name,
				error: getErrorMessage(error),
			});
		}
	}

	const totalFailed = failedRepos.length;

	await persistQueryRunStats({
		queryRunStatsByKey,
		queryOutcomeStatsByKey,
	});

	const hasUsefulResult = totalNew > 0 || candidates.length > 0;
	const hasHardFailure = totalFailed > 0 && !hasUsefulResult;

	const syncLog = await createSyncLog({
		section: strategy.id,
		totalFetched,
		totalUnique: candidates.length,
		totalExisting: existingSectionGithubIds.size,
		totalNew,
		totalAccepted,
		totalRejected,
		totalFailed,
		rateLimitHit,
		searchRequestsBudget,
		totalVariantsTried,
		status: hasHardFailure ? "failed" : "success",
		...getDiscoveryPlanSyncLogFields(discoveryPlan),
		error: serializeDiscoveryWarnings({
			rateLimitHit,
			rateLimitResetAt,
			rateLimitRetryAfterSeconds,
			remainingSearchRequests,
			searchRequestsBudget,
			discoveryPlan,
			partialErrors,
			failedRepos,
		}),
	});

	await persistSectionSearchQueryRunRows({
		syncLogId: syncLog.id,
		section: strategy.id,
		queryRunStatsByKey,
		queryOutcomeStatsByKey,
	});

	return {
		section: strategy.id,

		perPage,

		totalVariantsTried,
		totalFetched,
		totalCandidates: candidates.length,
		totalExistingInSection: existingSectionGithubIds.size,

		totalNew,
		totalAccepted,
		totalRejected,
		totalFailed,

		rateLimitHit,
		rateLimitResetAt,
		rateLimitRetryAfterSeconds,
		remainingSearchRequests,
		searchRequestsBudget,

		discoveryPlan,

		partialErrors,
		failedRepos,

		skillDetection:
			strategy.id === "agent-skills"
				? agentSkillDetectionContext.getStats()
				: undefined,
	};
}
