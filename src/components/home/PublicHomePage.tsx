import { useRef } from "react";
import type { PublicHomeData } from "@/server/functions/public-home";
import { useHomeRevealAnimations } from "./animations/useGsapScroll";
import { PublicFooter } from "./layout/PublicFooter";
import { PublicNavbar } from "./layout/PublicNavbar";
import { AboutSection } from "./sections/AboutSection";
import { CategorySection } from "./sections/CategorySection";
import { FaqSection } from "./sections/FaqSection";
import { Featured3dRepos } from "./sections/Featured3dRepos";
import { FeaturedAgentSkills } from "./sections/FeaturedAgentSkills";
import { HeroSection } from "./sections/HeroSection";
import { HowItWorksSection } from "./sections/HowItWorksSection";

type PublicHomePageProps = {
	data: PublicHomeData;
};

export function PublicHomePage({ data }: PublicHomePageProps) {
	const pageRef = useRef<HTMLDivElement>(null);

	useHomeRevealAnimations(pageRef);

	return (
		<div ref={pageRef} className="min-h-screen bg-[#05070a] text-zinc-100">
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

				<main>
					<HeroSection stats={data.stats} timeline={data.timeline} />

					<section
						id="featured-agent-skills"
						className="home-reveal mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8"
					>
						<FeaturedAgentSkills
							items={data.featuredAgentSkills}
							categories={data.agentSkillCategories}
						/>
					</section>

					<section
						id="featured-3d-motion"
						className="home-reveal mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8"
					>
						<Featured3dRepos items={data.featured3dRepos} />
					</section>

					<CategorySection items={data.agentSkillCategories} />
					<HowItWorksSection />
					<AboutSection />
					<FaqSection />
				</main>

				<PublicFooter />
			</div>
		</div>
	);
}
