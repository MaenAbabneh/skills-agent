import { useGSAP } from "@gsap/react";
import { createFileRoute } from "@tanstack/react-router";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
	type SkillsSearch,
	type SkillsSort,
	skillsSearchSchema,
} from "#/lib/validations/search";
import EmptyState from "@/components/home/EmptyState";
import HomeHeader from "@/components/home/HomeHeader";
import Navbar from "@/components/home/Navbar";
import SkillsSection from "@/components/home/SkillsSection";
import SkillsToolbar from "@/components/home/SkillsToolbar";
import type { SkillType } from "@/components/skillcard";

async function fetchFilteredSkills(filters: SkillsSearch) {
	await new Promise((resolve) => setTimeout(resolve, 500));

	let result = [...dummySkill];

	if (filters.category && filters.category !== "all") {
		result = result.filter((skill) => skill.category === filters.category);
	}

	if (filters.q) {
		const query = filters.q.toLowerCase();
		result = result.filter((skill) => {
			const searchableText = [
				skill.title,
				skill.description,
				skill.category,
				skill.author.username,
				...skill.tags,
			]
				.join(" ")
				.toLowerCase();

			return searchableText.includes(query);
		});
	}

	result = result.sort((a, b) => {
		switch (filters.sort) {
			case "oldest":
				return (
					new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
				);
			case "upvotes-desc":
				return b.upvotes - a.upvotes;
			case "likes-desc":
				return b.likes - a.likes;
			default:
				return (
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
				);
		}
	});

	return result;
}

export const Route = createFileRoute("/")({
	component: Home,
	validateSearch: (search) => skillsSearchSchema.parse(search),
	loaderDeps: ({ search }) => search,
	loader: async ({ deps }) => {
		const filteredSkills = await fetchFilteredSkills(deps);
		return {
			skills: filteredSkills,
		};
	},
});

const dummySkill: SkillType[] = [
	{
		id: "1",
		title: "React UI Kit",
		description:
			"Reusable React components for building polished dashboards and product pages.",
		category: "Frontend",
		installCommand: "npm install react-ui-kit",
		createdAt: "2024-01-12T00:00:00Z",
		author: {
			username: "john_doe",
			imageURL: "https://i.pravatar.cc/80?img=11",
		},
		upvotes: 128,
		likes: 256,
		commentsCount: 24,
		tags: ["react", "ui", "frontend"],
	},
	{
		id: "2",
		title: "Node API Starter",
		description:
			"A small Express setup with routing, validation, and clean error handling.",
		category: "Backend",
		installCommand: "npm install node-api-starter",
		createdAt: "2024-02-03T00:00:00Z",
		author: {
			username: "jane_doe",
			imageURL: "https://i.pravatar.cc/80?img=12",
		},
		upvotes: 176,
		likes: 342,
		commentsCount: 31,
		tags: ["node", "api", "express"],
	},
	{
		id: "3",
		title: "Python Data Helper",
		description:
			"Utility functions for cleaning CSV files, normalizing data, and exporting reports.",
		category: "Data",
		installCommand: "pip install data-helper",
		createdAt: "2024-03-19T00:00:00Z",
		author: {
			username: "alice_smith",
			imageURL: "https://i.pravatar.cc/80?img=13",
		},
		upvotes: 221,
		likes: 428,
		commentsCount: 45,
		tags: ["python", "data", "csv"],
	},
	{
		id: "4",
		title: "Auth Guard",
		description:
			"Drop-in route guards, session checks, and role-based access helpers.",
		category: "Security",
		installCommand: "npm install auth-guard",
		createdAt: "2024-04-08T00:00:00Z",
		author: {
			username: "omar_dev",
			imageURL: "https://i.pravatar.cc/80?img=14",
		},
		upvotes: 97,
		likes: 184,
		commentsCount: 16,
		tags: ["auth", "security", "roles"],
	},
	{
		id: "5",
		title: "Tailwind Forms",
		description:
			"Accessible form controls styled with Tailwind and ready for validation states.",
		category: "Design System",
		installCommand: "npm install tailwind-forms-kit",
		createdAt: "2024-05-22T00:00:00Z",
		author: {
			username: "sara_ui",
			imageURL: "https://i.pravatar.cc/80?img=15",
		},
		upvotes: 154,
		likes: 267,
		commentsCount: 28,
		tags: ["tailwind", "forms", "a11y"],
	},
	{
		id: "6",
		title: "GraphQL Query Pack",
		description:
			"Common GraphQL query helpers with caching utilities and typed response patterns.",
		category: "API",
		installCommand: "npm install graphql-query-pack",
		createdAt: "2024-06-11T00:00:00Z",
		author: {
			username: "mike_graph",
			imageURL: "https://i.pravatar.cc/80?img=16",
		},
		upvotes: 183,
		likes: 298,
		commentsCount: 34,
		tags: ["graphql", "cache", "api"],
	},
	{
		id: "7",
		title: "Chart Builder",
		description:
			"Config-driven charts for product metrics, sales trends, and operational dashboards.",
		category: "Analytics",
		installCommand: "npm install chart-builder",
		createdAt: "2024-07-02T00:00:00Z",
		author: {
			username: "nour_charts",
			imageURL: "https://i.pravatar.cc/80?img=17",
		},
		upvotes: 245,
		likes: 461,
		commentsCount: 52,
		tags: ["charts", "analytics", "dashboard"],
	},
	{
		id: "8",
		title: "Email Template Lab",
		description:
			"Responsive transactional email templates with preview data and reusable sections.",
		category: "Messaging",
		installCommand: "npm install email-template-lab",
		createdAt: "2024-08-17T00:00:00Z",
		author: {
			username: "lina_mail",
			imageURL: "https://i.pravatar.cc/80?img=18",
		},
		upvotes: 88,
		likes: 139,
		commentsCount: 12,
		tags: ["email", "templates", "responsive"],
	},
	{
		id: "9",
		title: "Prisma Seed Kit",
		description:
			"Factory helpers and seed scripts for building realistic development databases.",
		category: "Database",
		installCommand: "npm install prisma-seed-kit",
		createdAt: "2024-09-05T00:00:00Z",
		author: {
			username: "db_ahmad",
			imageURL: "https://i.pravatar.cc/80?img=19",
		},
		upvotes: 132,
		likes: 214,
		commentsCount: 21,
		tags: ["prisma", "database", "seed"],
	},
	{
		id: "10",
		title: "Test Runner Boost",
		description:
			"Vitest presets, mock factories, and browser test utilities for modern apps.",
		category: "Testing",
		installCommand: "npm install test-runner-boost",
		createdAt: "2024-10-14T00:00:00Z",
		author: {
			username: "qa_mona",
			imageURL: "https://i.pravatar.cc/80?img=20",
		},
		upvotes: 201,
		likes: 356,
		commentsCount: 39,
		tags: ["vitest", "testing", "mocks"],
	},
	{
		id: "11",
		title: "Next SEO Tools",
		description:
			"Metadata helpers, sitemap builders, and structured data snippets for Next.js sites.",
		category: "SEO",
		installCommand: "npm install next-seo-tools",
		createdAt: "2024-11-09T00:00:00Z",
		author: {
			username: "seo_karim",
			imageURL: "https://i.pravatar.cc/80?img=21",
		},
		upvotes: 119,
		likes: 197,
		commentsCount: 18,
		tags: ["nextjs", "seo", "metadata"],
	},
	{
		id: "12",
		title: "Realtime Presence",
		description:
			"Presence indicators, typing states, and channel subscriptions for collaborative apps.",
		category: "Realtime",
		installCommand: "npm install realtime-presence",
		createdAt: "2024-12-01T00:00:00Z",
		author: {
			username: "live_faris",
			imageURL: "https://i.pravatar.cc/80?img=22",
		},
		upvotes: 167,
		likes: 284,
		commentsCount: 33,
		tags: ["realtime", "presence", "websocket"],
	},
	{
		id: "13",
		title: "Markdown Studio",
		description:
			"Markdown parsing, preview rendering, and editor shortcuts for content-heavy tools.",
		category: "Content",
		installCommand: "npm install markdown-studio",
		createdAt: "2025-01-20T00:00:00Z",
		author: {
			username: "content_rami",
			imageURL: "https://i.pravatar.cc/80?img=23",
		},
		upvotes: 143,
		likes: 229,
		commentsCount: 26,
		tags: ["markdown", "editor", "content"],
	},
	{
		id: "14",
		title: "Upload Dropzone",
		description:
			"Drag-and-drop file uploads with progress states, validation, and retry handling.",
		category: "Storage",
		installCommand: "npm install upload-dropzone",
		createdAt: "2025-02-13T00:00:00Z",
		author: {
			username: "files_yara",
			imageURL: "https://i.pravatar.cc/80?img=24",
		},
		upvotes: 190,
		likes: 335,
		commentsCount: 37,
		tags: ["upload", "files", "storage"],
	},
	{
		id: "15",
		title: "Command Palette",
		description:
			"Keyboard-first command palette with search, groups, and async action support.",
		category: "Productivity",
		installCommand: "npm install command-palette-kit",
		createdAt: "2025-03-07T00:00:00Z",
		author: {
			username: "zain_tools",
			imageURL: "https://i.pravatar.cc/80?img=25",
		},
		upvotes: 258,
		likes: 503,
		commentsCount: 61,
		tags: ["commands", "search", "productivity"],
	},
];

gsap.registerPlugin(Flip);

function Home() {
	const containerRef = useRef<HTMLDivElement>(null);
	const isLayoutAnimatingRef = useRef(false);
	const [isGridView, setIsGridView] = useState(true);

	const categories = useMemo(
		() =>
			Array.from(new Set(dummySkill.map((skill) => skill.category))).sort(
				(a, b) => a.localeCompare(b),
			),
		[],
	);

	const {
		q: searchQuery,
		category: selectedCategory,
		sort: selectedSort,
	} = Route.useSearch();
	const navigate = Route.useNavigate();

	const { skills: filteredSkills } = Route.useLoaderData();

	const handleSearchChange = (value: string) => {
		navigate({
			search: (prev) => ({ ...prev, q: value }),
			replace: true,
		});
	};

	const handleCategoryChange = (value: string) => {
		navigate({
			search: (prev) => ({ ...prev, category: value }),
			replace: true,
		});
	};

	const handleSortChange = (value: SkillsSort) => {
		navigate({
			search: (prev) => ({ ...prev, sort: value }),
			replace: true,
		});
	};

	const totalUpvotes = useMemo(
		() => dummySkill.reduce((total, skill) => total + skill.upvotes, 0),
		[],
	);

	const { contextSafe } = useGSAP(
		() => {
			gsap.from(".skill-card-anim", {
				y: 50,
				opacity: 0,
				duration: 0.8,
				stagger: 0.1,
				ease: "power3.out",
			});
		},
		{ scope: containerRef },
	);

	const changeLayout = contextSafe((nextIsGridView: boolean) => {
		if (
			!containerRef.current ||
			isLayoutAnimatingRef.current ||
			nextIsGridView === isGridView
		) {
			return;
		}

		const cards = containerRef.current.querySelectorAll(".skill-card-anim");
		const state = Flip.getState(cards);

		isLayoutAnimatingRef.current = true;

		flushSync(() => {
			setIsGridView(nextIsGridView);
		});

		Flip.from(state, {
			duration: 0.6,
			ease: "power2.inOut",
			stagger: 0.04,
			absolute: true,
			onComplete: () => {
				isLayoutAnimatingRef.current = false;
				gsap.set(cards, { clearProps: "all" });
			},
		});
	});

	return (
		<>
			<Navbar />
			<main className="mx-auto max-w-7xl px-6 pb-8 md:px-8" ref={containerRef}>
				<HomeHeader
					skillsCount={dummySkill.length}
					categoriesCount={categories.length}
					totalUpvotes={totalUpvotes}
				/>
				<SkillsToolbar
					searchQuery={searchQuery}
					selectedCategory={selectedCategory}
					selectedSort={selectedSort}
					categories={categories}
					isGridView={isGridView}
					onSearchChange={handleSearchChange}
					onCategoryChange={handleCategoryChange}
					onSortChange={handleSortChange}
					onLayoutChange={changeLayout}
				/>
				<SkillsSection skills={filteredSkills} isGridView={isGridView} />
				{filteredSkills.length === 0 ? <EmptyState /> : null}
			</main>
		</>
	);
}
