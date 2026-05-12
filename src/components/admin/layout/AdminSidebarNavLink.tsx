import { Link, useMatchRoute, useRouterState } from "@tanstack/react-router";
import { SidebarMenuButton, SidebarMenuItem } from "#/components/ui/sidebar";
import {
	type AdminNavItem,
	getAdminReposDefaultSearch,
} from "#/constants/admin/navigation";
import { normalizeSectionId } from "#/lib/sections";

type AdminSidebarNavLinkProps = {
	item: AdminNavItem;
};

export function AdminSidebarNavLink({ item }: AdminSidebarNavLinkProps) {
	const Icon = item.icon;
	const matchRoute = useMatchRoute();
	const currentSection = useRouterState({
		select: (state) =>
			normalizeSectionId(
				(state.location.search as Record<string, unknown> | undefined)?.section,
			),
	});
	const isActive = Boolean(
		matchRoute({
			to: item.to,
			fuzzy: item.to !== "/admin",
		}),
	);

	if (item.to === "/admin/repos") {
		return (
			<SidebarMenuItem>
				<SidebarMenuButton asChild tooltip={item.label} isActive={isActive}>
					<Link
						to="/admin/repos"
						search={getAdminReposDefaultSearch(currentSection)}
						className="min-w-0"
					>
						<Icon />
						<span>{item.label}</span>
					</Link>
				</SidebarMenuButton>
			</SidebarMenuItem>
		);
	}

	return (
		<SidebarMenuItem>
			<SidebarMenuButton asChild tooltip={item.label} isActive={isActive}>
				<Link to={item.to} className="min-w-0">
					<Icon />
					<span>{item.label}</span>
				</Link>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
}
