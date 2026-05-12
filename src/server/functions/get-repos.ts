import { createServerFn } from "@tanstack/react-start";

import { GetReposBySectionInputSchema } from "@/lib/validations/repos";
import { getReposBySectionQuery } from "@/server/repos/repo.query";

export const getReposBySection = createServerFn({
	method: "GET",
})
	.inputValidator(GetReposBySectionInputSchema)
	.handler(async ({ data }) => {
		return getReposBySectionQuery({
			section: data.section,
			limit: data.limit,
			includeRejected: data.includeRejected,
		});
	});
