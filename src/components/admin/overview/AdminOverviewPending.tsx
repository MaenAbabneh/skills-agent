import { Card, CardContent, CardHeader } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";

const METRIC_SKELETON_KEYS = [
	"pending",
	"accepted",
	"review",
	"approved",
	"total",
];
const TABLE_SKELETON_KEYS = ["row-1", "row-2", "row-3", "row-4", "row-5"];

export function AdminOverviewPending() {
	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
				<div className="space-y-2">
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-4 w-full max-w-xl" />
				</div>
				<div className="flex gap-2">
					<Skeleton className="h-9 w-32" />
					<Skeleton className="h-9 w-28" />
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
				{METRIC_SKELETON_KEYS.map((key) => (
					<Card key={key}>
						<CardHeader className="pb-2">
							<Skeleton className="h-4 w-28" />
						</CardHeader>
						<CardContent className="space-y-2">
							<Skeleton className="h-8 w-16" />
							<Skeleton className="h-3 w-full" />
						</CardContent>
					</Card>
				))}
			</div>

			<Card>
				<CardHeader className="space-y-2">
					<Skeleton className="h-5 w-36" />
					<Skeleton className="h-4 w-72" />
				</CardHeader>
				<CardContent className="space-y-3">
					{TABLE_SKELETON_KEYS.map((key) => (
						<Skeleton key={key} className="h-10 w-full" />
					))}
				</CardContent>
			</Card>
		</div>
	);
}
