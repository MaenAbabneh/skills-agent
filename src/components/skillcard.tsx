import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
	Copy,
	Check,
	ArrowUp,
	MessageSquare,
	Terminal,
	Heart,
} from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { generateSlug } from "#/lib/utils";

// Data shape based on the database structure.
export interface SkillType {
	id: string;
	title: string;
	description: string;
	category: string;
	installCommand: string;
	createdAt: string;
	author: {
		username: string;
		imageURL: string;
	};
	upvotes: number;
	likes: number;
	commentsCount: number;
	tags: string[];
}

const SkillCard = (skill: SkillType) => {
	const [isCopied, setIsCopied] = useState(false);
	const [isLiked, setIsLiked] = useState(false);
	const [likesCount, setLikesCount] = useState(skill.likes);
	const [isLikeAnimating, setIsLikeAnimating] = useState(false);

	// Shared Zustand state for the currently selected card.
	const isHovered = useUIStore((state) => state.selectedSkillId === skill.id);
	const setSelectedSkill = useUIStore((state) => state.setSelectedSkill);

	// Copy the install command.
	const handleCopy = async (e: React.MouseEvent) => {
		e.preventDefault(); // Prevent the overlay link from opening.
		try {
			await navigator.clipboard.writeText(skill.installCommand);
			setIsCopied(true);
			setTimeout(() => setIsCopied(false), 2000); // Reset the button after two seconds.
		} catch (err) {
			console.error("Failed to copy the command", err);
		}
	};

	const handleLike = () => {
		const nextIsLiked = !isLiked;

		setIsLiked(nextIsLiked);
		setLikesCount((current) => current + (nextIsLiked ? 1 : -1));
		setIsLikeAnimating(false);
		requestAnimationFrame(() => {
			setIsLikeAnimating(true);
			setTimeout(() => setIsLikeAnimating(false), 420);
		});
	};

	// Format the date.
	const formattedDate = new Date(skill.createdAt).toLocaleDateString("en-US", {
		month: "short",
		year: "numeric",
	});

  const skillSlug = generateSlug(skill.title);

	return (
		<article
			className={`
        group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-black
        border transition-all duration-500 ease-out
        ${
					isHovered
						? "border-gray-300 dark:border-gray-600 shadow-2xl -translate-y-1"
						: "border-gray-200 dark:border-gray-800 shadow-sm"
				}
      `}
			onMouseEnter={() => setSelectedSkill(skill.id)}
			onMouseLeave={() => setSelectedSkill(null)}
		>
			{/* Hidden overlay link for TanStack Router navigation. */}
			<Link
				to="/skills/$skillSlug"
				params={{ skillSlug: skillSlug }}
				className="absolute inset-0 z-10"
				aria-label={`View details for ${skill.title}`}
			/>

			<div className="space-y-4">
				{/* Header: Avatar, Username, Date, and Category */}
				<header className="flex items-center justify-between overflow-hidden">
					<div className="flex items-center gap-3">
						<div className="overflow-hidden rounded-full border border-gray-200 dark:border-gray-800">
							<img
								src={skill.author.imageURL || "/default-avatar.png"}
								alt={skill.author.username}
								className="w-8 h-8 object-cover transition-transform duration-500 ease-out group-hover:scale-110"
							/>
						</div>
						<div className="text-sm">
							<address className="not-italic font-medium text-gray-900 dark:text-gray-100 transition-colors">
								{skill.author.username}
							</address>
							<time
								dateTime={skill.createdAt}
								className="text-xs text-gray-500"
							>
								{formattedDate}
							</time>
						</div>
					</div>
					<span className="px-2.5 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 rounded-full transition-colors group-hover:bg-gray-200 dark:group-hover:bg-gray-800">
						{skill.category}
					</span>
				</header>

				<div className="flex flex-wrap gap-1.5 relative z-20">
					{skill.tags.map((tag) => (
						<span
							key={tag}
							className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50"
						>
							#{tag}
						</span>
					))}
				</div>

				{/* Body: Title & Description */}
				<div>
					<h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-blue-500">
						{skill.title}
					</h3>
					<p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
						{skill.description}
					</p>
				</div>

				{/* Terminal / Install Command with Copy Button */}
				<div className="relative z-20 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-2 mt-4 transition-colors group-hover:border-gray-300 dark:group-hover:border-gray-700">
					<div className="flex items-center gap-2 overflow-hidden mr-2">
						<Terminal
							size={14}
							className="text-gray-400 shrink-0 transition-transform duration-500 group-hover:rotate-12"
						/>
						<code className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">
							{skill.installCommand}
						</code>
					</div>

					<button
						type="button"
						onClick={handleCopy}
						className={`
              flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md transition-all duration-300 active:scale-95
              ${
								isCopied
									? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
									: "text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
							}
            `}
						aria-label="Copy install command"
					>
						{isCopied ? (
							<>
								<Check size={14} className="animate-in zoom-in" />
								<span className="text-xs font-medium animate-in fade-in slide-in-from-right-1">
									Copied
								</span>
							</>
						) : (
							<Copy
								size={14}
								className="transition-transform group-hover:scale-110"
							/>
						)}
					</button>
				</div>
			</div>

			{/* Footer: Stats (Upvotes & Comments) */}
			<footer className="relative z-20 flex items-center gap-4 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800/50">
				<button
					type="button"
					className="group/btn flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-blue-500"
				>
					<ArrowUp
						size={14}
						className="transition-transform duration-300 ease-out group-hover/btn:-translate-y-1"
					/>
					<span className="font-medium">{skill.upvotes}</span>
				</button>

				<button
					type="button"
					onClick={handleLike}
					aria-pressed={isLiked}
					aria-label={isLiked ? `Unlike ${skill.title}` : `Like ${skill.title}`}
					className={`
            group/btn relative flex items-center gap-1.5 text-xs transition-colors
            ${isLiked ? "text-rose-500" : "text-gray-500 hover:text-rose-500"}
          `}
				>
					<span
						className={`
              pointer-events-none absolute -left-1 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-rose-400/20
              ${isLikeAnimating ? "animate-ping" : "hidden"}
            `}
					/>
					<Heart
						size={14}
						className={`
              relative transition-transform duration-300 ease-out group-hover/btn:scale-110
              ${isLiked ? "fill-current" : ""}
              ${isLikeAnimating ? "scale-125 rotate-[-10deg]" : ""}
            `}
					/>
					<span className="font-medium">{likesCount}</span>
				</button>

				<button
					type="button"
					className="group/btn flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-blue-500"
				>
					<MessageSquare
						size={14}
						className="transition-transform duration-300 ease-out group-hover/btn:scale-110"
					/>
					<span className="font-medium">{skill.commentsCount}</span>
				</button>
			</footer>
		</article>
	);
};

export default SkillCard;
