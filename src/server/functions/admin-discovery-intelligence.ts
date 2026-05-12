import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getAdminDiscoveryIntelligence } from "@/server/admin/admin-discovery-intelligence.query";
import { SECTION_IDS } from "@/server/sections/sections.config";

const GetAdminDiscoveryIntelligenceInputSchema = z.object({
	section: z.enum(SECTION_IDS),
});

export const getAdminDiscoveryIntelligenceAction = createServerFn({
	method: "GET",
})
	.inputValidator(GetAdminDiscoveryIntelligenceInputSchema)
	.handler(async ({ data }) => {
		return getAdminDiscoveryIntelligence({
			section: data.section,
			limit: 5,
		});
	});
