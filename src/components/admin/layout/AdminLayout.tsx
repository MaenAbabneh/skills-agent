import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "#/components/ui/sidebar";

import { adminNavItems } from "#/constants/admin/navigation";

import { AdminSidebar } from "./AdminSidebar";

type AdminLayoutProps = {
	children: ReactNode;
};

function getCurrentAdminItem(pathname: string) {
	const exactMatch = adminNavItems.find((item) => item.to === pathname);

	if (exactMatch) {
		return exactMatch;
	}

	return adminNavItems
		.filter((item) => item.to !== "/admin")
		.find((item) => pathname.startsWith(item.to));
}

export function AdminLayout({ children }: AdminLayoutProps) {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const currentItem = getCurrentAdminItem(pathname);

	return (
		<SidebarProvider>
			<AdminSidebar />

			<SidebarInset>
				<header className="sticky top-0 z-20 flex h-14 min-w-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
					<SidebarTrigger />

					<div className="min-w-0">
						<div className="truncate font-semibold">
							{currentItem?.label ?? "Admin Console"}
						</div>
						<div className="truncate text-xs text-muted-foreground">
							Admin Console / {currentItem?.label ?? "Repository intelligence"}
						</div>
					</div>
				</header>

				<main className="mx-auto w-full max-w-7xl overflow-x-hidden p-4 md:p-6 lg:p-8">
					{children}
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}
