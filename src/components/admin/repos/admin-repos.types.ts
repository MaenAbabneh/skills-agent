import type { getAdminRepos } from "#/server/functions/admin-repos";

export type UpdatingAction = "approve" | "reject" | "hide";

export type AdminRepo = Awaited<
	ReturnType<typeof getAdminRepos>
>["repos"][number];

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
