const CONTENT_PREVIEW_LENGTH = 1_000;

function decodeHtmlEntities(text: string): string {
	return text
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");
}

/**
 * Remove HTML comments from content.
 */
function removeHtmlComments(text: string): string {
	return text.replace(/<!--[\s\S]*?-->/g, "");
}

function removeHtml(text: string): string {
	return text
		.replace(/<script[\s\S]*?<\/script>/gi, " ")
		.replace(/<style[\s\S]*?<\/style>/gi, " ")
		.replace(/<img\b[^>]*>/gi, " ")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<\/(p|div|section|article|h[1-6]|li|tr)>/gi, "\n")
		.replace(/<[^>]+>/g, " ");
}

function removeMarkdownImages(text: string): string {
	return text
		.replace(/\[!\[[^\]]*]\([^)]+\)]\([^)]+\)/g, " ")
		.replace(/!\[[^\]]*]\([^)]+\)/g, " ");
}

function normalizeMarkdownLinks(text: string): string {
	return text.replace(/\[([^\]]+)]\((?:https?:\/\/|mailto:)[^)]+\)/g, "$1");
}

function removeRawUrls(text: string): string {
	return text.replace(/https?:\/\/\S+|www\.\S+/gi, " ");
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
 * Strip code-heavy blocks from the preview text.
 */
function stripCodeBlockContents(text: string): string {
	return text
		.replace(/```[\s\S]*?```/g, " ")
		.replace(/~~~[\s\S]*?~~~/g, " ")
		.replace(/^\s{4,}.*$/gm, " ");
}

function removeMarkdownDecorators(text: string): string {
	return text
		.replace(/^#{1,6}\s*/gm, "")
		.replace(/[*_`~|>]+/g, " ")
		.replace(/\s[-=*]{3,}\s/g, " ");
}

/**
 * Normalize repeated blank lines to at most one blank line.
 */
function normalizeWhitespace(text: string): string {
	return text
		.replace(/\r\n/g, "\n")
		.replace(/[ \t]+$/gm, "")
		.replace(/[ \t]{2,}/g, " ")
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
	preview = removeHtml(preview);
	preview = removeMarkdownImages(preview);
	preview = normalizeMarkdownLinks(preview);
	preview = removeRawUrls(preview);
	preview = removeMarkdownDecorators(preview);
	preview = decodeHtmlEntities(preview);
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
