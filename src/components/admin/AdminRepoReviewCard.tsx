import {
	AdminRepoExternalLinks,
	AdminRepoRejectionReasons,
	AdminRepoReviewActions,
	type AdminRepoReviewCardProps,
	AdminRepoReviewHeader,
	AdminRepoScoreBreakdown,
	AdminRepoStatsGrid,
	AdminRepoTopics,
} from "#/components/admin/repos/review-card";
import { AdminRepoSkillFiles } from "#/components/admin/repos/review-card/AdminRepoSkillFiles";
import { Card, CardContent, CardFooter } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";

export default function AdminRepoReviewCard({
	repo,
	section,
	isUpdating = false,
	updatingAction = null,
	onApprove,
	onReject,
	onHide,
}: AdminRepoReviewCardProps) {
	return (
		<Card className="overflow-hidden transition-colors hover:border-primary/40 hover:shadow-sm">
			<AdminRepoReviewHeader repo={repo} />

			<CardContent className="space-y-4">
				<AdminRepoStatsGrid
					stars={repo.stars}
					forks={repo.forks}
					openIssues={repo.openIssues}
				/>
				<AdminRepoScoreBreakdown scoreBreakdown={repo.scoreBreakdown} />

				<AdminRepoRejectionReasons rejectionReasons={repo.rejectionReasons} />

				<AdminRepoSkillFiles section={section} metadata={repo.metadata} />

				<AdminRepoTopics topics={repo.topics} />

				<Separator />

				<AdminRepoExternalLinks url={repo.url} homepage={repo.homepage} />
			</CardContent>

			<CardFooter className="bg-muted/30">
				<AdminRepoReviewActions
					repoSectionId={repo.repoSectionId}
					section={section}
					fullName={repo.fullName}
					isUpdating={isUpdating}
					updatingAction={updatingAction}
					onApprove={onApprove}
					onReject={onReject}
					onHide={onHide}
				/>
			</CardFooter>
		</Card>
	);
}
