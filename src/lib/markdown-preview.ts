function truncatePreview(value: string, maxLength: number) {
	if (value.length <= maxLength) {
		return value;
	}

	const truncated = value.slice(0, maxLength);
	const lastSpace = truncated.lastIndexOf(" ");

	return `${truncated.slice(0, lastSpace > 120 ? lastSpace : maxLength).trim()}...`;
}

function decodeHtmlEntities(text: string): string {
	return text
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");
}

export function markdownToPlainTextPreview(markdown: string, maxLength = 220) {
	const cleaned = markdown
		.replace(/^---\s*[\s\S]*?\s*---/, " ")
		.replace(/<!--[\s\S]*?-->/g, " ")
		.replace(/```[\s\S]*?```/g, " ")
		.replace(/~~~[\s\S]*?~~~/g, " ")
		.replace(/<script[\s\S]*?<\/script>/gi, " ")
		.replace(/<style[\s\S]*?<\/style>/gi, " ")
		.replace(/<img\b[^>]*>/gi, " ")
		.replace(/<br\s*\/?>/gi, " ")
		.replace(/<[^>]+>/g, " ")
		.replace(/\[!\[[^\]]*]\([^)]+\)]\([^)]+\)/g, " ")
		.replace(/!\[[^\]]*]\([^)]+\)/g, " ")
		.replace(/\[([^\]]+)]\((?:https?:\/\/|mailto:)[^)]+\)/g, "$1")
		.replace(/https?:\/\/\S+|www\.\S+/gi, " ")
		.replace(/^#{1,6}\s*/gm, "")
		.replace(/[*_`~|>]+/g, " ")
		.replace(/[{}[\]()]/g, " ")
		.replace(/[|]{2,}/g, " ")
		.replace(/\s+/g, " ")
		.trim();

	return truncatePreview(decodeHtmlEntities(cleaned), maxLength);
}
