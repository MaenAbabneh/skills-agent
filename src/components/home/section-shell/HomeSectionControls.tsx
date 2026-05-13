import type { ReactNode } from "react";

type HomeSectionSortValue = "stars" | "recent" | "name";

export function HomeSectionControls({
	filterLabel,
	filterOptions,
	filterControl,
	selectedFilter,
	onFilterChange,
	sortLabel = "Sort by:",
	sortOptions = [
		{ label: "Stars", value: "stars" },
		{ label: "Recent", value: "recent" },
	],
	sortValue,
	onSortChange,
}: {
	filterLabel: string;
	filterOptions: string[];
	filterControl?: ReactNode;
	selectedFilter: string;
	onFilterChange: (value: string) => void;
	sortLabel?: string;
	sortOptions?: { label: string; value: HomeSectionSortValue }[];
	sortValue: HomeSectionSortValue;
	onSortChange: (value: HomeSectionSortValue) => void;
}) {
	return (
		<div className="flex flex-col items-center justify-center  gap-8 md:flex-row md:items-center">
			{/* Filter Section */}
			<div className="flex items-center gap-3">
				<span className="font-mono text-sm text-zinc-500">{filterLabel}</span>
				{filterControl ?? (
					<div className="relative">
						<select
							value={selectedFilter}
							onChange={(e) => onFilterChange(e.target.value)}
							className="cursor-pointer appearance-none rounded-xl border border-zinc-800 bg-zinc-950/80 py-1.5 pr-8 pl-3 font-mono text-sm text-zinc-300 outline-none transition-colors hover:border-emerald-500/50 focus:border-emerald-500/50"
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
				)}
			</div>

			{/* Sort Section */}
			<div className="flex items-center gap-3">
				<span className="font-mono text-sm text-zinc-500">{sortLabel}</span>
				<div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-black/20 p-1">
					{sortOptions.map((option) => (
						<button
							key={option.value}
							type="button"
							onClick={() => onSortChange(option.value)}
							className={`rounded-lg px-3 py-1 font-mono text-xs transition-colors ${
								sortValue === option.value
									? "bg-zinc-800 text-zinc-100"
									: "text-zinc-500 hover:text-zinc-300"
							}`}
						>
							{option.label}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
