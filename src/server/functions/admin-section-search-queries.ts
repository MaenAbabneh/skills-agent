import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
	createSectionSearchQuery,
	deleteSectionSearchQuery,
	getAdminSectionSearchQueries,
	promoteTemporarySearchQuery,
	updateSectionSearchQuery,
} from "@/server/admin/admin-section-search-queries.query";
import { getGroupedTemporaryDiscoveries } from "@/server/admin/admin-section-search-query-runs.query";
import { SECTION_IDS } from "@/server/sections/sections.config";

const SectionSearchQueryTypeSchema = z.enum([
	"seed",
	"exploratory",
	"ai_suggested",
	"admin_added",
]);

const GetSectionSearchQueriesInputSchema = z.object({
	section: z.enum(SECTION_IDS),
});

const CreateSectionSearchQueryInputSchema = z.object({
	section: z.enum(SECTION_IDS),
	query: z.string().min(2).max(200),
	type: SectionSearchQueryTypeSchema.default("admin_added"),
	priority: z.number().int().min(1).max(100).default(10),
	enabled: z.boolean().default(true),
});

const UpdateSectionSearchQueryInputSchema = z.object({
	id: z.string().uuid(),
	section: z.enum(SECTION_IDS).optional(),

	query: z.string().min(2).max(200).optional(),
	type: SectionSearchQueryTypeSchema.optional(),
	priority: z.number().int().min(1).max(100).optional(),
	enabled: z.boolean().optional(),
});

const DeleteSectionSearchQueryInputSchema = z.object({
	id: z.string().uuid(),
	section: z.enum(SECTION_IDS).optional(),
});

const GetTemporaryDiscoveriesInputSchema = z.object({
	section: z.enum(SECTION_IDS),
	limit: z.number().int().min(1).max(50).default(20),
});

const PromoteTemporarySearchQueryInputSchema = z.object({
	section: z.enum(SECTION_IDS),
	query: z.string().min(2).max(200),
});

export const getAdminSectionSearchQueriesAction = createServerFn({
	method: "GET",
})
	.inputValidator(GetSectionSearchQueriesInputSchema)
	.handler(async ({ data }) => {
		return getAdminSectionSearchQueries(data.section);
	});

export const createSectionSearchQueryAction = createServerFn({
	method: "POST",
})
	.inputValidator(CreateSectionSearchQueryInputSchema)
	.handler(async ({ data }) => {
		return createSectionSearchQuery({
			section: data.section,
			query: data.query,
			type: data.type,
			priority: data.priority,
			enabled: data.enabled,
		});
	});

export const updateSectionSearchQueryAction = createServerFn({
	method: "POST",
})
	.inputValidator(UpdateSectionSearchQueryInputSchema)
	.handler(async ({ data }) => {
		return updateSectionSearchQuery({
			id: data.id,
			section: data.section,
			query: data.query,
			type: data.type,
			priority: data.priority,
			enabled: data.enabled,
		});
	});

export const deleteSectionSearchQueryAction = createServerFn({
	method: "POST",
})
	.inputValidator(DeleteSectionSearchQueryInputSchema)
	.handler(async ({ data }) => {
		return deleteSectionSearchQuery(data.id, data.section);
	});

export const getTemporaryDiscoveriesAction = createServerFn({
	method: "GET",
})
	.inputValidator(GetTemporaryDiscoveriesInputSchema)
	.handler(async ({ data }) => {
		return getGroupedTemporaryDiscoveries({
			section: data.section,
			limit: data.limit,
		});
	});

export const promoteTemporarySearchQueryAction = createServerFn({
	method: "POST",
})
	.inputValidator(PromoteTemporarySearchQueryInputSchema)
	.handler(async ({ data }) => {
		return promoteTemporarySearchQuery({
			section: data.section,
			query: data.query,
		});
	});
