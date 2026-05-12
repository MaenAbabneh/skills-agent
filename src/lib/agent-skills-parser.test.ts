import { describe, expect, it } from "vitest";
import { parseAgentSkillMarkdown } from "./agent-skills-parser";

describe("parseAgentSkillMarkdown", () => {
	it("should parse standard YAML frontmatter", () => {
		const markdown = `---
name: "Test Skill"
description: "A description of the test skill"
user-invocable: true
allowed-tools:
  - tool1
  - tool2
---
# Test Skill
Some content here.
`;
		const result = parseAgentSkillMarkdown(markdown);
		expect(result).toEqual({
			name: "Test Skill",
			description: "A description of the test skill",
			userInvocable: true,
			allowedTools: ["tool1", "tool2"],
		});
	});

	it("should parse inline allowed-tools", () => {
		const markdown = `---
name: "Inline Skill"
allowed-tools: ["test", "another"]
---
`;
		const result = parseAgentSkillMarkdown(markdown);
		expect(result.allowedTools).toEqual(["test", "another"]);
	});

	it("should extract description from first paragraph if missing in frontmatter", () => {
		const markdown = `---
name: "No Desc Skill"
---
# Heading

This is the first paragraph.
It spans multiple lines.

This is the second paragraph.
`;
		const result = parseAgentSkillMarkdown(markdown);
		expect(result.description).toBe(
			"This is the first paragraph. It spans multiple lines.",
		);
	});

	it("should return empty object for empty markdown", () => {
		expect(parseAgentSkillMarkdown("")).toEqual({});
	});
});
