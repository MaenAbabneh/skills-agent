import { Folder } from "lucide-react";
import { formatNumber } from "@/lib/format";
import type { CategoryCount } from "@/server/functions/public-home";

function getCategoryAccent(category: string) {
	const cat = category.toLowerCase();
	if (cat.includes("tools") || cat.includes("productivity")) {
		return {
			text: "text-cyan-400",
			icon: "text-cyan-500",
			hoverBorder: "hover:border-cyan-400/60",
		};
	}
	if (
		cat.includes("business") ||
		cat.includes("marketing") ||
		cat.includes("finance")
	) {
		return {
			text: "text-yellow-400",
			icon: "text-yellow-500",
			hoverBorder: "hover:border-yellow-400/60",
		};
	}
	if (
		cat.includes("development") ||
		cat.includes("api") ||
		cat.includes("code review") ||
		cat.includes("debugging")
	) {
		return {
			text: "text-blue-400",
			icon: "text-blue-500",
			hoverBorder: "hover:border-blue-400/60",
		};
	}
	if (cat.includes("testing") || cat.includes("security")) {
		return {
			text: "text-lime-400",
			icon: "text-lime-500",
			hoverBorder: "hover:border-lime-400/60",
		};
	}
	if (cat.includes("data") || cat.includes("ai") || cat.includes("research")) {
		return {
			text: "text-fuchsia-400",
			icon: "text-fuchsia-500",
			hoverBorder: "hover:border-fuchsia-400/60",
		};
	}
	if (
		cat.includes("devops") ||
		cat.includes("github automation") ||
		cat.includes("automation")
	) {
		return {
			text: "text-violet-400",
			icon: "text-violet-500",
			hoverBorder: "hover:border-violet-400/60",
		};
	}
	if (
		cat.includes("documentation") ||
		cat.includes("writing") ||
		cat.includes("content") ||
		cat.includes("media")
	) {
		return {
			text: "text-rose-400",
			icon: "text-rose-500",
			hoverBorder: "hover:border-rose-400/60",
		};
	}
	if (cat.includes("databases")) {
		return {
			text: "text-emerald-400",
			icon: "text-emerald-500",
			hoverBorder: "hover:border-emerald-400/60",
		};
	}
	if (cat.includes("blockchain")) {
		return {
			text: "text-amber-400",
			icon: "text-amber-500",
			hoverBorder: "hover:border-amber-400/60",
		};
	}
	if (cat.includes("lifestyle")) {
		return {
			text: "text-pink-400",
			icon: "text-pink-500",
			hoverBorder: "hover:border-pink-400/60",
		};
	}

	// Fallback
	return {
		text: "text-emerald-400",
		icon: "text-emerald-500",
		hoverBorder: "hover:border-emerald-400/60",
	};
}

export function CategoryCard({ item }: { item: CategoryCount }) {
	const accent = getCategoryAccent(item.category);

	return (
		<div
			className={`home-card-reveal group relative min-h-[120px] overflow-hidden rounded-2xl border border-zinc-800 bg-[#070707] p-5 transition-colors ${accent.hoverBorder}`}
		>
			<h3 className="relative z-10 text-base font-semibold text-zinc-100">
				{item.category}
			</h3>

			<p className="relative z-10 mt-8 font-mono text-sm">
				<span className={accent.text}>{formatNumber(item.count)}</span>
				<span className="ml-1 text-zinc-500">skills</span>
			</p>

			<Folder
				className={`absolute -bottom-3 -right-3 h-20 w-20 opacity-5 transition-opacity group-hover:opacity-10 ${accent.icon}`}
			/>
		</div>
	);
}
