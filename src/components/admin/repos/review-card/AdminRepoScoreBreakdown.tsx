import type { ScoreBreakdown } from "./admin-repo-review-card.types";

type AdminRepoScoreBreakdownProps = {
	scoreBreakdown?: ScoreBreakdown;
};

function ScoreItem({
	label,
	value,
}: {
	label: string;
	value: number | undefined;
}) {
	return (
		<div className="flex items-center justify-between gap-3">
			<span>{label}</span>
			<span className="font-medium text-foreground">{value ?? "-"}</span>
		</div>
	);
}

export function AdminRepoScoreBreakdown({
	scoreBreakdown,
}: AdminRepoScoreBreakdownProps) {
	if (!scoreBreakdown) {
		return null;
	}

	return (
		<div className="rounded-lg border p-3">
			<div className="mb-2 text-sm font-medium">Score breakdown</div>

			<div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
				<ScoreItem label="Relevance" value={scoreBreakdown.relevance} />
				<ScoreItem label="Usefulness" value={scoreBreakdown.usefulness} />
				<ScoreItem label="Popularity" value={scoreBreakdown.popularity} />
				<ScoreItem label="Momentum" value={scoreBreakdown.momentum} />
				<ScoreItem label="Maintenance" value={scoreBreakdown.maintenance} />
				<ScoreItem label="Completeness" value={scoreBreakdown.completeness} />
			</div>

			{(scoreBreakdown.baseTotal !== undefined ||
				scoreBreakdown.total !== undefined) && (
				<div className="mt-3 border-t pt-3 text-xs text-muted-foreground">
					<div className="grid gap-2 sm:grid-cols-2">
						<ScoreItem label="Base total" value={scoreBreakdown.baseTotal} />
						<ScoreItem label="Final total" value={scoreBreakdown.total} />
					</div>
				</div>
			)}
		</div>
	);
}
