import { HomeSectionFrame } from "../section-shell/HomeSectionFrame";

export function SectionHeading({
	kicker,
	title,
	description,
}: {
	kicker: string;
	title: string;
	description: string;
}) {
	const fileLabel = `${kicker.toLowerCase().replace(/\s+/g, "-")}.md`;

	return (
		<div className="mx-auto mb-12 max-w-3xl">
			<HomeSectionFrame title={title} fileLabel={fileLabel} statusLabel="ready">
				{description && (
					<p className="mx-auto max-w-3xl text-center font-mono text-base leading-relaxed text-zinc-400">
						<span className="mr-2 text-emerald-400">{"//"}</span>
						{description}
					</p>
				)}
			</HomeSectionFrame>
		</div>
	);
}
