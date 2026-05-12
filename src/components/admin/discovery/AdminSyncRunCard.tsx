import { Loader2, RefreshCcw } from "lucide-react";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";

import type { RunningDiscoveryAction } from "./useAdminDiscoveryActions";

type AdminSyncRunCardProps = {
	section: string;
	isRunning: boolean;
	runningAction: RunningDiscoveryAction;
	isRateLimitBlocked?: boolean;
	onRunSync: () => void | Promise<void>;
};

export function AdminSyncRunCard({
	section,
	isRunning,
	runningAction,
	isRateLimitBlocked = false,
	onRunSync,
}: AdminSyncRunCardProps) {
	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2">
					<RefreshCcw className="h-5 w-5" />
					Sync
				</CardTitle>

				<CardDescription>
					Sync runs the high-quality section queries and refreshes stored
					repository data.
				</CardDescription>
			</CardHeader>

			<CardContent className="space-y-4">
				<div className="rounded-lg border p-4 text-sm">
					<div className="flex flex-wrap items-center gap-2">
						<span className="font-medium">Section</span>
						<Badge variant="outline">{section}</Badge>
						{isRateLimitBlocked && (
							<Badge variant="destructive">Search API blocked</Badge>
						)}
					</div>

					<p className="mt-3 text-muted-foreground">
						Refreshes repository metadata for section queries while preserving
						existing admin decisions.
					</p>
				</div>
			</CardContent>

			<CardFooter>
				<Button
					type="button"
					variant="outline"
					onClick={onRunSync}
					disabled={isRunning || isRateLimitBlocked}
					className="w-full justify-start"
				>
					{runningAction === "sync" ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<RefreshCcw className="mr-2 h-4 w-4" />
					)}

					{runningAction === "sync" ? "Running Sync..." : `Run ${section} Sync`}
				</Button>
			</CardFooter>
		</Card>
	);
}
