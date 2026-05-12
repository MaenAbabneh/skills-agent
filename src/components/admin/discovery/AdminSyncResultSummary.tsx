import {
	AlertTriangle,
	CheckCircle2,
	Database,
	Github,
	XCircle,
} from "lucide-react";
import { AdminMetricCard } from "#/components/admin/common";
import { Badge } from "#/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";

import type { SyncResult } from "./useAdminDiscoveryActions";

type AdminSyncResultSummaryProps = {
	result: SyncResult | null;
};

export function AdminSyncResultSummary({
	result,
}: AdminSyncResultSummaryProps) {
	if (!result) {
		return null;
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
					<div>
						<CardTitle>Last Sync Result</CardTitle>
						<CardDescription>
							Result from the latest sync run in this session.
						</CardDescription>
					</div>
					{result.totalFailed > 0 || result.partialErrors.length > 0 ? (
						<Badge variant="destructive">Warnings</Badge>
					) : (
						<Badge variant="secondary">Completed</Badge>
					)}
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
					<AdminMetricCard
						title="Unique"
						value={result.totalUnique}
						description="Unique repos from queries"
						icon={Database}
					/>
					<AdminMetricCard
						title="Fetched"
						value={result.totalFetched}
						description="Repos returned by GitHub"
						icon={Github}
					/>
					<AdminMetricCard
						title="Accepted"
						value={result.totalAccepted}
						description="Algorithm accepted"
						icon={CheckCircle2}
					/>
					<AdminMetricCard
						title="Rejected"
						value={result.totalRejected}
						description="Algorithm rejected"
						icon={XCircle}
					/>
					<AdminMetricCard
						title="Failed"
						value={result.totalFailed}
						description="Repos that failed to sync"
						icon={AlertTriangle}
					/>
				</div>

				{(result.partialErrors.length > 0 || result.failedRepos.length > 0) && (
					<div className="grid gap-4 lg:grid-cols-2">
						{result.partialErrors.length > 0 && (
							<div className="rounded-lg border p-3">
								<div className="mb-2 font-medium">Partial errors</div>
								<div className="space-y-2">
									{result.partialErrors.slice(0, 5).map((error) => (
										<div
											key={error.query}
											className="rounded-md bg-muted/50 p-2 text-xs"
										>
											<div className="font-medium">{error.query}</div>
											<div className="text-muted-foreground">{error.error}</div>
										</div>
									))}
								</div>
							</div>
						)}

						{result.failedRepos.length > 0 && (
							<div className="rounded-lg border p-3">
								<div className="mb-2 font-medium">Failed repos</div>
								<div className="space-y-2">
									{result.failedRepos.slice(0, 5).map((repo) => (
										<div
											key={repo.fullName}
											className="rounded-md bg-muted/50 p-2 text-xs"
										>
											<div className="font-medium">{repo.fullName}</div>
											<div className="text-muted-foreground">{repo.error}</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
