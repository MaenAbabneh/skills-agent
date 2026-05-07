import {
	Check,
	ChevronDown,
	Filter,
	Heart,
	Layers,
	Search,
	TrendingUp,
} from "lucide-react";
import { useRef, useState } from "react";
import type { SkillsSort } from "#/lib/validations/search";

const sortOptions: Array<{ value: SkillsSort; label: string }> = [
	{ value: "newest", label: "Newest" },
	{ value: "oldest", label: "Oldest" },
	{ value: "upvotes-desc", label: "Top upvotes" },
	{ value: "likes-desc", label: "Top likes" },
];

export interface FilterMenuProps {
	categories: string[];
	selectedCategory: string;
	selectedSort: SkillsSort;
	onCategoryChange: (value: string) => void;
	onSortChange: (value: SkillsSort) => void;
}

const FilterMenu = ({
	categories,
	selectedCategory,
	selectedSort,
	onCategoryChange,
	onSortChange,
}: FilterMenuProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [isCategoryOpen, setIsCategoryOpen] = useState(false);
	const [categoryQuery, setCategoryQuery] = useState("");
	const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const selectedCategoryLabel =
		selectedCategory === "all" ? "All categories" : selectedCategory;
	const filteredCategories = categories.filter((category) =>
		category.toLowerCase().includes(categoryQuery.trim().toLowerCase()),
	);

	const clearCloseTimer = () => {
		if (closeTimerRef.current) {
			clearTimeout(closeTimerRef.current);
			closeTimerRef.current = null;
		}
	};

	const openMenu = () => {
		clearCloseTimer();
		setIsOpen(true);
	};

	const closeMenu = () => {
		clearCloseTimer();
		setIsOpen(false);
		setIsCategoryOpen(false);
		setCategoryQuery("");
	};

	const scheduleCloseMenu = () => {
		clearCloseTimer();
		closeTimerRef.current = setTimeout(closeMenu, 180);
	};

	return (
		<fieldset
			className="relative w-full sm:w-auto"
			onMouseEnter={openMenu}
			onMouseLeave={scheduleCloseMenu}
			onFocus={openMenu}
			onBlur={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget)) {
					scheduleCloseMenu();
				}
			}}
		>
			<legend className="sr-only">Skill filters</legend>
			<button
				type="button"
				onClick={() => {
					clearCloseTimer();
					setIsOpen((current) => !current);
				}}
				aria-expanded={isOpen}
				aria-haspopup="menu"
				className="flex h-11 w-full items-center justify-between gap-3 border border-gray-200 bg-white px-3 text-sm text-gray-900 transition-colors hover:border-blue-300 dark:border-gray-800 dark:bg-black dark:text-white dark:hover:border-blue-800 sm:min-w-64"
			>
				<span className="flex min-w-0 items-center gap-2">
					<Filter size={17} className="shrink-0 text-gray-400" />
					<span className="font-medium">Category</span>
					<span className="truncate text-gray-500 dark:text-gray-400">
						{selectedCategoryLabel}
					</span>
				</span>
				<ChevronDown
					size={16}
					className={`shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
				/>
			</button>

			<div
				role="menu"
				className={`
					absolute right-0 left-auto z-30 mt-2 w-80 max-w-[calc(100vw-3rem)] origin-top-right border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-800 dark:bg-black
					${isOpen ? "block" : "hidden"}
				`}
			>
				<div className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
					Sort by
				</div>
				<div className="space-y-1">
					{sortOptions.map((option) => {
						const isSelected = option.value === selectedSort;
						const Icon = option.value === "likes-desc" ? Heart : TrendingUp;

						return (
							<button
								key={option.value}
								type="button"
								role="menuitemradio"
								aria-checked={isSelected}
								onClick={() => {
									onSortChange(option.value);
									closeMenu();
								}}
								className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors ${
									isSelected
										? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
										: "text-gray-600 hover:bg-gray-50 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-white"
								}`}
							>
								<span className="flex items-center gap-2">
									<Icon size={15} />
									{option.label}
								</span>
								{isSelected ? <Check size={15} /> : null}
							</button>
						);
					})}
				</div>

				<div className="my-2 h-px bg-gray-100 dark:bg-gray-800" />
				<div>
					<button
						type="button"
						aria-expanded={isCategoryOpen}
						aria-haspopup="menu"
						onClick={(event) => {
							event.stopPropagation();
							clearCloseTimer();
							setIsCategoryOpen((current) => !current);
						}}
						className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors ${
							isCategoryOpen
								? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
								: "text-gray-600 hover:bg-gray-50 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-white"
						}`}
					>
						<span className="flex min-w-0 items-center gap-2">
							<Layers size={15} />
							<span className="font-medium">Category</span>
							<span className="truncate text-gray-400">
								{selectedCategoryLabel}
							</span>
						</span>
						<ChevronDown
							size={15}
							className={`
								shrink-0 transition-transform
								${isCategoryOpen ? "-rotate-180 sm:-rotate-90 sm:-translate-x-0.5" : "sm:-rotate-90"}
							`}
						/>
					</button>
				</div>

				<div
					role="menu"
					className={`
						mt-2 border border-gray-200 bg-white/95 p-2 shadow-xl backdrop-blur-sm dark:border-gray-800 dark:bg-black/95
						sm:absolute sm:right-full sm:top-0 sm:mt-0 sm:mr-1 sm:w-72
						${isCategoryOpen ? "block" : "hidden"}
					`}
				>
					<div className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
						Categories
					</div>
					<div className="relative mb-2">
						<Search
							size={14}
							className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
						/>
						<input
							type="search"
							value={categoryQuery}
							onClick={(event) => event.stopPropagation()}
							onChange={(event) => setCategoryQuery(event.target.value)}
							placeholder="Search categories..."
							aria-label="Search categories"
							className="h-9 w-full border border-gray-200 bg-white/80 pl-8 pr-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 dark:border-gray-800 dark:bg-black/60 dark:text-white"
						/>
					</div>
					<div className="menu-scrollbar max-h-56 space-y-1 overflow-y-auto pr-1">
						<button
							type="button"
							role="menuitemradio"
							aria-checked={selectedCategory === "all"}
							onClick={(event) => {
								event.stopPropagation();
								onCategoryChange("all");
								closeMenu();
							}}
							className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors ${
								selectedCategory === "all"
									? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
									: "text-gray-600 hover:bg-gray-50 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-white"
							}`}
						>
							<span className="flex items-center gap-2">
								<span
									className={`h-2 w-2 rounded-full ${
										selectedCategory === "all"
											? "bg-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.18)]"
											: "bg-gray-300 dark:bg-gray-700"
									}`}
								/>
								All categories
							</span>
							{selectedCategory === "all" ? <Check size={15} /> : null}
						</button>

						{filteredCategories.length === 0 ? (
							<div className="px-3 py-6 text-center text-sm text-gray-400">
								No categories found
							</div>
						) : (
							filteredCategories.map((category) => {
								const isSelected = category === selectedCategory;

								return (
									<button
										key={category}
										type="button"
										role="menuitemradio"
										aria-checked={isSelected}
										onClick={(event) => {
											event.stopPropagation();
											onCategoryChange(category);
											closeMenu();
										}}
										className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors ${
											isSelected
												? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
												: "text-gray-600 hover:bg-gray-50 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-white"
										}`}
									>
										<span className="flex items-center gap-2">
											<span
												className={`h-2 w-2 rounded-full ${
													isSelected
														? "bg-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.18)]"
														: "bg-gray-300 dark:bg-gray-700"
												}`}
											/>
											{category}
										</span>
										{isSelected ? <Check size={15} /> : null}
									</button>
								);
							})
						)}
					</div>
				</div>
			</div>
		</fieldset>
	);
};

export default FilterMenu;
