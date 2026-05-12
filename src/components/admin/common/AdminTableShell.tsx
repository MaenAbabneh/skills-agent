import type { ReactNode } from "react";

type AdminTableShellProps = {
	children: ReactNode;
};

export function AdminTableShell({ children }: AdminTableShellProps) {
	return (
		<div className="-mx-1 overflow-x-auto px-1">
			<div className="min-w-full align-middle">{children}</div>
		</div>
	);
}
