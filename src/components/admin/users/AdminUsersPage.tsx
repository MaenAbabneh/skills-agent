import { Shield, ShieldAlert, UserCog, UserMinus, Users } from "lucide-react";
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

const plannedActions = [
	{
		title: "Change Role",
		description: "Promote users to moderator/admin or demote them safely.",
		icon: Shield,
	},
	{
		title: "Suspend User",
		description: "Block abusive users without deleting their history.",
		icon: ShieldAlert,
	},
	{
		title: "Soft Delete",
		description: "Mark accounts as deleted while preserving audit records.",
		icon: UserMinus,
	},
];

export function AdminUsersPage() {
	return (
		<div className="space-y-6">
			<AdminPageHeader
				title="Users"
				description="Manage accounts, roles, suspensions, and moderation permissions."
				badge={<Badge variant="outline">Coming soon</Badge>}
			/>

			<div className="grid gap-4 md:grid-cols-3">
				{plannedActions.map((action) => {
					const Icon = action.icon;

					return (
						<Card key={action.title}>
							<CardHeader>
								<div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg border bg-muted">
									<Icon className="h-5 w-5" />
								</div>
								<CardTitle className="text-base">{action.title}</CardTitle>
								<CardDescription>{action.description}</CardDescription>
							</CardHeader>
						</Card>
					);
				})}
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Users className="h-5 w-5" />
						Users Management
					</CardTitle>
					<CardDescription>
						This page will list platform users and allow safe account moderation
						after user admin queries are connected.
					</CardDescription>
				</CardHeader>

				<CardContent>
					<AdminTableShell>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>User</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Role</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Joined</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								<TableRow>
									<TableCell colSpan={6} className="py-10">
										<AdminEmptyState
											inCard={false}
											icon={<UserCog className="h-10 w-10" />}
											title="User management is not connected yet"
											description="Planned actions include role changes, suspensions, and soft deletes with confirmation dialogs."
											action={
												<DisabledPlaceholderButton>
													Connect Users Table
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
					<CardTitle>Planned permission model</CardTitle>
					<CardDescription>
						Roles and account states planned for the next implementation step.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-2">
					<div className="rounded-lg border p-4">
						<div className="font-medium">Roles</div>
						<div className="mt-3 flex flex-wrap gap-2">
							<Badge>owner</Badge>
							<Badge variant="secondary">admin</Badge>
							<Badge variant="secondary">moderator</Badge>
							<Badge variant="outline">user</Badge>
						</div>
						<p className="mt-3 text-sm text-muted-foreground">
							Owner controls roles and dangerous actions. Admins manage repos,
							discovery, submissions, and normal users.
						</p>
					</div>

					<div className="rounded-lg border p-4">
						<div className="font-medium">Account status</div>
						<div className="mt-3 flex flex-wrap gap-2">
							<Badge variant="secondary">active</Badge>
							<Badge variant="destructive">banned</Badge>
							<Badge variant="outline">deleted</Badge>
						</div>
						<p className="mt-3 text-sm text-muted-foreground">
							Banned users keep their history but lose access. Deleted users are
							soft-deleted to preserve audit logs and relationships.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
