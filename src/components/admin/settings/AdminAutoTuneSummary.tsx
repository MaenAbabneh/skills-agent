import { Badge } from "#/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import {
	type AdminAutoTuneQueryInput,
	calculateAdminAutoTuneDecision,
} from "#/lib/admin-auto-tune";

type AdminAutoTuneSummaryProps = {
	enabled: boolean;
	queries: AdminAutoTuneQueryInput[];
};

function formatNumber(value: number) {
	return new Intl.NumberFormat("en").format(value);
}

function getAcceptanceRate(query: AdminAutoTuneQueryInput) {
	if (query.totalNew <= 0) {
		return 0;
	}

	return Math.round((query.totalAccepted / query.totalNew) * 100);
}

export function AdminAutoTuneSummary({
	enabled,
	queries,
}: AdminAutoTuneSummaryProps) {
	const decisions = queries.map((query) =>
		calculateAdminAutoTuneDecision(query),
	);
	const changedDecisionsAll = decisions.filter((decision) => decision.changed);
	const changedDecisions = decisions
		.filter((decision) => decision.changed)
		.sort(
			(a, b) =>
				Math.abs(b.nextPriority - b.currentPriority) -
				Math.abs(a.nextPriority - a.currentPriority),
		)
		.slice(0, 3);

	const enabledQueries = queries.filter((query) => query.enabled).length;
	const testedQueries = queries.filter((query) => query.totalRuns > 0).length;
	const changedCount = changedDecisionsAll.length;

	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<CardTitle>Auto Tune Summary</CardTitle>
						<CardDescription>
							Shows whether auto-tune is enabled and the latest priority changes
							based on current query stats.
						</CardDescription>
					</div>
					<Badge variant={enabled ? "default" : "outline"}>
						{enabled ? "Auto-tune enabled" : "Auto-tune disabled"}
					</Badge>
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				<div className="grid gap-3 sm:grid-cols-3">
					<div className="rounded-lg border p-3">
						<div className="text-xs text-muted-foreground">Enabled queries</div>
						<div className="mt-1 text-lg font-semibold">
							{formatNumber(enabledQueries)}
						</div>
					</div>
					<div className="rounded-lg border p-3">
						<div className="text-xs text-muted-foreground">Tested queries</div>
						<div className="mt-1 text-lg font-semibold">
							{formatNumber(testedQueries)}
						</div>
					</div>
					<div className="rounded-lg border p-3">
						<div className="text-xs text-muted-foreground">
							Priority changes
						</div>
						<div className="mt-1 text-lg font-semibold">
							{formatNumber(changedCount)}
						</div>
					</div>
				</div>

				<div className="space-y-3">
					<div className="text-sm font-medium">Latest priority changes</div>

					{changedDecisions.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No priority changes are suggested right now.
						</p>
					) : (
						<div className="space-y-2">
							{changedDecisions.map((decision) => {
								const delta = decision.nextPriority - decision.currentPriority;
								const sourceQuery = queries.find(
									(query) => query.id === decision.id,
								);
								const acceptanceRate = sourceQuery
									? getAcceptanceRate(sourceQuery)
									: 0;

								return (
									<div
										key={decision.id}
										className="rounded-lg border bg-background p-3 text-sm"
									>
										<div className="flex flex-wrap items-center justify-between gap-2">
											<div className="font-medium">{decision.query}</div>
											<Badge variant={delta > 0 ? "default" : "secondary"}>
												{delta > 0 ? "+" : ""}
												{delta} priority
											</Badge>
										</div>

										<div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
											<span>
												{decision.currentPriority} → {decision.nextPriority}
											</span>
											<span>Rate: {acceptanceRate}%</span>
											<span>{decision.reason}</span>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
