export const faqItems = [
	{
		question: "What is RepoRadar?",
		answer:
			"RepoRadar is a focused discovery hub for high-signal open-source repositories and agent skills found on GitHub.",
	},
	{
		question: "What are discovery sections?",
		answer:
			"Sections are curated slices of GitHub discovery, each with its own signals and item type.",
	},
	{
		question: "Why are Agent Skills separate from repositories?",
		answer:
			"Agent Skills are file-level items. A single repository can contain multiple SKILL.md files, and each one can be useful on its own.",
	},
	{
		question: "How are Agent Skills discovered?",
		answer:
			"They are indexed from public repositories containing SKILL.md files, then enriched with metadata and categories.",
	},
	{
		question: "How are 3D Motion projects selected?",
		answer:
			"3D Motion is repository-level and focuses on Three.js, WebGL, WebGPU, shaders, creative coding, and interactive web work.",
	},
	{
		question: "Can I submit a repo or skill?",
		answer:
			"Submission workflows are planned. For now, RepoRadar is populated through discovery and review tooling.",
	},
	{
		question: "Are items automatically published?",
		answer:
			"No. Items are reviewed before final public display; this v1 homepage temporarily shows development data.",
	},
	{
		question:
			"Is RepoRadar affiliated with GitHub, OpenAI, Anthropic, or any provider?",
		answer:
			"No. RepoRadar is not affiliated with those providers unless explicitly stated.",
	},
];

export const footerExploreLinks: [string, string][] = [
	["3D Motion", "#featured-3d-motion"],
	["Agent Skills", "#featured-agent-skills"],
	["Categories", "#"],
	["Featured", "#featured-agent-skills"],
	["Submit Repo", "/admin/submissions"],
];

export const footerPlatformLinks: [string, string][] = [
	["About", "#"],
	["How it works", "#how-it-works"],
	["FAQ", "#faq"],
	["GitHub", "https://github.com"],
	["Roadmap", "#"],
];

export const footerResourcesLinks: [string, string][] = [
	["Submit a repository", "/admin/submissions"],
	["Browse skills", "#featured-agent-skills"],
	["Browse projects", "#featured-3d-motion"],
	["View source", "https://github.com"],
	["Contact", "#"],
];
