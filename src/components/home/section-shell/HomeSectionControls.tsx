export function HomeSectionControls({
	filterLabel,
	filterOptions,
	selectedFilter,
	onFilterChange,
	sortLabel = "Sort by:",
	sortValue,
	onSortChange,
}: {
	filterLabel: string;
	filterOptions: string[];
	selectedFilter: string;
	onFilterChange: (value: string) => void;
	sortLabel?: string;
	sortValue: "stars" | "recent";
	onSortChange: (value: "stars" | "recent") => void;
}) {
	return (
		<div className="flex flex-col items-center justify-center  gap-8 md:flex-row md:items-center">
			{/* Filter Section */}
			<div className="flex items-center gap-3">
				<span className="font-mono text-sm text-zinc-500">{filterLabel}</span>
				<div className="relative">
					<select
						value={selectedFilter}
						onChange={(e) => onFilterChange(e.target.value)}
						className="appearance-none rounded-xl border border-zinc-800 bg-zinc-950/80 pl-3 pr-8 py-1.5 font-mono text-sm text-zinc-300 outline-none transition-colors hover:border-emerald-500/50 focus:border-emerald-500/50 cursor-pointer"
					>
						{filterOptions.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
					<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500">
						<svg
							className="h-4 w-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</div>
				</div>
			</div>

			{/* Sort Section */}
			<div className="flex items-center gap-3">
				<span className="font-mono text-sm text-zinc-500">{sortLabel}</span>
				<div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-black/20 p-1">
					<button
						type="button"
						onClick={() => onSortChange("stars")}
						className={`rounded-lg px-3 py-1 font-mono text-xs transition-colors ${
							sortValue === "stars"
								? "bg-zinc-800 text-zinc-100"
								: "text-zinc-500 hover:text-zinc-300"
						}`}
					>
						Stars
					</button>
					<button
						type="button"
						onClick={() => onSortChange("recent")}
						className={`rounded-lg px-3 py-1 font-mono text-xs transition-colors ${
							sortValue === "recent"
								? "bg-zinc-800 text-zinc-100"
								: "text-zinc-500 hover:text-zinc-300"
						}`}
					>
						Recent
					</button>
				</div>
			</div>
		</div>
	);
}
