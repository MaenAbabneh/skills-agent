import { z } from "zod";

/**
 * Save agent skill schema.
 */
export const saveAgentSkillSchema = z.object({
	agentSkillFileId: z.string().uuid(),
});

/**
 * Unsave agent skill schema.
 */
export const unsaveAgentSkillSchema = z.object({
	agentSkillFileId: z.string().uuid(),
});

/**
 * Save repo schema.
 */
export const saveRepoSchema = z.object({
	repoSectionId: z.string().uuid(),
});

/**
 * Unsave repo schema.
 */
export const unsaveRepoSchema = z.object({
	repoSectionId: z.string().uuid(),
});

export type SaveAgentSkill = z.infer<typeof saveAgentSkillSchema>;
export type UnsaveAgentSkill = z.infer<typeof unsaveAgentSkillSchema>;
export type SaveRepo = z.infer<typeof saveRepoSchema>;
export type UnsaveRepo = z.infer<typeof unsaveRepoSchema>;
