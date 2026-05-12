import { describe, expect, it, vi } from "vitest";

import type { GitHubRepo } from "@/lib/validations/github";
import type { DetectAgentSkillFilesResult } from "@/server/github/agent-skill-files";
import type { AgentSkillDetectionContext } from "@/server/repos/agent-skills-detection";
import { threeDMotionSection } from "@/server/sections/3d-motion";
import { agentSkillsSection } from "@/server/sections/agent-skills";
import { processGitHubRepoForSection } from "./repo.service";

function createRepo(overrides: Partial<GitHubRepo> = {}): GitHubRepo {
	return {
		id: 1,
		name: "agent-humanizer",
		full_name: "example/agent-humanizer",
		description: "Agent skill for improving writing.",
		html_url: "https://github.com/example/agent-humanizer",
		homepage: null,
		stargazers_count: 20,
		forks_count: 2,
		open_issues_count: 1,
		language: "Markdown",
		topics: ["agent", "skills"],
		archived: false,
		fork: false,
		license: null,
		owner: {
			login: "example",
			avatar_url: "https://github.com/example.png",
			html_url: "https://github.com/example",
		},
		default_branch: "main",
		created_at: "2026-01-01T00:00:00Z",
		updated_at: "2026-02-01T00:00:00Z",
		pushed_at: "2026-02-01T00:00:00Z",
		...overrides,
	};
}

function createDetectionContext(result: DetectAgentSkillFilesResult) {
	return {
		detectForRepo: vi.fn().mockResolvedValue(result),
		getStats: vi.fn().mockReturnValue({}),
	} as unknown as AgentSkillDetectionContext;
}

describe("processGitHubRepoForSection agent-skills detection", () => {
	it("accepts agent-skills repos only when a skill file is detected", async () => {
		const detectionContext = createDetectionContext({
			found: true,
			files: [
				{
					path: ".factory/skills/humanizer/SKILL.md",
					url: "https://github.com/example/agent-humanizer/blob/main/.factory/skills/humanizer/SKILL.md",
					fileName: "SKILL.md",
					skillName: "humanizer",
					confidence: "high",
				},
			],
		});

		const processed = await processGitHubRepoForSection({
			repo: createRepo(),
			strategy: agentSkillsSection,
			agentSkillDetectionContext: detectionContext,
			querySources: ["SKILL.md agent"],
		});

		expect(processed.isAccepted).toBe(true);
		expect(processed.rejectionReasons).not.toContain(
			"missing_agent_skill_file",
		);
		expect(processed.metadata.kind).toBe("agent-skills");

		if (processed.metadata.kind === "agent-skills") {
			expect(processed.metadata.skillDetected).toBe(true);
			expect(processed.metadata.skillFileUrl).toContain("SKILL.md");
			expect(processed.metadata.skillFiles).toHaveLength(1);
		}
	});

	it("rejects agent-skills repos without a detected skill file", async () => {
		const detectionContext = createDetectionContext({
			found: false,
			files: [],
		});

		const processed = await processGitHubRepoForSection({
			repo: createRepo(),
			strategy: agentSkillsSection,
			agentSkillDetectionContext: detectionContext,
			querySources: ["agent skill"],
		});

		expect(processed.isAccepted).toBe(false);
		expect(processed.rejectionReasons).toContain("missing_agent_skill_file");
		expect(processed.metadata.kind).toBe("agent-skills");

		if (processed.metadata.kind === "agent-skills") {
			expect(processed.metadata.skillDetected).toBe(false);
			expect(processed.metadata.skillFiles).toEqual([]);
			expect(processed.metadata.skillFileCount).toBe(0);
		}
	});

	it("does not call agent skill detection for 3d-motion repos", async () => {
		const detectionContext = createDetectionContext({
			found: true,
			files: [],
		});

		await processGitHubRepoForSection({
			repo: createRepo({
				name: "threejs-portfolio",
				full_name: "example/threejs-portfolio",
				description: "Interactive Three.js portfolio with shaders.",
				language: "TypeScript",
				topics: ["threejs", "webgl", "portfolio"],
			}),
			strategy: threeDMotionSection,
			agentSkillDetectionContext: detectionContext,
		});

		expect(detectionContext.detectForRepo).not.toHaveBeenCalled();
	});
});
