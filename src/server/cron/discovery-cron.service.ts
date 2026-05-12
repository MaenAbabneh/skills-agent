import { getOrCreateSectionDiscoverySettings } from "@/server/admin/admin-discovery-settings.query";
import { autoTuneSectionSearchQueries } from "@/server/admin/admin-section-search-queries.query";
import { discoverNewReposForSectionService } from "@/server/repos/discovery/discovery.service";
import type { SectionId } from "@/server/sections/sections.config";

function shouldPreventAutoTuneBoosts(result: unknown) {
	if (!result || typeof result !== "object" || !("discoveryPlan" in result)) {
		return false;
	}

	const discoveryPlan = result.discoveryPlan;

	if (!discoveryPlan || typeof discoveryPlan !== "object") {
		return false;
	}

	return (
		"diagnosis" in discoveryPlan && discoveryPlan.diagnosis === "saturated"
	);
}

export async function runDiscoveryCron(section: SectionId = "3d-motion") {
	const settings = await getOrCreateSectionDiscoverySettings(section);

	if (!settings.enabled) {
		return {
			section,
			skipped: true,
			reason: "Discovery is disabled for this section.",
		};
	}

	const result = await discoverNewReposForSectionService({
		section,
	});

	const queryAutoTune = settings.autoTuneQueriesEnabled
		? {
				enabled: true,
				...(await autoTuneSectionSearchQueries(section, {
					totalNew: result.totalNew,
					totalCandidates: result.totalCandidates,
					totalExistingInSection: result.totalExistingInSection,
					preventBoosts: shouldPreventAutoTuneBoosts(result),
				})),
			}
		: {
				enabled: false,
				totalQueries: 0,
				changed: 0,
				decisions: [],
			};

	return {
		section,
		skipped: false,
		result,
		queryAutoTune,
	};
}
