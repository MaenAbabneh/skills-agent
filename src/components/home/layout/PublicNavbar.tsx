import { Link } from "@tanstack/react-router";
import { BookOpen, Github, Moon, Search, Sun, Zap } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function PublicNavbar() {
	const [theme, setTheme] = useState<Theme>("dark");
	const isDarkMode = theme === "dark";

	useEffect(() => {
		const storedTheme =
			window.localStorage.getItem("theme") === "light" ? "light" : "dark";

		setTheme(storedTheme);
		document.documentElement.classList.toggle("dark", storedTheme === "dark");
	}, []);

	function toggleTheme() {
		setTheme((currentTheme) => {
			const nextTheme = currentTheme === "dark" ? "light" : "dark";

			document.documentElement.classList.toggle("dark", nextTheme === "dark");
			window.localStorage.setItem("theme", nextTheme);

			return nextTheme;
		});
	}

	return (
		<header className="sticky top-0 z-50 border-white/10 border-b bg-marketplace-bg/55 backdrop-blur-2xl">
			<nav className="mx-auto flex max-w-screen-2xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
				<Link
					to="/"
					className="shrink-0 font-mono text-base font-semibold text-zinc-100 tracking-normal sm:text-lg"
				>
					<span className="text-emerald-400">~/</span>RepoRadar
					<span className="text-marketplace-brown">|</span>
				</Link>

				<div className="ml-auto flex items-center gap-2">
					<div className="mr-4 hidden items-center gap-2 md:flex">
						<NavPill
							href="#search"
							icon={<Search size={16} />}
							label="Search"
						/>
						<NavPill
							href="#how-it-works"
							icon={<Zap size={16} />}
							label="Insights"
						/>
						<NavPill href="#faq" icon={<BookOpen size={16} />} label="Docs" />
						<NavPill
							href="https://github.com"
							icon={<Github size={16} />}
							label="GitHub"
						/>
					</div>

					<button
						type="button"
						onClick={toggleTheme}
						aria-label={
							isDarkMode ? "Switch to light mode" : "Switch to dark mode"
						}
						className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/0.06 text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-all hover:border-emerald-400/40 hover:bg-white/0.1 hover:text-emerald-300"
					>
						{isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
					</button>

					<span className="inline-flex h-10 items-center rounded-full border border-white/10 bg-white/0.06 px-4 font-mono text-xs text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
						EN
					</span>

					<Link
						to="/sign-in"
						className="inline-flex h-10 items-center rounded-full border border-marketplace-brown/25 bg-marketplace-brown/10 px-4 text-sm font-medium text-marketplace-brown-soft shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-all hover:border-marketplace-brown/60 hover:bg-marketplace-brown/15 hover:shadow-[0_0_24px_color-mix(in_srgb,var(--color-marketplace-brown)_14%,transparent),inset_0_1px_0_rgba(255,255,255,0.12)]"
					>
						Sign in
					</Link>
				</div>
			</nav>
		</header>
	);
}

function NavPill({
	href,
	icon,
	label,
}: {
	href: string;
	icon: React.ReactNode;
	label: string;
}) {
	return (
		<a
			href={href}
			className="group inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/0.06 px-4 text-sm font-medium text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-all hover:border-emerald-400/40 hover:bg-white/0.1 hover:text-zinc-50 hover:shadow-[0_0_24px_rgba(16,185,129,0.12),inset_0_1px_0_rgba(255,255,255,0.12)]"
		>
			<span className="text-zinc-400 transition-colors group-hover:text-emerald-300">
				{icon}
			</span>
			{label}
		</a>
	);
}
