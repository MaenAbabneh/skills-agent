import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { enrichRepositoryReadmesAction } from "#/server/functions/admin-repos";

export type ReadmeEnrichResult = {
	checked: number;
	updated: number;
	refreshed: number;
	missing: number;
	failed: number;
	skipped: number;
	partialErrors: {
		repoId: string;
		fullName: string;
		readmePath?: string;
		error: string;
	}[];
};

function normalizeReadmeEnrichResult(
	result: Omit<ReadmeEnrichResult, "partialErrors"> &
		Partial<Pick<ReadmeEnrichResult, "partialErrors">>,
): ReadmeEnrichResult {
	return {
		...result,
		partialErrors: result.partialErrors ?? [],
	};
}

/**
 * Hook for 3d-motion README enrichment admin controls.
 * Should only be used/displayed when the selected section is "3d-motion".
 */
export function useAdminRepoReadmeEnrichment() {
	const router = useRouter();

	const [isEnrichingMissingReadmes, setIsEnrichingMissingReadmes] =
		useState(false);
	const [isRefreshingExistingReadmes, setIsRefreshingExistingReadmes] =
		useState(false);
	const [enrichResult, setEnrichResult] = useState<ReadmeEnrichResult | null>(
		null,
	);

	async function enrichMissingReadmes() {
		try {
			setIsEnrichingMissingReadmes(true);
			setEnrichResult(null);

			const result = await enrichRepositoryReadmesAction({
				data: {
					section: "3d-motion",
					limit: 200,
					forceRefresh: false,
				},
			});

			const normalizedResult = normalizeReadmeEnrichResult(result);
			setEnrichResult(normalizedResult);

			const parts: string[] = [`Checked ${result.checked}`];
			if (result.updated > 0) parts.push(`${result.updated} updated`);
			if (result.missing > 0) parts.push(`${result.missing} missing`);
			if (result.failed > 0) parts.push(`${result.failed} failed`);

			toast.success(`${parts.join(", ")}.`);
			await router.invalidate();
		} catch (error) {
			console.error("README enrichment (missing) failed:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to enrich missing READMEs.",
			);
		} finally {
			setIsEnrichingMissingReadmes(false);
		}
	}

	async function refreshExistingReadmes() {
		try {
			setIsRefreshingExistingReadmes(true);
			setEnrichResult(null);

			const result = await enrichRepositoryReadmesAction({
				data: {
					section: "3d-motion",
					limit: 200,
					forceRefresh: true,
				},
			});

			const normalizedResult = normalizeReadmeEnrichResult(result);
			setEnrichResult(normalizedResult);

			const parts: string[] = [`Checked ${result.checked}`];
			if (result.refreshed > 0) parts.push(`${result.refreshed} refreshed`);
			if (result.missing > 0) parts.push(`${result.missing} missing`);
			if (result.failed > 0) parts.push(`${result.failed} failed`);

			toast.success(`${parts.join(", ")}.`);
			await router.invalidate();
		} catch (error) {
			console.error("README refresh failed:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to refresh existing READMEs.",
			);
		} finally {
			setIsRefreshingExistingReadmes(false);
		}
	}

	return {
		isEnrichingMissingReadmes,
		isRefreshingExistingReadmes,
		enrichMissingReadmes,
		refreshExistingReadmes,
		enrichResult,
	};
}
