import { BarChart3 } from "lucide-react";

export function AdminBrand() {
	return (
		<div className="flex min-w-0 items-center gap-2">
			<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background">
				<BarChart3 className="h-5 w-5" />
			</div>

			<div className="min-w-0 group-data-[collapsible=icon]:hidden">
				<div className="truncate font-semibold">Admin Console</div>
				<div className="truncate text-xs text-muted-foreground">
					Repository intelligence
				</div>
			</div>
		</div>
	);
}
