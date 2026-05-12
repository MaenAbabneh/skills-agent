import type { SectionId } from "#/lib/sections";
import type { RepoSectionMetadata } from "#/lib/validations/repo-metadata";

export type ScoreBreakdown = {
	relevance?: number;
	usefulness?: number;
	popularity?: number;
	momentum?: number;
	maintenance?: number;
	completeness?: number;
	demoMultiplier?: number;
	healthMultiplier?: number;
	baseTotal?: number;
	total?: number;
};

export type AdminRepoReviewCardRepo = {
	repoSectionId: string;

	fullName: string;
	owner: string;
	name: string;
	description: string;

	url: string;
	homepage: string | null;

	stars: number;
	forks: number;
	openIssues: number;

	language: string | null;
	topics: string[];

	repoType: string;
	score: number;

	isAccepted: boolean;
	status: string;

	rejectionReasons: string[];
	scoreBreakdown?: ScoreBreakdown;
	metadata?: RepoSectionMetadata | null;
};

export type AdminRepoReviewAction = "approve" | "reject" | "hide";

export type AdminRepoReviewCardProps = {
	repo: AdminRepoReviewCardRepo;
	section: SectionId;
	isUpdating?: boolean;
	updatingAction?: AdminRepoReviewAction | null;
	onApprove: (repoSectionId: string) => void | Promise<void>;
	onReject: (repoSectionId: string) => void | Promise<void>;
	onHide: (repoSectionId: string) => void | Promise<void>;
};
