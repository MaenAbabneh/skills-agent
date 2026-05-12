import type { SectionSearchQueryRunType } from "@/server/admin/admin-section-search-query-runs.query";
import type { GitHubRepoSearchSort } from "@/server/github";
import type {
	DiscoveryConfig,
	DiscoveryStarRange,
} from "@/server/sections/types";

export type DiscoveryBaseQuery =
	| string
	| {
			id?: string;
			query: string;
			queryType?: SectionSearchQueryRunType;
	  };

export type DiscoveryQueryVariant = {
	query: string;
	sourceQuery: string;
	sourceQueryId?: string;
	sourceQueryType?: SectionSearchQueryRunType;
	sort: GitHubRepoSearchSort;
	page: number;
	reason:
		| "base"
		| "star-range"
		| "recently-pushed"
		| "recently-created"
		| "relaxed";
};

function normalizeQuery(query: string) {
	return query.replace(/\s+/g, " ").trim();
}

function normalizeBaseQuery(baseQuery: DiscoveryBaseQuery) {
	if (typeof baseQuery === "string") {
		return {
			id: undefined,
			query: normalizeQuery(baseQuery),
		};
	}

	return {
		id: baseQuery.id,
		query: normalizeQuery(baseQuery.query),
		queryType: baseQuery.queryType,
	};
}

function getDateDaysAgo(days: number) {
	const date = new Date();
	date.setDate(date.getDate() - days);

	return date.toISOString().slice(0, 10);
}

function stripStarsQualifier(query: string) {
	return query
		.replace(/\s+stars:>\d+/g, "")
		.replace(/\s+stars:>=\d+/g, "")
		.replace(/\s+stars:<\d+/g, "")
		.replace(/\s+stars:<=\d+/g, "")
		.replace(/\s+stars:\d+\.\.\d+/g, "")
		.replace(/\s+stars:\d+\.\.\*/g, "")
		.trim();
}

function stripDateQualifiers(query: string) {
	return query
		.replace(/\s+pushed:>[^\s]+/g, "")
		.replace(/\s+created:>[^\s]+/g, "")
		.trim();
}

function buildStarsQualifier(range: DiscoveryStarRange) {
	if (typeof range.max === "number") {
		return `stars:${range.min}..${range.max}`;
	}

	return `stars:>=${range.min}`;
}

function rotateByDay<T>(items: T[]) {
	if (items.length === 0) {
		return items;
	}

	const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
	const offset = dayIndex % items.length;

	return [...items.slice(offset), ...items.slice(0, offset)];
}

function dedupeVariants(variants: DiscoveryQueryVariant[]) {
	const seen = new Set<string>();
	const unique: DiscoveryQueryVariant[] = [];

	for (const variant of variants) {
		const normalizedQuery = normalizeQuery(variant.query);
		const normalizedSourceQuery = normalizeQuery(variant.sourceQuery);

		const key = [
			normalizedQuery,
			variant.sourceQueryId ?? normalizedSourceQuery,
			variant.sourceQueryType ?? "",
			variant.sort,
			variant.page,
			variant.reason,
		].join("|");

		if (seen.has(key)) {
			continue;
		}

		seen.add(key);

		unique.push({
			...variant,
			query: normalizedQuery,
			sourceQuery: normalizedSourceQuery,
		});
	}

	return unique;
}

function interleaveVariantGroups(groups: DiscoveryQueryVariant[][]) {
	const result: DiscoveryQueryVariant[] = [];
	const maxLength = Math.max(...groups.map((group) => group.length), 0);

	for (let index = 0; index < maxLength; index += 1) {
		for (const group of groups) {
			const variant = group[index];

			if (variant) {
				result.push(variant);
			}
		}
	}

	return result;
}

function buildVariantsForBaseQuery({
	baseQuery,
	config,
}: {
	baseQuery: DiscoveryBaseQuery;
	config: DiscoveryConfig;
}) {
	const normalizedBaseQuery = normalizeBaseQuery(baseQuery);

	const sourceQuery = normalizedBaseQuery.query;
	const sourceQueryId = normalizedBaseQuery.id;
	const sourceQueryType = normalizedBaseQuery.queryType;

	if (!sourceQuery) {
		return [];
	}

	const queryWithoutDates = stripDateQualifiers(sourceQuery);
	const cleanQuery = stripStarsQualifier(queryWithoutDates);

	const variants: DiscoveryQueryVariant[] = [];

	for (const sort of config.sortModes) {
		for (const page of config.pages) {
			variants.push({
				query: queryWithoutDates,
				sourceQuery,
				sourceQueryId,
				sourceQueryType,
				sort,
				page,
				reason: "base",
			});
		}
	}

	for (const starRange of config.starRanges) {
		const starsQualifier = buildStarsQualifier(starRange);

		for (const sort of config.sortModes) {
			for (const page of config.pages) {
				variants.push({
					query: `${cleanQuery} ${starsQualifier}`,
					sourceQuery,
					sourceQueryId,
					sourceQueryType,
					sort,
					page,
					reason: "star-range",
				});
			}
		}
	}

	for (const days of config.pushedWithinDays) {
		const date = getDateDaysAgo(days);

		for (const sort of config.sortModes) {
			for (const page of config.pages) {
				variants.push({
					query: `${cleanQuery} pushed:>${date}`,
					sourceQuery,
					sourceQueryId,
					sourceQueryType,
					sort,
					page,
					reason: "recently-pushed",
				});
			}
		}
	}

	for (const days of config.createdWithinDays) {
		const date = getDateDaysAgo(days);

		for (const sort of config.sortModes) {
			for (const page of config.pages) {
				variants.push({
					query: `${cleanQuery} created:>${date}`,
					sourceQuery,
					sourceQueryId,
					sourceQueryType,
					sort,
					page,
					reason: "recently-created",
				});
			}
		}
	}

	if (config.enableRelaxedFallback) {
		for (const sort of config.sortModes) {
			variants.push({
				query: cleanQuery,
				sourceQuery,
				sourceQueryId,
				sourceQueryType,
				sort,
				page: 1,
				reason: "relaxed",
			});

			variants.push({
				query: `${cleanQuery} stars:>=1`,
				sourceQuery,
				sourceQueryId,
				sourceQueryType,
				sort,
				page: 1,
				reason: "relaxed",
			});
		}
	}

	return dedupeVariants(variants);
}

export function buildDiscoveryVariants({
	baseQueries,
	config,
}: {
	baseQueries: DiscoveryBaseQuery[];
	config: DiscoveryConfig;
}) {
	const rotatedBaseQueries = rotateByDay(baseQueries);

	const variantGroups = rotatedBaseQueries
		.map((baseQuery) =>
			buildVariantsForBaseQuery({
				baseQuery,
				config,
			}),
		)
		.filter((group) => group.length > 0);

	const interleavedVariants = interleaveVariantGroups(variantGroups);

	return dedupeVariants(interleavedVariants);
}
