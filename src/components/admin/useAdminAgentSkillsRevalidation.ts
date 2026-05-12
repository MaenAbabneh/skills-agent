import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import {
	enrichAgentSkillFilesAction,
	refreshAgentSkillDerivedMetadataAction,
} from "#/server/functions/admin-agent-skills";
import { revalidateAgentSkillsRepos } from "#/server/functions/admin-repos";

export function useAdminAgentSkillsRevalidation() {
	const router = useRouter();
	const [isRevalidatingAgentSkills, setIsRevalidatingAgentSkills] =
		useState(false);
	const [isEnrichingAgentSkills, setIsEnrichingAgentSkills] = useState(false);
	const [isRefreshingDerivedMetadata, setIsRefreshingDerivedMetadata] =
		useState(false);

	async function revalidateAgentSkills() {
		try {
			setIsRevalidatingAgentSkills(true);

			const result = await revalidateAgentSkillsRepos({
				data: {
					limit: 100,
				},
			});
			const failedSuffix = result.failed > 0 ? ` ${result.failed} failed.` : "";

			toast.success(
				`Revalidated ${result.processed} repos. ${result.detected} detected, ${result.rejected} rejected.${failedSuffix}`,
			);

			await router.invalidate();
		} catch (error) {
			console.error("Agent skills revalidation failed:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to revalidate agent skills repos.",
			);
		} finally {
			setIsRevalidatingAgentSkills(false);
		}
	}

	async function enrichAgentSkills() {
		try {
			setIsEnrichingAgentSkills(true);

			const result = await enrichAgentSkillFilesAction({
				data: { limit: 50 },
			});
			const failedSuffix = result.failed > 0 ? ` ${result.failed} failed.` : "";

			toast.success(
				`Processed ${result.processed} skills. ${result.enriched} enriched.${failedSuffix}`,
			);

			await router.invalidate();
		} catch (error) {
			console.error("Agent skills enrichment failed:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to enrich agent skills.",
			);
		} finally {
			setIsEnrichingAgentSkills(false);
		}
	}

	async function refreshDerivedMetadata() {
		try {
			setIsRefreshingDerivedMetadata(true);

			const result = await refreshAgentSkillDerivedMetadataAction({
				data: { limit: 500 },
			});
			const failedSuffix = result.failed > 0 ? ` ${result.failed} failed.` : "";

			toast.success(
				`Checked ${result.checked} skills. ${result.updated} updated. Remaining: ${result.remainingMissing}.${failedSuffix}`,
			);

			await router.invalidate();
		} catch (error) {
			console.error("Agent skills derived metadata refresh failed:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to refresh derived metadata.",
			);
		} finally {
			setIsRefreshingDerivedMetadata(false);
		}
	}

	return {
		isRevalidatingAgentSkills,
		revalidateAgentSkills,
		isEnrichingAgentSkills,
		enrichAgentSkills,
		isRefreshingDerivedMetadata,
		refreshDerivedMetadata,
	};
}
