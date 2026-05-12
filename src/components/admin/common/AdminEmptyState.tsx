import type { ReactNode } from "react";

import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";

type AdminEmptyStateProps = {
	icon?: ReactNode;
	title: string;
	description?: ReactNode;
	action?: ReactNode;
	inCard?: boolean;
};

export function AdminEmptyState({
	icon,
	title,
	description,
	action,
	inCard = true,
}: AdminEmptyStateProps) {
	const content = (
		<div className="mx-auto flex max-w-md flex-col items-center gap-3 text-center">
			{icon && <div className="text-muted-foreground">{icon}</div>}

			<div>
				<div className="font-medium text-foreground">{title}</div>
				{description && (
					<p className="mt-1 text-sm text-muted-foreground">{description}</p>
				)}
			</div>

			{action && <div className="mt-1">{action}</div>}
		</div>
	);

	if (!inCard) {
		return content;
	}

	return (
		<Card>
			<CardContent className="py-10">{content}</CardContent>
		</Card>
	);
}

export function DisabledPlaceholderButton({
	children,
}: {
	children: ReactNode;
}) {
	return (
		<Button type="button" variant="outline" disabled>
			{children}
		</Button>
	);
}
