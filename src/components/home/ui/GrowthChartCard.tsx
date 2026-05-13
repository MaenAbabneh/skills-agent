"use client";

import { useState } from "react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	Line,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type { TimelinePoint } from "@/server/functions/public-home";
import { TerminalDots } from "./TerminalDots";

type ChartMode = "skills" | "repos" | "both";

const INITIAL_CHART_DIMENSION = { width: 16, height: 10 };

export function GrowthChartCard({
	timeline,
	skillsCount,
	reposCount,
}: {
	timeline: TimelinePoint[];
	skillsCount: number;
	reposCount: number;
}) {
	const [mode, setMode] = useState<ChartMode>("skills");

	// Fallback data if timeline is empty
	const data =
		timeline && timeline.length > 0
			? timeline
			: generateFallbackData(skillsCount, reposCount);

	return (
		<div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-chart-skills/30 bg-[#080808] shadow-[0_0_40px_color-mix(in_srgb,var(--color-chart-skills)_5%,transparent)]">
			{/* Top Bar */}
			<div className="flex min-h-9 items-center justify-between gap-3 border-zinc-800/60 border-b bg-[#0c0c0c] px-4">
				<div className="flex min-w-0 items-center gap-3">
					<TerminalDots />
					<span className="truncate font-mono text-xs text-zinc-500">
						trend-analytics.tsx
					</span>
				</div>
				<span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-emerald-400/70">
					indexed
				</span>
			</div>

			{/* Content */}
			<div className="flex flex-1 flex-col p-4 sm:p-5">
				{/* Controls */}
				<div className="mb-5 flex items-center justify-between sm:mb-6">
					<div className="grid w-full grid-cols-3 rounded-md bg-zinc-900/50 p-1 font-mono text-xs sm:w-auto">
						<button
							type="button"
							onClick={() => setMode("skills")}
							className={`rounded px-2 py-1.5 transition-colors sm:px-3 ${
								mode === "skills"
									? "bg-zinc-800 text-chart-skills"
									: "text-zinc-500 hover:text-zinc-300"
							}`}
						>
							Skills
						</button>
						<button
							type="button"
							onClick={() => setMode("repos")}
							className={`rounded px-2 py-1.5 transition-colors sm:px-3 ${
								mode === "repos"
									? "bg-zinc-800 text-emerald-300"
									: "text-zinc-500 hover:text-zinc-300"
							}`}
						>
							3D Repos
						</button>
						<button
							type="button"
							onClick={() => setMode("both")}
							className={`rounded px-2 py-1.5 transition-colors sm:px-3 ${
								mode === "both"
									? "bg-zinc-800 text-zinc-200"
									: "text-zinc-500 hover:text-zinc-300"
							}`}
						>
							Both
						</button>
					</div>
				</div>

				{/* Chart Area */}
				<div className="min-h-0 flex-1">
					<div className="relative aspect-4/3 w-full sm:aspect-16/10">
						<ResponsiveContainer
							width="100%"
							height="100%"
							minWidth={0}
							minHeight={0}
							initialDimension={INITIAL_CHART_DIMENSION}
						>
							<AreaChart
								data={data}
								margin={{ top: 10, right: 12, left: 0, bottom: 4 }}
							>
								<defs>
									<linearGradient id="colorSkills" x1="0" y1="0" x2="0" y2="1">
										<stop
											offset="5%"
											stopColor="var(--color-chart-skills)"
											stopOpacity={0.55}
										/>
										<stop
											offset="95%"
											stopColor="var(--color-chart-skills)"
											stopOpacity={0}
										/>
									</linearGradient>
									<linearGradient id="colorRepos" x1="0" y1="0" x2="0" y2="1">
										<stop
											offset="5%"
											stopColor="var(--color-chart-repos)"
											stopOpacity={0.55}
										/>
										<stop
											offset="95%"
											stopColor="var(--color-chart-repos)"
											stopOpacity={0}
										/>
									</linearGradient>
								</defs>

								<CartesianGrid
									strokeDasharray="3 3"
									stroke="rgba(255,255,255,0.05)"
									vertical={false}
								/>

								<XAxis
									dataKey="label"
									stroke="#a1a1aa"
									fontSize={11}
									tickLine={false}
									axisLine={false}
									dy={10}
								/>

								<YAxis
									stroke="#a1a1aa"
									fontSize={11}
									tickLine={false}
									axisLine={false}
									domain={[0, (dataMax: number) => (dataMax > 0 ? dataMax : 1)]}
									tickFormatter={(value) =>
										value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value
									}
								/>

								<Tooltip
									content={<CustomTooltip mode={mode} />}
									cursor={{
										stroke: "rgba(255,255,255,0.1)",
										strokeWidth: 1,
										strokeDasharray: "4 4",
									}}
								/>

								{(mode === "skills" || mode === "both") && (
									<Area
										type="monotone"
										dataKey="cumulativeAgentSkills"
										stroke="var(--color-chart-skills)"
										strokeWidth={2}
										fill="url(#colorSkills)"
										animationDuration={900}
									/>
								)}

								{mode === "repos" && (
									<Area
										type="monotone"
										dataKey="cumulativeRepos3d"
										stroke="var(--color-chart-repos)"
										strokeWidth={2}
										fill="url(#colorRepos)"
										animationDuration={900}
									/>
								)}

								{mode === "both" && (
									<Line
										type="monotone"
										dataKey="cumulativeRepos3d"
										stroke="var(--color-chart-repos)"
										strokeWidth={2}
										dot={false}
										animationDuration={900}
									/>
								)}
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</div>

				<p className="mt-4 text-center font-mono text-[10px] text-zinc-600">
					Growth over the last 12 months from indexed GitHub items
				</p>
			</div>
		</div>
	);
}

// Custom Tooltip for Recharts
// biome-ignore lint/suspicious/noExplicitAny: Required by Recharts Tooltip content signature
function CustomTooltip({ active, payload, label, mode }: any) {
	if (active && payload && payload.length) {
		const point = payload[0]?.payload;
		const skillsAdded = point?.agentSkills ?? 0;
		const skillsTotal = point?.cumulativeAgentSkills ?? 0;
		const reposAdded = point?.repos3d ?? 0;
		const reposTotal = point?.cumulativeRepos3d ?? 0;

		return (
			<div className="rounded border border-zinc-800 bg-[#0a0a0a] p-3 shadow-xl">
				<p className="mb-2 font-mono text-xs text-blue-400">{label}</p>
				{(mode === "skills" || mode === "both") && (
					<div className="font-mono text-xs text-chart-skills">
						<p>
							Skills added: <span className="text-zinc-100">{skillsAdded}</span>
						</p>
						<p className="mt-1">
							Total this year:{" "}
							<span className="text-zinc-100">{skillsTotal}</span>
						</p>
					</div>
				)}
				{(mode === "repos" || mode === "both") && (
					<div className="mt-2 font-mono text-xs text-emerald-400">
						<p>
							Repos added: <span className="text-zinc-100">{reposAdded}</span>
						</p>
						<p className="mt-1">
							Total this year:{" "}
							<span className="text-zinc-100">{reposTotal}</span>
						</p>
					</div>
				)}
			</div>
		);
	}

	return null;
}

// Fallback generator
function generateFallbackData(
	skillsCount: number,
	reposCount: number,
): TimelinePoint[] {
	const multipliers = [
		0.03, 0.06, 0.1, 0.16, 0.24, 0.34, 0.46, 0.58, 0.7, 0.82, 0.92, 1,
	];
	const now = new Date();

	return multipliers.map((multiplier, index) => {
		const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
		d.setUTCMonth(d.getUTCMonth() - (multipliers.length - 1 - index));

		const previousMultiplier = multipliers[index - 1] ?? 0;
		const cumulativeAgentSkills =
			index === multipliers.length - 1
				? skillsCount
				: Math.round(skillsCount * multiplier);
		const cumulativeRepos3d =
			index === multipliers.length - 1
				? reposCount
				: Math.round(reposCount * multiplier);

		return {
			period: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
				2,
				"0",
			)}-01`,
			label: d.toLocaleDateString("en-US", {
				month: "short",
				timeZone: "UTC",
			}),
			agentSkills: Math.max(
				0,
				cumulativeAgentSkills - Math.round(skillsCount * previousMultiplier),
			),
			repos3d: Math.max(
				0,
				cumulativeRepos3d - Math.round(reposCount * previousMultiplier),
			),
			cumulativeAgentSkills,
			cumulativeRepos3d,
		};
	});
}
