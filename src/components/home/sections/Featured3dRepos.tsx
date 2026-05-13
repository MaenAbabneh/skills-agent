import { useMemo, useRef, useState } from "react";
import type { RepoHomeItem } from "@/server/functions/public-home";
import { useStickySearchEnhancement } from "../animations/useGsapScroll";
import { RepoHomeCard } from "../cards/RepoHomeCard";
import { EmptyState } from "../layout/EmptyState";
import { HomeSectionControls } from "../section-shell/HomeSectionControls";
import { HomeSectionFrame } from "../section-shell/HomeSectionFrame";
import { HomeSectionSearchBar } from "../section-shell/HomeSectionSearchBar";
import { HomeButton } from "../ui/HomeButton";

export function Featured3dRepos({ items }: { items: RepoHomeItem[] }) {
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState("All topics");
	const [sort, setSort] = useState<"recent" | "stars">("recent");
	const sectionRef = useRef<HTMLDivElement>(null);
	const searchRef = useRef<HTMLDivElement>(null);
	// TODO: link to /sections/3d-motion when the public section page is implemented.
	const loadMoreHref = "#featured-3d-motion";

	useStickySearchEnhancement(sectionRef, searchRef);

	const filterOptions = useMemo(() => {
		const uniqueTopics = Array.from(
			new Set(items.flatMap((i) => i.topics || [])),
		).sort();
		return ["All topics", ...uniqueTopics];
	}, [items]);

	const filteredItems = items.filter((item) => {
		if (filter !== "All topics" && !item.topics?.includes(filter)) {
			return false;
		}

		if (search.trim()) {
			const query = search.toLowerCase();
			const searchFields = [
				item.fullName,
				item.description,
				item.readmePreview,
				item.language,
				...(item.topics || []),
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
			return b.stars - a.stars;
		}
		return new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime();
	});

	return (
		<div ref={sectionRef} className="relative space-y-6">
			<div className="mx-auto max-w-3xl">
				<HomeSectionFrame
					title="Browse 3D Motion Repositories"
					fileLabel="repos --list"
					statusLabel="ready"
				>
					<HomeSectionControls
						filterLabel="Filter by"
						filterOptions={filterOptions}
						selectedFilter={filter}
						onFilterChange={setFilter}
						sortLabel="Sort by"
						sortValue={sort}
						onSortChange={setSort}
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
					placeholder="Search repositories: try 'three.js', 'webgl', 'portfolio', 'shader'..."
					prompt="find repos"
				/>
			</div>

			{items.length === 0 ? (
				<EmptyState>No 3D Motion repositories found yet.</EmptyState>
			) : sortedItems.length === 0 ? (
				<EmptyState>
					No 3D Motion repositories match your current filters.
				</EmptyState>
			) : (
				<div className="columns-1 gap-4 md:columns-2 xl:columns-3">
					{sortedItems.map((item) => (
						<div
							key={item.repoSectionId}
							className="home-card-reveal mb-4 break-inside-avoid"
						>
							<RepoHomeCard item={item} />
						</div>
					))}
				</div>
			)}

			<div className="flex justify-center pt-2">
				<HomeButton href={loadMoreHref}>Load more 3D</HomeButton>
			</div>
		</div>
	);
}
