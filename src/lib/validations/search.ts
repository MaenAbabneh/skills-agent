import { z } from "zod";

export const skillsSearchSchema = z.object({
	q: z.string().default("").catch(""),
	category: z.string().default("all").catch("all"),
	sort: z
		.enum(["newest", "oldest", "upvotes-desc", "likes-desc"])
		.default("newest")
		.catch("newest"),
});

export type SkillsSearch = z.infer<typeof skillsSearchSchema>;
export type SkillsSort = SkillsSearch["sort"];
