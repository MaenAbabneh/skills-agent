const CONTENT_PREVIEW_LENGTH = 1_000;

/**
 * Remove HTML comments from content.
 */
function removeHtmlComments(text: string): string {
	return text.replace(/<!--[\s\S]*?-->/g, "");
}

/**
 * Remove leading badge/image lines from the top of the content.
 * Targets lines that are purely badge markdown: [![...](...)(...)] or ![...](...)
 */
function removeLeadingBadges(text: string): string {
	const lines = text.split("\n");
	let firstContentLine = 0;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]?.trim() ?? "";
		const isBadgeLine =
			/^\[!\[/.test(line) ||
			/^!\[/.test(line) ||
			/^<img\s/i.test(line) ||
			line === "";

		if (!isBadgeLine) {
			firstContentLine = i;
			break;
		}
	}

	return lines.slice(firstContentLine).join("\n");
}

/**
 * Strip the contents of fenced code blocks from the preview text.
 * Replaces block body with a placeholder so structure is visible.
 */
function stripCodeBlockContents(text: string): string {
	return text.replace(/```[\s\S]*?```/g, "```…```");
}

/**
 * Normalize repeated blank lines to at most one blank line.
 */
function normalizeWhitespace(text: string): string {
	return text
		.replace(/\r\n/g, "\n")
		.replace(/[ \t]+$/gm, "")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

/**
 * Clean README content and generate a short preview.
 *
 * Returns:
 * - `content`: full original README content (unmodified)
 * - `contentPreview`: cleaned, truncated preview for cards/summaries
 */
export function cleanReadmePreview(rawContent: string): {
	content: string;
	contentPreview: string;
} {
	let preview = rawContent;

	preview = removeHtmlComments(preview);
	preview = removeLeadingBadges(preview);
	preview = stripCodeBlockContents(preview);
	preview = normalizeWhitespace(preview);

	const contentPreview =
		preview.length > CONTENT_PREVIEW_LENGTH
			? `${preview.slice(0, CONTENT_PREVIEW_LENGTH)}…`
			: preview;

	return {
		content: rawContent,
		contentPreview,
	};
}
