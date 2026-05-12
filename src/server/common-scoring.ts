import type { GitHubRepo } from "@/lib/validations/github";

export function clamp(value: number, min = 0, max = 100) {
	return Math.max(min, Math.min(value, max));
}

export function roundScore(value: number) {
	return Math.round(clamp(value));
}

export function getMonthsOld(dateString: string) {
	const date = new Date(dateString);

	if (Number.isNaN(date.getTime())) {
		return Number.POSITIVE_INFINITY;
	}

	return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 30);
}

export function getRepoAgeInYears(createdAt: string) {
	const created = new Date(createdAt).getTime();

	if (Number.isNaN(created)) {
		return 1;
	}

	const ageMs = Date.now() - created;
	const years = ageMs / (1000 * 60 * 60 * 24 * 365);

	// Prevent very new repos from getting unrealistic stars/year values.
	return Math.max(years, 0.25);
}

/**
 * Logarithmic star scoring.
 *
 * This gives a strong jump from 10 → 100 → 1000 stars,
 * but slows down after very high star counts.
 */
export function scoreStarsLog(stars: number, maxScore = 14) {
	if (stars <= 0) return 0;

	const normalized = Math.log10(stars + 1) / Math.log10(10000 + 1);

	return Math.min(Math.round(normalized * maxScore), maxScore);
}

/**
 * Momentum / velocity score.
 *
 * 1000 stars in 1 year is more impressive than
 * 1000 stars in 8 years.
 */
export function scoreMomentum({
	stars,
	createdAt,
	maxScore = 10,
}: {
	stars: number;
	createdAt: string;
	maxScore?: number;
}) {
	const ageYears = getRepoAgeInYears(createdAt);
	const starsPerYear = stars / ageYears;

	const normalized = Math.log10(starsPerYear + 1) / Math.log10(500 + 1);

	return Math.min(Math.round(normalized * maxScore), maxScore);
}

/**
 * Health based on open issues relative to stars.
 *
 * 500 issues with 10k stars is acceptable.
 * 50 issues with 200 stars is a bad signal.
 */
export function scoreIssueHealth({
	stars,
	openIssues,
	maxScore = 10,
}: {
	stars: number;
	openIssues: number;
	maxScore?: number;
}) {
	if (stars <= 0) {
		return openIssues > 10 ? 0 : Math.round(maxScore / 2);
	}

	const ratio = openIssues / stars;

	if (ratio <= 0.01) return maxScore;
	if (ratio <= 0.03) return Math.round(maxScore * 0.8);
	if (ratio <= 0.06) return Math.round(maxScore * 0.6);
	if (ratio <= 0.1) return Math.round(maxScore * 0.4);
	if (ratio <= 0.2) return Math.round(maxScore * 0.2);

	return 0;
}

export function scoreFreshnessWeighted(pushedAt: string, maxScore = 8) {
	const monthsOld = getMonthsOld(pushedAt);

	if (monthsOld <= 1) return maxScore;
	if (monthsOld <= 3) return Math.round(maxScore * 0.85);
	if (monthsOld <= 6) return Math.round(maxScore * 0.65);
	if (monthsOld <= 12) return Math.round(maxScore * 0.45);
	if (monthsOld <= 18) return Math.round(maxScore * 0.25);

	return 0;
}

export function scoreForksLog(forks: number, maxScore = 4) {
	if (forks <= 0) return 0;

	const normalized = Math.log10(forks + 1) / Math.log10(1000 + 1);

	return Math.min(Math.round(normalized * maxScore), maxScore);
}

export function scoreDescriptionQuality(
	description: string | null,
	maxScore = 4,
) {
	if (!description) return 0;

	const length = description.trim().length;

	if (length >= 120) return maxScore;
	if (length >= 80) return Math.round(maxScore * 0.85);
	if (length >= 40) return Math.round(maxScore * 0.6);
	if (length > 0) return Math.round(maxScore * 0.35);

	return 0;
}

export function scoreTopicCompleteness(topics: string[] = [], maxScore = 2) {
	if (topics.length >= 5) return maxScore;
	if (topics.length >= 3) return Math.round(maxScore * 0.75);
	if (topics.length >= 1) return Math.round(maxScore * 0.5);

	return 0;
}

/**
 * In 3D / interactive sections, no live demo is a major weakness.
 * This should be a multiplier, not just missing points.
 */
export function getDemoMultiplier(repo: GitHubRepo) {
	return repo.homepage?.trim() ? 1 : 0.8;
}

/**
 * Health multiplier based on archived/fork/issue ratio.
 */
export function getHealthMultiplier(repo: GitHubRepo) {
	if (repo.archived) return 0;
	if (repo.fork) return 0.75;

	if (repo.stargazers_count <= 0) {
		return repo.open_issues_count > 10 ? 0.8 : 1;
	}

	const issueRatio = repo.open_issues_count / repo.stargazers_count;

	if (issueRatio > 0.2) return 0.75;
	if (issueRatio > 0.1) return 0.85;

	return 1;
}

/**
 * Ranking score is for sorting only.
 *
 * The visible score remains the quality score,
 * but ranking gets a small popularity/fork boost.
 */
export function getRankingScore({
	score,
	stars,
	forks,
}: {
	score: number;
	stars: number;
	forks: number;
}) {
	const popularityBoost = Math.log10(stars + 1) * 3;
	const forkBoost = Math.log10(forks + 1) * 1.5;

	return score + popularityBoost + forkBoost;
}
