import { Link } from "@tanstack/react-router";
import { Database, RefreshCcw } from "lucide-react";
import {
	AdminEmptyState,
	AdminPageHeader,
	AdminRunStatusBadge,
	AdminTableShell,
	formatAdminDate,
} from "#/components/admin/common";

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
import type { SectionId } from "#/lib/sections";
import type { getAdminSyncLogsList } from "#/server/functions/admin-sync-logs";

import { AdminSyncLogErrorDialog } from "./AdminSyncLogErrorDialog";
import { parseSyncLogWarning } from "./admin-sync-logs.helpers";

type AdminSyncLogs = Awaited<ReturnType<typeof getAdminSyncLogsList>>;

type AdminSyncLogsPageProps = {
	section: SectionId;
	logs: AdminSyncLogs;
};

export function AdminSyncLogsPage({ section, logs }: AdminSyncLogsPageProps) {
	return (
		<div className="space-y-6">
			<AdminPageHeader
				title="Sync Logs"
				description="Review recent discovery and sync runs, including fetched candidates, accepted results, rejected results, and warnings."
				actions={
					<Button variant="outline" asChild>
						<Link to="/admin/discovery" search={{ section }}>
							<RefreshCcw className="mr-2 h-4 w-4" />
							View Discovery
						</Link>
					</Button>
				}
			/>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Database className="h-5 w-5" />
						Recent Runs
					</CardTitle>

					<CardDescription>
						Latest 50 sync/discovery executions across all sections.
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
									<TableHead className="text-right">Unique</TableHead>
									<TableHead className="text-right">Accepted</TableHead>
									<TableHead className="text-right">Rejected</TableHead>
									<TableHead>Warnings</TableHead>
									<TableHead>Error</TableHead>
									<TableHead>Time</TableHead>
								</TableRow>
							</TableHeader>

							<TableBody>
								{logs.length === 0 && (
									<TableRow>
										<TableCell colSpan={9} className="py-10">
											<AdminEmptyState
												inCard={false}
												icon={<Database className="h-10 w-10" />}
												title="No sync logs found"
												description="Discovery and sync runs will appear here after they complete."
												action={
													<Button variant="outline" asChild>
														<Link to="/admin/discovery" search={{ section }}>
															Open Discovery
														</Link>
													</Button>
												}
											/>
										</TableCell>
									</TableRow>
								)}

								{logs.map((log) => {
									const warning = parseSyncLogWarning(log.error);

									return (
										<TableRow key={log.id}>
											<TableCell className="font-medium">
												{log.section}
											</TableCell>
											<TableCell>
												<AdminRunStatusBadge status={log.status} />
											</TableCell>
											<TableCell className="text-right">
												{log.totalFetched}
											</TableCell>
											<TableCell className="text-right">
												{log.totalUnique}
											</TableCell>
											<TableCell className="text-right">
												{log.totalAccepted}
											</TableCell>
											<TableCell className="text-right">
												{log.totalRejected}
											</TableCell>
											<TableCell>
												{warning ? (
													<Badge
														variant={
															log.status === "failed"
																? "destructive"
																: "outline"
														}
													>
														{warning}
													</Badge>
												) : (
													<span className="text-muted-foreground">-</span>
												)}
											</TableCell>
											<TableCell>
												<AdminSyncLogErrorDialog error={log.error} />
											</TableCell>
											<TableCell className="whitespace-nowrap text-muted-foreground">
												{formatAdminDate(log.createdAt)}
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</AdminTableShell>
				</CardContent>
			</Card>
		</div>
	);
}
