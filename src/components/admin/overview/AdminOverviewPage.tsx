import { Link, useNavigate } from "@tanstack/react-router";
import {
	Activity,
	CheckCircle2,
	Clock,
	Database,
	Eye,
	Github,
	RefreshCcw,
	Search,
	ShieldAlert,
} from "lucide-react";

import {
	AdminEmptyState,
	AdminMetricCard,
	AdminPageHeader,
	AdminRunStatusBadge,
	AdminTableShell,
	formatAdminDate,
} from "#/components/admin/common";
import { AdminSectionSelector } from "#/components/admin/discovery";
import { useAdminAgentSkillsRevalidation } from "#/components/admin/useAdminAgentSkillsRevalidation";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
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
import { getAdminReposDefaultSearch } from "#/constants/admin/navigation";
import { SECTION_CONFIGS, type SectionId } from "#/lib/sections";
import type { AdminDiscoveryIntelligence } from "#/server/admin/admin-discovery-intelligence.query";
import type { getAdminDashboard } from "#/server/functions/admin-dashboard";

import { AdminDiscoveryIntelligenceCard } from "./AdminDiscoveryIntelligenceCard";

type AdminDashboard = Awaited<ReturnType<typeof getAdminDashboard>>;

type AdminOverviewPageProps = {
	selectedSection: SectionId;
	dashboard: AdminDashboard;
	discoveryIntelligence: AdminDiscoveryIntelligence;
};

function formatNumber(value: number) {
	return new Intl.NumberFormat("en").format(value);
}

function formatPercentValue(value: number) {
	const rounded = Math.round(value * 10) / 10;

	return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
}

function formatBasisPointsAsPercent(value: number | null) {
	if (value === null) {
		return "--";
	}

	return formatPercentValue(value / 100);
}

function getPlanBadgeVariant(value: string | null) {
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

function PlanBadge({ value }: { value: string | null }) {
	if (!value) {
		return <span className="text-muted-foreground">--</span>;
	}

	return <Badge variant={getPlanBadgeVariant(value)}>{value}</Badge>;
}

export function AdminOverviewPage({
	selectedSection,
	dashboard,
	discoveryIntelligence,
}: AdminOverviewPageProps) {
	const navigate = useNavigate({ from: "/admin" });
	const { totals, sections, recentRuns } = dashboard;
	const hasDashboardData = sections.length > 0 || recentRuns.length > 0;
	const selectedSectionLabel = SECTION_CONFIGS[selectedSection].label;
	const { isRevalidatingAgentSkills, revalidateAgentSkills } =
		useAdminAgentSkillsRevalidation();
	const selectedSectionHealth = sections.find(
		(section) => section.section === selectedSection,
	) ?? {
		section: selectedSection,
		pendingTotal: 0,
		pendingAccepted: 0,
		pendingRejected: 0,
		approvedTotal: 0,
		rejectedTotal: 0,
		hiddenTotal: 0,
		total: 0,
		lastRun: null,
	};

	function handleSectionChange(section: SectionId) {
		navigate({
			search: {
				section,
			},
		});
	}

	return (
		<div className="space-y-6">
			<AdminPageHeader
				title="Admin Dashboard"
				description="Monitor repository discovery, review queues, and platform health."
				actions={
					<>
						{selectedSection === "agent-skills" && (
							<Button
								type="button"
								variant="outline"
								disabled={isRevalidatingAgentSkills}
								onClick={revalidateAgentSkills}
							>
								<RefreshCcw
									className={`mr-2 h-4 w-4 ${isRevalidatingAgentSkills ? "animate-spin" : ""}`}
								/>
								{isRevalidatingAgentSkills
									? "Revalidating..."
									: "Revalidate Skills"}
							</Button>
						)}

						<Button asChild>
							<Link
								to="/admin/repos"
								search={getAdminReposDefaultSearch(selectedSection)}
							>
								<Github className="mr-2 h-4 w-4" />
								Review Repos
							</Link>
						</Button>

						<Button variant="outline" asChild>
							<Link
								to="/admin/discovery"
								search={{
									section: selectedSection,
								}}
							>
								<Search className="mr-2 h-4 w-4" />
								Discovery
							</Link>
						</Button>
					</>
				}
			/>

			{!hasDashboardData && (
				<AdminEmptyState
					icon={<Database className="h-10 w-10" />}
					title="No dashboard data yet"
					description="Run discovery or sync a section to populate admin health metrics."
					action={
						<Button variant="outline" asChild>
							<Link
								to="/admin/discovery"
								search={{
									section: selectedSection,
								}}
							>
								Open Discovery
							</Link>
						</Button>
					}
				/>
			)}

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
				<AdminMetricCard
					title="Global Pending Review"
					value={totals.pendingTotal}
					description="All sections waiting for admin decision"
					icon={Clock}
				/>

				<AdminMetricCard
					title="Global Algorithm Accepted"
					value={totals.pendingAccepted}
					description="Best pending candidates across all sections"
					icon={CheckCircle2}
				/>

				<AdminMetricCard
					title="Global Needs Review"
					value={totals.pendingRejected}
					description="Rejected or uncertain across all sections"
					icon={ShieldAlert}
				/>

				<AdminMetricCard
					title="Global Approved Publicly"
					value={totals.approvedTotal}
					description="Approved entries across all sections"
					icon={Eye}
				/>

				<AdminMetricCard
					title="Global Section Repos"
					value={totals.total}
					description="All stored section entries"
					icon={Database}
				/>
			</div>

			<AdminSectionSelector
				section={selectedSection}
				onSectionChange={handleSectionChange}
			/>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
				<AdminMetricCard
					title="Section Pending"
					value={selectedSectionHealth.pendingTotal}
					description={`${selectedSectionLabel} repos waiting for review`}
					icon={Clock}
				/>

				<AdminMetricCard
					title="Section Accepted"
					value={selectedSectionHealth.pendingAccepted}
					description="Pending repos accepted by the algorithm"
					icon={CheckCircle2}
				/>

				<AdminMetricCard
					title="Section Needs Review"
					value={selectedSectionHealth.pendingRejected}
					description="Pending repos rejected or uncertain"
					icon={ShieldAlert}
				/>

				<AdminMetricCard
					title="Section Approved"
					value={selectedSectionHealth.approvedTotal}
					description={`Approved ${selectedSectionLabel} entries`}
					icon={Eye}
				/>

				<AdminMetricCard
					title="Section Total"
					value={selectedSectionHealth.total}
					description={`All stored ${selectedSectionLabel} entries`}
					icon={Database}
				/>
			</div>

			<AdminDiscoveryIntelligenceCard intelligence={discoveryIntelligence} />

			<div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
				<Card>
					<CardHeader>
						<CardTitle>Section Health</CardTitle>

						<CardDescription>
							Review queue and approval status for each section.
						</CardDescription>
					</CardHeader>

					<CardContent>
						<AdminTableShell>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Section</TableHead>
										<TableHead className="text-right">Pending</TableHead>
										<TableHead className="text-right">Accepted</TableHead>
										<TableHead className="text-right">Needs Review</TableHead>
										<TableHead className="text-right">Approved</TableHead>
										<TableHead>Last Run</TableHead>
										<TableHead className="text-right">Action</TableHead>
									</TableRow>
								</TableHeader>

								<TableBody>
									{sections.length === 0 && (
										<TableRow>
											<TableCell colSpan={7} className="py-8">
												<AdminEmptyState
													inCard={false}
													title="No sections found"
													description="Discovery has not created section health rows yet."
												/>
											</TableCell>
										</TableRow>
									)}

									{sections.map((section) => (
										<TableRow key={section.section}>
											<TableCell className="font-medium">
												{section.section}
											</TableCell>

											<TableCell className="text-right">
												{formatNumber(section.pendingTotal)}
											</TableCell>

											<TableCell className="text-right">
												{formatNumber(section.pendingAccepted)}
											</TableCell>

											<TableCell className="text-right">
												{formatNumber(section.pendingRejected)}
											</TableCell>

											<TableCell className="text-right">
												{formatNumber(section.approvedTotal)}
											</TableCell>

											<TableCell>
												{section.lastRun ? (
													<div className="space-y-1">
														<AdminRunStatusBadge
															status={section.lastRun.status}
														/>

														<div className="text-xs text-muted-foreground">
															{formatAdminDate(section.lastRun.createdAt)}
														</div>
													</div>
												) : (
													<Badge variant="outline">Never</Badge>
												)}
											</TableCell>

											<TableCell className="text-right">
												<Button size="sm" variant="outline" asChild>
													<Link
														to="/admin/repos"
														search={getAdminReposDefaultSearch(
															section.section as SectionId,
														)}
													>
														Review
													</Link>
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</AdminTableShell>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Quick Actions</CardTitle>

						<CardDescription>
							Common admin tasks for discovery and review.
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-3">
						<Button className="w-full justify-start" asChild>
							<Link
								to="/admin/repos"
								search={getAdminReposDefaultSearch(selectedSection)}
							>
								<Github className="mr-2 h-4 w-4" />
								Review Pending Repos
							</Link>
						</Button>

						<Button className="w-full justify-start" variant="outline" asChild>
							<Link
								to="/admin/discovery"
								search={{
									section: selectedSection,
								}}
							>
								<Search className="mr-2 h-4 w-4" />
								Run Discovery
							</Link>
						</Button>

						<Button className="w-full justify-start" variant="outline" asChild>
							<Link
								to="/admin/sync-logs"
								search={{
									section: selectedSection,
								}}
							>
								<Activity className="mr-2 h-4 w-4" />
								View Sync Logs
							</Link>
						</Button>

						<Button className="w-full justify-start" variant="outline" asChild>
							<Link to="/admin/users">
								<ShieldAlert className="mr-2 h-4 w-4" />
								Manage Users
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Recent Discovery / Sync Runs</CardTitle>

					<CardDescription>
						Latest discovery activity for {selectedSectionLabel}. Accepted and
						rejected here are algorithm decisions, not final admin approval.
					</CardDescription>
				</CardHeader>

				<CardContent>
					<AdminTableShell>
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
									<TableHead>Time</TableHead>
								</TableRow>
							</TableHeader>

							<TableBody>
								{recentRuns.length === 0 && (
									<TableRow>
										<TableCell colSpan={16} className="py-8">
											<AdminEmptyState
												inCard={false}
												title="No discovery or sync runs yet"
												description="Runs will appear here after discovery or sync completes."
											/>
										</TableCell>
									</TableRow>
								)}

								{recentRuns.map((run) => (
									<TableRow key={`${run.section}-${run.createdAt}`}>
										<TableCell className="font-medium">{run.section}</TableCell>

										<TableCell>
											<div className="flex items-center gap-2">
												<AdminRunStatusBadge status={run.status} />

												{run.rateLimitHit && (
													<Badge variant="secondary">Rate limited</Badge>
												)}

												{run.totalFailed > 0 && (
													<Badge variant="destructive">
														{formatNumber(run.totalFailed)} failed
													</Badge>
												)}
											</div>
										</TableCell>

										<TableCell className="text-right">
											{formatNumber(run.totalFetched)}
										</TableCell>

										<TableCell className="text-right">
											{formatNumber(run.totalUnique)}
										</TableCell>

										<TableCell className="text-right">
											{formatNumber(run.totalExisting)}
										</TableCell>

										<TableCell className="text-right font-medium">
											{formatNumber(run.totalNew)}
										</TableCell>

										<TableCell className="text-right">
											{formatNumber(run.totalAccepted)}
										</TableCell>

										<TableCell className="text-right">
											{formatNumber(run.totalRejected)}
										</TableCell>

										<TableCell className="text-right">
											{run.totalFailed > 0 ? (
												<Badge variant="destructive">
													{formatNumber(run.totalFailed)}
												</Badge>
											) : (
												<span className="text-muted-foreground">0</span>
											)}
										</TableCell>

										<TableCell className="text-right">
											<span className="text-muted-foreground">
												{formatNumber(run.totalVariantsTried)}/
												{formatNumber(run.searchRequestsBudget)}
											</span>
										</TableCell>

										<TableCell>
											<PlanBadge value={run.discoveryPlanMode} />
										</TableCell>

										<TableCell>
											<PlanBadge value={run.discoveryPlanDiagnosis} />
										</TableCell>

										<TableCell>
											<PlanBadge value={run.discoveryPlanConfidence} />
										</TableCell>

										<TableCell className="text-right tabular-nums">
											<span className="text-muted-foreground">
												{formatBasisPointsAsPercent(
													run.discoveryPlanSaturationBps,
												)}
											</span>
										</TableCell>

										<TableCell className="text-right tabular-nums">
											<span className="text-muted-foreground">
												{formatBasisPointsAsPercent(run.discoveryPlanNewBps)}
											</span>
										</TableCell>

										<TableCell className="whitespace-nowrap text-muted-foreground">
											{formatAdminDate(run.createdAt)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</AdminTableShell>
				</CardContent>
			</Card>
		</div>
	);
}
