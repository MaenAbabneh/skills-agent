import { Code2, Heart, Star } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/format";
import { markdownToPlainTextPreview } from "@/lib/markdown-preview";
import type { RepoHomeItem } from "@/server/functions/public-home";
import { TerminalDots } from "../ui/TerminalDots";

export function RepoHomeCard({ item }: { item: RepoHomeItem }) {
	const rawSummary = item.readmePreview || item.description || "";
	const summary =
		markdownToPlainTextPreview(rawSummary, 220) ||
		"No README preview available yet.";

	const owner = item.fullName.split("/")[0];

	return (
		<a
			href={item.url}
			target="_blank"
			rel="noreferrer"
			className="group block overflow-hidden rounded-2xl border border-zinc-800 bg-[#080a10] transition-all hover:-translate-y-0.5 hover:border-marketplace-brown/50 hover:shadow-[0_0_28px_color-mix(in_srgb,var(--color-marketplace-brown)_10%,transparent)]"
		>
			<div className="flex items-center justify-between rounded-t-2xl border-zinc-800 border-b bg-zinc-950/80 px-4 py-3">
				<div className="flex min-w-0 items-center gap-2">
					<TerminalDots />
					<span className="truncate font-mono text-xs text-zinc-400 transition-colors group-hover:text-marketplace-brown-soft">
						{item.fullName}
					</span>
				</div>

				<span className="ml-3 inline-flex shrink-0 items-center gap-1 font-mono text-[11px] text-yellow-300">
					<Star size={12} fill="currentColor" />
					{formatNumber(item.stars)}
				</span>
			</div>

			<div className="p-4">
				<div className="mb-4 flex items-center gap-2">
					{owner && (
						<img
							src={`https://github.com/${owner}.png?size=40`}
							alt={owner}
							className="h-5 w-5 rounded-full"
							loading="lazy"
						/>
					)}
					<p className="font-mono text-xs text-zinc-500">
						from <span className="text-zinc-300">{owner}</span>
					</p>
				</div>
				<p className="line-clamp-3 text-sm leading-6 text-zinc-400">
					{summary}
				</p>

				<div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
					{item.language && (
						<span className="inline-flex items-center gap-1">
							<Code2 size={13} />
							{item.language}
						</span>
					)}
				</div>

				<div className="mt-5 flex items-center justify-between text-xs text-zinc-500">
					<span>{formatDate(item.pushedAt)}</span>
					<Heart
						size={15}
						className="text-zinc-600 transition-colors group-hover:text-marketplace-brown-soft"
					/>
				</div>
			</div>
		</a>
	);
}
