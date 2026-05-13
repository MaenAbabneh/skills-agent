import {
	footerExploreLinks,
	footerPlatformLinks,
	footerResourcesLinks,
} from "../data/home.constants";

export function PublicFooter() {
	return (
		<footer className="border-zinc-800 border-t bg-black/30">
			<div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_2fr] lg:px-8">
				<div>
					<p className="font-mono text-lg font-semibold text-zinc-100">
						<span className="text-emerald-400">~/</span>RepoRadar
						<span className="text-marketplace-brown">|</span>
					</p>
					<p className="mt-3 max-w-sm text-sm leading-6 text-zinc-400">
						Discover high-signal GitHub projects and real agent skills across
						focused open-source sections.
					</p>
					<p className="mt-4 font-mono text-sm text-emerald-300">
						$ reporadar explore --sections
					</p>
				</div>

				<div className="grid gap-6 sm:grid-cols-3">
					<FooterColumn title="Explore" links={footerExploreLinks} />
					<FooterColumn title="Platform" links={footerPlatformLinks} />
					<FooterColumn title="Resources" links={footerResourcesLinks} />
				</div>
			</div>
			<div className="mx-auto flex max-w-7xl flex-col gap-2 border-zinc-900 border-t px-4 py-5 text-xs text-zinc-600 sm:px-6 lg:px-8">
				<p>© 2026 RepoRadar. Built for open-source discovery.</p>
				<p>
					Not affiliated with GitHub, OpenAI, Anthropic, or any provider unless
					stated.
				</p>
			</div>
		</footer>
	);
}

function FooterColumn({
	title,
	links,
}: {
	title: string;
	links: [string, string][];
}) {
	return (
		<div>
			<h3 className="font-mono text-xs uppercase tracking-[0.16em] text-zinc-500">
				{title}
			</h3>
			<ul className="mt-3 space-y-2">
				{links.map(([label, href]) => (
					<li key={label}>
						<a
							href={href}
							className="text-sm text-zinc-400 transition-colors hover:text-emerald-400"
						>
							{label}
						</a>
					</li>
				))}
			</ul>
		</div>
	);
}
