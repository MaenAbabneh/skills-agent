import { z } from "zod";

import { SECTION_IDS } from "#/lib/sections";

export const STATUS_OPTIONS = [
	"pending",
	"approved",
	"rejected",
	"hidden",
	"all",
] as const;

export const ALGORITHM_OPTIONS = ["all", "accepted", "rejected"] as const;

export const PAGE_SIZE_OPTIONS = [24, 48, 96] as const;

export const AdminReposSearchSchema = z.object({
	section: z.enum(SECTION_IDS).default("3d-motion"),

	status: z
		.enum(["pending", "approved", "rejected", "hidden", "all"])
		.default("pending"),

	algorithm: z.enum(["all", "accepted", "rejected"]).default("all"),

	query: z.string().default(""),

	page: z.coerce.number().int().min(1).default(1),

	pageSize: z.coerce.number().int().min(12).max(100).default(24),
});

export type AdminReposSearch = z.infer<typeof AdminReposSearchSchema>;
