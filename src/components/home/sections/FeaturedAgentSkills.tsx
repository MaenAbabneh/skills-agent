import { useRef, useState } from "react";
import type {
	AgentSkillHomeItem,
	CategoryCount,
} from "@/server/functions/public-home";
import { useStickySearchEnhancement } from "../animations/useGsapScroll";
import { AgentSkillHomeCard } from "../cards/AgentSkillHomeCard";
import { EmptyState } from "../layout/EmptyState";
import { HomeSectionControls } from "../section-shell/HomeSectionControls";
import { HomeSectionFrame } from "../section-shell/HomeSectionFrame";
import { HomeSectionSearchBar } from "../section-shell/HomeSectionSearchBar";
import { HomeButton } from "../ui/HomeButton";

export function FeaturedAgentSkills({
	items,
	categories,
}: {
	items: AgentSkillHomeItem[];
	categories: CategoryCount[];
}) {
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState("Category");
	const [sort, setSort] = useState<"recent" | "stars">("recent");
	const sectionRef = useRef<HTMLDivElement>(null);
	const searchRef = useRef<HTMLDivElement>(null);
	const loadMoreHref = "/skills";

	useStickySearchEnhancement(sectionRef, searchRef);

	const filterOptions = ["Category", ...categories.map((c) => c.category)];

	const filteredItems = items.filter((item) => {
		if (filter !== "Category" && item.category !== filter) {
			return false;
		}

		if (search.trim()) {
			const query = search.toLowerCase();
			const searchFields = [
				item.skillName,
				item.description,
				item.repoFullName,
				item.installCommand,
			].filter(Boolean) as string[];

			const matchesSearch = searchFields.some((field) =>
				field.toLowerCase().includes(query),
			);

			if (!matchesSearch) {
				return false;
			}
		}

		return true;
	});

	const sortedItems = [...filteredItems].sort((a, b) => {
		if (sort === "stars") {
			return b.repoStars - a.repoStars;
		}
		return (
			new Date(b.repoUpdatedAt).getTime() - new Date(a.repoUpdatedAt).getTime()
		);
	});

	return (
		<div ref={sectionRef} className="relative space-y-6">
			<div className="mx-auto max-w-3xl">
				<HomeSectionFrame
					title="Browse Agent Skills"
					fileLabel="skills --list"
					statusLabel="ready"
				>
					<HomeSectionControls
						filterLabel="Filter by"
						filterOptions={filterOptions}
						selectedFilter={filter}
						onFilterChange={setFilter}
						sortLabel="Sort by"
						sortValue={sort}
						onSortChange={(value) => {
							if (value !== "name") {
								setSort(value);
							}
						}}
					/>
				</HomeSectionFrame>
			</div>

			<div
				ref={searchRef}
				className="section-search-sticky z-20 rounded-2xl md:sticky md:top-24"
			>
				<HomeSectionSearchBar
					value={search}
					onChange={setSearch}
					placeholder="Search skills: try 'code review', 'git automation', 'data analysis'..."
					prompt="find skills"
				/>
			</div>

			{items.length === 0 ? (
				<EmptyState>No Agent Skills found yet.</EmptyState>
			) : sortedItems.length === 0 ? (
				<EmptyState>No Agent Skills match your current filters.</EmptyState>
			) : (
				<div className="columns-1 gap-4 md:columns-2 xl:columns-3">
					{sortedItems.map((item) => (
						<div
							key={item.id}
							className="home-card-reveal mb-4 break-inside-avoid"
						>
							<AgentSkillHomeCard item={item} />
						</div>
					))}
				</div>
			)}

			<div className="flex justify-center pt-2">
				<HomeButton href={loadMoreHref}>Load more skills</HomeButton>
			</div>
		</div>
	);
}
