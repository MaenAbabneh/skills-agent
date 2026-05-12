import type { ReactNode } from "react";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "#/components/ui/alert-dialog";

type AdminConfirmActionDialogProps = {
	title: string;
	description: string;
	confirmLabel: string;
	variant?: "default" | "destructive";
	disabled?: boolean;
	trigger: ReactNode;
	onConfirm: () => void | Promise<void>;
};

export function AdminConfirmActionDialog({
	title,
	description,
	confirmLabel,
	variant = "default",
	disabled = false,
	trigger,
	onConfirm,
}: AdminConfirmActionDialogProps) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild disabled={disabled}>
				{trigger}
			</AlertDialogTrigger>

			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>

					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>

				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>

					<AlertDialogAction
						disabled={disabled}
						onClick={onConfirm}
						className={
							variant === "destructive"
								? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
								: undefined
						}
					>
						{confirmLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
