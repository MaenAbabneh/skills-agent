import { Loader2, Search } from "lucide-react";

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

type AdminDiscoveryRunCardProps = {
	section: string;
	isRunning: boolean;
	runningAction: RunningDiscoveryAction;
	isRateLimitBlocked?: boolean;
	onRunDiscovery: () => void | Promise<void>;
};

export function AdminDiscoveryRunCard({
	section,
	isRunning,
	runningAction,
	isRateLimitBlocked = false,
	onRunDiscovery,
}: AdminDiscoveryRunCardProps) {
	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2">
					<Search className="h-5 w-5" />
					Budget-Based Discovery
				</CardTitle>

				<CardDescription>
					Finds new repositories using discovery queries, rate-limit checks, and
					the section search budget.
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
						Uses section discovery queries and the configured search budget,
						then saves new repositories for review.
					</p>
				</div>
			</CardContent>

			<CardFooter>
				<Button
					type="button"
					onClick={onRunDiscovery}
					disabled={isRunning || isRateLimitBlocked}
					className="w-full justify-start"
				>
					{runningAction === "discovery" ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<Search className="mr-2 h-4 w-4" />
					)}

					{runningAction === "discovery"
						? "Running Discovery..."
						: `Run ${section} Discovery`}
				</Button>
			</CardFooter>
		</Card>
	);
}
