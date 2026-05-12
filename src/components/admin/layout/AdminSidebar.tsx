import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
} from "#/components/ui/sidebar";
import { adminNavItems } from "#/constants/admin/navigation";

import { AdminBrand } from "./AdminBrand";
import { AdminSidebarNavLink } from "./AdminSidebarNavLink";

export function AdminSidebar() {
	return (
		<Sidebar collapsible="icon">
			<SidebarHeader className="border-b p-3">
				<AdminBrand />
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Admin</SidebarGroupLabel>

					<SidebarGroupContent>
						<SidebarMenu>
							{adminNavItems.map((item) => (
								<AdminSidebarNavLink key={item.to} item={item} />
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="border-t p-3 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
				<span className="line-clamp-2">
					Admin tools for discovery, review, and moderation.
				</span>
			</SidebarFooter>
		</Sidebar>
	);
}
