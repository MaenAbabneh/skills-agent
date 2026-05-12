import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { useAdminAgentSkillsRevalidation } from "#/components/admin/useAdminAgentSkillsRevalidation";
import type { SectionId } from "#/lib/sections";

import {
	approveRepoSection,
	hideRepoSection,
	rejectRepoSection,
} from "#/server/functions/admin-repos";

import type { UpdatingAction } from "./admin-repos.types";

export function useAdminRepoActions(section: SectionId) {
	const router = useRouter();
	const [updatingRepoId, setUpdatingRepoId] = useState<string | null>(null);
	const [updatingAction, setUpdatingAction] = useState<UpdatingAction | null>(
		null,
	);
	const {
		isRevalidatingAgentSkills,
		revalidateAgentSkills,
		isEnrichingAgentSkills,
		enrichAgentSkills,
		isRefreshingDerivedMetadata,
		refreshDerivedMetadata,
	} = useAdminAgentSkillsRevalidation();

	async function runAction({
		repoSectionId,
		action,
	}: {
		repoSectionId: string;
		action: UpdatingAction;
	}) {
		try {
			setUpdatingRepoId(repoSectionId);
			setUpdatingAction(action);

			if (action === "approve") {
				await approveRepoSection({ data: { section, repoSectionId } });
				toast.success("Repo approved successfully.");
			}

			if (action === "reject") {
				await rejectRepoSection({ data: { section, repoSectionId } });
				toast.success("Repo rejected successfully.");
			}

			if (action === "hide") {
				await hideRepoSection({ data: { section, repoSectionId } });
				toast.success("Repo hidden successfully.");
			}

			await router.invalidate();
		} catch (error) {
			console.error("Admin repo action failed:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to update repo.",
			);
		} finally {
			setUpdatingRepoId(null);
			setUpdatingAction(null);
		}
	}

	return {
		updatingRepoId,
		updatingAction,
		isRevalidatingAgentSkills,
		runAction,
		revalidateAgentSkills,
		isEnrichingAgentSkills,
		enrichAgentSkills,
		isRefreshingDerivedMetadata,
		refreshDerivedMetadata,
	};
}
