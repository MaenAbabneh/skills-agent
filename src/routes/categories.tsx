import { createFileRoute, Link } from "@tanstack/react-router";

import { CategoryCard } from "@/components/home/cards/CategoryCard";
import { PublicFooter } from "@/components/home/layout/PublicFooter";
import { PublicNavbar } from "@/components/home/layout/PublicNavbar";
import { SectionHeading } from "@/components/home/layout/SectionHeading";
import { PUBLIC_BROWSE_STALE_TIME } from "@/lib/public-cache";
import { getPublicAgentSkillsPageData } from "@/server/functions/public-agent-skills";

export const Route = createFileRoute("/categories")({
	component: CategoriesRoute,

	loader: async () => {
		const data = await getPublicAgentSkillsPageData({
			data: {
				page: 1,
				pageSize: 1,
				sort: "stars",
			},
		});

		return {
			categories: data.categories,
		};
	},

	// Public browse cache is intentionally long-lived. Data refresh happens
	// through discovery/enrichment/admin workflows, not realtime user browsing.
	staleTime: PUBLIC_BROWSE_STALE_TIME,
	preloadStaleTime: PUBLIC_BROWSE_STALE_TIME,
	gcTime: PUBLIC_BROWSE_STALE_TIME,
});

function CategoriesRoute() {
	const { categories } = Route.useLoaderData();

	const sortedCategories = [...categories].sort((a, b) => {
		if (a.category.toLowerCase() === "other") return 1;
		if (b.category.toLowerCase() === "other") return -1;
		return a.category.localeCompare(b.category);
	});

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
					<div className="mb-8">
						<Link
							to="/skills"
							className="inline-flex items-center rounded-full border border-marketplace-brown/20 bg-marketplace-brown/10 px-4 py-2 font-mono text-xs text-marketplace-brown-soft transition-colors hover:border-marketplace-brown/50 hover:text-marketplace-brown"
						>
							$ cd ~/skills
						</Link>
					</div>

					<SectionHeading
						kicker="Categories"
						title="Browse by category"
						description="Explore agent skills organized by their primary use case"
					/>

					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{sortedCategories.map((item) => (
							<Link
								key={item.category}
								to="/skills"
								search={{ category: item.category }}
								className="block"
							>
								<CategoryCard item={item} />
							</Link>
						))}
					</div>
				</main>

				<PublicFooter />
			</div>
		</div>
	);
}
