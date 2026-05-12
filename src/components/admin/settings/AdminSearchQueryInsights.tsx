import { useRouter } from "@tanstack/react-router";
import { FlaskConical, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import type { SectionId } from "#/lib/sections";
import { updateSectionSearchQueryAction } from "#/server/functions/admin-section-search-queries";

type SearchQueryType = "seed" | "exploratory" | "ai_suggested" | "admin_added";

type AdminSearchQuery = {
	id: string;
	section: string;
	query: string;
	type: SearchQueryType;
	enabled: boolean;
	priority: number;
	totalRuns: number;
	totalFetched: number;
	totalCandidates: number;
	totalNew: number;
	totalAccepted: number;
	totalRejected: number;
	lastUsedAt: string | null;
	createdAt: string;
	updatedAt: string;
};

type AdminSearchQueryInsightsProps = {
	section: SectionId;
	queries: AdminSearchQuery[];
};

type QueryInsightAction = "boost" | "lower" | "disable";

function getAcceptanceRate(query: AdminSearchQuery) {
	if (query.totalNew <= 0) {
		return 0;
	}

	return Math.round((query.totalAccepted / query.totalNew) * 100);
}

function formatNumber(value: number) {
	return new Intl.NumberFormat("en").format(value);
}

function clampPriority(value: number) {
	return Math.max(1, Math.min(100, value));
}

function getPriorityChange({
	query,
	action,
}: {
	query: AdminSearchQuery;
	action: QueryInsightAction;
}) {
	if (action === "boost") {
		return clampPriority(query.priority + 1);
	}

	if (action === "lower") {
		return clampPriority(query.priority - 1);
	}

	return query.priority;
}

function QueryInsightList({
	queries,
	emptyLabel,
	updatingQueryId,
	onAction,
}: {
	queries: AdminSearchQuery[];
	emptyLabel: string;
	updatingQueryId: string | null;
	onAction: (query: AdminSearchQuery, action: QueryInsightAction) => void;
}) {
	if (queries.length === 0) {
		return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
	}

	return (
		<div className="space-y-3">
			{queries.map((query) => {
				const isUpdating = updatingQueryId === query.id;
				const acceptanceRate = getAcceptanceRate(query);

				return (
					<div
						key={query.id}
						className="rounded-lg border bg-background p-3 text-sm"
					>
						<div className="flex flex-wrap items-center justify-between gap-2">
							<div className="font-medium">{query.query}</div>

							<div className="flex flex-wrap items-center gap-2">
								<Badge variant="outline">Priority {query.priority}</Badge>

								{query.enabled ? (
									<Badge variant="default">Enabled</Badge>
								) : (
									<Badge variant="outline">Disabled</Badge>
								)}
							</div>
						</div>

						<div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
							<span>Runs: {formatNumber(query.totalRuns)}</span>
							<span>New: {formatNumber(query.totalNew)}</span>
							<span>Accepted: {formatNumber(query.totalAccepted)}</span>
							<span>Rate: {acceptanceRate}%</span>
						</div>

						<div className="mt-3 flex flex-wrap gap-2">
							<Button
								type="button"
								size="sm"
								variant="outline"
								disabled={isUpdating || query.priority >= 100}
								onClick={() => onAction(query, "boost")}
							>
								{isUpdating ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : null}
								Boost
							</Button>

							<Button
								type="button"
								size="sm"
								variant="outline"
								disabled={isUpdating || query.priority <= 1}
								onClick={() => onAction(query, "lower")}
							>
								{isUpdating ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : null}
								Lower
							</Button>

							<Button
								type="button"
								size="sm"
								variant="secondary"
								disabled={isUpdating || !query.enabled}
								onClick={() => onAction(query, "disable")}
							>
								{isUpdating ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : null}
								Disable
							</Button>
						</div>
					</div>
				);
			})}
		</div>
	);
}

export function AdminSearchQueryInsights({
	section,
	queries,
}: AdminSearchQueryInsightsProps) {
	const router = useRouter();

	const [updatingQueryId, setUpdatingQueryId] = useState<string | null>(null);

	const testedQueries = queries.filter((query) => query.totalRuns > 0);

	const topQueries = [...testedQueries]
		.filter((query) => query.totalNew > 0)
		.sort((a, b) => {
			const rateDiff = getAcceptanceRate(b) - getAcceptanceRate(a);

			if (rateDiff !== 0) {
				return rateDiff;
			}

			return b.totalAccepted - a.totalAccepted;
		})
		.slice(0, 3);

	const weakQueries = [...testedQueries]
		.filter((query) => query.totalRuns > 0 && getAcceptanceRate(query) < 40)
		.sort((a, b) => getAcceptanceRate(a) - getAcceptanceRate(b))
		.slice(0, 3);

	const untestedQueries = queries
		.filter((query) => query.totalRuns === 0)
		.slice(0, 3);

	async function handleInsightAction(
		query: AdminSearchQuery,
		action: QueryInsightAction,
	) {
		try {
			setUpdatingQueryId(query.id);

			if (action === "disable") {
				await updateSectionSearchQueryAction({
					data: {
						id: query.id,
						section,
						enabled: false,
					},
				});

				toast.success("Search query disabled.");
				await router.invalidate();
				return;
			}

			const nextPriority = getPriorityChange({
				query,
				action,
			});

			await updateSectionSearchQueryAction({
				data: {
					id: query.id,
					section,
					priority: nextPriority,
				},
			});

			toast.success(
				action === "boost"
					? "Search query priority boosted."
					: "Search query priority lowered.",
			);

			await router.invalidate();
		} catch (error) {
			console.error("Failed to update search query insight:", error);

			toast.error(
				error instanceof Error
					? error.message
					: "Failed to update search query.",
			);
		} finally {
			setUpdatingQueryId(null);
		}
	}

	return (
		<div className="grid gap-4 lg:grid-cols-3">
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-base">
						<TrendingUp className="h-4 w-4" />
						Top Queries
					</CardTitle>
				</CardHeader>

				<CardContent>
					<QueryInsightList
						queries={topQueries}
						emptyLabel="No strong queries yet."
						updatingQueryId={updatingQueryId}
						onAction={handleInsightAction}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-base">
						<TrendingDown className="h-4 w-4" />
						Weak Queries
					</CardTitle>
				</CardHeader>

				<CardContent>
					<QueryInsightList
						queries={weakQueries}
						emptyLabel="No weak queries detected yet."
						updatingQueryId={updatingQueryId}
						onAction={handleInsightAction}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-base">
						<FlaskConical className="h-4 w-4" />
						Untested Queries
					</CardTitle>
				</CardHeader>

				<CardContent>
					<QueryInsightList
						queries={untestedQueries}
						emptyLabel="All queries have been tested."
						updatingQueryId={updatingQueryId}
						onAction={handleInsightAction}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
