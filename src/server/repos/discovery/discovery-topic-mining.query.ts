import { and, eq, gte, or } from "drizzle-orm";
import type { RepoSection } from "@/lib/validations/repos";
import { db } from "@/server/db";
import { repoSections, repositories } from "@/server/db/schema";
import type { SectionId } from "@/server/sections/sections.config";

export type TopicMiningResult = {
	topic: string;
	count: number;
};

const GENERIC_TOPICS = new Set([
	"javascript",
	"typescript",
	"react",
	"html",
	"css",
	"frontend",
	"website",
	"app",
	"tailwind",
	"tailwindcss",
	"nextjs",
	"next-js",
	"vite",
	"python",
	"node",
	"api",
	"openai",
	"template",
]);

const AGENT_GENERIC_TOPICS = new Set([
	"javascript",
	"typescript",
	"python",
	"react",
	"node",
	"api",
	"openai",
	"app",
	"website",
	"template",
]);

const AGENT_STRONG_TOPICS = new Set([
	"agent",
	"ai-agent",
	"skill",
	"skills",
	"agent-skills",
	"assistant",
	"coding-agent",
	"claude",
	"cursor",
	"factory",
	"agents",
]);

const TOPIC_QUERY_COMPANIONS: Record<string, string[]> = {
	threejs: ["portfolio", "shader"],
	"three-js": ["portfolio", "shader"],
	webgl: ["creative-coding", "experiment"],
	webgpu: ["experiment", "visualization"],
	shader: ["threejs", "webgl"],
	glsl: ["webgl", "shader"],
	"react-three-fiber": ["drei", "portfolio"],
	r3f: ["physics", "portfolio"],
	drei: ["react-three-fiber", "threejs"],
	rapier: ["game", "physics"],
	gsap: ["scrolltrigger", "animation"],
	"generative-art": ["threejs", "webgl"],
	"creative-coding": ["webgl", "threejs"],
};

const AGENT_TOPIC_QUERY_COMPANIONS: Record<string, string[]> = {
	agent: ["skill"],
	"ai-agent": ["skill"],
	skill: ["agent"],
	skills: ["agent"],
	"agent-skills": ["SKILL.md"],
	assistant: ["skill file"],
	"coding-agent": ["SKILL.md"],
	claude: ["skill repository"],
	cursor: ["skill repository"],
	factory: ["skills SKILL.md"],
	agents: ["skill"],
};

function normalizeTopic(topic: string) {
	return topic.trim().toLowerCase();
}

function isUsefulTopic(topic: string, section: SectionId = "3d-motion") {
	const normalizedTopic = normalizeTopic(topic);

	if (normalizedTopic.length <= 1) {
		return false;
	}

	if (section === "agent-skills") {
		return (
			AGENT_STRONG_TOPICS.has(normalizedTopic) ||
			(!AGENT_GENERIC_TOPICS.has(normalizedTopic) &&
				(normalizedTopic.includes("agent") ||
					normalizedTopic.includes("skill") ||
					normalizedTopic.includes("assistant")))
		);
	}

	return !GENERIC_TOPICS.has(normalizedTopic);
}

export async function getTopTopicsFromAcceptedRepos({
	section,
	limit = 30,
	sinceDays = 60,
}: {
	section: RepoSection;
	limit?: number;
	sinceDays?: number;
}): Promise<TopicMiningResult[]> {
	const since = new Date();
	since.setDate(since.getDate() - sinceDays);

	const rows = await db
		.select({
			topics: repositories.topics,
		})
		.from(repoSections)
		.innerJoin(repositories, eq(repoSections.repoId, repositories.id))
		.where(
			and(
				eq(repoSections.section, section),
				gte(repoSections.createdAt, since),
				or(
					eq(repoSections.isAccepted, true),
					eq(repoSections.status, "approved"),
				),
			),
		);

	const counts = new Map<string, number>();

	for (const row of rows) {
		for (const topic of row.topics) {
			const normalizedTopic = normalizeTopic(topic);

			if (!isUsefulTopic(normalizedTopic, section)) {
				continue;
			}

			counts.set(normalizedTopic, (counts.get(normalizedTopic) ?? 0) + 1);
		}
	}

	return Array.from(counts.entries())
		.map(([topic, count]) => ({ topic, count }))
		.sort((a, b) => {
			if (b.count !== a.count) {
				return b.count - a.count;
			}

			return a.topic.localeCompare(b.topic);
		})
		.slice(0, limit);
}

export function generateTopicMiningQueries({
	section = "3d-motion",
	topics,
	maxQueries = 10,
}: {
	section?: SectionId;
	topics: TopicMiningResult[];
	maxQueries?: number;
}) {
	const queries: string[] = [];
	const seen = new Set<string>();

	for (const { topic } of topics) {
		const normalizedTopic = normalizeTopic(topic);

		if (!isUsefulTopic(normalizedTopic, section)) {
			continue;
		}

		const companions =
			section === "agent-skills"
				? (AGENT_TOPIC_QUERY_COMPANIONS[normalizedTopic] ?? ["skill"])
				: (TOPIC_QUERY_COMPANIONS[normalizedTopic] ?? ["threejs", "portfolio"]);

		for (const companion of companions) {
			const query = `topic:${normalizedTopic} ${companion}`.trim();

			if (seen.has(query)) {
				continue;
			}

			seen.add(query);
			queries.push(query);

			if (queries.length >= maxQueries) {
				return queries;
			}
		}
	}

	return queries;
}
