import { ExternalLink } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { CardDescription, CardHeader, CardTitle } from "#/components/ui/card";

import { AdminRepoAlgorithmBadge } from "./AdminRepoAlgorithmBadge";
import {
	getScoreBadgeVariant,
	getStatusBadgeVariant,
	hasRepoDemo,
} from "./admin-repo-review-card.helpers";
import type { AdminRepoReviewCardRepo } from "./admin-repo-review-card.types";

type AdminRepoReviewHeaderProps = {
	repo: AdminRepoReviewCardRepo;
};

export function AdminRepoReviewHeader({ repo }: AdminRepoReviewHeaderProps) {
	const hasDemo = hasRepoDemo(repo.homepage);

	return (
		<CardHeader className="space-y-3">
			<div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
				<div className="min-w-0 space-y-1">
					<CardTitle className="text-base">
						<a
							href={repo.url}
							target="_blank"
							rel="noreferrer"
							className="inline-flex max-w-full items-center gap-2 hover:underline"
						>
							<span className="truncate">{repo.fullName}</span>
							<ExternalLink className="h-3.5 w-3.5 shrink-0" />
						</a>
					</CardTitle>

					<CardDescription className="line-clamp-2">
						{repo.description || "No description provided."}
					</CardDescription>
				</div>

				<div className="flex shrink-0 flex-wrap justify-start gap-2 sm:justify-end">
					<Badge variant={getScoreBadgeVariant(repo.score)}>
						Score {repo.score}
					</Badge>

					<Badge variant="outline">{repo.repoType}</Badge>

					<Badge variant={getStatusBadgeVariant(repo.status)}>
						{repo.status}
					</Badge>
				</div>
			</div>

			<div className="flex flex-wrap gap-2">
				<AdminRepoAlgorithmBadge isAccepted={repo.isAccepted} />

				{repo.language && <Badge variant="secondary">{repo.language}</Badge>}

				{hasDemo ? (
					<Badge variant="secondary">Live demo</Badge>
				) : (
					<Badge variant="outline">No demo</Badge>
				)}
			</div>
		</CardHeader>
	);
}
