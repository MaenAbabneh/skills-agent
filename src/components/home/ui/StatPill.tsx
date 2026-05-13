import { formatNumber } from "@/lib/format";

export function StatPill({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-full border border-zinc-800 bg-zinc-950/80 px-4 py-2">
			<span className="font-mono text-sm font-semibold text-emerald-300">
				{formatNumber(value)}
			</span>
			<span className="ml-2 text-xs text-zinc-400">{label}</span>
		</div>
	);
}
