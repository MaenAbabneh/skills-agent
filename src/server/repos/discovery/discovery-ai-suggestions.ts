import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import type { RepoSection } from "@/lib/validations/repos";
import { db } from "@/server/db";
import { aiUsageLogs } from "@/server/db/schemas/aiUsageLogs-schema";
import type { SectionId } from "@/server/sections/sections.config";
import type { DiscoveryPlan } from "./discovery.planner";
import type { TopicMiningResult } from "./discovery-topic-mining.query";

const AI_USAGE_FEATURE = "discovery_query_suggestions";
const MIN_STATIC_AND_TOPIC_QUERIES_BEFORE_AI = 6;

type AIUsageStatus = "success" | "failed" | "skipped";

type AIQuerySuggestionsConfig = {
	enabled: boolean;
	provider: string;
	model: string;
	apiKey: string | null;
	maxCallsPerDay: number;
	minHoursBetweenCalls: number;
	maxSuggestionsPerCall: number;
};

type AIUsageSnapshot = {
	callsToday: number;
	lastSuccessAt: Date | null;
};

type AIQuerySuggestionsInput = {
	section: RepoSection;
	discoveryPlan: DiscoveryPlan;
	topics: TopicMiningResult[];
	weakQueries: string[];
	successfulQueries: string[];
	existingQueries: string[];
	availableStaticTemporaryQueriesCount: number;
	availableTopicMiningQueriesCount: number;
	maxSuggestions?: number;
};

type AIQuerySuggestionsResult = {
	queries: string[];
	skippedReason?: string;
};

const DiscoveryQuerySuggestionsSchema = z.object({
	queries: z.array(z.string().min(2).max(80)).max(10),
});

const GENERIC_QUERY_TEXTS_BY_SECTION: Record<SectionId, Set<string>> = {
	"3d-motion": new Set([
		"react app",
		"javascript",
		"javascript app",
		"typescript",
		"typescript app",
		"frontend",
		"frontend app",
		"website",
		"web app",
	]),
	"agent-skills": new Set([
		"react app",
		"javascript",
		"javascript app",
		"typescript",
		"typescript app",
		"python",
		"node",
		"openai",
		"api",
		"website",
		"web app",
		"template",
	]),
};

const DOMAIN_TERMS_BY_SECTION: Record<SectionId, string[]> = {
	"3d-motion": [
		"3d",
		"three",
		"threejs",
		"three.js",
		"r3f",
		"react-three-fiber",
		"react three fiber",
		"webgl",
		"webgpu",
		"shader",
		"glsl",
		"drei",
		"rapier",
		"cannon",
		"physics",
		"creative-coding",
		"generative-art",
		"generative art",
		"portfolio",
		"visualization",
		"particle",
		"canvas",
		"topic:three",
		"topic:webgl",
		"topic:webgpu",
		"topic:shader",
		"topic:glsl",
		"topic:r3f",
		"topic:react-three-fiber",
	],
	"agent-skills": [
		"agent",
		"agents",
		"ai agent",
		"skill",
		"skills",
		"skill.md",
		"skills.md",
		"skill file",
		"skill repository",
		"agent skill",
		"assistant",
		"coding assistant",
		"claude skill",
		"cursor skill",
		"factory skills",
		".factory",
		".skills",
		"topic:ai-agent",
		"topic:skill",
		"topic:skills",
		"topic:assistant",
		"topic:claude",
		"topic:cursor",
	],
};

function normalizeQuery(query: string) {
	return query.trim().replace(/\s+/g, " ").toLowerCase();
}

function toPositiveInt(value: string | undefined, fallback: number) {
	const parsed = Number.parseInt(value ?? "", 10);

	if (!Number.isFinite(parsed) || parsed <= 0) {
		return fallback;
	}

	return parsed;
}

function getErrorMessage(error: unknown) {
	return error instanceof Error
		? error.message
		: "Unknown AI suggestion error.";
}

export function resolveAIQuerySuggestionsConfig(): AIQuerySuggestionsConfig {
	const providerValue =
		process.env.AI_QUERY_PROVIDER?.trim().toLowerCase() || "gemini";

	return {
		enabled: process.env.AI_QUERY_SUGGESTIONS_ENABLED === "true",
		provider: providerValue,
		model: process.env.AI_QUERY_MODEL?.trim() || "gemini-2.5-flash-lite",
		apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() || null,
		maxCallsPerDay: toPositiveInt(process.env.AI_QUERY_MAX_CALLS_PER_DAY, 2),
		minHoursBetweenCalls: toPositiveInt(
			process.env.AI_QUERY_MIN_HOURS_BETWEEN_CALLS,
			12,
		),
		maxSuggestionsPerCall: toPositiveInt(
			process.env.AI_QUERY_MAX_SUGGESTIONS_PER_CALL,
			10,
		),
	};
}

function trimUniqueQueries(queries: string[], limit: number) {
	const seen = new Set<string>();
	const unique: string[] = [];

	for (const query of queries) {
		const normalized = normalizeQuery(query);

		if (!normalized || seen.has(normalized)) {
			continue;
		}

		seen.add(normalized);
		unique.push(query.trim());

		if (unique.length >= limit) {
			break;
		}
	}

	return unique;
}

function isDomainRelevantQuery({
	section,
	query,
}: {
	section: SectionId;
	query: string;
}) {
	const normalized = normalizeQuery(query);

	if (GENERIC_QUERY_TEXTS_BY_SECTION[section].has(normalized)) {
		return false;
	}

	return DOMAIN_TERMS_BY_SECTION[section].some((term) =>
		normalized.includes(term),
	);
}

function validateAISuggestions({
	section,
	queries,
	existingQueries,
	weakQueries,
	maxSuggestions,
}: {
	section: SectionId;
	queries: string[];
	existingQueries: string[];
	weakQueries: string[];
	maxSuggestions: number;
}) {
	const blocked = new Set(
		[...existingQueries, ...weakQueries].map(normalizeQuery),
	);
	const seen = new Set<string>();
	const valid: string[] = [];

	for (const query of queries) {
		const cleanQuery = query.trim().replace(/\s+/g, " ");
		const normalized = normalizeQuery(cleanQuery);

		if (
			!normalized ||
			cleanQuery.length > 80 ||
			seen.has(normalized) ||
			blocked.has(normalized) ||
			!isDomainRelevantQuery({ section, query: cleanQuery })
		) {
			continue;
		}

		seen.add(normalized);
		valid.push(cleanQuery);

		if (valid.length >= maxSuggestions) {
			break;
		}
	}

	return valid;
}

async function logAIUsage({
	section,
	provider,
	model,
	status,
	reason,
	inputTokens,
	outputTokens,
}: {
	section: RepoSection;
	provider: string;
	model: string;
	status: AIUsageStatus;
	reason?: string;
	inputTokens?: number;
	outputTokens?: number;
}) {
	await db.insert(aiUsageLogs).values({
		feature: AI_USAGE_FEATURE,
		section,
		provider,
		model,
		status,
		reason,
		inputTokens: inputTokens ?? 0,
		outputTokens: outputTokens ?? 0,
		estimatedCostCents: 0,
	});
}

async function getAIUsageSnapshot({
	section,
}: {
	section: RepoSection;
}): Promise<AIUsageSnapshot> {
	const now = new Date();
	const sinceDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);

	const [dayCountRow] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(aiUsageLogs)
		.where(
			and(
				eq(aiUsageLogs.feature, AI_USAGE_FEATURE),
				eq(aiUsageLogs.section, section),
				eq(aiUsageLogs.status, "success"),
				gte(aiUsageLogs.createdAt, sinceDay),
			),
		);

	const [latestSuccess] = await db
		.select({ createdAt: aiUsageLogs.createdAt })
		.from(aiUsageLogs)
		.where(
			and(
				eq(aiUsageLogs.feature, AI_USAGE_FEATURE),
				eq(aiUsageLogs.section, section),
				eq(aiUsageLogs.status, "success"),
			),
		)
		.orderBy(desc(aiUsageLogs.createdAt))
		.limit(1);

	return {
		callsToday: dayCountRow?.count ?? 0,
		lastSuccessAt: latestSuccess?.createdAt ?? null,
	};
}

function shouldRequestAIQuerySuggestions({
	config,
	discoveryPlan,
	availableStaticTemporaryQueriesCount,
	availableTopicMiningQueriesCount,
	usage,
}: {
	config: AIQuerySuggestionsConfig;
	discoveryPlan: DiscoveryPlan;
	availableStaticTemporaryQueriesCount: number;
	availableTopicMiningQueriesCount: number;
	usage: AIUsageSnapshot;
}) {
	if (!config.enabled) {
		return { ok: false as const, reason: "AI suggestions are disabled." };
	}

	if (discoveryPlan.mode !== "exploration") {
		return { ok: false as const, reason: "Discovery is not in exploration." };
	}

	if (config.provider !== "gemini") {
		return { ok: false as const, reason: "Unsupported AI query provider." };
	}

	if (discoveryPlan.diagnosis !== "saturated") {
		return { ok: false as const, reason: "Discovery is not saturated." };
	}

	if (
		availableStaticTemporaryQueriesCount + availableTopicMiningQueriesCount >=
		MIN_STATIC_AND_TOPIC_QUERIES_BEFORE_AI
	) {
		return {
			ok: false as const,
			reason: "Static and topic mining queries are sufficient.",
		};
	}

	if (usage.callsToday >= config.maxCallsPerDay) {
		return { ok: false as const, reason: "Daily AI call limit reached." };
	}

	if (usage.lastSuccessAt) {
		const nextAllowedAt = new Date(
			usage.lastSuccessAt.getTime() +
				config.minHoursBetweenCalls * 60 * 60 * 1000,
		);

		if (nextAllowedAt > new Date()) {
			return { ok: false as const, reason: "AI cooldown is active." };
		}
	}

	if (!config.apiKey) {
		return { ok: false as const, reason: "Missing Gemini API key." };
	}

	return { ok: true as const };
}

function buildPrompt({
	section,
	topics,
	weakQueries,
	successfulQueries,
	maxSuggestions,
}: {
	section: RepoSection;
	topics: TopicMiningResult[];
	weakQueries: string[];
	successfulQueries: string[];
	maxSuggestions: number;
}) {
	const topTopicLines = topics
		.slice(0, 12)
		.map((topic) => `${topic.topic} (${topic.count})`);
	const successfulQueryLines = trimUniqueQueries(successfulQueries, 10);
	const weakQueryLines = trimUniqueQueries(weakQueries, 10);
	const sectionDescription =
		section === "agent-skills"
			? "repositories with actual nested SKILL.md, skill.md, or skills.md agent skill definition files"
			: "3D web repository discovery";
	const exampleQueries =
		section === "agent-skills"
			? `["SKILL.md agent", "factory skills SKILL.md"]`
			: `["topic:webgpu experiment", "r3f physics game"]`;

	return `Return JSON only:
{
  "queries": ${exampleQueries}
}

Target section: ${section}
Need ${maxSuggestions} GitHub search queries for ${sectionDescription}.
Keep every query under 80 chars.

Top topics:
${topTopicLines.join("\n") || "none"}

Successful recent queries:
${successfulQueryLines.join("\n") || "none"}

Weak queries to avoid:
${weakQueryLines.join("\n") || "none"}`;
}

async function requestGeminiSuggestions({
	config,
	prompt,
	maxSuggestions,
}: {
	config: AIQuerySuggestionsConfig;
	prompt: string;
	maxSuggestions: number;
}) {
	const result = await generateObject({
		model: google(config.model),
		schema: DiscoveryQuerySuggestionsSchema,
		prompt,
		temperature: 0.3,
		maxOutputTokens: 300,
	});

	return {
		queries: result.object.queries.slice(0, maxSuggestions),
		inputTokens: result.usage.inputTokens ?? 0,
		outputTokens: result.usage.outputTokens ?? 0,
	};
}

export async function getAIQuerySuggestions({
	section,
	discoveryPlan,
	topics,
	weakQueries,
	successfulQueries,
	existingQueries,
	availableStaticTemporaryQueriesCount,
	availableTopicMiningQueriesCount,
	maxSuggestions,
}: AIQuerySuggestionsInput): Promise<AIQuerySuggestionsResult> {
	const config = resolveAIQuerySuggestionsConfig();
	const usage = await getAIUsageSnapshot({ section });
	const maxSuggestionsForCall = Math.min(
		maxSuggestions ?? config.maxSuggestionsPerCall,
		config.maxSuggestionsPerCall,
	);
	const guardrail = shouldRequestAIQuerySuggestions({
		config,
		discoveryPlan,
		availableStaticTemporaryQueriesCount,
		availableTopicMiningQueriesCount,
		usage,
	});

	if (!guardrail.ok) {
		if (config.enabled) {
			await logAIUsage({
				section,
				provider: config.provider,
				model: config.model,
				status: "skipped",
				reason: guardrail.reason,
			});
		}

		return {
			queries: [],
			skippedReason: guardrail.reason,
		};
	}

	const prompt = buildPrompt({
		section,
		topics,
		weakQueries,
		successfulQueries,
		maxSuggestions: maxSuggestionsForCall,
	});

	try {
		const result = await requestGeminiSuggestions({
			config,
			prompt,
			maxSuggestions: maxSuggestionsForCall,
		});
		const queries = validateAISuggestions({
			section,
			queries: result.queries,
			existingQueries,
			weakQueries,
			maxSuggestions: maxSuggestionsForCall,
		});

		await logAIUsage({
			section,
			provider: config.provider,
			model: config.model,
			status: "success",
			reason: `generated:${queries.length}`,
			inputTokens: result.inputTokens,
			outputTokens: result.outputTokens,
		});

		return { queries };
	} catch (error) {
		const message = getErrorMessage(error);

		await logAIUsage({
			section,
			provider: config.provider,
			model: config.model,
			status: "failed",
			reason: message,
		});

		return {
			queries: [],
			skippedReason: message,
		};
	}
}
