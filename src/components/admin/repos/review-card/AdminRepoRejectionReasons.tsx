import { Badge } from "#/components/ui/badge";

type AdminRepoRejectionReasonsProps = {
	rejectionReasons: string[];
	maxVisible?: number;
};

export function AdminRepoRejectionReasons({
	rejectionReasons,
	maxVisible = 3,
}: AdminRepoRejectionReasonsProps) {
	if (rejectionReasons.length === 0) {
		return null;
	}

	const visibleReasons = rejectionReasons.slice(0, maxVisible);
	const hiddenCount = Math.max(0, rejectionReasons.length - maxVisible);

	return (
		<div className="rounded-lg border border-destructive/30 p-3">
			<div className="mb-2 text-sm font-medium text-destructive">
				Rejection reasons
			</div>

			<div className="flex flex-wrap gap-2">
				{visibleReasons.map((reason) => (
					<Badge key={reason} variant="destructive">
						{reason}
					</Badge>
				))}

				{hiddenCount > 0 && (
					<Badge variant="outline">+{hiddenCount} more</Badge>
				)}
			</div>
		</div>
	);
}
