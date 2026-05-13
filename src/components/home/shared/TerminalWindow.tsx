import { TerminalDots } from "../ui/TerminalDots";

type TerminalWindowProps = {
	fileLabel?: string;
	headerSlot?: React.ReactNode;
	children: React.ReactNode;
	footer?: React.ReactNode;
	className?: string;
	contentClassName?: string;
};

export function TerminalWindow({
	fileLabel,
	headerSlot,
	children,
	footer,
	className = "",
	contentClassName = "p-6 md:p-8",
}: TerminalWindowProps) {
	return (
		<div
			className={`grid min-h-[460px] grid-rows-[auto_1fr_auto] overflow-hidden rounded-3xl border border-zinc-700/70 bg-[#050505] shadow-[0_0_0_1px_rgba(255,255,255,0.02)] ${className}`}
		>
			<div className="flex h-14 items-center border-zinc-800 border-b px-5">
				{headerSlot ?? (
					<div className="flex min-w-0 items-center gap-3">
						<TerminalDots />
						{fileLabel && (
							<span className="truncate font-mono text-xs text-zinc-500">
								{fileLabel}
							</span>
						)}
					</div>
				)}
			</div>
			<div className={`min-h-0 ${contentClassName}`}>{children}</div>
			{footer}
		</div>
	);
}
