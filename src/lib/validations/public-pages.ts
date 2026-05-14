import { z } from "zod";

/**
 * Public sort schema.
 * Valid sort options for public pages.
 */
export const publicSortSchema = z
	.enum(["stars", "recent", "name"])
	.default("stars")
	.catch("stars");

/**
 * Pagination input schema.
 */
export const paginationInputSchema = z.object({
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(48).default(24),
});

/**
 * Skills search schema.
 * Validates search parameters for skills page.
 */
export const skillsSearchSchema = z.object({
	q: z.string().trim().max(120).default("").catch(""),
	category: z.string().default("all").catch("all"),
	sort: publicSortSchema,
	page: z.number().int().min(1).default(1).catch(1),
	pageSize: z.number().int().min(1).max(48).default(24).catch(24),
});

/**
 * Category route params schema.
 */
export const categoryRouteParamsSchema = z.object({
	categorySlug: z
		.string()
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid category slug"),
	subcategorySlug: z
		.string()
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid subcategory slug")
		.optional(),
});

/**
 * Subcategory route params schema.
 */
export const subcategoryRouteParamsSchema = z.object({
	categorySlug: z
		.string()
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid category slug"),
	subcategorySlug: z
		.string()
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid subcategory slug"),
});

export type PublicSort = z.infer<typeof publicSortSchema>;
export type PaginationInput = z.infer<typeof paginationInputSchema>;
export type SkillsSearch = z.infer<typeof skillsSearchSchema>;
export type CategoryRouteParams = z.infer<typeof categoryRouteParamsSchema>;
export type SubcategoryRouteParams = z.infer<
	typeof subcategoryRouteParamsSchema
>;
