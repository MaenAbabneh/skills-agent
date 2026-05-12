import { AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";

import { Badge } from "#/components/ui/badge";

export function AdminRunStatusBadge({ status }: { status: string }) {
	if (status === "success") {
		return (
			<Badge variant="secondary" className="gap-1">
				<CheckCircle2 className="h-3 w-3" />
				Success
			</Badge>
		);
	}

	if (status === "failed") {
		return (
			<Badge variant="destructive" className="gap-1">
				<XCircle className="h-3 w-3" />
				Failed
			</Badge>
		);
	}

	if (status === "running") {
		return (
			<Badge variant="outline" className="gap-1">
				<Clock className="h-3 w-3" />
				Running
			</Badge>
		);
	}

	return (
		<Badge variant="outline" className="gap-1">
			<AlertCircle className="h-3 w-3" />
			{status}
		</Badge>
	);
}
