import { useRouter } from "@tanstack/react-router";
import { ArrowUpCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import { promoteTemporarySearchQueryAction } from "#/server/functions/admin-section-search-queries";

type TemporaryDiscoveryType =
	| "db"
	| "temporary"
	| "topic_temporary"
	| "ai_temporary";

type TemporaryDiscovery = {
	section?: string;
	query: string;
	queryType: TemporaryDiscoveryType;
	runs: number;
	totalNew: number;
	totalAccepted: number;
	totalRejected: number;
	latestSeenAt: string | null;
};

export type AdminTemporaryDiscoveriesCardProps = {
	section: SectionId;
	discoveries: TemporaryDiscovery[];
};

function formatNumber(value: number) {
	return new Intl.NumberFormat("en").format(value);
}

function formatDate(value: string | null) {
	if (!value) {
		return "Never";
	}

	return new Intl.DateTimeFormat("en", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));
}

function getTypeBadgeVariant(type: TemporaryDiscoveryType) {
	if (type === "topic_temporary") {
		return "default";
	}

	if (type === "ai_temporary") {
		return "secondary";
	}

	return "outline";
}

function getAcceptanceRate(discovery: TemporaryDiscovery) {
	if (discovery.totalNew <= 0) {
		return 0;
	}

	return Math.round((discovery.totalAccepted / discovery.totalNew) * 100);
}

export function AdminTemporaryDiscoveriesCard({
	section,
	discoveries,
}: AdminTemporaryDiscoveriesCardProps) {
	const router = useRouter();
	const [promotingQuery, setPromotingQuery] = useState<string | null>(null);

	async function promoteDiscovery(discovery: TemporaryDiscovery) {
		try {
			setPromotingQuery(discovery.query);

			await promoteTemporarySearchQueryAction({
				data: {
					section,
					query: discovery.query,
				},
			});

			toast.success("Temporary discovery promoted.");
			await router.invalidate();
		} catch (error) {
			console.error("Failed to promote temporary discovery:", error);

			toast.error(
				error instanceof Error
					? error.message
					: "Failed to promote temporary discovery.",
			);
		} finally {
			setPromotingQuery(null);
		}
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
					<div>
						<CardTitle>Temporary Discoveries</CardTitle>
						<CardDescription>
							Promote successful temporary discovery queries into the managed
							search query pool.
						</CardDescription>
					</div>

					<Badge variant="secondary">{discoveries.length} discovered</Badge>
				</div>
			</CardHeader>

			<CardContent>
				{discoveries.length === 0 ? (
					<div className="rounded-lg border p-6 text-center">
						<div className="font-medium">No temporary discoveries yet</div>
						<p className="mt-1 text-sm text-muted-foreground">
							Discovery runs will surface temporary query performance here.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto rounded-lg border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Query</TableHead>
									<TableHead>Performance</TableHead>
									<TableHead>Latest</TableHead>
									<TableHead>Action</TableHead>
								</TableRow>
							</TableHeader>

							<TableBody>
								{discoveries.map((discovery) => {
									const isPromoting = promotingQuery === discovery.query;

									return (
										<TableRow key={`${discovery.queryType}:${discovery.query}`}>
											<TableCell className="min-w-70 align-top">
												<div className="space-y-2">
													<div className="font-medium">{discovery.query}</div>
													<Badge
														variant={getTypeBadgeVariant(discovery.queryType)}
													>
														{discovery.queryType}
													</Badge>
													<Badge variant="outline">
														{discovery.section ?? section}
													</Badge>
												</div>
											</TableCell>

											<TableCell className="align-top">
												<div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-5">
													<div>
														<div>Runs</div>
														<div className="font-medium text-foreground">
															{formatNumber(discovery.runs)}
														</div>
													</div>
													<div>
														<div>New</div>
														<div className="font-medium text-foreground">
															{formatNumber(discovery.totalNew)}
														</div>
													</div>
													<div>
														<div>Accepted</div>
														<div className="font-medium text-foreground">
															{formatNumber(discovery.totalAccepted)}
														</div>
													</div>
													<div>
														<div>Rejected</div>
														<div className="font-medium text-foreground">
															{formatNumber(discovery.totalRejected)}
														</div>
													</div>
													<div>
														<div>Acceptance</div>
														<div className="font-medium text-foreground">
															{getAcceptanceRate(discovery)}%
														</div>
													</div>
												</div>
											</TableCell>

											<TableCell className="whitespace-nowrap align-top text-sm text-muted-foreground">
												{formatDate(discovery.latestSeenAt)}
											</TableCell>

											<TableCell className="align-top">
												<Button
													type="button"
													size="sm"
													disabled={isPromoting}
													onClick={() => promoteDiscovery(discovery)}
												>
													{isPromoting ? (
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													) : (
														<ArrowUpCircle className="mr-2 h-4 w-4" />
													)}
													Promote
												</Button>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
