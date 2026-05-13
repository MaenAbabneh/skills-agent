import type { PublicHomeData } from "@/server/functions/public-home";
import { GrowthChartCard } from "../ui/GrowthChartCard";
import { TerminalDots } from "../ui/TerminalDots";

export function HeroSection({
	stats,
	timeline,
}: {
	stats: PublicHomeData["stats"];
	timeline: PublicHomeData["timeline"];
}) {
	return (
		<section className="relative overflow-hidden border-b border-zinc-900 bg-[#050505]">
			{/* Background grid */}
			<div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_80%_60%_at_50%_0%,#000_70%,transparent_100%)]" />

			{/* Subtle Glows */}
			<div className="pointer-events-none absolute right-[8%] top-[15%] aspect-square w-[min(45vw,36rem)] rounded-full bg-marketplace-brown/10 blur-3xl" />
			<div className="pointer-events-none absolute bottom-0 left-0 aspect-square w-72 rounded-full bg-emerald-500/5 blur-3xl sm:w-96 lg:w-136" />

			<div className="relative mx-auto grid w-full max-w-screen-2xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,0.92fr)_minmax(22rem,1.08fr)] lg:px-8 lg:py-24 xl:py-28">
				{/* Left Column */}
				<div className="flex flex-col justify-center animate-in fade-in slide-in-from-bottom-8 duration-700">
					{/* Small label */}
					<div className="mb-6 flex items-center gap-3">
						<TerminalDots />
						<span className="font-mono text-sm text-zinc-500">
							reporadar.marketplace
						</span>
					</div>

					{/* Headline */}
					<h1 className="mb-4 max-w-3xl text-balance font-mono text-4xl font-bold leading-[0.95] tracking-tight text-zinc-50 sm:text-5xl md:text-6xl xl:text-7xl">
						<span className="text-terminal-orange">{">"}</span> GitHub Discovery
						<br />
						Radar
						<span className="ml-2 inline-block h-[0.7em] w-[0.4em] animate-pulse align-baseline bg-terminal-orange/60" />
					</h1>

					{/* Subtitle */}
					<p className="mb-10 max-w-3xl text-balance font-mono text-base text-zinc-400 md:text-lg">
						<span className="text-terminal-orange">{">"}</span> for curated
						repos and real SKILL.md agent skills
					</p>

					{/* Stat Card */}
					<div className="mb-6 w-full max-w-xl rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-4 font-mono text-sm text-zinc-300 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both sm:p-5 sm:text-base">
						<div className="text-zinc-500">const radar = {"{"}</div>
						<div className="pl-4">
							<span className="text-zinc-400">skills:</span>{" "}
							<span className="wrap-break-word text-marketplace-brown-soft">
								{new Intl.NumberFormat("en-US").format(
									stats.approvedAgentSkills,
								)}
							</span>
							,
						</div>
						<div className="pl-4">
							<span className="text-zinc-400">repos:</span>{" "}
							<span className="wrap-break-word text-marketplace-brown-soft">
								{new Intl.NumberFormat("en-US").format(stats.approved3dRepos)}
							</span>
						</div>
						<div className="text-zinc-500">{"};"}</div>
					</div>

					{/* Comment Block */}
					<div className="w-full max-w-3xl border-marketplace-brown/50 border-l-2 bg-marketplace-brown/10 p-4 font-mono text-xs leading-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both sm:text-sm">
						<div>
							<span className="text-emerald-500/70 text-base">/**</span>
						</div>
						<div>
							<span className="text-emerald-500/70 text-base"> *</span>{" "}
							<span className="text-zinc-400">
								Search focused sections, inspect README-enriched repositories,
							</span>
						</div>
						<div>
							<span className="text-emerald-500/70 text-base"> *</span>{" "}
							<span className="text-zinc-400">
								and discover real SKILL.md agent skills from GitHub.
							</span>
						</div>
						<div>
							<span className="text-emerald-500/70 text-base"> */</span>
						</div>
					</div>
				</div>

				{/* Right Column */}
				<div className="flex w-full justify-center lg:justify-end animate-in fade-in slide-in-from-right-8 duration-1000 delay-300 fill-mode-both">
					<div className="relative w-full">
						{/* Chart Card */}
						<GrowthChartCard
							timeline={timeline}
							skillsCount={stats.approvedAgentSkills}
							reposCount={stats.approved3dRepos}
						/>
					</div>
				</div>
			</div>
		</section>
	);
}
