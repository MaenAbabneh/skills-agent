import { formatNumber } from "@/lib/format";
import type { PublicHomeData } from "@/server/functions/public-home";
import { ExploreCard } from "../cards/ExploreCard";
import { SectionHeading } from "../layout/SectionHeading";

export function ExploreSections({ stats }: { stats: PublicHomeData["stats"] }) {
	return (
		<section className="home-reveal mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
			<SectionHeading
				kicker="Explore sections"
				title="Two discovery modes. One focused radar."
				description="RepoRadar separates repository-level discovery from file-level marketplace items, so each section can stay useful and specific."
			/>
			<div className="grid gap-4 md:grid-cols-2">
				<ExploreCard
					title="3D Motion"
					badge="Repository-level"
					description="Three.js, WebGL, React Three Fiber, WebGPU, shaders, creative coding, and interactive 3D web experiences."
					stats={[
						`${formatNumber(stats.approved3dRepos)} repositories`,
						"README enriched",
						"GitHub metadata",
					]}
					cta="Browse 3D Motion"
					href="#featured-3d-motion"
					accent="green"
				/>
				<ExploreCard
					title="Agent Skills"
					badge="Skill-level"
					description="Real SKILL.md files discovered inside public GitHub repositories. Each skill is reviewed and displayed as its own marketplace item."
					stats={[
						`${formatNumber(stats.approvedAgentSkills)} skills`,
						"Install commands",
						"Categories",
					]}
					cta="Browse Agent Skills"
					href="#featured-agent-skills"
					accent="brand"
				/>
			</div>
		</section>
	);
}
