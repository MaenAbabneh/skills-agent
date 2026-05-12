import { AlertCircle, GitFork, Star } from "lucide-react";

import { formatRepoNumber } from "./admin-repo-review-card.helpers";

type AdminRepoStatsGridProps = {
	stars: number;
	forks: number;
	openIssues: number;
};

export function AdminRepoStatsGrid({
	stars,
	forks,
	openIssues,
}: AdminRepoStatsGridProps) {
	return (
		<div className="grid gap-2 text-sm sm:grid-cols-3">
			<div className="rounded-lg border p-2.5">
				<div className="flex items-center gap-2 text-muted-foreground">
					<Star className="h-4 w-4" />
					Stars
				</div>

				<div className="mt-1 font-medium">{formatRepoNumber(stars)}</div>
			</div>

			<div className="rounded-lg border p-2.5">
				<div className="flex items-center gap-2 text-muted-foreground">
					<GitFork className="h-4 w-4" />
					Forks
				</div>

				<div className="mt-1 font-medium">{formatRepoNumber(forks)}</div>
			</div>

			<div className="rounded-lg border p-2.5">
				<div className="flex items-center gap-2 text-muted-foreground">
					<AlertCircle className="h-4 w-4" />
					Issues
				</div>

				<div className="mt-1 font-medium">{formatRepoNumber(openIssues)}</div>
			</div>
		</div>
	);
}
