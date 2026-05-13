import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDate, formatNumber } from "@/lib/format";
import { markdownToPlainTextPreview } from "@/lib/markdown-preview";
import {
	type AgentSkillListItem,
	getPublicAgentSkillsPageData,
	type PublicAgentSkillsPageData,
	type PublicAgentSkillsSort,
} from "@/server/functions/public-agent-skills";
import { PublicFooter } from "../home/layout/PublicFooter";
import { PublicNavbar } from "../home/layout/PublicNavbar";
import { HomeSectionControls } from "../home/section-shell/HomeSectionControls";
import { HomeSectionFrame } from "../home/section-shell/HomeSectionFrame";
import { HomeSectionSearchBar } from "../home/section-shell/HomeSectionSearchBar";
import { ArrowRightIcon } from "../home/ui/ArrowRightIcon";
import { CopyButton } from "../home/ui/CopyButton";
import { TerminalDots } from "../home/ui/TerminalDots";

type SkillsPageSearch = {
	q?: string;
	category?: string;
	sort?: PublicAgentSkillsSort;
};

type NormalizedSkillsPageSearch = {
	q: string;
	category: string;
	sort: PublicAgentSkillsSort;
};

type SkillsPageProps = {
	data: PublicAgentSkillsPageData;
	search: SkillsPageSearch;
};

function normalizeSearchParams({
	category,
	q,
	sort,
}: SkillsPageSearch): NormalizedSkillsPageSearch {
	return {
		q: q?.trim() ?? "",
		category: category || "all",
		sort: sort || "stars",
	};
}

function toRouteSearch({ category, q, sort }: SkillsPageSearch) {
	return {
		q: q?.trim() || undefined,
		category: category && category !== "all" ? category : undefined,
		sort: sort && sort !== "stars" ? sort : undefined,
	};
}

function getSkillFileTitle(skillName: string) {
	return /\.[a-z0-9]+$/i.test(skillName) ? skillName : `${skillName}.md`;
}

export function SkillsPage({ data, search }: SkillsPageProps) {
	const navigate = useNavigate();
	const normalizedSearch = normalizeSearchParams(search);
	const [searchInput, setSearchInput] = useState(normalizedSearch.q);
	const [selectedCategory, setSelectedCategory] = useState(
		normalizedSearch.category,
	);
	const [selectedSort, setSelectedSort] = useState<PublicAgentSkillsSort>(
		normalizedSearch.sort,
	);
	const [visibleItems, setVisibleItems] = useState(data.items);
	const [currentPage, setCurrentPage] = useState(data.pagination.page);
	const [pagination, setPagination] = useState(data.pagination);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [loadMoreError, setLoadMoreError] = useState("");

	useEffect(() => {
		const nextSearch = normalizeSearchParams(search);
		setSearchInput(nextSearch.q);
		setSelectedCategory(nextSearch.category);
		setSelectedSort(nextSearch.sort);
	}, [search]);

	useEffect(() => {
		setVisibleItems(data.items);
		setCurrentPage(data.pagination.page);
		setPagination(data.pagination);
		setLoadMoreError("");
	}, [data]);

	useEffect(() => {
		const nextQuery = searchInput.trim();
		if (nextQuery === normalizedSearch.q) {
			return;
		}

		const timeout = window.setTimeout(() => {
			void navigate({
				to: "/skills",
				search: toRouteSearch({
					q: nextQuery,
					category: selectedCategory,
					sort: selectedSort,
				}),
			});
		}, 250);

		return () => window.clearTimeout(timeout);
	}, [
		navigate,
		normalizedSearch.q,
		searchInput,
		selectedCategory,
		selectedSort,
	]);

	function updateFilters(nextSearch: SkillsPageSearch) {
		const normalizedNextSearch = normalizeSearchParams(nextSearch);
		void navigate({
			to: "/skills",
			search: toRouteSearch(normalizedNextSearch),
		});
	}

	function handleSortChange(sort: PublicAgentSkillsSort) {
		setSelectedSort(sort);
		updateFilters({
			q: searchInput,
			category: selectedCategory,
			sort,
		});
	}

	async function handleLoadMore() {
		try {
			setIsLoadingMore(true);
			setLoadMoreError("");

			const result = await getPublicAgentSkillsPageData({
				data: {
					q: normalizedSearch.q,
					category: normalizedSearch.category,
					sort: normalizedSearch.sort,
					page: currentPage + 1,
					pageSize: pagination.pageSize,
				},
			});

			setVisibleItems((items) => [...items, ...result.items]);
			setCurrentPage(result.pagination.page);
			setPagination(result.pagination);
		} catch (error) {
			console.error("Failed to load more public agent skills:", error);
			setLoadMoreError("Could not load more skills. Try again.");
		} finally {
			setIsLoadingMore(false);
		}
	}

	const isEmptyDataset = data.stats.totalSkills === 0;
	const isEmptyFilterResult = !isEmptyDataset && visibleItems.length === 0;

	return (
		<div className="min-h-screen bg-[#05070a] text-zinc-100">
			<div
				className="pointer-events-none fixed inset-0 opacity-[0.16]"
				style={{
					backgroundImage:
						"linear-gradient(rgba(39, 255, 160, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(39, 255, 160, 0.2) 1px, transparent 1px)",
					backgroundSize: "42px 42px",
				}}
			/>

			<div className="relative">
				<PublicNavbar />

				<main className="mx-auto max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
					<header className="grid gap-8 py-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:py-10">
						<div>
							<div className="inline-flex items-center gap-2 rounded-full border border-marketplace-brown/20 bg-marketplace-brown/10 px-4 py-2 font-mono text-xs text-marketplace-brown-soft">
								<span className="text-emerald-400">$</span>
								<span>pwd: ~/skills</span>
							</div>
							<h1 className="mt-6 text-4xl font-semibold tracking-normal text-zinc-50 md:text-6xl">
								Agent Skills
							</h1>
							<p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400 md:text-lg">
								Browse real SKILL.md files discovered inside public GitHub
								repositories.
							</p>
						</div>

						<div className="grid grid-cols-3 gap-3 self-end">
							<StatBlock
								label="total skills"
								value={formatNumber(data.stats.totalSkills)}
							/>
							<StatBlock
								label="source repos"
								value={formatNumber(data.stats.totalSources)}
							/>
							<StatBlock
								label="categories"
								value={formatNumber(data.stats.categories)}
							/>
						</div>
					</header>

					<section className="mt-4">
						<div className="mx-auto max-w-3xl">
							<HomeSectionFrame
								title="Browse Agent Skills"
								fileLabel="skills --list"
								statusLabel="ready"
							>
								<HomeSectionControls
									filterLabel="Filter by"
									filterOptions={[]}
									filterControl={
										<Link
											to="/categories"
											className="inline-flex rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-1.5 font-mono text-sm text-zinc-300 transition-colors hover:border-emerald-500/50 hover:text-emerald-200"
										>
											Category
										</Link>
									}
									selectedFilter={
										selectedCategory === "all" ? "Category" : selectedCategory
									}
									onFilterChange={() => {}}
									sortLabel="Sort by"
									sortOptions={[
										{ label: "Stars", value: "stars" },
										{ label: "Recent", value: "recent" },
										{ label: "Name", value: "name" },
									]}
									sortValue={selectedSort}
									onSortChange={(value) =>
										handleSortChange(value as PublicAgentSkillsSort)
									}
								/>
							</HomeSectionFrame>
						</div>

						<div className="mt-6">
							<HomeSectionSearchBar
								value={searchInput}
								onChange={setSearchInput}
								placeholder="Search skills: try 'code review', 'git automation', 'data analysis'..."
								prompt="find skills"
							/>
						</div>

						<div className="mb-5 flex justify-end">
							<span className="font-mono text-xs text-zinc-600">
								{formatNumber(pagination.totalItems)} matches
							</span>
						</div>

						{isEmptyDataset ? (
							<SkillsEmptyState>No Agent Skills found yet.</SkillsEmptyState>
						) : isEmptyFilterResult ? (
							<SkillsEmptyState>
								No skills match your current filters.
							</SkillsEmptyState>
						) : (
							<div className="columns-1 gap-4 md:columns-2 xl:columns-3 2xl:columns-4">
								{visibleItems.map((item) => (
									<div key={item.id} className="mb-4 break-inside-avoid">
										<PublicAgentSkillCard item={item} />
									</div>
								))}
							</div>
						)}

						{!isEmptyDataset && !isEmptyFilterResult && (
							<div className="flex flex-col items-center gap-3 pt-6">
								{loadMoreError && (
									<p className="font-mono text-sm text-red-300">
										{loadMoreError}
									</p>
								)}

								{pagination.hasNextPage ? (
									<button
										type="button"
										onClick={handleLoadMore}
										disabled={isLoadingMore}
										className="group inline-flex items-center gap-2 rounded-full border border-marketplace-brown bg-marketplace-brown px-6 py-4 font-semibold text-zinc-950 transition-all hover:bg-marketplace-brown-soft hover:shadow-[0_0_28px_rgba(217,145,120,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
									>
										<span>
											{isLoadingMore ? "Loading..." : "Load more skills"}
										</span>
										{!isLoadingMore && (
											<ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
										)}
									</button>
								) : (
									<p className="font-mono text-sm text-zinc-600">
										You reached the end.
									</p>
								)}
							</div>
						)}
					</section>
				</main>

				<PublicFooter />
			</div>
		</div>
	);
}

function StatBlock({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-2xl border border-white/10 bg-black/25 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
			<div className="font-mono text-[11px] text-zinc-500 uppercase tracking-normal">
				{label}
			</div>
			<div className="mt-2 font-mono text-2xl font-semibold text-zinc-50">
				{value}
			</div>
		</div>
	);
}

function SkillsEmptyState({ children }: { children: React.ReactNode }) {
	return (
		<div className="rounded-2xl border border-zinc-800 bg-[#070b0e]/90 p-10 text-center text-zinc-400">
			{children}
		</div>
	);
}

function PublicAgentSkillCard({ item }: { item: AgentSkillListItem }) {
	const description =
		markdownToPlainTextPreview(item.description ?? "", 180) ||
		"A discovered SKILL.md agent skill.";
	const owner = item.repoFullName.split("/")[0] || "unknown";

	return (
		<article className="group relative block overflow-hidden rounded-2xl border border-zinc-800 bg-[#070b0e] transition-all hover:-translate-y-0.5 hover:border-emerald-500/50 hover:shadow-[0_0_28px_rgba(16,185,129,0.12)]">
			<a
				href={item.fileUrl}
				target="_blank"
				rel="noreferrer"
				aria-label={`Open ${item.skillName}`}
				className="absolute inset-0 z-10 rounded-2xl"
			>
				<span className="sr-only">Open {item.skillName}</span>
			</a>

			<div className="flex items-center justify-between rounded-t-2xl border-zinc-800 border-b bg-zinc-950/80 px-4 py-3">
				<div className="flex min-w-0 items-center gap-2">
					<TerminalDots />
					<span className="truncate font-mono text-xs text-zinc-400 transition-colors group-hover:text-emerald-300">
						{getSkillFileTitle(item.skillName)}
					</span>
				</div>

				<span className="ml-3 inline-flex shrink-0 items-center gap-1 font-mono text-[11px] text-yellow-300">
					<Star size={12} fill="currentColor" />
					{formatNumber(item.repoStars)}
				</span>
			</div>

			<div className="p-4">
				<div className="mb-4 flex items-center gap-2">
					{owner && owner !== "unknown" && (
						<img
							src={`https://github.com/${owner}.png?size=40`}
							alt={owner}
							className="h-5 w-5 rounded-full"
							loading="lazy"
						/>
					)}
					<p className="font-mono text-xs text-zinc-500">
						from <span className="text-zinc-300">{item.repoFullName}</span>
					</p>
				</div>

				<p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-400">
					{description}
				</p>

				<div className="relative z-20 mt-4 rounded border border-emerald-400/15 bg-black/40 p-2">
					<div className="flex items-center gap-2">
						<span className="font-mono text-xs text-emerald-300">$</span>
						<code
							className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-300"
							title={item.installCommand}
						>
							{item.installCommand}
						</code>
						<CopyButton
							textToCopy={item.installCommand}
							ariaLabel={`Copy install command for ${item.skillName}`}
						/>
					</div>
				</div>

				<div className="mt-5 flex items-center justify-between text-xs text-zinc-500">
					<span>{formatDate(item.repoUpdatedAt)}</span>
					<Heart
						size={15}
						className="text-zinc-600 transition-colors group-hover:text-marketplace-brown-soft"
					/>
				</div>
			</div>
		</article>
	);
}
