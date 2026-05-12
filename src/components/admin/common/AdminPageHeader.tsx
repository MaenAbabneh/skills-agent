import type { ReactNode } from "react";

type AdminPageHeaderProps = {
	title: string;
	description?: string;
	badge?: ReactNode;
	actions?: ReactNode;
};

export function AdminPageHeader({
	title,
	description,
	badge,
	actions,
}: AdminPageHeaderProps) {
	return (
		<div className="flex min-w-0 flex-col justify-between gap-4 md:flex-row md:items-start">
			<div className="min-w-0">
				<div className="flex flex-wrap items-center gap-2">
					<h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
						{title}
					</h1>
					{badge}
				</div>

				{description && (
					<p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
						{description}
					</p>
				)}
			</div>

			{actions && (
				<div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
					{actions}
				</div>
			)}
		</div>
	);
}
