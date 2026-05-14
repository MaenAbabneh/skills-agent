import { z } from "zod";
import { gitHubRepoUrlSchema, gitHubSkillFileUrlSchema } from "./github";

/**
 * Create repo submission schema.
 * User submits a GitHub repo URL.
 */
export const createRepoSubmissionSchema = z.object({
	githubUrl: gitHubRepoUrlSchema,
	suggestedSection: z.enum(["3d-motion", "agent-skills"]),
	reason: z.string().max(1000).optional(),
});

/**
 * Create skill file submission schema.
 * User submits a GitHub skill file URL (pointing to SKILL.md).
 */
export const createSkillFileSubmissionSchema = z.object({
	githubUrl: gitHubSkillFileUrlSchema,
	suggestedSection: z.enum(["3d-motion", "agent-skills"]),
	suggestedCategoryId: z.string().uuid().optional(),
	suggestedSubcategoryId: z.string().uuid().optional(),
	reason: z.string().max(1000).optional(),
});

/**
 * Create submission schema (discriminated union).
 * Validates based on submission type.
 */
export const createSubmissionSchema = z.discriminatedUnion("submissionType", [
	z.object({
		submissionType: z.literal("repo"),
		githubUrl: gitHubRepoUrlSchema,
		suggestedSection: z.enum(["3d-motion", "agent-skills"]),
		reason: z.string().max(1000).optional(),
	}),
	z.object({
		submissionType: z.literal("skill_file"),
		githubUrl: gitHubSkillFileUrlSchema,
		suggestedSection: z.enum(["3d-motion", "agent-skills"]),
		suggestedCategoryId: z.string().uuid().optional(),
		suggestedSubcategoryId: z.string().uuid().optional(),
		reason: z.string().max(1000).optional(),
	}),
]);

/**
 * Process submission schema.
 * Internal server schema for processing submissions.
 */
export const processSubmissionSchema = z.object({
	submissionId: z.string().uuid(),
	status: z.enum(["pending", "processing", "approved", "rejected", "failed"]),
	adminNote: z.string().optional(),
	metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Update submission status schema.
 * Admin schema for updating submission status.
 */
export const updateSubmissionStatusSchema = z.object({
	status: z.enum(["approved", "rejected", "failed"]).optional(),
	adminNote: z.string().optional(),
});

/**
 * Submission metadata schema.
 * Stores fetch/process results.
 */
export const submissionMetadataSchema = z.object({
	fetchedAt: z.string().optional(),
	fetchError: z.string().optional(),
	parsedOwner: z.string().optional(),
	parsedRepo: z.string().optional(),
	parsedBranch: z.string().optional(),
	parsedFilePath: z.string().optional(),
	parseError: z.string().optional(),
	githubMetadata: z.record(z.string(), z.unknown()).optional(),
	processingError: z.string().optional(),
});

export type CreateRepoSubmission = z.infer<typeof createRepoSubmissionSchema>;
export type CreateSkillFileSubmission = z.infer<
	typeof createSkillFileSubmissionSchema
>;
export type CreateSubmission = z.infer<typeof createSubmissionSchema>;
export type ProcessSubmission = z.infer<typeof processSubmissionSchema>;
export type UpdateSubmissionStatus = z.infer<
	typeof updateSubmissionStatusSchema
>;
export type SubmissionMetadata = z.infer<typeof submissionMetadataSchema>;
