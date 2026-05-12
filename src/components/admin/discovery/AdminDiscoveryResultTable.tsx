import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Badge } from "#/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";

import type { DiscoveryResult } from "./useAdminDiscoveryActions";

type AdminDiscoveryResultTableProps = {
	result: DiscoveryResult | null;
};

function formatNumber(value: number) {
	return new Intl.NumberFormat("en").format(value);
}

function formatPercentValue(value: number) {
	const percent = Math.round(value * 1000) / 10;

	return `${Number.isInteger(percent) ? percent.toFixed(0) : percent.toFixed(1)}%`;
}

function getDiscoveryPlan(result: unknown) {
	if (!result || typeof result !== "object" || !("discoveryPlan" in result)) {
		return null;
	}

	const discoveryPlan = result.discoveryPlan;

	if (!discoveryPlan || typeof discoveryPlan !== "object") {
		return null;
	}

	return discoveryPlan as {
		mode?: string;
		diagnosis?: string;
		confidence?: string;
		saturationRate?: number;
		newRate?: number;
	};
}

function getPlanBadgeVariant(value: string | undefined) {
	if (
		value === "recovery" ||
		value === "rate-limited" ||
		value === "high-failure"
	) {
		return "destructive";
	}

	if (value === "exploration" || value === "saturated") {
		return "secondary";
	}

	if (value === "normal" || value === "healthy" || value === "high") {
		return "default";
	}

	return "outline";
}

function PlanBadge({ value }: { value: string | undefined }) {
	if (!value) {
		return <span className="text-muted-foreground">--</span>;
	}

	return <Badge variant={getPlanBadgeVariant(value)}>{value}</Badge>;
}

function getStatusBadge(result: DiscoveryResult) {
	if (result.totalFailed > 0) {
		return <Badge variant="destructive">Warnings</Badge>;
	}

	if (result.rateLimitHit) {
		return <Badge variant="secondary">Rate limited</Badge>;
	}

	if (result.partialErrors.length > 0) {
		return <Badge variant="secondary">Warnings</Badge>;
	}

	return <Badge variant="default">Success</Badge>;
}

function getStatusIcon(result: DiscoveryResult) {
	if (result.totalFailed > 0 || result.partialErrors.length > 0) {
		return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
	}

	return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
}

export function AdminDiscoveryResultTable({
	result,
}: AdminDiscoveryResultTableProps) {
	if (!result) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Recent Discovery Runs</CardTitle>

					<CardDescription>
						Latest repository discovery activity. Accepted and rejected here are
						algorithm decisions, not final admin approval.
					</CardDescription>
				</CardHeader>

				<CardContent>
					<div className="rounded-lg border p-6 text-center">
						<div className="font-medium">No runs yet</div>

						<p className="mt-1 text-sm text-muted-foreground">
							Discovery activity will appear here after the first run.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	const discoveryPlan = getDiscoveryPlan(result);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Recent Discovery Runs</CardTitle>

				<CardDescription>
					Latest repository discovery activity. Accepted and rejected here are
					algorithm decisions, not final admin approval.
				</CardDescription>
			</CardHeader>

			<CardContent>
				<div className="overflow-x-auto rounded-lg border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Section</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="text-right">Fetched</TableHead>
								<TableHead className="text-right">Candidates</TableHead>
								<TableHead className="text-right">Existing</TableHead>
								<TableHead className="text-right">New</TableHead>
								<TableHead className="text-right">Accepted</TableHead>
								<TableHead className="text-right">Rejected</TableHead>
								<TableHead className="text-right">Failed</TableHead>
								<TableHead className="text-right">Budget</TableHead>
								<TableHead>Plan</TableHead>
								<TableHead>Diagnosis</TableHead>
								<TableHead>Confidence</TableHead>
								<TableHead className="text-right">Saturation</TableHead>
								<TableHead className="text-right">New Rate</TableHead>
							</TableRow>
						</TableHeader>

						<TableBody>
							<TableRow
								className={result.totalFailed > 0 ? "bg-muted/30" : undefined}
							>
								<TableCell>
									<div className="font-medium">{result.section}</div>
								</TableCell>

								<TableCell>
									<div className="flex items-center gap-2">
										{getStatusIcon(result)}
										{getStatusBadge(result)}
									</div>
								</TableCell>

								<TableCell className="text-right">
									{formatNumber(result.totalFetched)}
								</TableCell>

								<TableCell className="text-right">
									{formatNumber(result.totalCandidates)}
								</TableCell>

								<TableCell className="text-right">
									{formatNumber(result.totalExistingInSection)}
								</TableCell>

								<TableCell className="text-right font-medium">
									{formatNumber(result.totalNew)}
								</TableCell>

								<TableCell className="text-right">
									{formatNumber(result.totalAccepted)}
								</TableCell>

								<TableCell className="text-right">
									{formatNumber(result.totalRejected)}
								</TableCell>

								<TableCell className="text-right">
									{result.totalFailed > 0 ? (
										<Badge variant="destructive">
											{formatNumber(result.totalFailed)}
										</Badge>
									) : (
										<span className="text-muted-foreground">0</span>
									)}
								</TableCell>

								<TableCell className="text-right">
									<span className="text-muted-foreground">
										{result.totalVariantsTried}/{result.searchRequestsBudget}
									</span>
								</TableCell>

								<TableCell>
									<PlanBadge value={discoveryPlan?.mode} />
								</TableCell>

								<TableCell>
									<PlanBadge value={discoveryPlan?.diagnosis} />
								</TableCell>

								<TableCell>
									<PlanBadge value={discoveryPlan?.confidence} />
								</TableCell>

								<TableCell className="text-right tabular-nums">
									<span className="text-muted-foreground">
										{typeof discoveryPlan?.saturationRate === "number"
											? formatPercentValue(discoveryPlan.saturationRate)
											: "--"}
									</span>
								</TableCell>

								<TableCell className="text-right tabular-nums">
									<span className="text-muted-foreground">
										{typeof discoveryPlan?.newRate === "number"
											? formatPercentValue(discoveryPlan.newRate)
											: "--"}
									</span>
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}
