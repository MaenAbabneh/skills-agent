import { createFileRoute } from "@tanstack/react-router";

import { SkillsPage } from "@/components/skills/SkillsPage";
import { PUBLIC_BROWSE_STALE_TIME } from "@/lib/public-cache";
import {
	getPublicAgentSkillsPageData,
	type PublicAgentSkillsSort,
} from "@/server/functions/public-agent-skills";

const SORT_VALUES = ["stars", "recent", "name"] as const;

type SkillsSearch = {
	q?: string;
	category?: string;
	sort?: PublicAgentSkillsSort;
};

function normalizeSearch(search: Record<string, unknown>): SkillsSearch {
	const sort = SORT_VALUES.includes(search.sort as PublicAgentSkillsSort)
		? (search.sort as PublicAgentSkillsSort)
		: undefined;
	const q = typeof search.q === "string" ? search.q.trim() : "";
	const category =
		typeof search.category === "string" ? search.category.trim() : "";

	return {
		q: q || undefined,
		category: category && category !== "all" ? category : undefined,
		sort: sort && sort !== "stars" ? sort : undefined,
	};
}

export const Route = createFileRoute("/skills")({
	component: SkillsRoute,

	validateSearch: normalizeSearch,

	loaderDeps: ({ search }) => ({
		q: search.q ?? "",
		category: search.category ?? "all",
		sort: search.sort ?? "stars",
	}),

	loader: async ({ deps }) => {
		const skillsData = await getPublicAgentSkillsPageData({
			data: {
				q: deps.q,
				category: deps.category,
				sort: deps.sort,
				page: 1,
				pageSize: 24,
			},
		});

		return {
			skillsData,
		};
	},

	// Public browse cache is intentionally long-lived. Data refresh happens
	// through discovery/enrichment/admin workflows, not realtime user browsing.
	staleTime: PUBLIC_BROWSE_STALE_TIME,
	preloadStaleTime: PUBLIC_BROWSE_STALE_TIME,
	gcTime: PUBLIC_BROWSE_STALE_TIME,
});

function SkillsRoute() {
	const search = Route.useSearch();
	const { skillsData } = Route.useLoaderData();

	return <SkillsPage data={skillsData} search={search} />;
}
