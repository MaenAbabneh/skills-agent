import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { RepoSectionSchema } from "@/lib/validations/repos";
import { discoverNewReposForSectionService } from "@/server/repos/discovery/discovery.service";

const DiscoverReposInputSchema = z.object({
	section: RepoSectionSchema,
	perPage: z.number().min(5).max(50).optional(),
});

export const discoverNewReposForSection = createServerFn({
	method: "POST",
})
	.inputValidator(DiscoverReposInputSchema)
	.handler(async ({ data }) => {
		return discoverNewReposForSectionService({
			section: data.section,
			perPage: data.perPage,
		});
	});
