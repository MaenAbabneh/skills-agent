import { z } from "zod";

export const RepoCommandSchema = z.object({
	clone: z.string(),
	install: z.string().optional(),
	run: z.string().optional(),
	packageManager: z
		.enum(["npm", "pnpm", "yarn", "bun", "npx", "unknown"])
		.optional(),
});

export const RepoReadmeMetadataSchema = z.object({
	path: z.string(),
	content: z.string(),
});

export const RepoSkillMetadataSchema = z.object({
	exists: z.boolean(),
	path: z.string().optional(),
	name: z.string().optional(),
	description: z.string().optional(),
	content: z.string().optional(),
});

export const DetectedAgentSkillFileSchema = z.object({
	path: z.string(),
	url: z.string().url(),
	fileName: z.string(),
	skillName: z.string(),
	confidence: z.enum(["high", "medium"]),
});

export const InteractiveProjectMetadataSchema = z.object({
	kind: z.literal("3d-motion"),

	readme: RepoReadmeMetadataSchema.optional(),

	commands: RepoCommandSchema,

	zipUrl: z.string().url(),

	liveDemoUrl: z.string().url().nullable().optional(),

	techStack: z.array(z.string()).default([]),

	projectKind: z
		.enum([
			"portfolio",
			"showcase",
			"interactive-experience",
			"visualization",
			"creative-coding",
			"starter",
			"learning",
			"game",
			"unknown",
		])
		.default("unknown"),

	previewImage: z.string().url().optional(),
});

export const AgentSkillMetadataSchema = z.object({
	kind: z.literal("agent-skills"),

	readme: RepoReadmeMetadataSchema.optional(),

	skill: RepoSkillMetadataSchema.optional(),

	commands: RepoCommandSchema,

	zipUrl: z.string().url(),

	skillFilePath: z.string().optional(),

	skillDetected: z.boolean().optional(),

	skillFileUrl: z.string().url().optional(),

	skillFileName: z.string().optional(),

	skillName: z.string().optional(),

	skillFiles: z.array(DetectedAgentSkillFileSchema).optional(),

	skillFileCount: z.number().int().min(0).optional(),

	skillTreeTruncated: z.boolean().optional(),

	skillDetectionError: z.string().optional(),

	requiredFiles: z.array(z.string()).default([]),

	runUrl: z.string().url().optional(),
});

export const RepoSectionMetadataSchema = z.discriminatedUnion("kind", [
	InteractiveProjectMetadataSchema,
	AgentSkillMetadataSchema,
]);

export type RepoCommand = z.infer<typeof RepoCommandSchema>;
export type RepoReadmeMetadata = z.infer<typeof RepoReadmeMetadataSchema>;
export type RepoSkillMetadata = z.infer<typeof RepoSkillMetadataSchema>;
export type DetectedAgentSkillFile = z.infer<
	typeof DetectedAgentSkillFileSchema
>;
export type InteractiveProjectMetadata = z.infer<
	typeof InteractiveProjectMetadataSchema
>;
export type AgentSkillMetadata = z.infer<typeof AgentSkillMetadataSchema>;
export type RepoSectionMetadata = z.infer<typeof RepoSectionMetadataSchema>;
