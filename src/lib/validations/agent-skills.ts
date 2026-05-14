import { z } from "zod";

/**
 * Agent skill install commands schema.
 */
export const agentSkillInstallCommandsSchema = z.object({
	recommended: z.string().optional(),
	npx: z.string().optional(),
	bunx: z.string().optional(),
	pnpm: z.string().optional(),
	global: z.string().optional(),
	specificNpx: z.string().optional(),
	specificBunx: z.string().optional(),
	specificPnpm: z.string().optional(),
	specificGlobal: z.string().optional(),
	sparseCheckout: z.string().optional(),
	singleFileCurl: z.string().optional(),
	rawFileUrl: z.string().optional(),
	skillFolderPath: z.string().optional(),
});

/**
 * Agent skill taxonomy metadata schema.
 * Stores metadata about how a skill was classified.
 */
export const agentSkillTaxonomyMetadataSchema = z.object({
	categorySlug: z.string().optional(),
	subcategorySlug: z.string().optional(),
	confidence: z.string().optional(),
	matchedKeywords: z.array(z.string()).optional(),
	classifierVersion: z.string().optional(),
});

/**
 * Parsed SKILL.md content schema.
 */
export const parsedSkillMdSchema = z.object({
	name: z.string().min(1),
	description: z.string().min(1),
	allowedTools: z.array(z.string()).optional(),
	userInvocable: z.boolean().optional(),
});

/**
 * Agent skill content schema for detail pages.
 * Includes enriched content and metadata.
 */
export const agentSkillContentSchema = z.object({
	content: z.string().optional(),
	contentPreview: z.string().optional(),
	rawFileUrl: z.string().url().optional(),
	contentSha: z.string().optional(),
	contentFetchedAt: z.date().optional(),
	skillFolderPath: z.string().optional(),
	downloadZipUrl: z.string().url().optional(),
});

/**
 * Agent skill file metadata schema.
 * Stores extraction results and classifier output.
 */
export const agentSkillFileMetadataSchema = z.object({
	extractedName: z.string().optional(),
	extractedDescription: z.string().optional(),
	extractedTools: z.array(z.string()).optional(),
	extractError: z.string().optional(),
	taxonomy: agentSkillTaxonomyMetadataSchema.optional(),
	installCommands: agentSkillInstallCommandsSchema.optional(),
});

export type AgentSkillInstallCommands = z.infer<
	typeof agentSkillInstallCommandsSchema
>;
export type AgentSkillTaxonomyMetadata = z.infer<
	typeof agentSkillTaxonomyMetadataSchema
>;
export type ParsedSkillMd = z.infer<typeof parsedSkillMdSchema>;
export type AgentSkillContent = z.infer<typeof agentSkillContentSchema>;
export type AgentSkillFileMetadata = z.infer<
	typeof agentSkillFileMetadataSchema
>;
