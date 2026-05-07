import { Grid3X3, LayoutList } from "lucide-react";

export interface LayoutTabsProps {
	isGridView: boolean;
	onLayoutChange: (nextIsGridView: boolean) => void;
}

const LayoutTabs = ({ isGridView, onLayoutChange }: LayoutTabsProps) => {
	return (
		<div
			role="tablist"
			aria-label="Choose layout view"
			className="grid h-11 grid-cols-2 border border-gray-200 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-950 lg:w-40"
		>
			<button
				type="button"
				role="tab"
				onClick={() => onLayoutChange(true)}
				aria-selected={isGridView}
				aria-label="Grid view"
				className={`flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
					isGridView
						? "bg-white text-blue-600 shadow-sm dark:bg-gray-800 dark:text-blue-400"
						: "text-gray-500 hover:text-gray-900 dark:hover:text-white"
				}`}
			>
				<Grid3X3 size={17} />
				<span>Grid</span>
			</button>
			<button
				type="button"
				role="tab"
				onClick={() => onLayoutChange(false)}
				aria-selected={!isGridView}
				aria-label="List view"
				className={`flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
					!isGridView
						? "bg-white text-blue-600 shadow-sm dark:bg-gray-800 dark:text-blue-400"
						: "text-gray-500 hover:text-gray-900 dark:hover:text-white"
				}`}
			>
				<LayoutList size={17} />
				<span>List</span>
			</button>
		</div>
	);
};

export default LayoutTabs;
