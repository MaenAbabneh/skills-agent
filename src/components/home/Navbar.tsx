import { LogIn, Moon, Sparkles, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const getStoredTheme = (): Theme => {
	return window.localStorage.getItem("theme") === "dark" ? "dark" : "light";
};

const applyTheme = (theme: Theme) => {
	document.documentElement.classList.toggle("dark", theme === "dark");
	window.localStorage.setItem("theme", theme);
};

const Navbar = () => {
	const [theme, setTheme] = useState<Theme>("light");
	const isDarkMode = theme === "dark";

	useEffect(() => {
		const storedTheme = getStoredTheme();

		setTheme(storedTheme);
		applyTheme(storedTheme);
	}, []);

	const toggleTheme = () => {
		setTheme((currentTheme) => {
			const nextTheme = currentTheme === "dark" ? "light" : "dark";

			applyTheme(nextTheme);
			return nextTheme;
		});
	};

	return (
		<nav className="mb-8 border-b border-gray-200 bg-white/80 py-4 backdrop-blur dark:border-gray-800 dark:bg-black/80">
			<div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 md:flex-row md:items-center md:justify-between md:px-8">
				<div className="flex items-center justify-between gap-4">
					<a
						href="/"
						className="inline-flex items-center gap-2 text-base font-semibold text-gray-950 dark:text-white"
					>
						<span className="flex h-9 w-9 items-center justify-center border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-400">
							<Sparkles size={18} />
						</span>
						<span>Skills Agent</span>
					</a>
				</div>

				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:justify-end">
					<div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
						<a
							href="/"
							className="px-3 py-2 font-medium text-gray-950 transition-colors hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
						>
							Home
						</a>
						<a
							href="#skills"
							className="px-3 py-2 transition-colors hover:text-blue-600 dark:hover:text-blue-400"
						>
							Skills
						</a>
						<a
							href="#about"
							className="px-3 py-2 transition-colors hover:text-blue-600 dark:hover:text-blue-400"
						>
							About
						</a>
					</div>

					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={toggleTheme}
							aria-label={
								isDarkMode ? "Switch to light mode" : "Switch to dark mode"
							}
							className="flex h-10 w-10 items-center justify-center border border-gray-200 bg-white text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-gray-800 dark:bg-black dark:text-gray-300 dark:hover:border-blue-800 dark:hover:text-blue-400"
						>
							{isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
						</button>
						<button
							type="button"
							className="inline-flex h-10 items-center justify-center gap-2 bg-gray-950 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-600 dark:bg-white dark:text-black dark:hover:bg-blue-100"
						>
							<LogIn size={16} />
							<span>Login</span>
						</button>
					</div>
				</div>
			</div>
		</nav>
	);
};

export default Navbar;
