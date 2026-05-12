import { and, eq, isNull, or, sql } from "drizzle-orm";
import { cleanReadmePreview } from "#/lib/readme-cleanup";
import { db } from "#/server/db";
import {
	repoSections,
	repositories,
	repositoryReadmes,
} from "#/server/db/schemas/app-schema";
import { fetchRepositoryReadme } from "#/server/github/repo-readme";

const ALLOWED_SECTIONS = ["3d-motion"] as const;
const DEFAULT_MAX_README_CONTENT_CHARS = 200_000;
type AllowedSection = (typeof ALLOWED_SECTIONS)[number];

function isAllowedSection(section: string): section is AllowedSection {
	return ALLOWED_SECTIONS.includes(section as AllowedSection);
}

export type EnrichRepositoryReadmesResult = {
	checked: number;
	updated: number;
	refreshed: number;
	missing: number;
	failed: number;
	skipped: number;
	partialErrors: ReadmeEnrichmentPartialError[];
};

export type ReadmeEnrichmentPartialError = {
	repoId: string;
	fullName: string;
	readmePath?: string;
	error: string;
};

/**
 * Enrich README content for accepted repositories in a repository-level section.
 *
 * Only permitted for: 3d-motion.
 * Never runs for: agent-skills.
 *
 * @param section - Section to enrich (must be "3d-motion")
 * @param limit - Max repos to process per batch
 * @param forceRefresh - If true, re-fetches READMEs even if content already exists
 */
export async function enrichRepositoryReadmes({
	section = "3d-motion",
	limit = 50,
	forceRefresh = false,
}: {
	section?: string;
	limit?: number;
	forceRefresh?: boolean;
} = {}): Promise<EnrichRepositoryReadmesResult> {
	if (!isAllowedSection(section)) {
		console.warn(
			`[enrichRepositoryReadmes] Section "${section}" is not allowed. Only: ${ALLOWED_SECTIONS.join(", ")}.`,
		);
		return {
			checked: 0,
			updated: 0,
			refreshed: 0,
			missing: 0,
			failed: 0,
			skipped: 0,
			partialErrors: [],
		};
	}

	// Build the selection query
	const baseQuery = db
		.select({
			repoId: repositories.id,
			owner: repositories.owner,
			repoName: repositories.name,
			fullName: repositories.fullName,
			defaultBranch: repositories.defaultBranch,
			existingReadmeId: repositoryReadmes.id,
			existingContent: repositoryReadmes.content,
			existingContentPreview: repositoryReadmes.contentPreview,
			existingReadmeUrl: repositoryReadmes.readmeUrl,
			existingRawReadmeUrl: repositoryReadmes.rawReadmeUrl,
			existingMetadata: repositoryReadmes.metadata,
		})
		.from(repositories)
		.innerJoin(
			repoSections,
			and(
				eq(repoSections.repoId, repositories.id),
				eq(repoSections.section, section),
				eq(repoSections.isAccepted, true),
			),
		)
		.leftJoin(repositoryReadmes, eq(repositoryReadmes.repoId, repositories.id));

	const rows = forceRefresh
		? await baseQuery.limit(limit)
		: await baseQuery
				.where(
					or(
						isNull(repositoryReadmes.id),
						isNull(repositoryReadmes.contentFetchedAt),
						isNull(repositoryReadmes.content),
					),
				)
				.limit(limit);

	const concurrency = Number(process.env.REPO_README_FETCH_CONCURRENCY) || 4;

	let checked = 0;
	let updated = 0;
	let refreshed = 0;
	let missing = 0;
	let failed = 0;
	const skipped = 0;
	const partialErrors: ReadmeEnrichmentPartialError[] = [];

	for (let i = 0; i < rows.length; i += concurrency) {
		const batch = rows.slice(i, i + concurrency);

		await Promise.all(
			batch.map(async (row) => {
				checked++;

				const existingMetadata =
					(row.existingMetadata as Record<string, unknown> | null) ?? {};
				const hasExistingContent = Boolean(row.existingContent);
				const isExistingRow = Boolean(row.existingReadmeId);

				let fetchResult: Awaited<ReturnType<typeof fetchRepositoryReadme>>;
				try {
					fetchResult = await fetchRepositoryReadme({
						owner: row.owner,
						repo: row.repoName,
						defaultBranch: row.defaultBranch,
					});
				} catch (unexpectedError) {
					// Should never happen since fetchRepositoryReadme never throws,
					// but guard just in case.
					const errorMessage =
						unexpectedError instanceof Error
							? unexpectedError.message
							: "Unexpected fetch error";

					try {
						await upsertReadmeFailed({
							repoId: row.repoId,
							owner: row.owner,
							repoName: row.repoName,
							defaultBranch: row.defaultBranch,
							existingMetadata,
							hasExistingContent,
							existingContent: row.existingContent,
							existingContentPreview: row.existingContentPreview,
							existingReadmeUrl: row.existingReadmeUrl,
							existingRawReadmeUrl: row.existingRawReadmeUrl,
							errorMessage,
						});
					} catch (saveError) {
						const saveErrorMessage = getErrorMessage(saveError);
						partialErrors.push({
							repoId: row.repoId,
							fullName: row.fullName,
							error: saveErrorMessage,
						});
						logReadmeDiagnosticSaveFailure({
							fullName: row.fullName,
							repoId: row.repoId,
							error: saveError,
						});
					}
					failed++;
					return;
				}

				if (!fetchResult.ok) {
					if (fetchResult.error === "not_found") {
						// README doesn't exist in this repo
						try {
							await upsertReadmeNotFound({
								repoId: row.repoId,
								owner: row.owner,
								repoName: row.repoName,
								defaultBranch: row.defaultBranch,
								existingMetadata,
								hasExistingContent,
								existingContent: row.existingContent,
								existingContentPreview: row.existingContentPreview,
								existingReadmeUrl: row.existingReadmeUrl,
								existingRawReadmeUrl: row.existingRawReadmeUrl,
							});
							missing++;
						} catch (saveError) {
							const saveErrorMessage = getErrorMessage(saveError);
							failed++;
							partialErrors.push({
								repoId: row.repoId,
								fullName: row.fullName,
								error: saveErrorMessage,
							});
							logReadmeDiagnosticSaveFailure({
								fullName: row.fullName,
								repoId: row.repoId,
								error: saveError,
							});
						}
					} else {
						try {
							await upsertReadmeFailed({
								repoId: row.repoId,
								owner: row.owner,
								repoName: row.repoName,
								defaultBranch: row.defaultBranch,
								existingMetadata,
								hasExistingContent,
								existingContent: row.existingContent,
								existingContentPreview: row.existingContentPreview,
								existingReadmeUrl: row.existingReadmeUrl,
								existingRawReadmeUrl: row.existingRawReadmeUrl,
								errorMessage: fetchResult.error,
							});
						} catch (saveError) {
							const saveErrorMessage = getErrorMessage(saveError);
							partialErrors.push({
								repoId: row.repoId,
								fullName: row.fullName,
								error: saveErrorMessage,
							});
							logReadmeDiagnosticSaveFailure({
								fullName: row.fullName,
								repoId: row.repoId,
								error: saveError,
							});
						}
						failed++;
					}
					return;
				}

				try {
					const saveResult = await saveFetchedReadme({
						repoId: row.repoId,
						owner: row.owner,
						repoName: row.repoName,
						defaultBranch: row.defaultBranch,
						existingMetadata,
						fetchResult,
						forceRefresh,
						isExistingRow,
					});

					if (forceRefresh && saveResult.wasExistingRow) {
						refreshed++;
					} else {
						updated++;
					}
				} catch (saveError) {
					const errorMessage = getErrorMessage(saveError);
					const { content, contentPreview } = prepareReadmeContentForSave(
						fetchResult.content,
					);
					const readmePath = sanitizePostgresText(fetchResult.path);

					failed++;
					partialErrors.push({
						repoId: row.repoId,
						fullName: row.fullName,
						readmePath,
						error: errorMessage,
					});

					console.error("[enrichRepositoryReadmes] README DB save failed:", {
						fullName: row.fullName,
						repoId: row.repoId,
						readmePath,
						contentLength: content.length,
						previewLength: contentPreview.length,
						sha: fetchResult.sha,
						error: errorMessage,
						cause: getErrorCauseMessage(saveError),
					});

					if (isExistingRow) {
						await updateReadmeSaveFailureMetadata({
							repoId: row.repoId,
							existingMetadata,
							errorMessage,
						});
					}
				}
			}),
		);
	}

	return {
		checked,
		updated,
		refreshed,
		missing,
		failed,
		skipped,
		partialErrors,
	};
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type FailureContext = {
	repoId: string;
	owner: string;
	repoName: string;
	defaultBranch: string;
	existingMetadata: Record<string, unknown>;
	hasExistingContent: boolean;
	existingContent: string | null;
	existingContentPreview: string | null;
	existingReadmeUrl: string | null;
	existingRawReadmeUrl: string | null;
	errorMessage: string;
};

type NotFoundContext = Omit<FailureContext, "errorMessage">;

type SuccessfulFetchResult = Extract<
	Awaited<ReturnType<typeof fetchRepositoryReadme>>,
	{ ok: true }
>;

type SaveFetchedReadmeContext = {
	repoId: string;
	owner: string;
	repoName: string;
	defaultBranch: string;
	existingMetadata: Record<string, unknown>;
	fetchResult: SuccessfulFetchResult;
	forceRefresh: boolean;
	isExistingRow: boolean;
};

function getErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : "Unknown error";
}

function getErrorCauseMessage(error: unknown) {
	if (!(error instanceof Error) || error.cause === undefined) {
		return undefined;
	}

	return error.cause instanceof Error
		? error.cause.message
		: String(error.cause);
}

function getMaxReadmeContentChars() {
	const value = Number(process.env.REPO_README_MAX_CONTENT_CHARS);

	if (!Number.isFinite(value) || value < 1) {
		return DEFAULT_MAX_README_CONTENT_CHARS;
	}

	return Math.trunc(value);
}

function logReadmeDiagnosticSaveFailure({
	fullName,
	repoId,
	error,
}: {
	fullName: string;
	repoId: string;
	error: unknown;
}) {
	console.error("[enrichRepositoryReadmes] README diagnostic DB save failed:", {
		fullName,
		repoId,
		error: getErrorMessage(error),
		cause: getErrorCauseMessage(error),
	});
}

function replaceLoneSurrogates(value: string) {
	return value.replace(
		/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g,
		"\uFFFD",
	);
}

function sanitizePostgresText(value: string) {
	// biome-ignore lint/suspicious/noControlCharactersInRegex: Postgres text cannot contain null bytes.
	const withoutNullBytes = value.replace(/\u0000/g, "");
	const maybeToWellFormed = (
		withoutNullBytes as string & { toWellFormed?: () => string }
	).toWellFormed;
	const wellFormed =
		typeof maybeToWellFormed === "function"
			? maybeToWellFormed.call(withoutNullBytes)
			: replaceLoneSurrogates(withoutNullBytes);

	return (
		wellFormed
			.normalize("NFC")
			// biome-ignore lint/suspicious/noControlCharactersInRegex: Strip unsafe C0/DEL controls while preserving markdown whitespace.
			.replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
	);
}

function prepareReadmeContentForSave(rawContent: string) {
	const cleaned = cleanReadmePreview(rawContent);
	const content = sanitizePostgresText(cleaned.content);
	const contentPreview = sanitizePostgresText(cleaned.contentPreview);
	const maxContentChars = getMaxReadmeContentChars();
	const contentTruncated = content.length > maxContentChars;

	return {
		content: contentTruncated ? content.slice(0, maxContentChars) : content,
		contentPreview,
		contentTruncated,
		originalContentLength: content.length,
	};
}

async function saveFetchedReadme(ctx: SaveFetchedReadmeContext) {
	const { content, contentPreview, contentTruncated, originalContentLength } =
		prepareReadmeContentForSave(ctx.fetchResult.content);
	const readmePath = sanitizePostgresText(ctx.fetchResult.path);
	const readmeUrl = sanitizePostgresText(ctx.fetchResult.htmlUrl);
	const rawReadmeUrl = sanitizePostgresText(ctx.fetchResult.rawUrl);

	const existingRows = await db
		.select({
			id: repositoryReadmes.id,
			metadata: repositoryReadmes.metadata,
		})
		.from(repositoryReadmes)
		.where(eq(repositoryReadmes.repoId, ctx.repoId))
		.limit(1);
	const existingRow = existingRows[0];
	const now = new Date();
	const successMetadata: Record<string, unknown> = {
		...((existingRow?.metadata as Record<string, unknown> | undefined) ??
			ctx.existingMetadata),
		lastFetchStatus: "success",
		...(ctx.forceRefresh && (existingRow || ctx.isExistingRow)
			? { refreshedAt: now.toISOString() }
			: {}),
	};

	delete successMetadata.error;
	delete successMetadata.dbError;
	delete successMetadata.lastFailedAt;

	if (contentTruncated) {
		successMetadata.contentTruncated = true;
		successMetadata.originalContentLength = originalContentLength;
	} else {
		delete successMetadata.contentTruncated;
		delete successMetadata.originalContentLength;
	}

	const values = {
		owner: ctx.owner,
		repoName: ctx.repoName,
		defaultBranch: ctx.defaultBranch,
		readmePath,
		readmeUrl,
		rawReadmeUrl,
		content,
		contentPreview,
		contentSha: ctx.fetchResult.sha,
		contentFetchedAt: now,
		metadata: successMetadata,
		updatedAt: now,
	};

	if (existingRow) {
		await db
			.update(repositoryReadmes)
			.set(values)
			.where(eq(repositoryReadmes.repoId, ctx.repoId));

		return { wasExistingRow: true };
	}

	await db.insert(repositoryReadmes).values({
		repoId: ctx.repoId,
		...values,
		createdAt: now,
	});

	return { wasExistingRow: false };
}

async function updateReadmeSaveFailureMetadata({
	repoId,
	existingMetadata,
	errorMessage,
}: {
	repoId: string;
	existingMetadata: Record<string, unknown>;
	errorMessage: string;
}) {
	const now = new Date();
	const metadata = {
		...existingMetadata,
		lastFetchStatus: "failed",
		error: "db_save_failed",
		dbError: errorMessage,
		lastFailedAt: now.toISOString(),
	};

	try {
		await db
			.update(repositoryReadmes)
			.set({
				metadata,
				updatedAt: now,
			})
			.where(eq(repositoryReadmes.repoId, repoId));
	} catch (metadataError) {
		console.error(
			"[enrichRepositoryReadmes] README DB save failure metadata update failed:",
			{
				repoId,
				error: getErrorMessage(metadataError),
				cause: getErrorCauseMessage(metadataError),
			},
		);
	}
}

async function upsertReadmeFailed(ctx: FailureContext) {
	const now = new Date();
	const failMetadata: Record<string, unknown> = {
		...ctx.existingMetadata,
		lastFetchStatus: "failed",
		error: ctx.errorMessage,
		lastFailedAt: now.toISOString(),
	};

	// If there's existing content, keep it; otherwise upsert with nulls for diagnostics.
	const contentSet = ctx.hasExistingContent
		? {
				// Preserve existing content — do not overwrite with null
				content: ctx.existingContent,
				contentPreview: ctx.existingContentPreview,
				readmeUrl: ctx.existingReadmeUrl,
				rawReadmeUrl: ctx.existingRawReadmeUrl,
			}
		: {
				content: null as string | null,
				contentPreview: null as string | null,
				readmeUrl: null as string | null,
				rawReadmeUrl: null as string | null,
			};

	await db
		.insert(repositoryReadmes)
		.values({
			repoId: ctx.repoId,
			owner: ctx.owner,
			repoName: ctx.repoName,
			defaultBranch: ctx.defaultBranch,
			...contentSet,
			metadata: failMetadata,
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: repositoryReadmes.repoId,
			set: {
				// On conflict: only update metadata + updatedAt.
				// Keep existing content/urls if they exist.
				...(ctx.hasExistingContent
					? {}
					: {
							content: sql`EXCLUDED.content`,
							contentPreview: sql`EXCLUDED.content_preview`,
						}),
				metadata: failMetadata,
				updatedAt: now,
			},
		});
}

async function upsertReadmeNotFound(ctx: NotFoundContext) {
	const now = new Date();
	const notFoundMetadata: Record<string, unknown> = {
		...ctx.existingMetadata,
		lastFetchStatus: "not_found",
		error: "not_found",
	};

	const contentSet = ctx.hasExistingContent
		? {
				content: ctx.existingContent,
				contentPreview: ctx.existingContentPreview,
				readmeUrl: ctx.existingReadmeUrl,
				rawReadmeUrl: ctx.existingRawReadmeUrl,
			}
		: {
				content: null as string | null,
				contentPreview: null as string | null,
				readmeUrl: null as string | null,
				rawReadmeUrl: null as string | null,
			};

	await db
		.insert(repositoryReadmes)
		.values({
			repoId: ctx.repoId,
			owner: ctx.owner,
			repoName: ctx.repoName,
			defaultBranch: ctx.defaultBranch,
			...contentSet,
			metadata: notFoundMetadata,
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: repositoryReadmes.repoId,
			set: {
				...(ctx.hasExistingContent
					? {}
					: {
							content: sql`EXCLUDED.content`,
							contentPreview: sql`EXCLUDED.content_preview`,
						}),
				metadata: notFoundMetadata,
				updatedAt: now,
			},
		});
}
