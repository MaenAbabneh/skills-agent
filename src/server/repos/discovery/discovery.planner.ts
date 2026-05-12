import type { SectionId } from "@/server/sections/sections.config";
import type {
	DiscoveryConfig,
	DiscoveryStarRange,
} from "@/server/sections/types";

export type DiscoveryPlanMode =
	| "normal"
	| "exploration"
	| "freshness"
	| "recovery";

export type DiscoveryPlanDiagnosis =
	| "healthy"
	| "saturated"
	| "low-budget"
	| "high-failure"
	| "rate-limited";

export type DiscoveryPlanConfidence = "low" | "medium" | "high";

export type DiscoveryPlanQuerySelection =
	| "priority"
	| "least-used"
	| "balanced";

type TemporaryExplorationQueryFamily =
	| "portfolio"
	| "shader"
	| "game"
	| "physics"
	| "data-viz"
	| "maps"
	| "creative-coding"
	| "webgpu"
	| "skills"
	| "tools"
	| "mcp"
	| "browser"
	| "coding"
	| "framework"
	| "workflow"
	| "developer-tools"
	| "toolkit"
	| "plugins"
	| "sdk"
	| "rag"
	| "cli"
	| "memory"
	| "provider";

type TemporaryExplorationQuery = {
	query: string;
	family: TemporaryExplorationQueryFamily;
};

export type DiscoveryPlanningRun = {
	totalFetched: number;
	totalCandidates: number;
	totalExisting: number;
	totalNew: number;
	totalFailed: number;
	rateLimitHit: boolean;
	searchRequestsBudget: number;
	totalVariantsTried: number;
	discoveryPlanMode?: DiscoveryPlanMode | null;
	discoveryPlanDiagnosis?: DiscoveryPlanDiagnosis | null;
	createdAt: string | Date;
};

export type DiscoveryPlan = {
	mode: DiscoveryPlanMode;
	diagnosis: DiscoveryPlanDiagnosis;
	confidence: DiscoveryPlanConfidence;
	reason: string;
	planSummary: string;
	expectedEffect: string;

	saturationRate: number;
	newRate: number;
	failureRate: number;

	querySelection: DiscoveryPlanQuerySelection;

	perPage: number;
	maxVariantsPerRun: number;

	pages: number[];
	pushedWithinDays: number[];
	createdWithinDays: number[];
	starRanges: DiscoveryStarRange[];

	suggestedQueries: string[];
	temporaryQueries: string[];
};

const EXPLORATION_STAR_RANGES: DiscoveryStarRange[] = [
	{ min: 0, max: 5 },
	{ min: 5, max: 25 },
	{ min: 25, max: 250 },
	{ min: 250, max: 1000 },
];

const TEMPORARY_EXPLORATION_QUERIES: TemporaryExplorationQuery[] = [
	{ query: "threejs portfolio animation", family: "portfolio" },
	{ query: "r3f developer portfolio", family: "portfolio" },
	{ query: "webgl personal website", family: "portfolio" },
	{ query: "3d portfolio react", family: "portfolio" },
	{ query: "interactive portfolio threejs", family: "portfolio" },
	{ query: "3d landing page portfolio", family: "portfolio" },

	{ query: "threejs shader", family: "shader" },
	{ query: "glsl webgl experiment", family: "shader" },
	{ query: "fragment shader threejs", family: "shader" },
	{ query: "shader material r3f", family: "shader" },
	{ query: "webgl shader playground", family: "shader" },
	{ query: "threejs postprocessing shader", family: "shader" },

	{ query: "threejs game prototype", family: "game" },
	{ query: "react three fiber game", family: "game" },
	{ query: "webgl browser game", family: "game" },
	{ query: "threejs arcade game", family: "game" },
	{ query: "r3f game demo", family: "game" },
	{ query: "threejs multiplayer demo", family: "game" },

	{ query: "react three rapier game", family: "physics" },
	{ query: "cannon es threejs", family: "physics" },
	{ query: "physics simulation r3f", family: "physics" },
	{ query: "threejs physics playground", family: "physics" },
	{ query: "rapier threejs demo", family: "physics" },
	{ query: "3d physics webgl", family: "physics" },

	{ query: "3d data visualization react", family: "data-viz" },
	{ query: "threejs dashboard visualization", family: "data-viz" },
	{ query: "webgl data visualization", family: "data-viz" },
	{ query: "3d graph threejs", family: "data-viz" },
	{ query: "r3f data visualization", family: "data-viz" },
	{ query: "threejs network visualization", family: "data-viz" },

	{ query: "webgl map visualization", family: "maps" },
	{ query: "globe threejs", family: "maps" },
	{ query: "threejs mapbox", family: "maps" },
	{ query: "3d map react", family: "maps" },
	{ query: "earth globe webgl", family: "maps" },
	{ query: "threejs geospatial visualization", family: "maps" },

	{ query: "creative coding webgl", family: "creative-coding" },
	{ query: "generative art r3f", family: "creative-coding" },
	{ query: "audio reactive webgl", family: "creative-coding" },
	{ query: "particle system threejs", family: "creative-coding" },
	{ query: "threejs generative art", family: "creative-coding" },
	{ query: "webgl visual experiment", family: "creative-coding" },

	{ query: "webgpu demo", family: "webgpu" },
	{ query: "webgpu experiment", family: "webgpu" },
	{ query: "threejs webgpu", family: "webgpu" },
	{ query: "react webgpu", family: "webgpu" },
	{ query: "webgpu renderer threejs", family: "webgpu" },
	{ query: "webgpu visualization", family: "webgpu" },
];

const AGENT_SKILLS_TEMPORARY_EXPLORATION_QUERIES: TemporaryExplorationQuery[] =
	[
		{ query: "agent skill file", family: "skills" },
		{ query: "SKILL.md agent", family: "skills" },
		{ query: "skill.md ai agent", family: "skills" },
		{ query: "agent skills markdown", family: "skills" },
		{ query: "coding assistant skill file", family: "coding" },
		{ query: "claude skill repository", family: "provider" },
		{ query: "cursor skill repository", family: "provider" },
		{ query: "factory skills SKILL.md", family: "skills" },
		{ query: ".factory skills agent", family: "skills" },
		{ query: ".skills directory agent", family: "skills" },
		{ query: "skills directory SKILL.md", family: "skills" },
		{ query: "ai agent skill markdown", family: "skills" },
		{ query: "coding agent SKILL.md", family: "coding" },
	];

const TEMPORARY_EXPLORATION_QUERIES_BY_SECTION: Record<
	SectionId,
	TemporaryExplorationQuery[]
> = {
	"3d-motion": TEMPORARY_EXPLORATION_QUERIES,
	"agent-skills": AGENT_SKILLS_TEMPORARY_EXPLORATION_QUERIES,
};

function safeRate(numerator: number, denominator: number) {
	if (denominator <= 0) {
		return 0;
	}

	return numerator / denominator;
}

function getRunNewRate(run: DiscoveryPlanningRun) {
	return safeRate(run.totalNew, run.totalCandidates);
}

function isSaturatedRun(run: DiscoveryPlanningRun) {
	return run.totalCandidates >= 100 && getRunNewRate(run) < 0.05;
}

function getRunSaturationRate(run: DiscoveryPlanningRun) {
	return safeRate(run.totalExisting, run.totalCandidates);
}

function isSaturatedNormalRun(run: DiscoveryPlanningRun, section: SectionId) {
	if (
		section === "agent-skills" &&
		run.discoveryPlanMode === "normal" &&
		run.totalCandidates >= 50 &&
		run.totalNew === 0
	) {
		return true;
	}

	return (
		run.discoveryPlanMode === "normal" &&
		run.totalCandidates >= 100 &&
		(getRunNewRate(run) < 0.05 || run.totalNew === 0)
	);
}

function isHealthyPerformanceRun(run: DiscoveryPlanningRun) {
	return getRunNewRate(run) >= 0.1 && getRunSaturationRate(run) < 0.85;
}

function uniqueSortedNumbers(values: number[]) {
	return Array.from(
		new Set(values.filter((value) => Number.isFinite(value) && value > 0)),
	).sort((a, b) => a - b);
}

function dedupeStarRanges(ranges: DiscoveryStarRange[]) {
	const seen = new Set<string>();
	const unique: DiscoveryStarRange[] = [];

	for (const range of ranges) {
		const key = `${range.min}:${range.max ?? ""}`;

		if (seen.has(key)) {
			continue;
		}

		seen.add(key);
		unique.push(range);
	}

	return unique;
}

function getConservativeWindows(values: number[]) {
	return uniqueSortedNumbers(values).slice(0, 2);
}

function rotateByDay<T>(items: T[]) {
	if (items.length === 0) {
		return items;
	}

	const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
	const offset = dayIndex % items.length;

	return [...items.slice(offset), ...items.slice(0, offset)];
}

function normalizeTemporaryQuery(query: string) {
	return query.trim().replace(/\s+/g, " ").toLowerCase();
}

export function selectTemporaryExplorationQueries({
	section = "3d-motion",
	excludedQueries = [],
	targetCount = 12,
	maxPerFamily = 2,
}: {
	section?: SectionId;
	excludedQueries?: string[];
	targetCount?: number;
	maxPerFamily?: number;
} = {}) {
	const selected: string[] = [];
	const excluded = new Set(excludedQueries.map(normalizeTemporaryQuery));
	const familyCounts = new Map<TemporaryExplorationQueryFamily, number>();
	const rotatedQueries = rotateByDay(
		TEMPORARY_EXPLORATION_QUERIES_BY_SECTION[section],
	);

	for (const item of rotatedQueries) {
		if (excluded.has(normalizeTemporaryQuery(item.query))) {
			continue;
		}

		const currentFamilyCount = familyCounts.get(item.family) ?? 0;

		if (currentFamilyCount >= maxPerFamily) {
			continue;
		}

		selected.push(item.query);
		familyCounts.set(item.family, currentFamilyCount + 1);

		if (selected.length >= targetCount) {
			break;
		}
	}

	if (selected.length >= targetCount) {
		return selected;
	}

	for (const item of rotatedQueries) {
		if (
			selected.includes(item.query) ||
			excluded.has(normalizeTemporaryQuery(item.query))
		) {
			continue;
		}

		selected.push(item.query);

		if (selected.length >= targetCount) {
			break;
		}
	}

	return selected;
}

function getConfidence({
	latestRun,
	recentRuns,
}: {
	latestRun: DiscoveryPlanningRun | null;
	recentRuns: DiscoveryPlanningRun[];
}): DiscoveryPlanConfidence {
	if (!latestRun || latestRun.totalCandidates <= 0) {
		return "low";
	}

	if (latestRun.totalCandidates >= 100) {
		return "high";
	}

	const runsWithCandidates = recentRuns.filter(
		(run) => run.totalCandidates >= 25,
	);

	if (runsWithCandidates.length >= 2) {
		return "medium";
	}

	return "low";
}

export function toBasisPoints(rate: number) {
	return Math.round(rate * 10_000);
}

export function createDiscoveryPlan({
	section,
	config,
	recentRuns,
	remainingSearchRequests,
}: {
	section: SectionId;
	config: DiscoveryConfig;
	recentRuns: DiscoveryPlanningRun[];
	remainingSearchRequests: number | null;
}): DiscoveryPlan {
	const latestRun = recentRuns[0] ?? null;
	const recentHysteresisRuns = recentRuns.slice(0, 5);

	const saturationRate = latestRun ? getRunSaturationRate(latestRun) : 0;
	const newRate = latestRun ? getRunNewRate(latestRun) : 0;
	const failureRate = latestRun
		? safeRate(latestRun.totalFailed, latestRun.totalCandidates)
		: 0;

	const confidence = getConfidence({
		latestRun,
		recentRuns,
	});

	const isLowBudget =
		remainingSearchRequests === null ||
		remainingSearchRequests <= config.minSearchRemaining + 2;
	const isRateLimited = latestRun?.rateLimitHit === true;
	const isHighFailure = failureRate >= 0.1;
	const isSaturated =
		(latestRun !== null && isSaturatedRun(latestRun)) || saturationRate >= 0.85;
	const recentNormalRunSaturated = recentHysteresisRuns.some((run) =>
		isSaturatedNormalRun(run, section),
	);
	const healthyRecentRunCount = recentHysteresisRuns.filter(
		isHealthyPerformanceRun,
	).length;
	const hasStableHealthyPerformance = healthyRecentRunCount >= 3;
	const shouldHoldExplorationUntilStable =
		latestRun !== null && !hasStableHealthyPerformance;

	const createExplorationPlan = ({
		reason,
		planSummary,
		expectedEffect,
	}: {
		reason: string;
		planSummary: string;
		expectedEffect: string;
	}): DiscoveryPlan => {
		const explorationQueries = selectTemporaryExplorationQueries({ section });

		return {
			mode: "exploration",
			diagnosis: "saturated",
			confidence,
			reason,
			planSummary,
			expectedEffect,
			saturationRate,
			newRate,
			failureRate,
			querySelection: "least-used",
			perPage: config.perPage,
			maxVariantsPerRun: config.maxVariantsPerRun,
			pages: uniqueSortedNumbers([...config.pages, 3, 4]),
			pushedWithinDays: uniqueSortedNumbers([
				...config.pushedWithinDays,
				90,
				180,
			]),
			createdWithinDays: uniqueSortedNumbers([
				...config.createdWithinDays,
				180,
				365,
			]),
			starRanges: dedupeStarRanges([
				...config.starRanges,
				...EXPLORATION_STAR_RANGES,
			]),
			suggestedQueries: explorationQueries,
			temporaryQueries: explorationQueries,
		};
	};

	if (isLowBudget || isRateLimited || isHighFailure) {
		const diagnosis: DiscoveryPlanDiagnosis = isRateLimited
			? "rate-limited"
			: isHighFailure
				? "high-failure"
				: "low-budget";

		return {
			mode: "recovery",
			diagnosis,
			confidence,
			reason: isRateLimited
				? "Recent discovery hit the GitHub search rate limit."
				: isHighFailure
					? "Recent discovery has a high failure rate."
					: "GitHub search requests are near the configured reserve.",
			planSummary: "Recovery mode will spend a smaller budget conservatively.",
			expectedEffect:
				"Discovery will avoid deeper exploration until rate limit or failure pressure drops.",
			saturationRate,
			newRate,
			failureRate,
			querySelection: "priority",
			perPage: Math.min(config.perPage, 50),
			maxVariantsPerRun: Math.max(1, Math.min(config.maxVariantsPerRun, 3)),
			pages: [1],
			pushedWithinDays: getConservativeWindows(config.pushedWithinDays),
			createdWithinDays: getConservativeWindows(config.createdWithinDays),
			starRanges: config.starRanges,
			suggestedQueries: [],
			temporaryQueries: [],
		};
	}

	if (recentNormalRunSaturated) {
		return createExplorationPlan({
			reason:
				section === "agent-skills"
					? "Recent normal agent-skills run returned no new skills; staying in exploration."
					: "Recent normal mode run was saturated; staying in exploration.",
			planSummary:
				"Exploration hysteresis will keep least-used queries and wider search windows until the saturated normal run ages out of recent history.",
			expectedEffect:
				"Discovery should avoid bouncing back to the saturated normal strategy after only a few successful exploration runs.",
		});
	}

	if (isSaturated) {
		return createExplorationPlan({
			reason:
				"Recent discovery is saturated: candidates are high, but new repositories are low.",
			planSummary:
				"Exploration mode will search less-used queries, deeper pages, and wider date/star ranges.",
			expectedEffect:
				"Discovery will spend the same budget outside the repeatedly saturated search area.",
		});
	}

	if (shouldHoldExplorationUntilStable) {
		return createExplorationPlan({
			reason:
				"Recent discovery has not shown three healthy runs yet; staying in exploration.",
			planSummary:
				"Exploration hysteresis will keep least-used queries and wider search windows until performance is stable.",
			expectedEffect:
				"Discovery should only return to normal mode after recent runs have a strong new-repository rate and lower saturation.",
		});
	}

	return {
		mode: "normal",
		diagnosis: "healthy",
		confidence,
		reason: latestRun
			? "Recent discovery is not saturated or rate limited."
			: "No recent discovery runs are available yet.",
		planSummary: "Normal mode will use balanced query selection.",
		expectedEffect:
			"Discovery will keep using configured pages, date windows, and star ranges.",
		saturationRate,
		newRate,
		failureRate,
		querySelection: "balanced",
		perPage: config.perPage,
		maxVariantsPerRun: config.maxVariantsPerRun,
		pages: config.pages,
		pushedWithinDays: config.pushedWithinDays,
		createdWithinDays: config.createdWithinDays,
		starRanges: config.starRanges,
		suggestedQueries: [],
		temporaryQueries: [],
	};
}

export function applyDiscoveryPlanToConfig(
	config: DiscoveryConfig,
	plan: DiscoveryPlan,
): DiscoveryConfig {
	return {
		...config,
		perPage: plan.perPage,
		maxVariantsPerRun: plan.maxVariantsPerRun,
		pages: plan.pages,
		pushedWithinDays: plan.pushedWithinDays,
		createdWithinDays: plan.createdWithinDays,
		starRanges: plan.starRanges,
	};
}
