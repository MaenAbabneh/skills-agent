import { Filter, LibraryBig, Sparkles } from "lucide-react";

export interface HomeHeaderProps {
	skillsCount: number;
	categoriesCount: number;
	totalUpvotes: number;
}

const HomeHeader = ({
	skillsCount,
	categoriesCount,
	totalUpvotes,
}: HomeHeaderProps) => {
	return (
		<section
			id="about"
			className="mb-8 border-b border-gray-200 pb-8 dark:border-gray-800"
		>
			<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
				<div className="max-w-3xl">
					<div className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
						<Sparkles size={16} />
						<span>Skills platform</span>
					</div>
					<h1 className="text-3xl font-bold text-gray-950 md:text-5xl dark:text-white">
						Skilled Library
					</h1>
					<p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 md:text-base dark:text-gray-400">
						A curated library for discovering ready-to-use skills and tools that
						help developers build interfaces, services, and analytics faster.
					</p>
				</div>

				<div className="grid gap-3 text-sm sm:grid-cols-3">
					<div className="border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-black">
						<div className="flex items-center gap-2 text-gray-500">
							<LibraryBig size={15} />
							<span>Skills</span>
						</div>
						<p className="mt-1 text-2xl font-semibold text-gray-950 dark:text-white">
							{skillsCount}
						</p>
					</div>
					<div className="border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-black">
						<div className="flex items-center gap-2 text-gray-500">
							<Filter size={15} />
							<span>Categories</span>
						</div>
						<p className="mt-1 text-2xl font-semibold text-gray-950 dark:text-white">
							{categoriesCount}
						</p>
					</div>
					<div className="border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-black">
						<div className="flex items-center gap-2 text-gray-500">
							<Sparkles size={15} />
							<span>Votes</span>
						</div>
						<p className="mt-1 text-2xl font-semibold text-gray-950 dark:text-white">
							{totalUpvotes}
						</p>
					</div>
				</div>
			</div>
		</section>
	);
};

export default HomeHeader;
