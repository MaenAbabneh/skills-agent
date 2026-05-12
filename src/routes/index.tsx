import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import RepoCard from "#/components/RepoCard";
import { discoverNewReposForSection } from "#/server/functions/discovery";
import { getReposBySection } from "#/server/functions/get-repos";
import { syncSection } from "#/server/functions/sync";

export const Route = createFileRoute("/")({
	component: Home,

	loader: async () => {
		const reposResult = await getReposBySection({
			data: {
				section: "3d-motion",
				limit: 30,
				includeRejected: true,
			},
		});

		return {
			reposResult,
		};
	},

	staleTime: 1000 * 60 * 5,
});

function Home() {
	const router = useRouter();
	const { reposResult } = Route.useLoaderData();

	const [runningAction, setRunningAction] = useState<
		"sync" | "discovery" | null
	>(null);

	const [message, setMessage] = useState<string | null>(null);

	const isRunning = runningAction !== null;

	async function handleSync() {
		try {
			setRunningAction("sync");
			setMessage(null);

			const result = await syncSection({
				data: {
					section: "3d-motion",
					limit: 10,
					includeRejected: true,
				},
			});

			console.log("Sync result:", result);

			setMessage(
				`Synced ${result.totalUnique} unique repos. Accepted: ${result.totalAccepted}, Rejected: ${result.totalRejected}, Failed: ${result.totalFailed}`,
			);

			await router.invalidate();
		} catch (error) {
			console.error("Sync failed:", error);

			setMessage(error instanceof Error ? error.message : "Sync failed");
		} finally {
			setRunningAction(null);
		}
	}

	async function handleDiscovery() {
		try {
			setRunningAction("discovery");
			setMessage(null);

			const result = await discoverNewReposForSection({
				data: {
					section: "3d-motion",
					perPage: 20,
				},
			});

			console.log("Discovery result:", result);

			if (result.rateLimitHit && result.totalNew === 0) {
				setMessage(
					result.rateLimitResetAt
						? `GitHub search rate limit reached. Try again after ${result.rateLimitResetAt}.`
						: "GitHub search rate limit reached. Try again later.",
				);
			} else {
				setMessage(
					[
						"Discovery finished.",
						`Budget used: ${result.totalVariantsTried}/${result.searchRequestsBudget} search requests.`,
						`Fetched: ${result.totalFetched}.`,
						`Candidates: ${result.totalCandidates}.`,
						`Already existing: ${result.totalExistingInSection}.`,
						`New saved: ${result.totalNew}.`,
						`Accepted by algorithm: ${result.totalAccepted}.`,
						`Rejected by algorithm: ${result.totalRejected}.`,
						`Failed: ${result.totalFailed}.`,
						result.rateLimitHit && result.rateLimitResetAt
							? `Rate limit hit. Reset: ${result.rateLimitResetAt}.`
							: null,
					]
						.filter(Boolean)
						.join(" "),
				);
			}

			await router.invalidate();
		} catch (error) {
			console.error("Discovery failed:", error);

			setMessage(error instanceof Error ? error.message : "Discovery failed");
		} finally {
			setRunningAction(null);
		}
	}

	return (
		<main className="space-y-6">
			<section className="space-y-4">
				<div>
					<h2 className="text-2xl font-bold">Interactive 3D Web Projects</h2>

					<p className="text-sm text-gray-500">
						Open-source 3D websites, interactive web experiences, creative
						coding projects, animated landing pages, and visual experiments.
					</p>
				</div>

				<div className="flex flex-wrap gap-3">
					<button
						type="button"
						onClick={handleSync}
						disabled={isRunning}
						className="rounded-lg border px-4 py-2 text-sm"
					>
						{runningAction === "sync" ? "Syncing..." : "Sync 3D Motion Repos"}
					</button>

					<button
						type="button"
						onClick={handleDiscovery}
						disabled={isRunning}
						className="rounded-lg border px-4 py-2 text-sm"
					>
						{runningAction === "discovery"
							? "Discovering..."
							: "Discover New 3D Repos"}
					</button>
				</div>

				{message && <p className="text-sm text-gray-500">{message}</p>}

				{reposResult.sync && (
					<div className="rounded-lg border p-3 text-xs text-gray-500">
						<p>Latest sync status: {reposResult.sync.status}</p>
						<p>
							Fetched: {reposResult.sync.totalFetched} / Unique:{" "}
							{reposResult.sync.totalUnique} / Accepted:{" "}
							{reposResult.sync.totalAccepted} / Rejected:{" "}
							{reposResult.sync.totalRejected}
						</p>
					</div>
				)}

				{reposResult.repos.length === 0 && (
					<div className="rounded-lg border p-4 text-sm text-gray-500">
						<p>No repos found.</p>
						<p>Run sync or discovery first.</p>
					</div>
				)}

				{reposResult.repos.length > 0 && (
					<>
						<div className="text-sm text-gray-500">
							{reposResult.totalReturned} repos from {reposResult.totalUnique}{" "}
							unique results
						</div>

						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{reposResult.repos.map((repo) => (
								<RepoCard key={repo.id} repo={repo} />
							))}
						</div>
					</>
				)}
			</section>
		</main>
	);
}
