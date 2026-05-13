export function SectionSearchBlock({
	variant,
}: {
	variant: "agent-skills" | "3d-motion";
}) {
	const isAgentSkills = variant === "agent-skills";

	return (
		<div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
			<form
				onSubmit={(event) => event.preventDefault()}
				className="flex flex-col gap-3 md:flex-row md:items-center"
			>
				<label
					htmlFor={`${variant}-search`}
					className={`shrink-0 font-mono text-sm ${
						isAgentSkills ? "text-emerald-300" : "text-terminal-orange"
					}`}
				>
					{isAgentSkills
						? "$ find skills --query"
						: "$ find repos --section 3d-motion --query"}
				</label>
				<input
					id={`${variant}-search`}
					type="search"
					placeholder={
						isAgentSkills
							? '"code review, debugging, github automation"'
							: '"webgl shader portfolio"'
					}
					className={`min-h-11 flex-1 rounded-xl border border-zinc-800 bg-black/30 px-3 font-mono text-sm text-zinc-200 outline-none placeholder:text-zinc-600 ${
						isAgentSkills
							? "focus:border-emerald-500/60"
							: "focus:border-marketplace-brown/60"
					}`}
				/>
			</form>
		</div>
	);
}
