import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Badge } from "#/components/ui/badge";

type AdminRepoAlgorithmBadgeProps = {
	isAccepted: boolean;
};

export function AdminRepoAlgorithmBadge({
	isAccepted,
}: AdminRepoAlgorithmBadgeProps) {
	if (isAccepted) {
		return (
			<Badge className="gap-1">
				<CheckCircle2 className="h-3 w-3" />
				Accepted by algorithm
			</Badge>
		);
	}

	return (
		<Badge variant="destructive" className="gap-1">
			<AlertCircle className="h-3 w-3" />
			Needs review
		</Badge>
	);
}
