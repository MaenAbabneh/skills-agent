import { useForm } from "@tanstack/react-form";
import { useRouter } from "@tanstack/react-router";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminConfirmActionDialog } from "#/components/admin/common/AdminConfirmActionDialog";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Switch } from "#/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import type { SECTION_IDS } from "#/lib/sections";
import {
	createSectionSearchQueryAction,
	deleteSectionSearchQueryAction,
	updateSectionSearchQueryAction,
} from "#/server/functions/admin-section-search-queries";

type SearchQueryType = "seed" | "exploratory" | "ai_suggested" | "admin_added";
type SearchQuerySection = (typeof SECTION_IDS)[number];

type AdminSearchQuery = {
	id: string;

	section: string;
	query: string;
	type: SearchQueryType;

	enabled: boolean;
	priority: number;

	totalRuns: number;
	totalFetched: number;
	totalCandidates: number;
	totalNew: number;
	totalAccepted: number;
	totalRejected: number;

	lastUsedAt: string | null;
	createdAt: string;
	updatedAt: string;
};

type AdminSearchQueriesManagerProps = {
	section: SearchQuerySection;
	queries: AdminSearchQuery[];
};

type AddQueryFormValues = {
	query: string;
	priority: string;
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

function getAcceptanceRate(query: AdminSearchQuery) {
	if (query.totalNew <= 0) {
		return 0;
	}

	return Math.round((query.totalAccepted / query.totalNew) * 100);
}

function getQueryTypeBadgeVariant(type: SearchQueryType) {
	if (type === "admin_added") {
		return "default";
	}

	if (type === "ai_suggested") {
		return "secondary";
	}

	if (type === "exploratory") {
		return "outline";
	}

	return "outline";
}

function getPerformanceBadge(query: AdminSearchQuery) {
	const acceptanceRate = getAcceptanceRate(query);

	if (query.totalRuns === 0) {
		return {
			label: "Untested",
			variant: "outline" as const,
		};
	}

	if (query.totalNew === 0) {
		return {
			label: "No new repos",
			variant: "secondary" as const,
		};
	}

	if (acceptanceRate >= 70) {
		return {
			label: "Strong",
			variant: "default" as const,
		};
	}

	if (acceptanceRate >= 40) {
		return {
			label: "Mixed",
			variant: "secondary" as const,
		};
	}

	return {
		label: "Weak",
		variant: "destructive" as const,
	};
}

function FieldError({ errors }: { errors: unknown[] }) {
	if (errors.length === 0) {
		return null;
	}

	return (
		<p className="text-xs text-destructive">
			{errors.map((error) => String(error)).join(", ")}
		</p>
	);
}

function SearchQueryStats({ query }: { query: AdminSearchQuery }) {
	const acceptanceRate = getAcceptanceRate(query);
	const performance = getPerformanceBadge(query);

	return (
		<div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3 lg:grid-cols-6">
			<div>
				<div>Runs</div>
				<div className="font-medium text-foreground">
					{formatNumber(query.totalRuns)}
				</div>
			</div>

			<div>
				<div>Fetched</div>
				<div className="font-medium text-foreground">
					{formatNumber(query.totalFetched)}
				</div>
			</div>

			<div>
				<div>Candidates</div>
				<div className="font-medium text-foreground">
					{formatNumber(query.totalCandidates)}
				</div>
			</div>

			<div>
				<div>New</div>
				<div className="font-medium text-foreground">
					{formatNumber(query.totalNew)}
				</div>
			</div>

			<div>
				<div>Accepted</div>
				<div className="font-medium text-foreground">
					{formatNumber(query.totalAccepted)} / {acceptanceRate}%
				</div>
			</div>

			<div>
				<div>Performance</div>
				<div className="mt-1">
					<Badge variant={performance.variant}>{performance.label}</Badge>
				</div>
			</div>
		</div>
	);
}

function SearchQueryRow({
	query,
	isUpdating,
	onToggleEnabled,
	onUpdatePriority,
	onDelete,
}: {
	query: AdminSearchQuery;
	isUpdating: boolean;
	onToggleEnabled: (query: AdminSearchQuery, enabled: boolean) => Promise<void>;
	onUpdatePriority: (
		query: AdminSearchQuery,
		priority: number,
	) => Promise<void>;
	onDelete: (query: AdminSearchQuery) => Promise<void>;
}) {
	const [priority, setPriority] = useState(String(query.priority));

	const parsedPriority = Number(priority);
	const canSavePriority =
		Number.isInteger(parsedPriority) &&
		parsedPriority >= 1 &&
		parsedPriority <= 100 &&
		parsedPriority !== query.priority;

	return (
		<TableRow>
			<TableCell className="min-w-[320px] align-top">
				<div className="space-y-2">
					<div className="flex flex-wrap items-center gap-2">
						<div className="font-medium">{query.query}</div>

						<Badge variant={getQueryTypeBadgeVariant(query.type)}>
							{query.type}
						</Badge>

						{query.enabled ? (
							<Badge variant="default">Enabled</Badge>
						) : (
							<Badge variant="outline">Disabled</Badge>
						)}
					</div>

					<div className="text-xs text-muted-foreground">
						Last used: {formatDate(query.lastUsedAt)}
					</div>

					<SearchQueryStats query={query} />
				</div>
			</TableCell>

			<TableCell className="w-45 align-top">
				<div className="flex items-center gap-2">
					<Input
						type="number"
						min={1}
						max={100}
						value={priority}
						disabled={isUpdating}
						onChange={(event) => setPriority(event.target.value)}
						className="h-9 w-20"
					/>

					<Button
						type="button"
						size="sm"
						variant="outline"
						disabled={isUpdating || !canSavePriority}
						onClick={() => onUpdatePriority(query, parsedPriority)}
					>
						{isUpdating ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Save className="h-4 w-4" />
						)}

						<span className="sr-only">Save priority</span>
					</Button>
				</div>
			</TableCell>

			<TableCell className="w-30 align-top">
				<Switch
					checked={query.enabled}
					disabled={isUpdating}
					onCheckedChange={(enabled) => onToggleEnabled(query, enabled)}
				/>
			</TableCell>

			<TableCell className="w-30 align-top">
				<AdminConfirmActionDialog
					title="Delete search query?"
					description={`This will permanently delete "${query.query}" and its performance history.`}
					confirmLabel="Delete"
					variant="destructive"
					disabled={isUpdating}
					onConfirm={() => onDelete(query)}
					trigger={
						<Button
							type="button"
							size="sm"
							variant="destructive"
							disabled={isUpdating}
						>
							{isUpdating ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Trash2 className="h-4 w-4" />
							)}

							<span className="sr-only">Delete query</span>
						</Button>
					}
				/>
			</TableCell>
		</TableRow>
	);
}

export function AdminSearchQueriesManager({
	section,
	queries,
}: AdminSearchQueriesManagerProps) {
	const router = useRouter();

	const [updatingQueryId, setUpdatingQueryId] = useState<string | null>(null);

	const addQueryForm = useForm({
		defaultValues: {
			query: "",
			priority: "10",
		} satisfies AddQueryFormValues,

		onSubmit: async ({ value, formApi }) => {
			try {
				const cleanQuery = value.query.trim();
				const priority = Number(value.priority);

				if (!cleanQuery) {
					toast.error("Search query cannot be empty.");
					return;
				}

				if (!Number.isInteger(priority) || priority < 1 || priority > 100) {
					toast.error("Priority must be between 1 and 100.");
					return;
				}

				await createSectionSearchQueryAction({
					data: {
						section,
						query: cleanQuery,
						type: "admin_added",
						priority,
						enabled: true,
					},
				});

				toast.success("Search query added successfully.");

				formApi.reset();

				await router.invalidate();
			} catch (error) {
				console.error("Failed to add search query:", error);

				toast.error(
					error instanceof Error
						? error.message
						: "Failed to add search query.",
				);
			}
		},
	});

	async function updateQueryEnabled(query: AdminSearchQuery, enabled: boolean) {
		try {
			setUpdatingQueryId(query.id);

			await updateSectionSearchQueryAction({
				data: {
					id: query.id,
					section,
					enabled,
				},
			});

			toast.success(
				enabled ? "Search query enabled." : "Search query disabled.",
			);

			await router.invalidate();
		} catch (error) {
			console.error("Failed to update search query:", error);

			toast.error(
				error instanceof Error
					? error.message
					: "Failed to update search query.",
			);
		} finally {
			setUpdatingQueryId(null);
		}
	}

	async function updateQueryPriority(
		query: AdminSearchQuery,
		priority: number,
	) {
		try {
			setUpdatingQueryId(query.id);

			await updateSectionSearchQueryAction({
				data: {
					id: query.id,
					section,
					priority,
				},
			});

			toast.success("Search query priority updated.");

			await router.invalidate();
		} catch (error) {
			console.error("Failed to update search query priority:", error);

			toast.error(
				error instanceof Error
					? error.message
					: "Failed to update search query priority.",
			);
		} finally {
			setUpdatingQueryId(null);
		}
	}

	async function deleteQuery(query: AdminSearchQuery) {
		try {
			setUpdatingQueryId(query.id);

			await deleteSectionSearchQueryAction({
				data: {
					id: query.id,
					section,
				},
			});

			toast.success("Search query deleted.");

			await router.invalidate();
		} catch (error) {
			console.error("Failed to delete search query:", error);

			toast.error(
				error instanceof Error
					? error.message
					: "Failed to delete search query.",
			);
		} finally {
			setUpdatingQueryId(null);
		}
	}

	const enabledCount = queries.filter((query) => query.enabled).length;
	const testedCount = queries.filter((query) => query.totalRuns > 0).length;

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
					<div>
						<CardTitle>Search Queries</CardTitle>

						<CardDescription>
							Manage the base GitHub search queries used by discovery. These
							queries are expanded into variants using pages, date windows, star
							ranges, and sort modes.
						</CardDescription>
					</div>

					<div className="flex flex-wrap gap-2">
						<Badge variant="outline">{section}</Badge>
						<Badge variant="secondary">{enabledCount} enabled</Badge>
						<Badge variant="secondary">{testedCount} tested</Badge>
					</div>
				</div>
			</CardHeader>

			<CardContent className="space-y-6">
				<form
					className="grid gap-3 rounded-lg border bg-muted/30 p-4 md:grid-cols-[1fr_140px_auto] md:items-end"
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						addQueryForm.handleSubmit();
					}}
				>
					<addQueryForm.Field
						name="query"
						validators={{
							onChange: ({ value }) => {
								if (value.trim().length < 2) {
									return "Query must be at least 2 characters.";
								}

								if (value.length > 200) {
									return "Query must be less than 200 characters.";
								}

								return undefined;
							},
						}}
					>
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>New query</Label>

								<Input
									id={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									placeholder="example: threejs landing page"
								/>

								<FieldError errors={field.state.meta.errors} />
							</div>
						)}
					</addQueryForm.Field>

					<addQueryForm.Field
						name="priority"
						validators={{
							onChange: ({ value }) => {
								const numberValue = Number(value);

								if (
									!Number.isInteger(numberValue) ||
									numberValue < 1 ||
									numberValue > 100
								) {
									return "Priority must be between 1 and 100.";
								}

								return undefined;
							},
						}}
					>
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Priority</Label>

								<Input
									id={field.name}
									type="number"
									min={1}
									max={100}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
								/>

								<FieldError errors={field.state.meta.errors} />
							</div>
						)}
					</addQueryForm.Field>

					<addQueryForm.Subscribe
						selector={(state) => [state.canSubmit, state.isSubmitting]}
					>
						{([canSubmit, isSubmitting]) => (
							<Button type="submit" disabled={!canSubmit || isSubmitting}>
								{isSubmitting ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : (
									<Plus className="mr-2 h-4 w-4" />
								)}
								Add Query
							</Button>
						)}
					</addQueryForm.Subscribe>
				</form>

				{queries.length === 0 ? (
					<div className="rounded-lg border p-6 text-center">
						<div className="font-medium">No search queries yet</div>
						<p className="mt-1 text-sm text-muted-foreground">
							Add your first query to start customizing discovery.
						</p>
					</div>
				) : (
					<div className="overflow-x-auto rounded-lg border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Query & Performance</TableHead>
									<TableHead>Priority</TableHead>
									<TableHead>Enabled</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>

							<TableBody>
								{queries.map((query) => (
									<SearchQueryRow
										key={query.id}
										query={query}
										isUpdating={updatingQueryId === query.id}
										onToggleEnabled={updateQueryEnabled}
										onUpdatePriority={updateQueryPriority}
										onDelete={deleteQuery}
									/>
								))}
							</TableBody>
						</Table>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
