import { CheckCircle2, EyeOff, Loader2, XCircle } from "lucide-react";

import { AdminConfirmActionDialog } from "#/components/admin/common/AdminConfirmActionDialog";
import { Button } from "#/components/ui/button";
import type { SectionId } from "#/lib/sections";

import type { AdminRepoReviewAction } from "./admin-repo-review-card.types";

type AdminRepoReviewActionsProps = {
	repoSectionId: string;
	section: SectionId;
	fullName: string;

	isUpdating?: boolean;
	updatingAction?: AdminRepoReviewAction | null;

	onApprove: (repoSectionId: string) => void | Promise<void>;
	onReject: (repoSectionId: string) => void | Promise<void>;
	onHide: (repoSectionId: string) => void | Promise<void>;
};

export function AdminRepoReviewActions({
	repoSectionId,
	section: _section,
	fullName,
	isUpdating = false,
	updatingAction = null,
	onApprove,
	onReject,
	onHide,
}: AdminRepoReviewActionsProps) {
	const isApproving = isUpdating && updatingAction === "approve";
	const isRejecting = isUpdating && updatingAction === "reject";
	const isHiding = isUpdating && updatingAction === "hide";

	return (
		<div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap">
			<Button
				type="button"
				size="sm"
				disabled={isUpdating}
				onClick={() => onApprove(repoSectionId)}
				className="sm:w-auto"
			>
				{isApproving ? (
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
				) : (
					<CheckCircle2 className="mr-2 h-4 w-4" />
				)}

				{isApproving ? "Approving..." : "Approve"}
			</Button>

			<AdminConfirmActionDialog
				title="Reject repository?"
				description={`This will mark ${fullName} as rejected. It will not appear publicly.`}
				confirmLabel="Reject"
				variant="destructive"
				disabled={isUpdating}
				onConfirm={() => onReject(repoSectionId)}
				trigger={
					<Button
						type="button"
						size="sm"
						variant="destructive"
						disabled={isUpdating}
						className="w-full sm:w-auto"
					>
						{isRejecting ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<XCircle className="mr-2 h-4 w-4" />
						)}

						{isRejecting ? "Rejecting..." : "Reject"}
					</Button>
				}
			/>

			<AdminConfirmActionDialog
				title="Hide repository?"
				description={`This will hide ${fullName}. You can still find it later in hidden repos.`}
				confirmLabel="Hide"
				disabled={isUpdating}
				onConfirm={() => onHide(repoSectionId)}
				trigger={
					<Button
						type="button"
						size="sm"
						variant="outline"
						disabled={isUpdating}
						className="w-full sm:w-auto"
					>
						{isHiding ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<EyeOff className="mr-2 h-4 w-4" />
						)}

						{isHiding ? "Hiding..." : "Hide"}
					</Button>
				}
			/>
		</div>
	);
}
