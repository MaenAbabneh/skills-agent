import { getSectionDiscoverySettings } from "@/server/admin/admin-discovery-settings.query";
import type { DiscoveryConfig, SectionStrategy } from "@/server/sections/types";

export const DEFAULT_DISCOVERY_CONFIG: DiscoveryConfig = {
	enabled: true,

	perPage: 20,

	maxCandidateMultiplier: 3,

	maxVariantsPerRun: 12,

	minSearchRemaining: 3,

	sortModes: ["updated", "stars"],

	pushedWithinDays: [7, 30],

	createdWithinDays: [30, 90],

	starRanges: [
		{ min: 1, max: 20 },
		{ min: 20, max: 100 },
		{ min: 100, max: 500 },
	],

	pages: [1, 2],

	enableRelaxedFallback: true,
};

export function resolveDiscoveryConfig(
	config?: Partial<DiscoveryConfig>,
): DiscoveryConfig {
	return {
		...DEFAULT_DISCOVERY_CONFIG,
		...config,

		sortModes: config?.sortModes ?? DEFAULT_DISCOVERY_CONFIG.sortModes,

		pushedWithinDays:
			config?.pushedWithinDays ?? DEFAULT_DISCOVERY_CONFIG.pushedWithinDays,

		createdWithinDays:
			config?.createdWithinDays ?? DEFAULT_DISCOVERY_CONFIG.createdWithinDays,

		starRanges: config?.starRanges ?? DEFAULT_DISCOVERY_CONFIG.starRanges,

		pages: config?.pages ?? DEFAULT_DISCOVERY_CONFIG.pages,
	};
}

export async function resolveSectionDiscoveryConfig(
	strategy: SectionStrategy,
): Promise<DiscoveryConfig> {
	const baseConfig = resolveDiscoveryConfig(strategy.discoveryConfig);

	const dbSettings = await getSectionDiscoverySettings(strategy.id);

	if (!dbSettings) {
		return baseConfig;
	}

	return {
		...baseConfig,

		enabled: dbSettings.enabled,

		perPage: dbSettings.perPage,

		maxCandidateMultiplier: dbSettings.maxCandidateMultiplier,

		maxVariantsPerRun: dbSettings.maxVariantsPerRun,

		minSearchRemaining: dbSettings.minSearchRemaining,

		pushedWithinDays: dbSettings.pushedWithinDays,

		createdWithinDays: dbSettings.createdWithinDays,

		starRanges: dbSettings.starRanges,

		pages: dbSettings.pages,
	};
}
