import { AlertCircle } from "lucide-react";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "#/components/ui/alert-dialog";
import { Button } from "#/components/ui/button";

import { formatSyncLogError } from "./admin-sync-logs.helpers";

type AdminSyncLogErrorDialogProps = {
	error: string | null;
};

export function AdminSyncLogErrorDialog({
	error,
}: AdminSyncLogErrorDialogProps) {
	if (!error) {
		return <span className="text-muted-foreground">-</span>;
	}

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button type="button" variant="outline" size="sm">
					<AlertCircle className="mr-2 h-4 w-4" />
					Inspect
				</Button>
			</AlertDialogTrigger>

			<AlertDialogContent className="max-w-2xl">
				<AlertDialogHeader>
					<AlertDialogTitle>Sync log details</AlertDialogTitle>
					<AlertDialogDescription>
						Recorded warning or error payload for this run.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<pre className="max-h-[55vh] overflow-auto rounded-lg border bg-muted/40 p-3 text-xs text-foreground">
					{formatSyncLogError(error)}
				</pre>

				<AlertDialogFooter>
					<AlertDialogAction>Close</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
