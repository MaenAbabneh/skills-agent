import { TerminalWindow } from "../shared/TerminalWindow";
import { AboutFeatureTabs } from "./AboutFeatureTabs";

export function AboutSection() {
	return (
		<section
			id="about"
			className="home-reveal mx-auto grid w-full max-w-screen-2xl items-stretch gap-6 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:px-8"
		>
			<TerminalWindow
				fileLabel="ABOUT.md"
				className="home-card-reveal h-full"
				contentClassName="grid h-full grid-rows-[1fr_auto] p-0"
			>
				<div className="p-6 md:p-8">
					<h2 className="font-mono text-xl font-bold tracking-tight text-zinc-50 md:text-2xl">
						## Why Agent Skills Marketplace?
					</h2>

					<div className="mt-3  border-marketplace-brown border-l-2 bg-marketplace-brown/5 py-1 pl-5 ">
						<div className="space-y-5 text-base leading-7 text-zinc-300">
							<p>
								Finding the right agent skill among thousands of GitHub
								repositories can be overwhelming. Skills Marketplace solves this
								by providing smart search, occupation-based filtering, and
								quality indicators to help you quickly find exactly what you
								need.
							</p>
							<p>
								Whether you're a developer automating workflows, a team lead
								building custom AI tools, or a hobbyist exploring AI coding
								assistants, you'll find skills for every use case. All skills
								use the open SKILL.md standard, compatible with Claude Code,
								OpenAI Codex CLI, and other tools adopting this format.
							</p>
						</div>
					</div>
				</div>

				<div className="border-zinc-800 border-t px-6 py-4 md:px-8">
					<p className="font-mono text-sm leading-6 text-zinc-300">
						<span className="text-yellow-300">[INFO]</span> Ready to explore the
						largest collection of agent skills for AI coding assistants?
					</p>
				</div>
			</TerminalWindow>

			<div className="home-card-reveal h-full">
				<AboutFeatureTabs />
			</div>
		</section>
	);
}
