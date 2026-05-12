import { createServerFn } from "@tanstack/react-start";
import { GetReposBySectionInputSchema } from "@/lib/validations/repos";
import { syncSectionRepos } from "@/server/repos/repo.sync";

export const syncSection = createServerFn({ method: "POST" })
	.inputValidator(GetReposBySectionInputSchema)
	.handler(async ({ data }) => {
		return syncSectionRepos({
			section: data.section,
		});
	});
