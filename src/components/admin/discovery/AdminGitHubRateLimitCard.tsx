import { useRouter } from "@tanstack/react-router";
import { Github, RefreshCcw } from "lucide-react";
import { useState } from "react";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Progress } from "#/components/ui/progress";

type RateLimitBucket = {
	limit: number;
	used: number;
	remaining: number;
	resetAt: string;
	retryAfterSeconds: number;
};

type AdminGitHubRateLimitCardProps = {
	search: RateLimitBucket | null;
	core: RateLimitBucket | null;
};

function formatResetTime(value: string) {
	return new Intl.DateTimeFormat("en", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));
}

function formatRetryAfter(seconds: number) {
	if (seconds <= 0) {
		return "now";
	}

	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;

	if (minutes <= 0) {
		return `${remainingSeconds}s`;
	}

	return `${minutes}m ${remainingSeconds}s`;
}

function getRemainingPercentage(bucket: RateLimitBucket | null) {
	if (!bucket || bucket.limit <= 0) {
		return 0;
	}

	return Math.round((bucket.remaining / bucket.limit) * 100);
}

function getSearchStatus(search: RateLimitBucket | null) {
	if (!search) {
		return {
			label: "Unknown",
			variant: "outline" as const,
			description: "Rate limit data is unavailable.",
		};
	}

	if (search.remaining <= 3) {
		return {
			label: "Blocked",
			variant: "destructive" as const,
			description: "Discovery should wait until GitHub search resets.",
		};
	}

	if (search.remaining <= 10) {
		return {
			label: "Warning",
			variant: "secondary" as const,
			description: "Discovery can run, but the search budget is low.",
		};
	}

	return {
		label: "Healthy",
		variant: "default" as const,
		description: "Enough GitHub search budget is available.",
	};
}

function RateLimitMiniPanel({
	title,
	bucket,
	statusBadge,
}: {
	title: string;
	bucket: RateLimitBucket | null;
	statusBadge?: React.ReactNode;
}) {
	const remainingPercentage = getRemainingPercentage(bucket);

	return (
		<div className="rounded-lg border p-3">
			<div className="mb-3 flex items-center justify-between gap-3">
				<div className="text-sm font-medium">{title}</div>
				{statusBadge}
			</div>

			{bucket ? (
				<div className="space-y-3">
					<div>
						<div className="mb-1 flex items-center justify-between text-sm">
							<span className="text-muted-foreground">Remaining</span>
							<span className="font-medium">
								{bucket.remaining} / {bucket.limit}
							</span>
						</div>

						<Progress value={remainingPercentage} className="h-2" />

						<div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
							<span>{remainingPercentage}% available</span>
							<span>Used: {bucket.used}</span>
						</div>
					</div>

					<div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
						<div>
							<div>Reset</div>
							<div className="font-medium text-foreground">
								{formatResetTime(bucket.resetAt)}
							</div>
						</div>

						<div>
							<div>Retry after</div>
							<div className="font-medium text-foreground">
								{formatRetryAfter(bucket.retryAfterSeconds)}
							</div>
						</div>
					</div>
				</div>
			) : (
				<p className="text-sm text-muted-foreground">
					Rate limit data is unavailable.
				</p>
			)}
		</div>
	);
}

export function AdminGitHubRateLimitCard({
	search,
	core,
}: AdminGitHubRateLimitCardProps) {
	const router = useRouter();
	const [isRefreshing, setIsRefreshing] = useState(false);
	const status = getSearchStatus(search);

	async function handleRefresh() {
		try {
			setIsRefreshing(true);
			await router.invalidate();
		} finally {
			setIsRefreshing(false);
		}
	}

	return (
		<Card>
			<CardHeader className="space-y-3 pb-3">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<Github className="h-5 w-5" />
							GitHub Rate Limit
						</CardTitle>

						<CardDescription>{status.description}</CardDescription>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<Badge variant={status.variant}>{status.label}</Badge>

						<Button
							type="button"
							variant="outline"
							size="sm"
							disabled={isRefreshing}
							onClick={handleRefresh}
						>
							<RefreshCcw
								className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
							/>
							{isRefreshing ? "Refreshing..." : "Refresh"}
						</Button>
					</div>
				</div>
			</CardHeader>

			<CardContent>
				<div className="grid gap-3 lg:grid-cols-2">
					<RateLimitMiniPanel
						title="Search API"
						bucket={search}
						statusBadge={<Badge variant={status.variant}>{status.label}</Badge>}
					/>

					<RateLimitMiniPanel title="Core API" bucket={core} />
				</div>
			</CardContent>
		</Card>
	);
}
