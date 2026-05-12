import type { LucideIcon } from "lucide-react";
import {
	Bot,
	Database,
	FileText,
	Github,
	LayoutDashboard,
	Settings,
	Users,
} from "lucide-react";
import type { SectionId } from "#/lib/sections";

export type AdminNavRoute =
	| "/admin"
	| "/admin/repos"
	| "/admin/discovery"
	| "/admin/sync-logs"
	| "/admin/submissions"
	| "/admin/users"
	| "/admin/settings";

export type AdminNavItem = {
	label: string;
	to: AdminNavRoute;
	icon: LucideIcon;
};

export const ADMIN_REPOS_DEFAULT_SEARCH = {
	section: "3d-motion",
	status: "pending",
	algorithm: "all",
	query: "",
	page: 1,
	pageSize: 24,
} as const;

export function getAdminReposDefaultSearch(section: SectionId = "3d-motion") {
	return {
		section,
		status: ADMIN_REPOS_DEFAULT_SEARCH.status,
		algorithm: ADMIN_REPOS_DEFAULT_SEARCH.algorithm,
		query: ADMIN_REPOS_DEFAULT_SEARCH.query,
		page: ADMIN_REPOS_DEFAULT_SEARCH.page,
		pageSize: ADMIN_REPOS_DEFAULT_SEARCH.pageSize,
	};
}

export const adminNavItems: AdminNavItem[] = [
	{
		label: "Overview",
		to: "/admin",
		icon: LayoutDashboard,
	},
	{
		label: "Repos Review",
		to: "/admin/repos",
		icon: Github,
	},
	{
		label: "Discovery",
		to: "/admin/discovery",
		icon: Bot,
	},
	{
		label: "Sync Logs",
		to: "/admin/sync-logs",
		icon: Database,
	},
	{
		label: "Submissions",
		to: "/admin/submissions",
		icon: FileText,
	},
	{
		label: "Users",
		to: "/admin/users",
		icon: Users,
	},
	{
		label: "Settings",
		to: "/admin/settings",
		icon: Settings,
	},
];
