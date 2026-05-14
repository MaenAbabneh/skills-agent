import type { GitHubRepo } from "@/lib/validations/github";
import type { RepoSectionMetadata } from "@/lib/validations/repo-metadata";
import type {
	RepoSection,
	RepoSectionStatus,
	RepoType,
	ScoreBreakdown,
} from "@/lib/validations/repos";

export function getRepoLicense(repo: GitHubRepo) {
	return (
		repo.license?.spdx_id ?? repo.license?.key ?? repo.license?.name ?? null
	);
}

export function toDateOrNow(value: string | null | undefined) {
	const date = value ? new Date(value) : null;

	if (!date || Number.isNaN(date.getTime())) {
		return new Date();
	}

	return date;
}

export function mapGitHubRepoToRepositoryValues(repo: GitHubRepo) {
	return {
		githubId: repo.id,

		owner: repo.owner.login,
		name: repo.name,
		fullName: repo.full_name,

		description: repo.description ?? "No description provided.",

		url: repo.html_url,
		homepage: repo.homepage ?? null,
		avatarUrl: repo.owner.avatar_url,

		language: repo.language,

		topics: Array.isArray(repo.topics) ? repo.topics : [],

		stars: repo.stargazers_count,
		forks: repo.forks_count,
		openIssues: repo.open_issues_count,

		archived: repo.archived,
		fork: repo.fork,

		license: getRepoLicense(repo),

		defaultBranch: repo.default_branch ?? "main",

		githubCreatedAt: toDateOrNow(repo.created_at),
		githubUpdatedAt: toDateOrNow(repo.updated_at),
		pushedAt: toDateOrNow(repo.pushed_at),

		syncedAt: new Date(),
		updatedAt: new Date(),
	};
}

export function mapRepoSectionValues({
	repoId,
	section,
	repoType,
	score,
	scoreBreakdown,
	rejectionReasons,
	isAccepted,
	metadata,
	status,
}: {
	repoId: string;
	section: RepoSection;
	repoType: RepoType;
	score: number;
	scoreBreakdown: ScoreBreakdown;
	rejectionReasons: string[];
	isAccepted: boolean;
	metadata: RepoSectionMetadata;
	status?: RepoSectionStatus;
}) {
	return {
		repoId,
		section,

		repoType,

		score,
		scoreBreakdown,

		rejectionReasons,
		isAccepted,

		status: status ?? "pending",

		metadata,

		updatedAt: new Date(),
	};
}
