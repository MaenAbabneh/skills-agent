import type { SkillsSort } from "#/lib/validations/search";
import FilterMenu from "./FilterMenu";
import LayoutTabs from "./LayoutTabs";
import SearchBar from "./SearchBar";

export interface SkillsToolbarProps {
	searchQuery: string;
	selectedCategory: string;
	selectedSort: SkillsSort;
	categories: string[];
	isGridView: boolean;
	onSearchChange: (value: string) => void;
	onCategoryChange: (value: string) => void;
	onSortChange: (value: SkillsSort) => void;
	onLayoutChange: (nextIsGridView: boolean) => void;
}

const SkillsToolbar = ({
	searchQuery,
	selectedCategory,
	selectedSort,
	categories,
	isGridView,
	onSearchChange,
	onCategoryChange,
	onSortChange,
	onLayoutChange,
}: SkillsToolbarProps) => {
	return (
		<section className="mb-8 flex flex-col gap-3">
			<SearchBar value={searchQuery} onChange={onSearchChange} />
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<LayoutTabs isGridView={isGridView} onLayoutChange={onLayoutChange} />
				<FilterMenu
					categories={categories}
					selectedCategory={selectedCategory}
					selectedSort={selectedSort}
					onCategoryChange={onCategoryChange}
					onSortChange={onSortChange}
				/>
			</div>
		</section>
	);
};

export default SkillsToolbar;
