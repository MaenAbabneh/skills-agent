import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { RepoSectionSchema } from "@/lib/validations/repos";
import {
	getAdminReposQuery,
	updateRepoSectionStatus,
} from "@/server/admin/admin-repos.query";
import { SECTION_IDS } from "@/server/sections/sections.config";

const AdminRepoStatusSchema = z.enum([
	"pending",
	"approved",
	"rejected",
	"hidden",
	"all",
]);

const AdminRepoAlgorithmSchema = z.enum(["all", "accepted", "rejected"]);

const GetAdminReposInputSchema = z.object({
	section: RepoSectionSchema,
	status: AdminRepoStatusSchema.default("pending"),
	algorithm: AdminRepoAlgorithmSchema.default("all"),
	query: z.string().default(""),
	limit: z.number().min(1).max(200).default(24),
	offset: z.number().min(0).default(0),
});

const RepoSectionActionInputSchema = z.object({
	section: z.enum(SECTION_IDS),
	repoSectionId: z.string().min(1),
});

export const getAdminRepos = createServerFn({
	method: "GET",
})
	.inputValidator(GetAdminReposInputSchema)
	.handler(async ({ data }) => {
		return getAdminReposQuery({
			section: data.section,
			status: data.status,
			algorithm: data.algorithm,
			query: data.query,
			limit: data.limit,
			offset: data.offset,
		});
	});

export const approveRepoSection = createServerFn({
	method: "POST",
})
	.inputValidator(RepoSectionActionInputSchema)
	.handler(async ({ data }) => {
		return updateRepoSectionStatus({
			section: data.section,
			repoSectionId: data.repoSectionId,
			status: "approved",
		});
	});

export const rejectRepoSection = createServerFn({
	method: "POST",
})
	.inputValidator(RepoSectionActionInputSchema)
	.handler(async ({ data }) => {
		return updateRepoSectionStatus({
			section: data.section,
			repoSectionId: data.repoSectionId,
			status: "rejected",
		});
	});

export const hideRepoSection = createServerFn({
	method: "POST",
})
	.inputValidator(RepoSectionActionInputSchema)
	.handler(async ({ data }) => {
		return updateRepoSectionStatus({
			section: data.section,
			repoSectionId: data.repoSectionId,
			status: "hidden",
		});
	});
