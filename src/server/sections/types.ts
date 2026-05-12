import type { GitHubRepo } from "@/lib/validations/github";
import type {
	ClassificationSignal,
	RepoSection,
	RepoType,
	ScoreBreakdown,
	TypeScores,
} from "@/lib/validations/repos";
import type { GitHubRepoSearchSort } from "@/server/github";

export type ClassificationResult = {
	repoType: RepoType;
	confidence: number;
	matchedSignals: ClassificationSignal[];
	typeScores: TypeScores;
};

export type SpecificRejectionParams = {
	repo: GitHubRepo;
	relevance: number;
	repoType: RepoType;
	score: number;
	classification: ClassificationResult;
};

export type DiscoveryStarRange = {
	min: number;
	max?: number;
};

export type DiscoveryConfig = {
	/**
	 * Can this section be discovered automatically?
	 */
	enabled: boolean;

	/**
	 * Default target for new repos per discovery run.
	 */

	/**
	 * GitHub results per query variant.
	 */
	perPage: number;

	/**
	 * How many candidates to collect before stopping.
	 *
	 * Example:
	 * targetNewRepos = 30
	 * maxCandidateMultiplier = 5
	 * candidate soft limit = 150
	 */
	maxCandidateMultiplier: number;

	/**
	 * Hard limit for GitHub search variants per run.
	 *
	 * This prevents one section from consuming the full GitHub search rate limit.
	 */
	maxVariantsPerRun: number;

	/**
	 * Minimum GitHub search requests to keep unused as reserve.
	 *
	 * Example:
	 * search.remaining = 30
	 * minSearchRemaining = 3
	 * usable requests = 27
	 */
	minSearchRemaining: number;

	/**
	 * GitHub repository search sort modes.
	 */
	sortModes: GitHubRepoSearchSort[];

	/**
	 * Search repos pushed within these day windows.
	 *
	 * Example: [7, 30, 90]
	 */
	pushedWithinDays: number[];

	/**
	 * Search repos created within these day windows.
	 *
	 * Example: [30, 90, 180]
	 */
	createdWithinDays: number[];

	/**
	 * Star ranges to avoid only seeing famous repos.
	 */
	starRanges: DiscoveryStarRange[];

	/**
	 * GitHub search pages to scan.
	 */
	pages: number[];

	/**
	 * Allows broader fallback variants.
	 */
	enableRelaxedFallback: boolean;
};

export type SectionStrategy = {
	id: RepoSection;

	label: string;
	description: string;

	/**
	 * Normal sync settings.
	 */
	perPage: number;
	minStars: number;
	minScore: number;

	/**
	 * High-quality queries used by normal sync.
	 */
	queries: string[];

	/**
	 * Wider query pool used by automated discovery.
	 * If missing, discovery falls back to queries.
	 */
	discoveryQueries?: string[];

	/**
	 * Section-specific discovery behavior.
	 */
	discoveryConfig?: DiscoveryConfig;

	classifyRepo: (repo: GitHubRepo) => ClassificationResult;

	calculateScore: (
		repo: GitHubRepo,
		classification: ClassificationResult,
	) => {
		score: number;
		scoreBreakdown: ScoreBreakdown;
	};

	getRejectionReasons: (params: SpecificRejectionParams) => string[];
};
