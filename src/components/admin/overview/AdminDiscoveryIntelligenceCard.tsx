import {
	Activity,
	Bot,
	CheckCircle2,
	Compass,
	ShieldAlert,
	TrendingUp,
} from "lucide-react";

import { Badge } from "#/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import type { AdminDiscoveryIntelligence } from "#/server/admin/admin-discovery-intelligence.query";

type AdminDiscoveryIntelligenceCardProps = {
	intelligence: AdminDiscoveryIntelligence;
};

function formatPercent(value: number) {
	return `${Math.round(value * 100)}%`;
}

function formatNumber(value: number) {
	return new Intl.NumberFormat("en").format(value);
}

function formatDate(value: string) {
	return new Intl.DateTimeFormat("en", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));
}

function getModeBadgeVariant(mode: string) {
	if (mode === "exploration") {
		return "default" as const;
	}

	if (mode === "recovery") {
		return "destructive" as const;
	}

	return "secondary" as const;
}

function getDiagnosisBadgeVariant(diagnosis: string) {
	if (diagnosis === "saturated" || diagnosis === "rate-limited") {
		return "destructive" as const;
	}

	if (diagnosis === "healthy") {
		return "secondary" as const;
	}

	return "outline" as const;
}

export function AdminDiscoveryIntelligenceCard({
	intelligence,
}: AdminDiscoveryIntelligenceCardProps) {
	const latestRun = intelligence.latestRun;
	const sectionLabel = intelligence.sectionLabel ?? intelligence.section;

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
					<div>
						<CardTitle className="flex items-center gap-2">
							<Compass className="h-5 w-5" />
							Discovery Intelligence
						</CardTitle>

						<CardDescription>
							Planner mode, saturation, recent yield, and AI status.
						</CardDescription>
					</div>

					<div className="flex flex-wrap gap-2">
						<Badge variant="outline">{sectionLabel}</Badge>

						{intelligence.recentNormalSaturated ? (
							<Badge variant="destructive">Normal saturated recently</Badge>
						) : (
							<Badge variant="secondary">Normal stable</Badge>
						)}
					</div>
				</div>
			</CardHeader>

			<CardContent className="space-y-5">
				{latestRun ? (
					<>
						<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
							<div className="rounded-lg border p-3">
								<div className="flex items-center justify-between gap-2">
									<div className="text-sm text-muted-foreground">
										Current Mode
									</div>
									<Activity className="h-4 w-4 text-muted-foreground" />
								</div>

								<div className="mt-2 flex flex-wrap gap-2">
									<Badge variant={getModeBadgeVariant(latestRun.mode)}>
										{latestRun.mode}
									</Badge>

									<Badge
										variant={getDiagnosisBadgeVariant(latestRun.diagnosis)}
									>
										{latestRun.diagnosis}
									</Badge>
								</div>

								<div className="mt-2 text-xs text-muted-foreground">
									{latestRun.querySelection} · {latestRun.confidence}
								</div>
							</div>

							<div className="rounded-lg border p-3">
								<div className="flex items-center justify-between gap-2">
									<div className="text-sm text-muted-foreground">
										Latest New
									</div>
									<TrendingUp className="h-4 w-4 text-muted-foreground" />
								</div>

								<div className="mt-2 text-2xl font-semibold">
									{formatNumber(latestRun.totalNew)}
								</div>

								<div className="text-xs text-muted-foreground">
									New rate {formatPercent(latestRun.newRate)}
								</div>
							</div>

							<div className="rounded-lg border p-3">
								<div className="flex items-center justify-between gap-2">
									<div className="text-sm text-muted-foreground">
										Latest Accepted
									</div>
									<CheckCircle2 className="h-4 w-4 text-muted-foreground" />
								</div>

								<div className="mt-2 text-2xl font-semibold">
									{formatNumber(latestRun.totalAccepted)}
								</div>

								<div className="text-xs text-muted-foreground">
									Rejected {formatNumber(latestRun.totalRejected)}
								</div>
							</div>

							<div className="rounded-lg border p-3">
								<div className="flex items-center justify-between gap-2">
									<div className="text-sm text-muted-foreground">
										AI Enabled
									</div>
									<Bot className="h-4 w-4 text-muted-foreground" />
								</div>

								<div className="mt-2 flex flex-wrap gap-2">
									{intelligence.aiEnabled ? (
										<Badge variant="secondary">Enabled</Badge>
									) : (
										<Badge variant="outline">Disabled</Badge>
									)}

									{intelligence.lastAiUsage ? (
										<Badge variant="outline">
											{intelligence.lastAiUsage.status}
										</Badge>
									) : (
										<Badge variant="outline">No calls yet</Badge>
									)}
								</div>

								<div className="mt-2 text-xs text-muted-foreground">
									{intelligence.lastAiUsage
										? `${
												intelligence.lastAiUsage.provider ??
												intelligence.aiProvider
											} · ${intelligence.lastAiUsage.model ?? intelligence.aiModel} · ${
												intelligence.lastAiUsage.reason ?? "no reason"
											}`
										: "No AI calls yet."}
								</div>
							</div>
						</div>

						{intelligence.shouldStayInExploration && (
							<div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
								<ShieldAlert className="mt-0.5 h-4 w-4 text-destructive" />

								<div>
									<div className="text-sm font-medium">
										Stay in exploration recommended
									</div>

									<p className="mt-1 text-sm text-muted-foreground">
										A recent normal run was saturated.
									</p>
								</div>
							</div>
						)}

						<div className="space-y-2">
							<div className="text-sm font-medium">Last 5 Runs</div>

							<div className="space-y-2">
								{intelligence.recentRuns.map((run) => (
									<div
										key={run.id}
										className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
									>
										<div className="flex flex-wrap items-center gap-2">
											<Badge variant={getModeBadgeVariant(run.mode)}>
												{run.mode}
											</Badge>

											<Badge variant={getDiagnosisBadgeVariant(run.diagnosis)}>
												{run.diagnosis}
											</Badge>

											<span className="text-sm text-muted-foreground">
												{formatDate(run.createdAt)}
											</span>
										</div>

										<div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
											<span>New {formatNumber(run.totalNew)}</span>
											<span>Accepted {formatNumber(run.totalAccepted)}</span>
											<span>New rate {formatPercent(run.newRate)}</span>
											<span>
												Saturation {formatPercent(run.saturationRate)}
											</span>
										</div>
									</div>
								))}
							</div>
						</div>
					</>
				) : (
					<div className="rounded-lg border p-6 text-center">
						<div className="font-medium">No discovery runs yet</div>

						<p className="mt-1 text-sm text-muted-foreground">
							No discovery runs yet for {sectionLabel}.
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
