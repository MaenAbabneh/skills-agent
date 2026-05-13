import { Search, Sparkles, Terminal } from "lucide-react";
import { SectionHeading } from "../layout/SectionHeading";

export function HowItWorksSection() {
	return (
		<section
			id="how-it-works"
			className="home-reveal mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8"
		>
			<SectionHeading
				kicker="Workflow"
				title="How it works"
				description="Discovery is split into small, inspectable steps."
			/>
			<div className="grid gap-4 md:grid-cols-3">
				{[
					{
						title: "Discover",
						text: "Searches GitHub using section-specific queries and signals.",
						icon: <Search size={18} />,
					},
					{
						title: "Enrich",
						text: "Adds README previews, SKILL.md metadata, install commands, and categories.",
						icon: <Sparkles size={18} />,
					},
					{
						title: "Review",
						text: "Items are reviewed before public display.",
						icon: <Terminal size={18} />,
					},
				].map((item) => (
					<div
						key={item.title}
						className="home-card-reveal rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5"
					>
						<div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
							{item.icon}
						</div>
						<h3 className="text-lg font-semibold text-zinc-50">{item.title}</h3>
						<p className="mt-3 text-sm leading-6 text-zinc-400">{item.text}</p>
					</div>
				))}
			</div>
		</section>
	);
}
