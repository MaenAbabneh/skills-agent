import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { sectionDiscoverySettings } from "@/server/db/schema";
import {
	SECTION_CONFIGS,
	SECTION_IDS,
	type SectionId,
} from "@/server/sections/sections.config";

export type DiscoveryStarRange = {
	min: number;
	max?: number;
};

export type SectionDiscoverySettingsValues = {
	section: SectionId;

	enabled: boolean;
	autoTuneQueriesEnabled: boolean;

	perPage: number;
	maxVariantsPerRun: number;
	minSearchRemaining: number;
	maxCandidateMultiplier: number;

	pages: number[];
	pushedWithinDays: number[];
	createdWithinDays: number[];
	starRanges: DiscoveryStarRange[];
};

export type UpdateSectionDiscoverySettingsInput = {
	section: SectionId;

	enabled: boolean;
	autoTuneQueriesEnabled: boolean;

	perPage: number;
	maxVariantsPerRun: number;
	minSearchRemaining: number;
	maxCandidateMultiplier: number;

	pages: number[];
	pushedWithinDays: number[];
	createdWithinDays: number[];
	starRanges: DiscoveryStarRange[];
};

const DEFAULT_SECTION_DISCOVERY_SETTINGS: SectionDiscoverySettingsValues = {
	section: "3d-motion",

	enabled: true,
	autoTuneQueriesEnabled: false,

	perPage: 20,
	maxVariantsPerRun: 12,
	minSearchRemaining: 3,
	maxCandidateMultiplier: 3,

	pages: [1, 2],
	pushedWithinDays: [7, 30],
	createdWithinDays: [30, 90],
	starRanges: [
		{ min: 1, max: 20 },
		{ min: 20, max: 100 },
		{ min: 100, max: 500 },
	],
};

const AGENT_SKILLS_SECTION_DISCOVERY_SETTINGS: SectionDiscoverySettingsValues =
	{
		...DEFAULT_SECTION_DISCOVERY_SETTINGS,
		section: "agent-skills",
		perPage: 100,
		maxVariantsPerRun: 8,
	};

const DEFAULT_SECTION_DISCOVERY_SETTINGS_BY_SECTION: Record<
	SectionId,
	SectionDiscoverySettingsValues
> = {
	"3d-motion": DEFAULT_SECTION_DISCOVERY_SETTINGS,
	"agent-skills": AGENT_SKILLS_SECTION_DISCOVERY_SETTINGS,
};

function getDefaultSectionDiscoverySettings(section: SectionId) {
	return DEFAULT_SECTION_DISCOVERY_SETTINGS_BY_SECTION[section];
}

function normalizeNumberArray(value: unknown, fallback: number[]) {
	if (!Array.isArray(value)) {
		return fallback;
	}

	const numbers = value
		.map((item) => Number(item))
		.filter((item) => Number.isFinite(item) && item > 0);

	return numbers.length > 0 ? numbers : fallback;
}

function normalizeStarRanges(
	value: unknown,
	fallback: DiscoveryStarRange[],
): DiscoveryStarRange[] {
	if (!Array.isArray(value)) {
		return fallback;
	}

	const ranges: DiscoveryStarRange[] = [];

	for (const item of value) {
		if (!item || typeof item !== "object") {
			continue;
		}

		const raw = item as {
			min?: unknown;
			max?: unknown;
		};

		const min = Number(raw.min);

		if (!Number.isFinite(min) || min < 0) {
			continue;
		}

		if (raw.max === undefined || raw.max === null || raw.max === "") {
			ranges.push({ min });
			continue;
		}

		const max = Number(raw.max);

		if (!Number.isFinite(max) || max <= min) {
			continue;
		}

		ranges.push({ min, max });
	}

	return ranges.length > 0 ? ranges : fallback;
}

function mapSettingsRow(
	row: typeof sectionDiscoverySettings.$inferSelect,
): SectionDiscoverySettingsValues {
	const section = row.section as SectionId;
	const defaults = getDefaultSectionDiscoverySettings(section);

	return {
		section,

		enabled: row.enabled,
		autoTuneQueriesEnabled: row.autoTuneQueriesEnabled,

		perPage: row.perPage,
		maxVariantsPerRun: row.maxVariantsPerRun,
		minSearchRemaining: row.minSearchRemaining,
		maxCandidateMultiplier: row.maxCandidateMultiplier,

		pages: normalizeNumberArray(row.pages, defaults.pages),

		pushedWithinDays: normalizeNumberArray(
			row.pushedWithinDays,
			defaults.pushedWithinDays,
		),

		createdWithinDays: normalizeNumberArray(
			row.createdWithinDays,
			defaults.createdWithinDays,
		),

		starRanges: normalizeStarRanges(row.starRanges, defaults.starRanges),
	};
}

export async function getSectionDiscoverySettings(section: SectionId) {
	const rows = await db
		.select()
		.from(sectionDiscoverySettings)
		.where(eq(sectionDiscoverySettings.section, section))
		.limit(1);

	const row = rows[0];

	if (!row) {
		return null;
	}

	return mapSettingsRow(row);
}

export async function getOrCreateSectionDiscoverySettings(section: SectionId) {
	const existing = await getSectionDiscoverySettings(section);

	if (existing) {
		return existing;
	}

	const defaults = {
		...getDefaultSectionDiscoverySettings(section),
		section,
	};

	const rows = await db
		.insert(sectionDiscoverySettings)
		.values({
			section: defaults.section,

			enabled: defaults.enabled,
			autoTuneQueriesEnabled: defaults.autoTuneQueriesEnabled,

			perPage: defaults.perPage,
			maxVariantsPerRun: defaults.maxVariantsPerRun,
			minSearchRemaining: defaults.minSearchRemaining,
			maxCandidateMultiplier: defaults.maxCandidateMultiplier,

			pages: defaults.pages,
			pushedWithinDays: defaults.pushedWithinDays,
			createdWithinDays: defaults.createdWithinDays,
			starRanges: defaults.starRanges,
		})
		.onConflictDoNothing({
			target: sectionDiscoverySettings.section,
		})
		.returning();

	const created = rows[0];

	if (created) {
		return mapSettingsRow(created);
	}

	const fallback = await getSectionDiscoverySettings(section);

	if (!fallback) {
		throw new Error(`Failed to create discovery settings for ${section}.`);
	}

	return fallback;
}

export async function getAdminDiscoverySettings() {
	const settings = await Promise.all(
		SECTION_IDS.map((section) => getOrCreateSectionDiscoverySettings(section)),
	);

	return {
		sections: settings,
		sectionConfigs: SECTION_CONFIGS,
	};
}

export async function updateSectionDiscoverySettings({
	section,

	enabled,
	autoTuneQueriesEnabled,

	perPage,
	maxVariantsPerRun,
	minSearchRemaining,
	maxCandidateMultiplier,

	pages,
	pushedWithinDays,
	createdWithinDays,
	starRanges,
}: UpdateSectionDiscoverySettingsInput) {
	const rows = await db
		.insert(sectionDiscoverySettings)
		.values({
			section,

			enabled,
			autoTuneQueriesEnabled,

			perPage,
			maxVariantsPerRun,
			minSearchRemaining,
			maxCandidateMultiplier,

			pages,
			pushedWithinDays,
			createdWithinDays,
			starRanges,

			updatedAt: new Date(),
		})
		.onConflictDoUpdate({
			target: sectionDiscoverySettings.section,
			set: {
				enabled,
				autoTuneQueriesEnabled,

				perPage,
				maxVariantsPerRun,
				minSearchRemaining,
				maxCandidateMultiplier,

				pages,
				pushedWithinDays,
				createdWithinDays,
				starRanges,

				updatedAt: new Date(),
			},
		})
		.returning();

	const updated = rows[0];

	if (!updated) {
		throw new Error(`Failed to update discovery settings for ${section}.`);
	}

	return mapSettingsRow(updated);
}
