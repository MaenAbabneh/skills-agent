import type { CategoryCount } from "@/server/functions/public-home";
import { CategoryCard } from "../cards/CategoryCard";
import { EmptyState } from "../layout/EmptyState";
import { SectionHeading } from "../layout/SectionHeading";
import { HomeButton } from "../ui/HomeButton";

export function CategorySection({ items }: { items: CategoryCount[] }) {
	// TODO: link to /categories when the public categories page is implemented.
	const categoriesHref = "#categories";
	const sortedItems = [...items].sort((a, b) => {
		if (a.category.toLowerCase() === "other") return 1;
		if (b.category.toLowerCase() === "other") return -1;
		return 0;
	});

	return (
		<section
			id="categories"
			className="home-reveal mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8"
		>
			<SectionHeading
				kicker="Categories"
				title="Browse by category"
				description="Explore agent skills organized by their primary use case"
			/>
			{sortedItems.length > 0 ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{sortedItems.map((item) => (
						<CategoryCard key={item.category} item={item} />
					))}
				</div>
			) : (
				<EmptyState>No Agent Skill categories found yet.</EmptyState>
			)}
			<div className="flex justify-center pt-6">
				<HomeButton href={categoriesHref} variant="outline">
					View all categories
				</HomeButton>
			</div>
		</section>
	);
}
