import { z } from "zod";
import { SECTION_IDS } from "@/lib/sections";

export const RepoSectionSchema = z.enum(SECTION_IDS);

export const RepoTypeSchema = z.enum([
	// 3D / interactive projects
	"portfolio",
	"showcase",
	"interactive-experience",
	"visualization",
	"creative-coding",
	"starter",
	"learning",
	"game",

	// Agent skills
	"agent-skill",
	"mcp-server",
	"prompt-pack",
	"workflow",
	"agent-tool",
	"workflow-agent",
	"browser-agent",
	"coding-agent",
	"agent-framework",
	"automation-tool",
	"llm-tool",

	// Generic / excluded
	"ui-resource",
	"library",
	"tool",
	"unknown",
]);

export const RepoSectionStatusSchema = z.enum([
	"approved",
	"pending",
	"rejected",
	"hidden",
]);

export const ClassificationSignalSchema = z.object({
	type: RepoTypeSchema,
	source: z.enum(["topic", "name", "description", "text", "system"]),
	keyword: z.string(),
	points: z.number(),
});

export const TypeScoresSchema = z.record(RepoTypeSchema, z.number());

export const ScoreBreakdownSchema = z.object({
	relevance: z.number(),
	usefulness: z.number(),
	popularity: z.number(),
	momentum: z.number(),
	maintenance: z.number(),
	completeness: z.number(),

	demoMultiplier: z.number(),
	healthMultiplier: z.number(),

	baseTotal: z.number(),
	total: z.number(),
});

export const ProcessedRepoSchema = z.object({
	id: z.number(),

	name: z.string(),
	fullName: z.string(),
	owner: z.string(),

	description: z.string(),
	url: z.string().url(),
	homepage: z.string().nullable(),

	stars: z.number(),
	forks: z.number(),
	openIssues: z.number(),

	language: z.string().nullable(),
	topics: z.array(z.string()),
	avatarUrl: z.string().url(),

	archived: z.boolean(),
	fork: z.boolean(),

	createdAt: z.string(),
	updatedAt: z.string(),
	pushedAt: z.string(),

	section: RepoSectionSchema,
	repoType: RepoTypeSchema,

	classificationConfidence: z.number().min(0).max(1),
	matchedSignals: z.array(ClassificationSignalSchema),
	typeScores: TypeScoresSchema,

	score: z.number().min(0).max(100),
	scoreBreakdown: ScoreBreakdownSchema,

	rejectionReasons: z.array(z.string()),
	isAccepted: z.boolean(),
});

export const GetReposBySectionInputSchema = z.object({
	section: RepoSectionSchema,
	limit: z.number().min(1).max(30).default(10),
	includeRejected: z.boolean().default(false),
});

export const GetReposBySectionResultSchema = z.object({
	section: RepoSectionSchema,
	label: z.string(),
	description: z.string(),

	totalFetched: z.number(),
	totalUnique: z.number(),
	totalReturned: z.number(),

	repos: z.array(ProcessedRepoSchema),
});

export type RepoSection = z.infer<typeof RepoSectionSchema>;
export type RepoType = z.infer<typeof RepoTypeSchema>;
export type RepoSectionStatus = z.infer<typeof RepoSectionStatusSchema>;

export type ClassificationSignal = z.infer<typeof ClassificationSignalSchema>;

export type TypeScores = z.infer<typeof TypeScoresSchema>;

export type ScoreBreakdown = z.infer<typeof ScoreBreakdownSchema>;
export type ProcessedRepo = z.infer<typeof ProcessedRepoSchema>;

export type GetReposBySectionInput = z.infer<
	typeof GetReposBySectionInputSchema
>;

export type GetReposBySectionResult = z.infer<
	typeof GetReposBySectionResultSchema
>;
