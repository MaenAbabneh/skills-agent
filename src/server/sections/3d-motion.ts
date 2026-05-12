import type { GitHubRepo } from "@/lib/validations/github";
import type {
	ClassificationSignal,
	RepoType,
	TypeScores,
} from "@/lib/validations/repos";
import {
	clamp,
	getDemoMultiplier,
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

function hasExactTopic(topics: string[], values: string[]) {
	return topics.some((topic) => values.includes(topic));
}

function hasTopicContaining(topics: string[], values: string[]) {
	return topics.some((topic) => values.some((value) => topic.includes(value)));
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

const relevanceKeywords = [
	"3d",
	"threejs",
	"three.js",
	"webgpu",
	"react-three-fiber",
	"r3f",
	"webgl",
	"gsap",
	"framer-motion",
	"interactive",
	"experience",
	"visualization",
	"visualisation",
	"creative coding",
	"portfolio",
	"website",
	"landing",
	"clone",
	"showcase",
	"awwwards",
	"scroll",
	"canvas",
	"shader",
	"simulation",
];

const strongTechKeywords = [
	"threejs",
	"three.js",
	"react-three-fiber",
	"r3f",
	"webgl",
	"webgpu",
	"gsap",
];

const weakTechKeywords = ["framer-motion", "3d"];

const projectSignals = [
	"website",
	"portfolio",
	"landing",
	"clone",
	"showcase",
	"interactive",
	"experience",
	"visualization",
	"visualisation",
	"creative coding",
	"experiment",
	"project",
	"demo",
	"game",
	"simulation",
	"city",
	"map",
	"world",
	"space",
];

function hasStrongProjectPurposeSignal({
	name,
	description,
	topics,
	text,
}: {
	name: string;
	description: string;
	topics: string[];
	text: string;
}) {
	const projectTopics = [
		"portfolio",
		"website",
		"landing-page",
		"showcase",
		"demo",
		"visualization",
		"visualisation",
		"creative-coding",
		"generative-art",
		"game",
		"threejs-portfolio",
		"webgl-demo",
		"webgl-experiment",
		"webgpu-demo",
		"webgpu-experiment",
	];

	const projectNameSignals = [
		"portfolio",
		"website",
		"landing",
		"clone",
		"demo",
		"showcase",
		"experience",
		"visualization",
		"visualisation",
		"game",
		"city",
		"map",
		"world",
		"space",
	];

	const projectDescriptionSignals = [
		"portfolio website",
		"personal website",
		"landing page",
		"interactive website",
		"interactive experience",
		"web experience",
		"3d website",
		"3d portfolio",
		"webgl experience",
		"webgpu experience",
		"creative coding",
		"data visualization",
		"github profile as",
		"built a clone",
		"website clone",
		"demo project",
	];

	return (
		hasExactTopic(topics, projectTopics) ||
		includesAny(name, projectNameSignals) ||
		includesAny(description, projectDescriptionSignals) ||
		includesAny(text, ["live demo", "deployed demo", "interactive demo"])
	);
}

function hasStrongUiResourceSignal({
	name,
	description,
	topics,
}: {
	name: string;
	description: string;
	topics: string[];
}) {
	const uiTopics = [
		"ui-library",
		"component-library",
		"components-library",
		"react-components",
		"ui-components",
		"design-system",
		"component-registry",
		"shadcn",
		"tailwind-components",
	];

	const uiNameSignals = [
		"ui-kit",
		"component-library",
		"components-library",
		"component-registry",
		"design-system",
	];

	const uiDescriptionPhrases = [
		"component library",
		"ui library",
		"ui components",
		"react components",
		"collection of components",
		"components you can install",
		"copy and paste components",
		"component registry",
		"component distribution",
		"design system",
		"shadcn cli",
	];

	return (
		hasTopicContaining(topics, uiTopics) ||
		includesAny(name, uiNameSignals) ||
		includesAny(description, uiDescriptionPhrases)
	);
}

function isUsageMention({
	name,
	description,
	topics,
}: {
	name: string;
	description: string;
	topics: string[];
}) {
	const usagePhrases = [
		"built with",
		"powered by",
		"using ",
		"using:",
		"made with",
		"created with",
		"demo using",
		"example of",
		"how to use",
	];

	if (includesAny(name, ["example", "demo", "sample", "playground"])) {
		return true;
	}

	if (includesAny(description, usagePhrases)) {
		return true;
	}

	if (hasExactTopic(topics, ["example", "demo", "sample", "playground"])) {
		return true;
	}

	return false;
}

function hasStrongLibrarySignal({
	name,
	description,
	topics,
}: {
	name: string;
	description: string;
	topics: string[];
}) {
	const libraryTopics = [
		"library",
		"framework",
		"engine",
		"sdk",
		"toolkit",
		"npm-package",
		"package",
	];

	const libraryNameSignals = [
		"library",
		"framework",
		"engine",
		"sdk",
		"toolkit",
	];

	const libraryDescriptionPhrases = [
		"javascript library",
		"typescript library",
		"animation library",
		"a library for",
		"framework for",
		"engine for",
		"rendering engine",
		"game engine",
		"physics engine",
		"sdk for",
		"toolkit for",
		"npm package",
		"build tool",
		"bundler",
		"compiler",
	];

	const hasStrongTopic = hasExactTopic(topics, libraryTopics);
	const hasStrongName = includesAny(name, libraryNameSignals);

	if (hasStrongTopic || hasStrongName) {
		return true;
	}

	if (isUsageMention({ name, description, topics })) {
		return false;
	}

	return includesAny(description, libraryDescriptionPhrases);
}

function hasStrongToolSignal({
	name,
	description,
	topics,
}: {
	name: string;
	description: string;
	topics: string[];
}) {
	const toolTopics = [
		"cli",
		"developer-tools",
		"devtools",
		"generator",
		"utility",
		"tool",
	];

	const toolNameSignals = ["cli", "generator", "devtool", "devtools"];

	const toolDescriptionPhrases = [
		"command line tool",
		"developer tool",
		"code generator",
		"cli tool",
		"utility for",
		"tool for generating",
	];

	const hasStrongTopic = hasExactTopic(topics, toolTopics);
	const hasStrongName = includesAny(name, toolNameSignals);

	if (hasStrongTopic || hasStrongName) {
		return true;
	}

	if (isUsageMention({ name, description, topics })) {
		return false;
	}

	return includesAny(description, toolDescriptionPhrases);
}

function classifyRepo(repo: GitHubRepo): ClassificationResult {
	const scores = createEmptyTypeScores();
	const matchedSignals: ClassificationSignal[] = [];

	const name = repo.name.toLowerCase();
	const description = (repo.description ?? "").toLowerCase();
	const topics = (repo.topics ?? []).map((topic) => topic.toLowerCase());
	const text = getRepoText(repo);

	function addSignal({ type, source, keyword, points }: ClassificationSignal) {
		scores[type] = (scores[type] ?? 0) + points;

		matchedSignals.push({
			type,
			source,
			keyword,
			points,
		});
	}

	function addTopicSignal(
		topic: string,
		type: RepoType,
		keyword: string,
		points: number,
	) {
		if (topic === keyword || topic.includes(keyword)) {
			addSignal({
				type,
				source: "topic",
				keyword,
				points,
			});
		}
	}

	for (const topic of topics) {
		addTopicSignal(topic, "portfolio", "portfolio", 22);
		addTopicSignal(topic, "game", "game", 22);

		addTopicSignal(topic, "visualization", "visualization", 22);
		addTopicSignal(topic, "visualization", "visualisation", 22);

		addTopicSignal(topic, "creative-coding", "creative-coding", 22);
		addTopicSignal(topic, "creative-coding", "generative-art", 18);

		addTopicSignal(topic, "starter", "starter", 20);
		addTopicSignal(topic, "starter", "template", 20);

		addTopicSignal(topic, "learning", "tutorial", 20);
		addTopicSignal(topic, "learning", "education", 20);

		addTopicSignal(topic, "showcase", "landing-page", 16);

		addTopicSignal(topic, "interactive-experience", "interactive", 16);
		addTopicSignal(topic, "interactive-experience", "threejs", 10);
		addTopicSignal(topic, "interactive-experience", "webgl", 10);
		addTopicSignal(topic, "interactive-experience", "webgpu", 10);
		addTopicSignal(topic, "interactive-experience", "react-three-fiber", 10);
	}

	if (name.includes("portfolio")) {
		addSignal({
			type: "portfolio",
			source: "name",
			keyword: "portfolio",
			points: 18,
		});
	}

	if (name.includes("clone")) {
		addSignal({
			type: "showcase",
			source: "name",
			keyword: "clone",
			points: 16,
		});
	}

	if (name.includes("starter") || name.includes("boilerplate")) {
		addSignal({
			type: "starter",
			source: "name",
			keyword: name.includes("starter") ? "starter" : "boilerplate",
			points: 18,
		});
	}

	if (
		name.includes("learn") ||
		name.includes("course") ||
		name.includes("tutorial")
	) {
		addSignal({
			type: "learning",
			source: "name",
			keyword: "learn/course/tutorial",
			points: 18,
		});
	}

	if (
		name.includes("city") ||
		name.includes("map") ||
		name.includes("visualization")
	) {
		addSignal({
			type: "visualization",
			source: "name",
			keyword: "city/map/visualization",
			points: 18,
		});
	}

	if (name.includes("game")) {
		addSignal({
			type: "game",
			source: "name",
			keyword: "game",
			points: 18,
		});
	}

	if (name.includes("shader") || name.includes("generative")) {
		addSignal({
			type: "creative-coding",
			source: "name",
			keyword: "shader/generative",
			points: 16,
		});
	}

	if (includesAny(description, ["portfolio", "personal website"])) {
		addSignal({
			type: "portfolio",
			source: "description",
			keyword: "portfolio/personal website",
			points: 12,
		});
	}

	if (
		includesAny(description, [
			"landing page",
			"clone",
			"showcase",
			"awwwards",
			"scroll",
		])
	) {
		addSignal({
			type: "showcase",
			source: "description",
			keyword: "landing/clone/showcase",
			points: 12,
		});
	}

	if (
		includesAny(description, [
			"interactive",
			"experience",
			"simulation",
			"world",
			"space",
		])
	) {
		addSignal({
			type: "interactive-experience",
			source: "description",
			keyword: "interactive/experience/simulation",
			points: 10,
		});
	}

	if (
		includesAny(description, [
			"visualization",
			"visualisation",
			"map",
			"graph",
			"github profile",
			"data visualization",
			"city",
		])
	) {
		addSignal({
			type: "visualization",
			source: "description",
			keyword: "visualization/map/graph/city",
			points: 12,
		});
	}

	if (
		includesAny(description, [
			"creative coding",
			"generative",
			"shader",
			"experiment",
			"webgl experiment",
			"webgpu experiment",
		])
	) {
		addSignal({
			type: "creative-coding",
			source: "description",
			keyword: "creative/generative/shader/experiment",
			points: 12,
		});
	}

	if (includesAny(description, ["tutorial", "course", "workshop", "learn"])) {
		addSignal({
			type: "learning",
			source: "description",
			keyword: "tutorial/course/workshop/learn",
			points: 12,
		});
	}

	if (includesAny(description, ["starter", "template", "boilerplate"])) {
		addSignal({
			type: "starter",
			source: "description",
			keyword: "starter/template/boilerplate",
			points: 12,
		});
	}

	if (includesAny(description, ["game", "video game"])) {
		addSignal({
			type: "game",
			source: "description",
			keyword: "game/video game",
			points: 12,
		});
	}

	const hasProjectPurpose = hasStrongProjectPurposeSignal({
		name,
		description,
		topics,
		text,
	});

	const strongUiResourceSignal = hasStrongUiResourceSignal({
		name,
		description,
		topics,
	});

	const strongLibrarySignal = hasStrongLibrarySignal({
		name,
		description,
		topics,
	});

	const strongToolSignal = hasStrongToolSignal({
		name,
		description,
		topics,
	});

	if (strongUiResourceSignal) {
		addSignal({
			type: "ui-resource",
			source: "system",
			keyword: "strong_ui_resource_signal",
			points: hasProjectPurpose ? 18 : 42,
		});
	}

	if (strongLibrarySignal) {
		addSignal({
			type: "library",
			source: "system",
			keyword: "strong_library_signal",
			points: hasProjectPurpose ? 14 : 36,
		});
	}

	if (strongToolSignal) {
		addSignal({
			type: "tool",
			source: "system",
			keyword: "strong_tool_signal",
			points: hasProjectPurpose ? 12 : 28,
		});
	}

	if (includesAny(text, ["website", "demo", "project"])) {
		addSignal({
			type: "showcase",
			source: "text",
			keyword: "website/demo/project",
			points: 4,
		});
	}

	if (includesAny(text, ["interactive", "3d", "webgl", "webgpu", "threejs"])) {
		addSignal({
			type: "interactive-experience",
			source: "text",
			keyword: "interactive/3d/webgl/webgpu/threejs",
			points: 4,
		});
	}

	const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]) as [
		RepoType,
		number,
	][];

	const bestEntry = sorted[0];
	const secondEntry = sorted[1];

	if (!bestEntry) {
		return {
			repoType: "unknown",
			confidence: 0,
			matchedSignals,
			typeScores: scores,
		};
	}

	const [bestType, bestScore] = bestEntry;
	const secondBestScore = secondEntry?.[1] ?? 0;

	if (bestScore < 10) {
		return {
			repoType: "unknown",
			confidence: 0,
			matchedSignals,
			typeScores: scores,
		};
	}

	const confidenceByStrength = clamp(bestScore / 40, 0, 1);
	const confidenceByMargin =
		bestScore <= 0 ? 0 : clamp((bestScore - secondBestScore) / bestScore, 0, 1);

	const confidence = Number(
		(confidenceByStrength * 0.6 + confidenceByMargin * 0.4 || 0).toFixed(2),
	);

	return {
		repoType: bestType,
		confidence,
		matchedSignals,
		typeScores: scores,
	};
}

function calculateSectionRelevance(
	repo: GitHubRepo,
	classification: ClassificationResult,
) {
	const text = getRepoText(repo);
	const repoType = classification.repoType;

	const keywordMatches = countMatches(text, relevanceKeywords);

	const hasStrongTechSignal = includesAny(text, strongTechKeywords);
	const hasWeakTechSignal = includesAny(text, weakTechKeywords);
	const hasProjectSignal = includesAny(text, projectSignals);

	let score = 0;

	if (hasStrongTechSignal) score += 10;
	else if (hasWeakTechSignal) score += 4;

	if (hasProjectSignal) score += 8;

	if (
		repoType === "interactive-experience" ||
		repoType === "visualization" ||
		repoType === "creative-coding"
	) {
		score += 8;
	} else if (repoType === "portfolio" || repoType === "showcase") {
		score += 6;
	} else if (
		repoType === "starter" ||
		repoType === "learning" ||
		repoType === "game"
	) {
		score += 5;
	}

	score += Math.min(keywordMatches, 4);

	if (classification.confidence >= 0.75) score += 2;
	else if (classification.confidence < 0.35) score -= 3;

	return clamp(score, 0, 30);
}

function calculateUsefulness(repo: GitHubRepo, repoType: RepoType) {
	let score = 0;

	if (repo.homepage?.trim()) score += 7;

	score += scoreDescriptionQuality(repo.description, 4);
	score += scoreTopicCompleteness(repo.topics ?? [], 3);

	if (
		repoType === "interactive-experience" ||
		repoType === "visualization" ||
		repoType === "creative-coding"
	) {
		score += 4;
	}

	if (repoType === "starter" || repoType === "learning") {
		score += 5;
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

	if (repo.homepage?.trim()) score += 3;
	if (repo.language) score += 2;
	if ((repo.topics ?? []).length > 0) score += 2;
	if (repo.description && repo.description.trim().length >= 30) score += 2;
	if (repo.default_branch) score += 1;

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

	const acceptedTypes: RepoType[] = [
		"portfolio",
		"showcase",
		"interactive-experience",
		"visualization",
		"creative-coding",
		"starter",
		"learning",
		"game",
	];

	const hasStrongTechSignal = includesAny(text, strongTechKeywords);
	const hasWeakTechSignal = includesAny(text, weakTechKeywords);
	const hasProjectSignal = includesAny(text, projectSignals);

	const name = repo.name.toLowerCase();
	const description = (repo.description ?? "").toLowerCase();
	const topics = (repo.topics ?? []).map((topic) => topic.toLowerCase());

	const hasProjectPurpose = hasStrongProjectPurposeSignal({
		name,
		description,
		topics,
		text,
	});

	if (!hasProjectSignal && !hasProjectPurpose) {
		reasons.push("missing_project_signal");
	}

	if (!hasStrongTechSignal && !(hasWeakTechSignal && relevance >= 12)) {
		reasons.push("missing_strong_3d_motion_tech_signal");
	}

	if (!acceptedTypes.includes(repoType)) {
		if (!(hasProjectPurpose && relevance >= 12)) {
			reasons.push(`wrong_repo_type_${repoType}`);
		}
	}

	if (classification.confidence < 0.25) {
		reasons.push("low_classification_confidence");
	}

	if (relevance <= 0) {
		reasons.push("low_relevance");
	}

	return reasons;
}

export const threeDMotionSection = {
	id: "3d-motion",
	label: "Interactive 3D Web Projects",
	description:
		"Open-source 3D websites, interactive web experiences, creative coding projects, animated landing pages, and visual experiments.",

	perPage: 20,

	minStars: 20,
	minScore: 60,

	queries: [
		"interactive 3d website stars:>20",
		"threejs portfolio stars:>20",
		"webgl interactive project stars:>20",
		"creative coding threejs stars:>20",
		"3d visualization github stars:>20",
		"gsap landing page threejs stars:>20",
		"threejs website clone stars:>20",
		"react three fiber portfolio stars:>20",
	],

	discoveryQueries: [
		"threejs portfolio",
		"react three fiber portfolio",
		"r3f portfolio",
		"webgl portfolio",
		"3d portfolio website",

		"interactive 3d website",
		"interactive webgl experience",
		"immersive web threejs",
		"web experience threejs",
		"3d web experience",

		"webgl visualization",
		"threejs visualization",
		"3d data visualization",
		"interactive map webgl",
		"3d city visualization",

		"creative coding webgl",
		"creative coding threejs",
		"shader experiment webgl",
		"generative art threejs",
		"webgpu experiment",

		"gsap animated website",
		"threejs landing page",
		"awwwards threejs",
		"scroll animation threejs",
		"website clone threejs",

		"threejs game",
		"webgl game",
		"3d simulation webgl",
		"physics simulation threejs",
	],

	discoveryConfig: {
		enabled: true,

		perPage: 20,

		maxCandidateMultiplier: 3,

		maxVariantsPerRun: 12,

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

		const demoMultiplier = getDemoMultiplier(repo);
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
