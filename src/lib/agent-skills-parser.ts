export type ParsedAgentSkill = {
	name?: string;
	description?: string;
	allowedTools?: string[];
	userInvocable?: boolean;
};

export function parseAgentSkillMarkdown(markdown: string): ParsedAgentSkill {
	const result: ParsedAgentSkill = {};

	if (!markdown) {
		return result;
	}

	// 1. Try to extract YAML frontmatter
	const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---/);
	if (frontmatterMatch) {
		const yamlBlock = frontmatterMatch[1]!;

		// Parse name
		const nameMatch = yamlBlock.match(/^name:\s*(.+)$/m);
		if (nameMatch) {
			result.name = nameMatch[1]?.trim().replace(/^["']|["']$/g, "");
		}

		// Parse description
		const descMatch = yamlBlock.match(/^description:\s*(.+)$/m);
		if (descMatch) {
			result.description = descMatch[1]?.trim().replace(/^["']|["']$/g, "");
		}

		// Parse user-invocable
		const invocableMatch = yamlBlock.match(
			/^user-?invocable:\s*(true|false)$/im,
		);
		if (invocableMatch) {
			result.userInvocable = invocableMatch[1]?.toLowerCase() === "true";
		}

		// Parse allowed-tools (simple array parsing)
		const toolsMatch = yamlBlock.match(
			/^allowed-?tools:\s*\n((?:[ \t]+-\s*.+\n?)+)/m,
		);
		if (toolsMatch) {
			const toolsList = toolsMatch[1]!;
			result.allowedTools = toolsList
				.split("\n")
				.map((line) => line.trim().replace(/^- /, "").trim())
				.filter((tool) => tool.length > 0);
		} else {
			// Also try inline array parsing: allowed-tools: ["tool1", "tool2"]
			const inlineToolsMatch = yamlBlock.match(/^allowed-?tools:\s*\[(.*?)\]/m);
			if (inlineToolsMatch) {
				const toolsStr = inlineToolsMatch[1]!;
				result.allowedTools = toolsStr
					.split(",")
					.map((t) => t.trim().replace(/^["']|["']$/g, ""))
					.filter((t) => t.length > 0);
			}
		}
	}

	// 2. Fallback: If no description, try to extract from the first paragraph
	if (!result.description) {
		// Strip frontmatter and headings
		const contentWithoutFrontmatter = markdown.replace(
			/^---\n[\s\S]*?\n---\n/,
			"",
		);
		const contentWithoutHeadings = contentWithoutFrontmatter
			.replace(/^#+.*$/gm, "")
			.trim();

		// Get first paragraph
		const paragraphs = contentWithoutHeadings.split(/\n\s*\n/);
		if (paragraphs.length > 0) {
			const firstParagraph = paragraphs[0]?.trim() || "";
			// Filter out code blocks or weird structures
			if (
				firstParagraph &&
				!firstParagraph.startsWith("```") &&
				!firstParagraph.startsWith("<!--")
			) {
				// Truncate if too long
				const truncated =
					firstParagraph.length > 300
						? `${firstParagraph.slice(0, 297)}...`
						: firstParagraph;
				result.description = truncated.replace(/\n/g, " ").trim();
			}
		}
	}

	return result;
}
