import { Bot, Layers3 } from "lucide-react";

export function ExploreCard({
	title,
	badge,
	description,
	stats,
	cta,
	href,
	accent,
}: {
	title: string;
	badge: string;
	description: string;
	stats: string[];
	cta: string;
	href: string;
	accent: "green" | "brand";
}) {
	const accentClass =
		accent === "green"
			? "text-emerald-300 border-emerald-400/25 bg-emerald-400/10"
			: "text-marketplace-brown-soft border-marketplace-brown/25 bg-marketplace-brown/10";

	return (
		<a
			href={href}
			className="home-card-reveal group rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 transition-all hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-zinc-950"
		>
			<div className="flex items-start justify-between gap-4">
				<div>
					<span
						className={`mb-4 inline-flex rounded-full border px-2.5 py-1 font-mono text-[11px] ${accentClass}`}
					>
						{badge}
					</span>
					<h3 className="text-xl font-semibold text-zinc-50">{title}</h3>
				</div>
				{title === "3D Motion" ? (
					<Layers3 className="text-emerald-400/80" size={24} />
				) : (
					<Bot className="text-marketplace-brown-soft/80" size={24} />
				)}
			</div>
			<p className="mt-4 text-sm leading-6 text-zinc-400">{description}</p>
			<div className="mt-5 flex flex-wrap gap-2">
				{stats.map((stat) => (
					<span
						key={stat}
						className="rounded border border-zinc-800 bg-black/30 px-2 py-1 font-mono text-[11px] text-zinc-500"
					>
						{stat}
					</span>
				))}
			</div>
			<p className="mt-5 font-mono text-sm text-emerald-300 transition-colors group-hover:text-marketplace-brown-soft">
				{cta} -&gt;
			</p>
		</a>
	);
}
