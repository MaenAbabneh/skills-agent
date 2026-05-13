import { Github, Search, Zap } from "lucide-react";
import { useState } from "react";
import { TerminalWindow } from "../shared/TerminalWindow";

const aboutTabs = [
	{
		id: "browse",
		label: "Browse",
		icon: Search,
		functionName: "Browse&Discover",
		comment:
			"Search through 1.2M+ agent skills with intelligent filtering by occupation, author, and popularity. Compatible with Claude Code, Codex CLI and ChatGPT.",
	},
	{
		id: "easy",
		label: "Easy",
		icon: Zap,
		functionName: "EasyInstallation",
		comment:
			"Copy to ~/.claude/skills/ for Claude Code or ~/.codex/skills/ for Codex CLI. Same SKILL.md format works across platforms.",
	},
	{
		id: "github",
		label: "GitHub",
		icon: Github,
		functionName: "GitHubOpenSource",
		comment:
			"All skills sourced from GitHub open-source repositories. We filter low-quality repos (minimum 2 stars), but always review code before installing.",
	},
] as const;

type AboutTab = (typeof aboutTabs)[number];

export function AboutFeatureTabs() {
	const [activeTabId, setActiveTabId] = useState<AboutTab["id"]>("browse");
	const activeTab =
		aboutTabs.find((tab) => tab.id === activeTabId) ?? aboutTabs[0];
	const ActiveIcon = activeTab.icon;

	return (
		<TerminalWindow
			className="h-full"
			contentClassName="grid h-full grid-rows-[1fr_auto] p-0"
			headerSlot={
				<div className="grid h-full w-full grid-cols-3">
					{aboutTabs.map((tab) => {
						const Icon = tab.icon;
						const isActive = tab.id === activeTabId;

						return (
							<button
								type="button"
								key={tab.id}
								onClick={() => setActiveTabId(tab.id)}
								className={`relative inline-flex min-w-0 items-center justify-center gap-2 px-2 font-mono text-xs transition-colors sm:text-sm ${
									isActive
										? "text-zinc-100"
										: "text-zinc-500 hover:text-zinc-300"
								}`}
							>
								<Icon size={16} className="shrink-0" />
								<span className="truncate">{tab.label}</span>
								<span
									className={`absolute inset-x-4 bottom-0 h-0.5 rounded-full transition-colors ${
										isActive ? "bg-marketplace-brown" : "bg-transparent"
									}`}
								/>
							</button>
						);
					})}
				</div>
			}
		>
			<div className="p-5 pb-4 sm:p-6 sm:pb-5 md:p-7 md:pb-5">
				<div
					key={activeTab.id}
					className="flex flex-col font-mono animate-in fade-in slide-in-from-bottom-2 duration-200"
				>
					<div className="text-sm leading-7 wrap-break-word sm:text-[15px]">
						<span className="text-fuchsia-400">export</span>{" "}
						<span className="text-sky-400">const</span>{" "}
						<span className="text-zinc-100">{activeTab.functionName}</span>{" "}
						<span className="text-zinc-400">= () =&gt; {"{"}</span>
					</div>

					<div className=" flex items-center gap-5 pl-4 ">
						<span className="text-sm text-sky-400">return</span>
						<div className="text-marketplace-brown drop-shadow-[0_0_22px_color-mix(in_srgb,var(--color-marketplace-brown)_28%,transparent)]">
							<ActiveIcon size={42} strokeWidth={1.55} />
						</div>
					</div>

					<div className="flex flex-col justify-center py-3">
						<div className="w-full rounded-2xl border-emerald-400/80 border-l-[3px] bg-emerald-950/25 px-5 py-4 shadow-[-10px_0_22px_-14px_rgba(52,211,153,0.95)]">
							<div className="text-sm leading-6 text-emerald-300/80">
								<span className="text-emerald-300 text-xl">/**</span>
								<p className="my-1 text-zinc-300">
									<span className="mr-2 text-emerald-300 text-xl">*</span>
									{activeTab.comment}
								</p>
								<span className="text-emerald-300 text-xl">*/</span>
							</div>
						</div>
					</div>

					<div className="text-sm text-zinc-400">{"}"}</div>
				</div>
			</div>

			<div className="border-zinc-900 border-t px-5 pb-5 pt-4 sm:px-6 md:px-7">
				<div className="grid grid-cols-3 gap-2">
					{aboutTabs.map((tab) => (
						<button
							type="button"
							key={tab.id}
							onClick={() => setActiveTabId(tab.id)}
							aria-label={`Show ${tab.label}`}
							className={`h-1.5 rounded-full transition-colors ${
								tab.id === activeTab.id ? "bg-marketplace-brown" : "bg-zinc-800"
							}`}
						/>
					))}
				</div>
			</div>
		</TerminalWindow>
	);
}
