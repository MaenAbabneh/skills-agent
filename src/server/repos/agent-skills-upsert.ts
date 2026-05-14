import { parseAgentSkillMarkdown } from "@/lib/agent-skills-parser";
import {
	classifyAgentSkillCategory,
	generateAgentSkillInstallCommands,
	generateAgentSkillSlug,
} from "@/lib/agent-skills-utils";
import { cleanReadmePreview } from "@/lib/readme-cleanup";
import {
	type AgentSkillTaxonomyMetadata,
	agentSkillFileMetadataSchema,
	agentSkillTaxonomyMetadataSchema,
} from "@/lib/validations/agent-skills";
import type { GitHubRepo } from "@/lib/validations/github";
import { db } from "@/server/db";
import {
	agentSkillCategories,
	agentSkillFiles,
	agentSkillSubcategories,
} from "@/server/db/schema";
import {
	type DetectedAgentSkillFile,
	fetchAgentSkillFileContent,
} from "@/server/github/agent-skill-files";
import { buildGitHubZipUrl } from "@/server/repos/repo.metadata";

type TaxonomyCategoryRow = {
	id: string;
	name: string;
	slug: string;
};

type TaxonomySubcategoryRow = {
	id: string;
	categoryId: string;
	name: string;
	slug: string;
};

type LoadedTaxonomyRows = {
	categories: TaxonomyCategoryRow[];
	subcategories: TaxonomySubcategoryRow[];
};

export type ResolvedAgentSkillTaxonomy = {
	categoryId: string | null;
	subcategoryId: string | null;
	categoryLabel: string;
	subcategoryLabel: string | null;
	metadata: AgentSkillTaxonomyMetadata;
};

export type UpsertDetectedAgentSkillFilesResult = {
	processed: number;
	upserted: number;
	failed: number;
	strictDetected: boolean;
};

function normalizeLookupValue(value: string) {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function getSkillFolderPath(filePath: string) {
	const parts = filePath.split("/").filter(Boolean);

	return parts.length <= 1 ? "." : parts.slice(0, -1).join("/");
}

function buildFileUrl({
	repository,
	filePath,
}: {
	repository: GitHubRepo;
	filePath: string;
}) {
	const branch = repository.default_branch || "main";

	return `https://github.com/${repository.full_name}/blob/${branch}/${filePath}`;
}

function buildRawFileUrl({
	repository,
	filePath,
}: {
	repository: GitHubRepo;
	filePath: string;
}) {
	const branch = repository.default_branch || "main";

	return `https://raw.githubusercontent.com/${repository.full_name}/${branch}/${filePath}`;
}

function hasTextMatch(text: string, candidate: string) {
	const normalizedText = normalizeLookupValue(text);
	const normalizedCandidate = normalizeLookupValue(candidate);

	if (!normalizedText || !normalizedCandidate) {
		return false;
	}

	return (
		normalizedText === normalizedCandidate ||
		normalizedText.includes(normalizedCandidate) ||
		normalizedCandidate.includes(normalizedText)
	);
}

function getMatchScore(text: string, candidate: string) {
	const normalizedText = normalizeLookupValue(text);
	const normalizedCandidate = normalizeLookupValue(candidate);

	if (!normalizedText || !normalizedCandidate) {
		return 0;
	}

	if (normalizedText === normalizedCandidate) {
		return 100;
	}

	if (normalizedText.includes(normalizedCandidate)) {
		return 80 + Math.min(normalizedCandidate.length, 20);
	}

	if (normalizedCandidate.includes(normalizedText)) {
		return 60 + Math.min(normalizedText.length, 20);
	}

	return 0;
}

function getSearchText({
	skillName,
	description,
	filePath,
	repoName,
	repoDescription,
	topics,
	content,
}: {
	skillName: string;
	description: string;
	filePath: string;
	repoName: string;
	repoDescription: string;
	topics: string[];
	content: string;
}) {
	return [
		skillName,
		description,
		filePath,
		repoName,
		repoDescription,
		...(topics ?? []),
		content,
	]
		.filter(Boolean)
		.join(" ");
}

async function getAgentSkillTaxonomyRows(): Promise<LoadedTaxonomyRows> {
	const [categories, subcategories] = await Promise.all([
		db
			.select({
				id: agentSkillCategories.id,
				name: agentSkillCategories.name,
				slug: agentSkillCategories.slug,
			})
			.from(agentSkillCategories),
		db
			.select({
				id: agentSkillSubcategories.id,
				categoryId: agentSkillSubcategories.categoryId,
				name: agentSkillSubcategories.name,
				slug: agentSkillSubcategories.slug,
			})
			.from(agentSkillSubcategories),
	]);

	return { categories, subcategories };
}

function findBestCategory({
	categories,
	searchText,
	guessedCategoryLabel,
}: {
	categories: TaxonomyCategoryRow[];
	searchText: string;
	guessedCategoryLabel: string;
}) {
	let bestCategory: TaxonomyCategoryRow | null = null;
	let bestScore = 0;

	for (const category of categories) {
		const score = Math.max(
			getMatchScore(searchText, category.name),
			getMatchScore(searchText, category.slug),
			getMatchScore(guessedCategoryLabel, category.name),
			getMatchScore(guessedCategoryLabel, category.slug),
		);

		if (score > bestScore) {
			bestCategory = category;
			bestScore = score;
		}
	}

	return {
		bestCategory,
		bestScore,
	};
}

function findBestSubcategory({
	subcategories,
	searchText,
	guessedCategoryLabel,
	categoryId,
}: {
	subcategories: TaxonomySubcategoryRow[];
	searchText: string;
	guessedCategoryLabel: string;
	categoryId?: string | null;
}) {
	let bestSubcategory: TaxonomySubcategoryRow | null = null;
	let bestScore = 0;

	for (const subcategory of subcategories) {
		if (categoryId && subcategory.categoryId !== categoryId) {
			continue;
		}

		const score = Math.max(
			getMatchScore(searchText, subcategory.name),
			getMatchScore(searchText, subcategory.slug),
			getMatchScore(guessedCategoryLabel, subcategory.name),
			getMatchScore(guessedCategoryLabel, subcategory.slug),
		);

		if (score > bestScore) {
			bestSubcategory = subcategory;
			bestScore = score;
		}
	}

	return {
		bestSubcategory,
		bestScore,
	};
}

function findOtherTaxonomyRows({
	categories,
	subcategories,
}: {
	categories: TaxonomyCategoryRow[];
	subcategories: TaxonomySubcategoryRow[];
}) {
	const otherCategory =
		categories.find(
			(category) =>
				hasTextMatch(category.name, "Other") ||
				hasTextMatch(category.slug, "Other"),
		) ?? null;

	if (!otherCategory) {
		return {
			otherCategory: null,
			otherSubcategory: null,
		};
	}

	const otherSubcategory =
		subcategories.find(
			(subcategory) =>
				subcategory.categoryId === otherCategory.id &&
				(hasTextMatch(subcategory.name, "Other") ||
					hasTextMatch(subcategory.slug, "Other")),
		) ?? null;

	return {
		otherCategory,
		otherSubcategory,
	};
}

function parseTaxonomyMetadata(metadata: unknown): AgentSkillTaxonomyMetadata {
	return agentSkillTaxonomyMetadataSchema.parse(metadata);
}

export async function resolveAgentSkillTaxonomy({
	skillName,
	description,
	filePath,
	repoName,
	repoDescription,
	topics,
	content,
}: {
	skillName: string;
	description: string;
	filePath: string;
	repoName: string;
	repoDescription: string;
	topics: string[];
	content: string;
}): Promise<ResolvedAgentSkillTaxonomy> {
	const taxonomy = await getAgentSkillTaxonomyRows();
	const searchText = getSearchText({
		skillName,
		description,
		filePath,
		repoName,
		repoDescription,
		topics,
		content,
	});
	const guessedCategoryLabel = normalizeLookupValue(
		classifyAgentSkillCategory({
			skillName,
			filePath,
			repoName,
			repoDescription,
			topics,
			skillContent: content,
			extractedDescription: description,
		}),
	);

	if (taxonomy.categories.length === 0) {
		return {
			categoryId: null,
			subcategoryId: null,
			categoryLabel: "Other",
			subcategoryLabel: null,
			metadata: parseTaxonomyMetadata({
				categorySlug: undefined,
				subcategorySlug: undefined,
				fallbackReason: "taxonomy-table-empty",
				confidence: "low",
				matchedKeywords: [],
				classifierVersion: "agent-skills-taxonomy-v1",
			}),
		};
	}

	const { bestCategory, bestScore } = findBestCategory({
		categories: taxonomy.categories,
		searchText,
		guessedCategoryLabel,
	});

	const { bestSubcategory } = findBestSubcategory({
		subcategories: taxonomy.subcategories,
		searchText,
		guessedCategoryLabel,
		categoryId: bestCategory?.id,
	});

	const { otherCategory, otherSubcategory } = findOtherTaxonomyRows(taxonomy);

	if (bestCategory || bestSubcategory) {
		const resolvedCategory = bestCategory ?? otherCategory;
		const resolvedSubcategory = bestSubcategory ?? otherSubcategory;
		const matchedSubcategory =
			resolvedSubcategory &&
			resolvedSubcategory.categoryId === resolvedCategory?.id
				? resolvedSubcategory
				: null;

		return {
			categoryId: resolvedCategory?.id ?? null,
			subcategoryId: matchedSubcategory?.id ?? null,
			categoryLabel: resolvedCategory?.name ?? "Other",
			subcategoryLabel: matchedSubcategory?.name ?? null,
			metadata: parseTaxonomyMetadata({
				categorySlug: resolvedCategory?.slug,
				subcategorySlug: matchedSubcategory?.slug,
				fallbackReason:
					bestScore > 0
						? bestSubcategory
							? "matched-category-and-subcategory"
							: "matched-category"
						: "matched-other",
				confidence: bestScore >= 80 ? "high" : "medium",
				matchedKeywords: [
					skillName,
					filePath,
					repoName,
					repoDescription,
					...topics,
				].filter((value): value is string => Boolean(value)),
				classifierVersion: "agent-skills-taxonomy-v1",
			}),
		};
	}

	if (otherCategory) {
		return {
			categoryId: otherCategory.id,
			subcategoryId: otherSubcategory?.id ?? null,
			categoryLabel: otherCategory.name,
			subcategoryLabel: otherSubcategory?.name ?? null,
			metadata: parseTaxonomyMetadata({
				categorySlug: otherCategory.slug,
				subcategorySlug: otherSubcategory?.slug,
				fallbackReason: otherSubcategory
					? "matched-other"
					: "other-category-without-subcategory",
				confidence: "low",
				matchedKeywords: [],
				classifierVersion: "agent-skills-taxonomy-v1",
			}),
		};
	}

	return {
		categoryId: null,
		subcategoryId: null,
		categoryLabel: "Other",
		subcategoryLabel: null,
		metadata: parseTaxonomyMetadata({
			categorySlug: undefined,
			subcategorySlug: undefined,
			fallbackReason: "no-match",
			confidence: "low",
			matchedKeywords: [],
			classifierVersion: "agent-skills-taxonomy-v1",
		}),
	};
}

function buildAgentSkillMetadata({
	file,
	repository,
	querySources,
	fetchError,
	parsed,
	taxonomy,
	detectedAt,
}: {
	file: DetectedAgentSkillFile;
	repository: GitHubRepo;
	querySources: string[];
	fetchError?: string;
	parsed?: ReturnType<typeof parseAgentSkillMarkdown>;
	taxonomy: ResolvedAgentSkillTaxonomy;
	detectedAt: Date;
}) {
	const installCommands = generateAgentSkillInstallCommands({
		owner: repository.owner.login,
		repo: repository.name,
		defaultBranch: repository.default_branch || "main",
		filePath: file.path,
		skillName: parsed?.name?.trim() || file.skillName,
	});

	return agentSkillFileMetadataSchema.parse({
		contentFetchError: fetchError,
		discovery: {
			section: "agent-skills",
			querySources: Array.from(new Set(querySources)),
			detectedFilePath: file.path,
			detectedFileUrl: file.url,
			detectedFileName: file.fileName,
			detectionConfidence: file.confidence,
			detectedAt: detectedAt.toISOString(),
		},
		taxonomy: taxonomy.metadata,
		installCommands,
	});
}

async function upsertDetectedAgentSkillFile({
	repoId,
	repoSectionId,
	repository,
	detectedFile,
	querySources,
}: {
	repoId: string;
	repoSectionId: string;
	repository: GitHubRepo;
	detectedFile: DetectedAgentSkillFile;
	querySources: string[];
}) {
	const detectedAt = new Date();
	const branch = repository.default_branch || "main";
	const filePath = detectedFile.path;
	const skillFolderPath = getSkillFolderPath(filePath);
	const fileUrl = buildFileUrl({ repository, filePath });
	const rawFileUrl = buildRawFileUrl({ repository, filePath });
	const downloadZipUrl = buildGitHubZipUrl(repository);
	const slug = generateAgentSkillSlug({
		owner: repository.owner.login,
		repo: repository.name,
		filePath,
	});

	let parsedSkill = parseAgentSkillMarkdown("");
	let content: string | null = null;
	let contentPreview: string | null = null;
	let contentFetchedAt: Date | null = null;
	let contentFetchError: string | undefined;

	const contentResult = await fetchAgentSkillFileContent({
		owner: repository.owner.login,
		repo: repository.name,
		defaultBranch: branch,
		filePath,
	});

	if (contentResult.ok) {
		content = contentResult.content ?? "";
		contentPreview = cleanReadmePreview(content).contentPreview;
		contentFetchedAt = detectedAt;
		parsedSkill = parseAgentSkillMarkdown(content);
	} else {
		contentFetchError = contentResult.error ?? "Failed to fetch SKILL.md";
	}

	const resolvedSkillName = parsedSkill.name?.trim() || detectedFile.skillName;
	const resolvedDescription = parsedSkill.description?.trim() ?? null;
	const taxonomy = await resolveAgentSkillTaxonomy({
		skillName: resolvedSkillName,
		description: resolvedDescription ?? "",
		filePath,
		repoName: repository.name,
		repoDescription: repository.description ?? "",
		topics: repository.topics ?? [],
		content: content ?? "",
	});
	const metadata = buildAgentSkillMetadata({
		file: {
			...detectedFile,
			skillName: resolvedSkillName,
		},
		repository,
		querySources,
		fetchError: contentFetchError,
		parsed: parsedSkill,
		taxonomy,
		detectedAt,
	});

	const values = {
		repoId,
		repoSectionId,
		section: "agent-skills" as const,
		skillName: resolvedSkillName,
		slug,
		filePath,
		fileUrl,
		fileName: detectedFile.fileName,
		confidence: detectedFile.confidence,
		category: taxonomy.categoryLabel,
		categoryId: taxonomy.categoryId,
		subcategoryId: taxonomy.subcategoryId,
		description: resolvedDescription,
		allowedTools: parsedSkill.allowedTools ?? null,
		userInvocable: parsedSkill.userInvocable ?? null,
		status: "approved" as const,
		isAccepted: true,
		content,
		contentPreview,
		rawFileUrl,
		contentSha: null,
		contentFetchedAt,
		skillFolderPath,
		downloadZipUrl,
		metadata,
		updatedAt: detectedAt,
	};

	await db
		.insert(agentSkillFiles)
		.values(values)
		.onConflictDoUpdate({
			target: [
				agentSkillFiles.repoId,
				agentSkillFiles.section,
				agentSkillFiles.filePath,
			],
			set: {
				skillName: values.skillName,
				slug: values.slug,
				fileUrl: values.fileUrl,
				fileName: values.fileName,
				confidence: values.confidence,
				category: values.category,
				categoryId: values.categoryId,
				subcategoryId: values.subcategoryId,
				description: values.description,
				allowedTools: values.allowedTools,
				userInvocable: values.userInvocable,
				status: values.status,
				isAccepted: values.isAccepted,
				rawFileUrl: values.rawFileUrl,
				skillFolderPath: values.skillFolderPath,
				downloadZipUrl: values.downloadZipUrl,
				metadata: values.metadata,
				...(contentResult.ok
					? {
							content: values.content,
							contentPreview: values.contentPreview,
							contentFetchedAt: values.contentFetchedAt,
						}
					: {}),
				updatedAt: detectedAt,
			},
		});
}

export async function upsertDetectedAgentSkillFiles({
	repoId,
	repoSectionId,
	repository,
	detectedFiles,
	querySources,
}: {
	repoId: string;
	repoSectionId: string;
	repository: GitHubRepo;
	detectedFiles: DetectedAgentSkillFile[];
	querySources: string[];
}): Promise<UpsertDetectedAgentSkillFilesResult> {
	if (detectedFiles.length === 0) {
		return {
			processed: 0,
			upserted: 0,
			failed: 0,
			strictDetected: false,
		};
	}

	let processed = 0;
	let upserted = 0;
	let failed = 0;

	for (const detectedFile of detectedFiles) {
		processed += 1;

		try {
			await upsertDetectedAgentSkillFile({
				repoId,
				repoSectionId,
				repository,
				detectedFile,
				querySources,
			});

			upserted += 1;
		} catch (error) {
			failed += 1;
			console.error(
				`[Agent Skills] Failed to upsert detected file ${detectedFile.path} for ${repository.full_name}:`,
				error,
			);
		}
	}

	return {
		processed,
		upserted,
		failed,
		strictDetected: true,
	};
}
