export type AgentSkillInstallCommands = {
	recommended: string;
	npx: string;
	bunx: string;
	pnpm: string;
	global: string;
	specificNpx: string;
	specificBunx: string;
	specificPnpm: string;
	specificGlobal: string;
	sparseCheckout: string;
	singleFileCurl: string;
	skillFolderPath: string;
	rawFileUrl: string;
};

export function generateAgentSkillInstallCommands({
	owner,
	repo,
	defaultBranch,
	filePath,
	skillName,
}: {
	owner: string;
	repo: string;
	defaultBranch: string;
	filePath: string;
	skillName: string;
}): AgentSkillInstallCommands {
	// Derive the folder that contains the SKILL.md file.
	// e.g. ".agents/skills/deploy-to-vercel/SKILL.md" → ".agents/skills/deploy-to-vercel"
	// e.g. "SKILL.md" (root) → "."
	const pathParts = filePath.split("/");
	const skillFolderPath =
		pathParts.length <= 1 ? "." : pathParts.slice(0, -1).join("/");

	const rawFileUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${filePath}`;

	const repoTarget = `${owner}/${repo}`;

	// Base (whole repo)
	const npx = `npx skills add ${repoTarget}`;
	const bunx = `bunx skills add ${repoTarget}`;
	const pnpm = `pnpm dlx skills add ${repoTarget}`;
	const global = `skills add ${repoTarget}`;

	// Specific skill folder
	const specificNpx = `npx skills add ${repoTarget} --path "${skillFolderPath}"`;
	const specificBunx = `bunx skills add ${repoTarget} --path "${skillFolderPath}"`;
	const specificPnpm = `pnpm dlx skills add ${repoTarget} --path "${skillFolderPath}"`;
	const specificGlobal = `skills add ${repoTarget} --path "${skillFolderPath}"`;

	// Manual sparse-checkout (or shallow clone when at root)
	const sparseCheckout =
		skillFolderPath === "."
			? `git clone --depth=1 https://github.com/${owner}/${repo}.git`
			: [
					`git clone --filter=blob:none --sparse https://github.com/${owner}/${repo}.git`,
					`cd ${repo}`,
					`git sparse-checkout set "${skillFolderPath}"`,
				].join("\n");

	// Single file curl
	const singleFileCurl = [
		`mkdir -p "${skillName}"`,
		`curl -L -o "${skillName}/SKILL.md" "${rawFileUrl}"`,
	].join("\n");

	const recommended = npx;

	return {
		recommended,
		npx,
		bunx,
		pnpm,
		global,
		specificNpx,
		specificBunx,
		specificPnpm,
		specificGlobal,
		sparseCheckout,
		singleFileCurl,
		skillFolderPath,
		rawFileUrl,
	};
}

export function generateAgentSkillSlug({
	owner,
	repo,
	filePath,
}: {
	owner: string;
	repo: string;
	filePath: string;
}): string {
	const text = `${owner}-${repo}-${filePath}`;

	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-") // replace non-alphanumeric with hyphens
		.replace(/-+/g, "-") // collapse repeated hyphens
		.replace(/^-|-$/g, ""); // trim hyphens
}

export type ClassifyAgentSkillCategoryInput = {
	skillName: string;
	filePath: string;
	repoName?: string;
	repoDescription?: string | null;
	topics?: string[];
	skillContent?: string;
	extractedDescription?: string;
};

export function classifyAgentSkillCategory({
	skillName,
	filePath,
	repoName = "",
	repoDescription = "",
	topics = [],
	skillContent = "",
	extractedDescription = "",
}: ClassifyAgentSkillCategoryInput): string {
	const text = [
		skillName,
		filePath,
		repoName,
		repoDescription || "",
		extractedDescription || "",
		skillContent || "",
		...(topics || []),
	]
		.join(" ")
		.toLowerCase();

	const matches = (keywords: string[]) => {
		return keywords.some((kw) => {
			// Basic word boundary or exact match
			const regex = new RegExp(`\\b${kw}\\b`, "i");
			return regex.test(text);
		});
	};

	if (
		matches([
			"code-review",
			"review",
			"reviewer",
			"pr-review",
			"pull-request-review",
		])
	) {
		return "Code Review";
	}
	if (matches(["debug", "bug", "fixing", "troubleshoot", "inspect", "trace"])) {
		return "Debugging";
	}
	if (
		matches([
			"docs",
			"documentation",
			"readme",
			"changelog",
			"md-sync",
			"technical-writer",
		])
	) {
		return "Documentation";
	}
	if (
		matches([
			"writing",
			"writer",
			"humanizer",
			"copy",
			"edit",
			"grammar",
			"tone",
		])
	) {
		return "Writing";
	}
	if (
		matches([
			"content creation",
			"content-creation",
			"blog",
			"post",
			"article",
			"social media",
			"social-media",
			"tweet",
			"video",
			"youtube",
		])
	) {
		return "Content Creation";
	}
	if (
		matches([
			"research",
			"paper",
			"search",
			"aggregator",
			"summarize",
			"insight",
		])
	) {
		return "Research";
	}
	if (
		matches([
			"data",
			"analysis",
			"analytics",
			"csv",
			"spreadsheet",
			"excel",
			"sql",
			"database",
			"query",
		])
	) {
		return "Data Analysis";
	}
	if (
		matches(["browser", "chromium", "playwright", "selenium", "web automation"])
	) {
		return "Browser Automation";
	}
	if (
		matches([
			"github",
			"issue",
			"pr",
			"pull-request",
			"release",
			"ghsa",
			"maintainer",
		])
	) {
		return "GitHub Automation";
	}
	if (
		matches([
			"ci",
			"cd",
			"deploy",
			"docker",
			"kubernetes",
			"infra",
			"cloud",
			"smoke",
			"server",
			"vercel",
		])
	) {
		return "DevOps";
	}
	if (
		matches(["test", "testing", "qa", "validation", "verify", "jest", "vitest"])
	) {
		return "Testing";
	}
	if (
		matches([
			"brand",
			"marketing",
			"seo",
			"campaign",
			"content",
			"leads",
			"sales",
		])
	) {
		return "Marketing";
	}
	if (
		matches([
			"trading",
			"finance",
			"alpaca",
			"stock",
			"accounting",
			"excel model",
			"excel",
			"crypto",
			"wallet",
		])
	) {
		return "Finance";
	}
	if (matches(["security", "audit", "vulnerability", "pentest"])) {
		return "Security";
	}
	if (matches(["api", "interface", "endpoint", "sdk", "rest", "graphql"])) {
		return "API Development";
	}
	if (
		matches([
			"workflow",
			"productivity",
			"assistant",
			"task",
			"todo",
			"calendar",
		])
	) {
		return "Productivity";
	}
	if (matches(["theme", "ui", "ux", "design", "figma", "tailwind", "css"])) {
		return "Design";
	}

	return "Other";
}
