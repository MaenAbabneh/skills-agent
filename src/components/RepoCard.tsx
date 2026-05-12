// src/components/RepoCard.tsx

import { Link } from "@tanstack/react-router";
import {
	BadgeCheck,
	Code2,
	ExternalLink,
	GitFork,
	Github,
	Heart,
	Star,
} from "lucide-react";
import { useState } from "react";
import { useUIStore } from "@/store/useUIStore";

export interface RepoCardType {
	id: number;
	name: string;
	fullName: string;
	owner: string;

	description: string;
	url: string;
	homepage: string | null;

	stars: number;
	forks: number;
	openIssues: number;

	language: string | null;
	topics: string[];
	avatarUrl: string;

	archived: boolean;
	fork: boolean;

	createdAt: string;
	updatedAt: string;
	pushedAt: string;

	section: string;
	repoType: string;

	score: number;
	rejectionReasons: string[];
	isAccepted: boolean;
}

type RepoCardProps = {
	repo: RepoCardType;
};

function formatNumber(value: number) {
	return new Intl.NumberFormat("en", {
		notation: value >= 1000 ? "compact" : "standard",
		maximumFractionDigits: 1,
	}).format(value);
}

function formatDate(date: string) {
	return new Date(date).toLocaleDateString("en-US", {
		month: "short",
		year: "numeric",
	});
}

function getScoreLabel(score: number) {
	if (score >= 90) return "Top Pick";
	if (score >= 75) return "Strong";
	if (score >= 60) return "Good";
	return "Low";
}

const RepoCard = ({ repo }: RepoCardProps) => {
	const [isSaved, setIsSaved] = useState(false);

	const isHovered = useUIStore(
		(state) => state.selectedSkillId === String(repo.id),
	);
	const setSelectedSkill = useUIStore((state) => state.setSelectedSkill);

	const handleSave = (e: React.MouseEvent) => {
		e.preventDefault();
		setIsSaved((current) => !current);
	};

	return (
		<article
			className={`
        group relative flex h-full flex-col justify-between rounded-2xl bg-white p-5
        border transition-all duration-500 ease-out dark:bg-black
        ${
					isHovered
						? "border-gray-300 shadow-2xl -translate-y-1 dark:border-gray-600"
						: "border-gray-200 shadow-sm dark:border-gray-800"
				}
      `}
			onMouseEnter={() => setSelectedSkill(String(repo.id))}
			onMouseLeave={() => setSelectedSkill(null)}
		>
			<Link
				to="/"
				params={{
					owner: repo.owner,
					repo: repo.name,
				}}
				className="absolute inset-0 z-10"
				aria-label={`View details for ${repo.fullName}`}
			/>

			<div className="space-y-4">
				<header className="flex items-start justify-between gap-3">
					<div className="flex min-w-0 items-center gap-3">
						<div className="overflow-hidden rounded-full border border-gray-200 dark:border-gray-800">
							<img
								src={repo.avatarUrl}
								alt={repo.owner}
								className="h-9 w-9 object-cover transition-transform duration-500 ease-out group-hover:scale-110"
							/>
						</div>

						<div className="min-w-0">
							<p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
								{repo.owner}
							</p>
							<time className="text-xs text-gray-500" dateTime={repo.pushedAt}>
								Updated {formatDate(repo.pushedAt)}
							</time>
						</div>
					</div>

					<span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 font-mono text-xs text-gray-600 transition-colors group-hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:group-hover:bg-gray-800">
						{repo.repoType}
					</span>
				</header>

				<div>
					<div className="mb-2 flex items-center gap-2">
						<Github size={16} className="shrink-0 text-gray-400" />
						<h3 className="line-clamp-1 text-lg font-semibold text-gray-900 transition-colors duration-300 group-hover:text-blue-500 dark:text-white">
							{repo.name}
						</h3>
					</div>

					<p className="font-mono text-xs text-gray-500">{repo.fullName}</p>

					<p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
						{repo.description}
					</p>
				</div>

				<div className="relative z-20 flex flex-wrap gap-1.5">
					{repo.topics.slice(0, 4).map((topic) => (
						<span
							key={topic}
							className="rounded border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:border-blue-800/50 dark:bg-blue-900/20 dark:text-blue-400"
						>
							#{topic}
						</span>
					))}
				</div>

				<div className="relative z-20 rounded-xl border border-gray-200 bg-gray-50 p-3 transition-colors group-hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900/50 dark:group-hover:border-gray-700">
					<div className="flex items-center justify-between gap-3">
						<div>
							<div className="flex items-center gap-1.5">
								<BadgeCheck size={15} className="text-blue-500" />
								<span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
									Score {repo.score}
								</span>
							</div>
							<p className="mt-0.5 text-xs text-gray-500">
								{getScoreLabel(repo.score)} · {repo.section}
							</p>
						</div>

						{repo.language && (
							<div className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 text-xs text-gray-600 dark:bg-black dark:text-gray-300">
								<Code2 size={13} />
								{repo.language}
							</div>
						)}
					</div>
				</div>
			</div>

			<footer className="relative z-20 mt-6 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800/50">
				<div className="flex items-center gap-4">
					<span className="flex items-center gap-1.5 text-xs text-gray-500">
						<Star size={14} />
						<span className="font-medium">{formatNumber(repo.stars)}</span>
					</span>

					<span className="flex items-center gap-1.5 text-xs text-gray-500">
						<GitFork size={14} />
						<span className="font-medium">{formatNumber(repo.forks)}</span>
					</span>
				</div>

				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={handleSave}
						aria-pressed={isSaved}
						aria-label={isSaved ? `Unsave ${repo.name}` : `Save ${repo.name}`}
						className={`
              rounded-lg p-2 transition-colors active:scale-95
              ${
								isSaved
									? "text-rose-500"
									: "text-gray-500 hover:bg-gray-100 hover:text-rose-500 dark:hover:bg-gray-900"
							}
            `}
					>
						<Heart size={15} className={isSaved ? "fill-current" : ""} />
					</button>

					<a
						href={repo.url}
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-white"
						onClick={(e) => e.stopPropagation()}
					>
						GitHub
						<ExternalLink size={13} />
					</a>
				</div>
			</footer>
		</article>
	);
};

export default RepoCard;
