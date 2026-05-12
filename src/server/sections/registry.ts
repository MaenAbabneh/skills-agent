import { threeDMotionSection } from "./3d-motion";
import { agentSkillsSection } from "./agent-skills";
import type { SectionId } from "./sections.config";
import type { SectionStrategy } from "./types";

export const sectionRegistry = {
	"3d-motion": threeDMotionSection,
	"agent-skills": agentSkillsSection,
} satisfies Record<SectionId, SectionStrategy>;

export function getSectionStrategy(section: string): SectionStrategy {
	const key = section as SectionId;
	const strategy = sectionRegistry[key] as unknown as SectionStrategy;

	if (!strategy) {
		throw new Error(`Section strategy not found for "${section}"`);
	}

	return strategy;
}
