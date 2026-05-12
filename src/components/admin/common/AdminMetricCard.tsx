import type { ComponentType } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";

type AdminMetricCardProps = {
	title: string;
	value: number | string;
	description?: string;
	icon?: ComponentType<{ className?: string }>;
};

export function AdminMetricCard({
	title,
	value,
	description,
	icon: Icon,
}: AdminMetricCardProps) {
	return (
		<Card className="overflow-hidden">
			<CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">
					{title}
				</CardTitle>
				{Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
			</CardHeader>

			<CardContent>
				<div className="text-2xl font-bold tabular-nums">{value}</div>
				{description && (
					<p className="mt-1 text-xs leading-5 text-muted-foreground">
						{description}
					</p>
				)}
			</CardContent>
		</Card>
	);
}
