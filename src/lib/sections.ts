export const SECTION_IDS = ["3d-motion", "agent-skills"] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export type SectionConfig = {
	id: SectionId;
	label: string;
	description: string;
	defaultQueries: string[];
};

const THREE_D_MOTION_DEFAULT_QUERIES = [
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
] as const;

const AGENT_SKILLS_DEFAULT_QUERIES = [
	"agent skill",
	"agent skills",
	"skill.md agent",
	"SKILL.md agent",
	"coding agent skill",
	"ai agent skill",
	"claude skill",
	"cursor skill",
	"factory skills",
	"skills directory agent",
	"agent skill markdown",
	"skill file agent",
] as const;

export const SECTION_CONFIGS: Record<SectionId, SectionConfig> = {
	"3d-motion": {
		id: "3d-motion",
		label: "3D Motion",
		description: "Interactive 3D web projects and animated experiences.",
		defaultQueries: [...THREE_D_MOTION_DEFAULT_QUERIES],
	},
	"agent-skills": {
		id: "agent-skills",
		label: "Agent Skills",
		description:
			"Repositories containing agent skill definition files such as SKILL.md, skill.md, or skills.md.",
		defaultQueries: [...AGENT_SKILLS_DEFAULT_QUERIES],
	},
};

export const SECTION_OPTIONS = SECTION_IDS.map((id) => ({
	value: id,
	label: SECTION_CONFIGS[id].label,
	description: SECTION_CONFIGS[id].description,
}));

export function isSectionId(value: unknown): value is SectionId {
	return typeof value === "string" && SECTION_IDS.includes(value as SectionId);
}

export function normalizeSectionId(value: unknown): SectionId {
	return isSectionId(value) ? value : "3d-motion";
}
