import { Heart, Star } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/format";
import { markdownToPlainTextPreview } from "@/lib/markdown-preview";
import type { AgentSkillHomeItem } from "@/server/functions/public-home";
import { CopyButton } from "../ui/CopyButton";
import { TerminalDots } from "../ui/TerminalDots";

function getSkillFileTitle(skillName: string) {
	return /\.[a-z0-9]+$/i.test(skillName) ? skillName : `${skillName}.md`;
}

function getCardInstallCommand(item: AgentSkillHomeItem) {
	if ("installCommand" in item && typeof item.installCommand === "string") {
		return item.installCommand;
	}
	return `npx skills add ${item.repoFullName}`;
}

export function AgentSkillHomeCard({ item }: { item: AgentSkillHomeItem }) {
	const installCommand = getCardInstallCommand(item);
	const description =
		markdownToPlainTextPreview(item.description ?? "", 180) ||
		"A discovered SKILL.md agent skill.";

	const owner = item.repoFullName.split("/")[0] || "unknown";

	return (
		<article className="group relative block overflow-hidden rounded-2xl border border-zinc-800 bg-[#070b0e] transition-all hover:-translate-y-0.5 hover:border-emerald-500/50 hover:shadow-[0_0_28px_rgba(16,185,129,0.12)]">
			<a
				href={item.fileUrl}
				target="_blank"
				rel="noreferrer"
				aria-label={`Open ${item.skillName}`}
				className="absolute inset-0 z-10 rounded-2xl"
			>
				<span className="sr-only">Open {item.skillName}</span>
			</a>
			<div className="flex items-center justify-between rounded-t-2xl border-zinc-800 border-b bg-zinc-950/80 px-4 py-3">
				<div className="flex min-w-0 items-center gap-2">
					<TerminalDots />
					<span className="truncate font-mono text-xs text-zinc-400 transition-colors group-hover:text-emerald-300">
						{getSkillFileTitle(item.skillName)}
					</span>
				</div>

				<span className="ml-3 inline-flex shrink-0 items-center gap-1 font-mono text-[11px] text-yellow-300">
					<Star size={12} fill="currentColor" />
					{formatNumber(item.repoStars)}
				</span>
			</div>
			<div className="p-4">
				<div className="mb-4 flex items-center gap-2">
					{owner && owner !== "unknown" && (
						<img
							src={`https://github.com/${owner}.png?size=40`}
							alt={owner}
							className="h-5 w-5 rounded-full"
							loading="lazy"
						/>
					)}
					<p className="font-mono text-xs text-zinc-500">
						from <span className="text-zinc-300">{item.repoFullName}</span>
					</p>
				</div>
				<p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-400">
					{description}
				</p>

				<div className="relative z-20 mt-4 rounded border border-emerald-400/15 bg-black/40 p-2">
					<div className="flex items-center gap-2">
						<span className="font-mono text-xs text-emerald-300">$</span>
						<code
							className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-300"
							title={installCommand}
						>
							{installCommand}
						</code>
						<CopyButton
							textToCopy={installCommand}
							ariaLabel={`Copy install command for ${item.skillName}`}
						/>
					</div>
				</div>

				<div className="mt-5 flex items-center justify-between text-xs text-zinc-500">
					<span>{formatDate(item.repoUpdatedAt)}</span>
					<Heart
						size={15}
						className="text-zinc-600 transition-colors group-hover:text-marketplace-brown-soft"
					/>
				</div>
			</div>
		</article>
	);
}
