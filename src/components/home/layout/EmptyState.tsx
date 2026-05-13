export function EmptyState({ children }: { children: React.ReactNode }) {
	return (
		<div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/70 p-6 font-mono text-sm text-zinc-500">
			{children}
		</div>
	);
}
