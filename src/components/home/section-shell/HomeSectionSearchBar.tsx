import { TerminalDots } from "../ui/TerminalDots";

export function HomeSectionSearchBar({
	value,
	onChange,
	placeholder,
	prompt = "find",
}: {
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
	prompt?: string;
}) {
	return (
		<div className="mb-8 overflow-hidden rounded-2xl border border-marketplace-brown/20 bg-zinc-950/80 shadow-inner transition-colors focus-within:border-marketplace-brown/40">
			{/* Top Bar */}
			<div className="flex items-center gap-3 border-b border-zinc-800/80 bg-black/40 px-4 py-3">
				<TerminalDots />
				<span className="font-mono text-[12px] uppercase tracking-widest text-zinc-500">
					Type to search
				</span>
			</div>
			{/* Input Row */}
			<div className="flex items-center gap-3 px-4 py-3">
				<span className="shrink-0 font-mono text-emerald-400">$</span>
				<span className="shrink-0 font-mono text-sm text-terminal-orange">
					{prompt}
				</span>
				<input
					type="search"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					className="min-h-12 flex-1 bg-transparent font-mono text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
				/>
			</div>
		</div>
	);
}
