import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import type { SectionId } from "#/lib/sections";
import { discoverNewReposForSection } from "#/server/functions/discovery";
import { syncSection } from "#/server/functions/sync";

export type RunningDiscoveryAction = "discovery" | "sync" | null;

export type DiscoveryResult = Awaited<
	ReturnType<typeof discoverNewReposForSection>
>;

export type SyncResult = Awaited<ReturnType<typeof syncSection>>;

type UseAdminDiscoveryActionsParams = {
	section: SectionId;
};

type UseAdminDiscoveryActionsReturn = {
	isRunning: boolean;
	runningAction: RunningDiscoveryAction;
	lastDiscoveryResult: DiscoveryResult | null;
	lastSyncResult: SyncResult | null;
	resetLastResults: () => void;
	runDiscovery: () => Promise<void>;
	runSync: () => Promise<void>;
};

export function useAdminDiscoveryActions({
	section,
}: UseAdminDiscoveryActionsParams): UseAdminDiscoveryActionsReturn {
	const router = useRouter();

	const [runningAction, setRunningAction] =
		useState<RunningDiscoveryAction>(null);

	const [lastDiscoveryResult, setLastDiscoveryResult] =
		useState<DiscoveryResult | null>(null);

	const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

	function resetLastResults() {
		setLastDiscoveryResult(null);
		setLastSyncResult(null);
	}

	const isRunning = runningAction !== null;

	async function runDiscovery() {
		try {
			setRunningAction("discovery");

			const result = await discoverNewReposForSection({
				data: {
					section,
				},
			});

			setLastDiscoveryResult(result);

			if (result.rateLimitHit && result.totalNew === 0) {
				toast.warning(
					result.rateLimitResetAt
						? `GitHub search rate limit reached. Try again after ${result.rateLimitResetAt}.`
						: "GitHub search rate limit reached. Try again later.",
				);
			} else {
				toast.success(
					`Discovery completed. New: ${result.totalNew}, Accepted: ${result.totalAccepted}, Rejected: ${result.totalRejected}.`,
				);
			}

			await router.invalidate();
		} catch (error) {
			console.error("Discovery failed:", error);

			toast.error(error instanceof Error ? error.message : "Discovery failed.");
		} finally {
			setRunningAction(null);
		}
	}

	async function runSync() {
		try {
			setRunningAction("sync");

			const result = await syncSection({
				data: {
					section,
					limit: 10,
					includeRejected: true,
				},
			});

			setLastSyncResult(result);

			toast.success(
				`Sync completed. Unique: ${result.totalUnique}, Accepted: ${result.totalAccepted}, Rejected: ${result.totalRejected}.`,
			);

			await router.invalidate();
		} catch (error) {
			console.error("Sync failed:", error);

			toast.error(error instanceof Error ? error.message : "Sync failed.");
		} finally {
			setRunningAction(null);
		}
	}

	return {
		isRunning,
		runningAction,

		lastDiscoveryResult,
		lastSyncResult,
		resetLastResults,

		runDiscovery,
		runSync,
	};
}
