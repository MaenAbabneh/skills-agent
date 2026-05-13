import type React from "react";
import { TerminalDots } from "../ui/TerminalDots";

export function HomeSectionFrame({
	title,
	fileLabel,
	statusLabel = "ready",
	showStatusDot = true,
	titlePrefix = ">",
	titlePrefixColor = "text-terminal-orange",
	alignTitle = "center",
	children,
}: {
	title: string;
	fileLabel: string;
	statusLabel?: string;
	showStatusDot?: boolean;
	titlePrefix?: string;
	titlePrefixColor?: string;
	alignTitle?: "left" | "center" | "right";
	children?: React.ReactNode;
}) {
	return (
		<div className="rounded-2xl border border-zinc-800 bg-[#070b0e] overflow-hidden shadow-2xl shadow-black/20">
			{/* Terminal Top Bar */}
			<div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
				<div className="flex items-center gap-3">
					<TerminalDots />
					<span className="font-mono text-xs text-zinc-500">{fileLabel}</span>
				</div>
				{statusLabel && (
					<div className="flex items-center gap-2">
						{showStatusDot && (
							<span className="relative flex h-2 w-2">
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-20" />
								<span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
							</span>
						)}
						<span className="font-mono text-[12px] text-zinc-600">
							{statusLabel}
						</span>
					</div>
				)}
			</div>

			{/* Body */}
			<div className="p-6">
				<h2
					className={`mb-8 text-2xl font-semibold text-zinc-50 md:text-4xl ${alignTitle === "center" ? "text-center" : alignTitle === "left" ? "text-left" : "text-right"}`}
				>
					<span className={`mr-3 ${titlePrefixColor}`}>{titlePrefix}</span>
					{title}
				</h2>
				{children}
			</div>
		</div>
	);
}
