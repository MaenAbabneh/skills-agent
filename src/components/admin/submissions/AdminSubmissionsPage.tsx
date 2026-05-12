import {
	CheckCircle2,
	ExternalLink,
	FileText,
	Inbox,
	ShieldCheck,
	XCircle,
} from "lucide-react";
import {
	AdminEmptyState,
	AdminPageHeader,
	AdminTableShell,
	DisabledPlaceholderButton,
} from "#/components/admin/common";
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

const plannedWorkflow = [
	{
		title: "User submits repo",
		description: "A logged-in user suggests a GitHub repository and section.",
		icon: FileText,
	},
	{
		title: "System validates",
		description:
			"We fetch repo metadata, classify it, and prepare review info.",
		icon: ShieldCheck,
	},
	{
		title: "Admin decides",
		description: "Admin approves, rejects, or sends it to manual review.",
		icon: CheckCircle2,
	},
];

export function AdminSubmissionsPage() {
	return (
		<div className="space-y-6">
			<AdminPageHeader
				title="Submissions"
				description="Review GitHub repositories submitted by users and decide whether they should enter the public catalog."
				badge={<Badge variant="outline">Coming soon</Badge>}
			/>

			<div className="grid gap-4 md:grid-cols-3">
				{plannedWorkflow.map((item) => {
					const Icon = item.icon;

					return (
						<Card key={item.title}>
							<CardHeader>
								<div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg border bg-muted">
									<Icon className="h-5 w-5" />
								</div>
								<CardTitle className="text-base">{item.title}</CardTitle>
								<CardDescription>{item.description}</CardDescription>
							</CardHeader>
						</Card>
					);
				})}
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Inbox className="h-5 w-5" />
						Submission Queue
					</CardTitle>
					<CardDescription>
						User-submitted repositories will appear here with validation,
						classification, and admin actions.
					</CardDescription>
				</CardHeader>

				<CardContent>
					<AdminTableShell>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Repository</TableHead>
									<TableHead>Submitted By</TableHead>
									<TableHead>Suggested Section</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Submitted At</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								<TableRow>
									<TableCell colSpan={6} className="py-10">
										<AdminEmptyState
											inCard={false}
											icon={<Inbox className="h-10 w-10" />}
											title="No submissions connected yet"
											description="The planned workflow is submit, validate, then admin decision. No fake submission actions are enabled."
											action={
												<DisabledPlaceholderButton>
													Connect Submissions
												</DisabledPlaceholderButton>
											}
										/>
									</TableCell>
								</TableRow>
							</TableBody>
						</Table>
					</AdminTableShell>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Planned actions</CardTitle>
					<CardDescription>
						Actions that will be available once submissions are connected.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-3 md:grid-cols-3">
					<div className="rounded-lg border p-4">
						<div className="flex items-center gap-2 font-medium">
							<CheckCircle2 className="h-4 w-4" />
							Approve
						</div>
						<p className="mt-2 text-sm text-muted-foreground">
							Import the repository into the correct section as approved or
							pending review.
						</p>
					</div>
					<div className="rounded-lg border p-4">
						<div className="flex items-center gap-2 font-medium">
							<XCircle className="h-4 w-4" />
							Reject
						</div>
						<p className="mt-2 text-sm text-muted-foreground">
							Reject irrelevant or duplicate submissions while preserving the
							submission record.
						</p>
					</div>
					<div className="rounded-lg border p-4">
						<div className="flex items-center gap-2 font-medium">
							<ExternalLink className="h-4 w-4" />
							Open Source
						</div>
						<p className="mt-2 text-sm text-muted-foreground">
							Open the GitHub repository or live demo before making a decision.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
