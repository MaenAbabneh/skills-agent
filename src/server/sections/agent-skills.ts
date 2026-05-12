import type { GitHubRepo } from "@/lib/validations/github";
import type {
	ClassificationSignal,
	RepoType,
	TypeScores,
} from "@/lib/validations/repos";
import { SECTION_CONFIGS } from "@/server/sections/sections.config";
import {
	clamp,
	getHealthMultiplier,
	roundScore,
	scoreDescriptionQuality,
	scoreForksLog,
	scoreFreshnessWeighted,
	scoreIssueHealth,
	scoreMomentum,
	scoreStarsLog,
	scoreTopicCompleteness,
} from "../common-scoring";
import type { ClassificationResult, SectionStrategy } from "./types";

function getRepoText(repo: GitHubRepo) {
	return [
		repo.name,
		repo.full_name,
		repo.description ?? "",
		repo.language ?? "",
		...(repo.topics ?? []),
	]
		.join(" ")
		.toLowerCase();
}

function includesAny(text: string, keywords: string[]) {
	return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}

function countMatches(text: string, keywords: string[]) {
	return keywords.filter((keyword) => text.includes(keyword.toLowerCase()))
		.length;
}

function createEmptyTypeScores(): TypeScores {
	return {
		portfolio: 0,
		showcase: 0,
		"interactive-experience": 0,
		visualization: 0,
		"creative-coding": 0,
		starter: 0,
		learning: 0,
		game: 0,

		"agent-skill": 0,
		"mcp-server": 0,
		"prompt-pack": 0,
		workflow: 0,
		"agent-tool": 0,
		"workflow-agent": 0,
		"browser-agent": 0,
		"coding-agent": 0,
		"agent-framework": 0,
		"automation-tool": 0,
		"llm-tool": 0,

		"ui-resource": 0,
		library: 0,
		tool: 0,
		unknown: 0,
	};
}

const positiveKeywords = [
	"agent",
	"agents",
	"ai agent",
	"agentic",
	"automation",
	"workflow",
	"mcp",
	"model context protocol",
	"tool calling",
	"tools",
	"skill",
	"skills",
	"plugin",
	"plugins",
	"assistant",
	"coding assistant",
	"browser agent",
	"autonomous",
	"multi-agent",
	"multi agent",
	"llm",
	"rag",
	"orchestration",
	"sdk",
	"server",
	"cli",
];

const negativeKeywords = [
	"portfolio",
	"landing page",
	"clone",
	"tutorial",
	"course",
	"homework",
	"demo-only",
	"game",
	"theme",
	"template",
];

const acceptedTypes: RepoType[] = [
	"agent-skill",
	"mcp-server",
	"agent-tool",
	"workflow-agent",
	"browser-agent",
	"coding-agent",
	"agent-framework",
	"automation-tool",
	"llm-tool",
	"workflow",
	"tool",
	"library",
];

function addSignal({
	scores,
	matchedSignals,
	type,
	source,
	keyword,
	points,
}: ClassificationSignal & {
	scores: TypeScores;
	matchedSignals: ClassificationSignal[];
}) {
	scores[type] = (scores[type] ?? 0) + points;
	matchedSignals.push({ type, source, keyword, points });
}

function classifyRepo(repo: GitHubRepo): ClassificationResult {
	const scores = createEmptyTypeScores();
	const matchedSignals: ClassificationSignal[] = [];
	const name = repo.name.toLowerCase();
	const description = (repo.description ?? "").toLowerCase();
	const topics = (repo.topics ?? []).map((topic) => topic.toLowerCase());
	const text = getRepoText(repo);

	for (const topic of topics) {
		if (topic === "mcp" || topic.includes("model-context-protocol")) {
			addSignal({
				scores,
				matchedSignals,
				type: "mcp-server",
				source: "topic",
				keyword: topic,
				points: 28,
			});
		}

		if (topic.includes("agent") || topic.includes("agentic")) {
			addSignal({
				scores,
				matchedSignals,
				type: "agent-tool",
				source: "topic",
				keyword: topic,
				points: 22,
			});
		}

		if (topic.includes("browser-agent")) {
			addSignal({
				scores,
				matchedSignals,
				type: "browser-agent",
				source: "topic",
				keyword: topic,
				points: 24,
			});
		}

		if (topic.includes("coding-agent") || topic.includes("coding-assistant")) {
			addSignal({
				scores,
				matchedSignals,
				type: "coding-agent",
				source: "topic",
				keyword: topic,
				points: 24,
			});
		}

		if (topic.includes("workflow") || topic.includes("automation")) {
			addSignal({
				scores,
				matchedSignals,
				type: "workflow-agent",
				source: "topic",
				keyword: topic,
				points: 18,
			});
		}

		if (topic.includes("framework") || topic.includes("multi-agent")) {
			addSignal({
				scores,
				matchedSignals,
				type: "agent-framework",
				source: "topic",
				keyword: topic,
				points: 18,
			});
		}
	}

	if (includesAny(name, ["mcp", "model-context-protocol"])) {
		addSignal({
			scores,
			matchedSignals,
			type: "mcp-server",
			source: "name",
			keyword: "mcp/model-context-protocol",
			points: 24,
		});
	}

	if (includesAny(name, ["agent", "agentic", "assistant"])) {
		addSignal({
			scores,
			matchedSignals,
			type: "agent-tool",
			source: "name",
			keyword: "agent/agentic/assistant",
			points: 18,
		});
	}

	if (includesAny(name, ["browser", "computer-use"])) {
		addSignal({
			scores,
			matchedSignals,
			type: "browser-agent",
			source: "name",
			keyword: "browser/computer-use",
			points: 16,
		});
	}

	if (includesAny(name, ["coding", "code", "developer"])) {
		addSignal({
			scores,
			matchedSignals,
			type: "coding-agent",
			source: "name",
			keyword: "coding/code/developer",
			points: 14,
		});
	}

	if (includesAny(name, ["workflow", "automation", "orchestration"])) {
		addSignal({
			scores,
			matchedSignals,
			type: "workflow-agent",
			source: "name",
			keyword: "workflow/automation/orchestration",
			points: 14,
		});
	}

	if (includesAny(description, ["mcp server", "model context protocol"])) {
		addSignal({
			scores,
			matchedSignals,
			type: "mcp-server",
			source: "description",
			keyword: "mcp server/model context protocol",
			points: 24,
		});
	}

	if (
		includesAny(description, [
			"ai agent",
			"agent framework",
			"agentic workflow",
			"autonomous agent",
			"tool calling",
			"llm tool",
		])
	) {
		addSignal({
			scores,
			matchedSignals,
			type: "agent-framework",
			source: "description",
			keyword: "ai-agent/agent-framework/tool-calling",
			points: 20,
		});
	}

	if (includesAny(description, ["browser agent", "browser automation"])) {
		addSignal({
			scores,
			matchedSignals,
			type: "browser-agent",
			source: "description",
			keyword: "browser agent/browser automation",
			points: 18,
		});
	}

	if (includesAny(description, ["coding agent", "coding assistant"])) {
		addSignal({
			scores,
			matchedSignals,
			type: "coding-agent",
			source: "description",
			keyword: "coding agent/coding assistant",
			points: 18,
		});
	}

	if (includesAny(description, ["workflow automation", "automation toolkit"])) {
		addSignal({
			scores,
			matchedSignals,
			type: "automation-tool",
			source: "description",
			keyword: "workflow automation/automation toolkit",
			points: 16,
		});
	}

	if (includesAny(description, ["skill", "plugin", "tool"])) {
		addSignal({
			scores,
			matchedSignals,
			type: "agent-skill",
			source: "description",
			keyword: "skill/plugin/tool",
			points: 10,
		});
	}

	if (includesAny(text, ["sdk", "cli", "server"])) {
		addSignal({
			scores,
			matchedSignals,
			type: "agent-tool",
			source: "text",
			keyword: "sdk/cli/server",
			points: 6,
		});
	}

	if (includesAny(text, ["rag", "memory", "vector database"])) {
		addSignal({
			scores,
			matchedSignals,
			type: "llm-tool",
			source: "text",
			keyword: "rag/memory/vector database",
			points: 8,
		});
	}

	const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]) as [
		RepoType,
		number,
	][];
	const bestEntry = sorted[0];
	const secondBestScore = sorted[1]?.[1] ?? 0;

	if (!bestEntry || bestEntry[1] < 10) {
		return {
			repoType: "unknown",
			confidence: 0,
			matchedSignals,
			typeScores: scores,
		};
	}

	const [repoType, bestScore] = bestEntry;
	const confidenceByStrength = clamp(bestScore / 45, 0, 1);
	const confidenceByMargin =
		bestScore <= 0 ? 0 : clamp((bestScore - secondBestScore) / bestScore, 0, 1);

	return {
		repoType,
		confidence: Number(
			(confidenceByStrength * 0.65 + confidenceByMargin * 0.35).toFixed(2),
		),
		matchedSignals,
		typeScores: scores,
	};
}

function calculateSectionRelevance(
	repo: GitHubRepo,
	classification: ClassificationResult,
) {
	const text = getRepoText(repo);
	const positiveMatches = countMatches(text, positiveKeywords);
	const negativeMatches = countMatches(text, negativeKeywords);

	let score = Math.min(positiveMatches, 8) * 3;

	if (acceptedTypes.includes(classification.repoType)) {
		score += 8;
	}

	if (classification.confidence >= 0.7) {
		score += 3;
	} else if (classification.confidence < 0.3) {
		score -= 4;
	}

	score -= Math.min(negativeMatches, 4) * 3;

	return clamp(score, 0, 30);
}

function calculateUsefulness(repo: GitHubRepo, repoType: RepoType) {
	let score = 0;

	score += scoreDescriptionQuality(repo.description, 5);
	score += scoreTopicCompleteness(repo.topics ?? [], 4);

	if (repo.language) {
		score += 2;
	}

	if (repo.homepage?.trim()) {
		score += 2;
	}

	if (
		repoType === "mcp-server" ||
		repoType === "agent-framework" ||
		repoType === "agent-tool"
	) {
		score += 5;
	} else if (
		repoType === "workflow-agent" ||
		repoType === "browser-agent" ||
		repoType === "coding-agent"
	) {
		score += 4;
	}

	return clamp(score, 0, 20);
}

function calculatePopularity(repo: GitHubRepo) {
	const stars = scoreStarsLog(repo.stargazers_count, 10);
	const forks = scoreForksLog(repo.forks_count, 3);
	const license = repo.license ? 2 : 0;

	return clamp(stars + forks + license, 0, 15);
}

function calculateMomentum(repo: GitHubRepo) {
	return scoreMomentum({
		stars: repo.stargazers_count,
		createdAt: repo.created_at,
		maxScore: 10,
	});
}

function calculateMaintenance(repo: GitHubRepo) {
	const freshness = scoreFreshnessWeighted(repo.pushed_at, 7);
	const issueHealth = scoreIssueHealth({
		stars: repo.stargazers_count,
		openIssues: repo.open_issues_count,
		maxScore: 5,
	});
	const repoState = repo.archived ? 0 : repo.fork ? 1 : 3;

	return clamp(freshness + issueHealth + repoState, 0, 15);
}

function calculateCompleteness(repo: GitHubRepo) {
	let score = 0;

	if (repo.language) score += 2;
	if ((repo.topics ?? []).length > 0) score += 2;
	if (repo.description && repo.description.trim().length >= 30) score += 3;
	if (repo.default_branch) score += 1;
	if (repo.license) score += 2;

	return clamp(score, 0, 10);
}

function getSpecificRejectionReasons({
	repo,
	relevance,
	repoType,
	classification,
}: {
	repo: GitHubRepo;
	relevance: number;
	repoType: RepoType;
	classification: ClassificationResult;
}) {
	const reasons: string[] = [];
	const text = getRepoText(repo);
	const positiveMatches = countMatches(text, positiveKeywords);
	const negativeMatches = countMatches(text, negativeKeywords);

	if (positiveMatches === 0) {
		reasons.push("missing_agent_skill_signal");
	}

	if (negativeMatches >= 2 && positiveMatches < 2) {
		reasons.push("mostly_non_agent_content");
	}

	if (!acceptedTypes.includes(repoType)) {
		reasons.push(`wrong_repo_type_${repoType}`);
	}

	if (classification.confidence < 0.2) {
		reasons.push("low_classification_confidence");
	}

	if (relevance <= 0) {
		reasons.push("low_relevance");
	}

	return reasons;
}

export const agentSkillsSection = {
	id: "agent-skills",
	label: "Agent Skills",
	description: SECTION_CONFIGS["agent-skills"].description,

	perPage: 100,

	minStars: 1,
	minScore: 55,

	queries: SECTION_CONFIGS["agent-skills"].defaultQueries,
	discoveryQueries: SECTION_CONFIGS["agent-skills"].defaultQueries,

	discoveryConfig: {
		enabled: true,
		perPage: 100,
		maxCandidateMultiplier: 3,
		maxVariantsPerRun: 8,
		minSearchRemaining: 3,
		sortModes: ["updated", "stars"],
		pushedWithinDays: [7, 30],
		createdWithinDays: [30, 90],
		starRanges: [
			{ min: 1, max: 20 },
			{ min: 20, max: 100 },
			{ min: 100, max: 500 },
		],
		pages: [1, 2],
		enableRelaxedFallback: true,
	},

	classifyRepo,

	calculateScore(repo: GitHubRepo, classification: ClassificationResult) {
		const repoType = classification.repoType;
		const relevance = calculateSectionRelevance(repo, classification);
		const usefulness = calculateUsefulness(repo, repoType);
		const popularity = calculatePopularity(repo);
		const momentum = calculateMomentum(repo);
		const maintenance = calculateMaintenance(repo);
		const completeness = calculateCompleteness(repo);
		const demoMultiplier = 1;
		const healthMultiplier = getHealthMultiplier(repo);
		const baseTotal =
			relevance +
			usefulness +
			popularity +
			momentum +
			maintenance +
			completeness;
		const total = roundScore(baseTotal * demoMultiplier * healthMultiplier);

		return {
			score: total,
			scoreBreakdown: {
				relevance,
				usefulness,
				popularity,
				momentum,
				maintenance,
				completeness,
				demoMultiplier,
				healthMultiplier,
				baseTotal: roundScore(baseTotal),
				total,
			},
		};
	},

	getRejectionReasons({ repo, relevance, repoType, classification }) {
		return getSpecificRejectionReasons({
			repo,
			relevance,
			repoType,
			classification,
		});
	},
} satisfies SectionStrategy;
