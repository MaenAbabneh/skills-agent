import type { GitHubRepo } from "@/lib/validations/github";
import type { RepoSectionMetadata } from "@/lib/validations/repo-metadata";
import type { RepoSection, RepoType } from "@/lib/validations/repos";

export function buildGitHubZipUrl(repo: GitHubRepo) {
	const branch = repo.default_branch || "main";

	return `https://github.com/${repo.full_name}/archive/refs/heads/${branch}.zip`;
}

export function buildGitCloneCommand(repo: GitHubRepo) {
	return `git clone ${repo.html_url}.git`;
}

export function normalizeThreeDProjectKind(repoType: RepoType) {
	const allowedKinds = [
		"portfolio",
		"showcase",
		"interactive-experience",
		"visualization",
		"creative-coding",
		"starter",
		"learning",
		"game",
		"unknown",
	] as const;

	if (allowedKinds.includes(repoType as (typeof allowedKinds)[number])) {
		return repoType as (typeof allowedKinds)[number];
	}

	return "unknown";
}

export function buildRepoSectionMetadata({
	repo,
	section,
	repoType,
}: {
	repo: GitHubRepo;
	section: RepoSection;
	repoType: RepoType;
}): RepoSectionMetadata {
	const clone = buildGitCloneCommand(repo);
	const zipUrl = buildGitHubZipUrl(repo);

	if (section === "3d-motion") {
		return {
			kind: "3d-motion",

			readme: undefined,

			commands: {
				clone,
			},

			zipUrl,

			liveDemoUrl: repo.homepage ?? null,

			techStack: Array.isArray(repo.topics) ? repo.topics : [],

			projectKind: normalizeThreeDProjectKind(repoType),

			previewImage: undefined,
		};
	}

	return {
		kind: "agent-skills",

		readme: undefined,

		skill: {
			exists: false,
		},

		commands: {
			clone,
		},

		zipUrl,

		skillDetected: false,
		skillFilePath: undefined,
		skillFileUrl: undefined,
		skillFileName: undefined,
		skillName: undefined,
		skillFiles: [],
		skillFileCount: 0,

		requiredFiles: [],

		runUrl: undefined,
	};
}
