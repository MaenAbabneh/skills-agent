import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
	getAdminDiscoverySettings,
	updateSectionDiscoverySettings,
} from "@/server/admin/admin-discovery-settings.query";
import { SECTION_IDS } from "@/server/sections/sections.config";

const DiscoveryStarRangeSchema = z.object({
	min: z.number().min(0),
	max: z.number().min(0).optional(),
});

const UpdateSectionDiscoverySettingsInputSchema = z.object({
	section: z.enum(SECTION_IDS),

	enabled: z.boolean(),
	autoTuneQueriesEnabled: z.boolean(),

	perPage: z.number().int().min(1).max(100),

	maxVariantsPerRun: z.number().int().min(1).max(30),

	minSearchRemaining: z.number().int().min(0).max(30),

	maxCandidateMultiplier: z.number().int().min(1).max(20),

	pages: z.array(z.number().int().min(1).max(10)).min(1).max(10),

	pushedWithinDays: z.array(z.number().int().min(1).max(365)).min(1).max(10),

	createdWithinDays: z.array(z.number().int().min(1).max(365)).min(1).max(10),

	starRanges: z.array(DiscoveryStarRangeSchema).min(1).max(20),
});

export const getAdminDiscoverySettingsAction = createServerFn({
	method: "GET",
}).handler(async () => {
	return getAdminDiscoverySettings();
});

export const updateSectionDiscoverySettingsAction = createServerFn({
	method: "POST",
})
	.inputValidator(UpdateSectionDiscoverySettingsInputSchema)
	.handler(async ({ data }) => {
		return updateSectionDiscoverySettings({
			section: data.section,

			enabled: data.enabled,
			autoTuneQueriesEnabled: data.autoTuneQueriesEnabled,

			perPage: data.perPage,
			maxVariantsPerRun: data.maxVariantsPerRun,
			minSearchRemaining: data.minSearchRemaining,
			maxCandidateMultiplier: data.maxCandidateMultiplier,

			pages: data.pages,
			pushedWithinDays: data.pushedWithinDays,
			createdWithinDays: data.createdWithinDays,
			starRanges: data.starRanges,
		});
	});
