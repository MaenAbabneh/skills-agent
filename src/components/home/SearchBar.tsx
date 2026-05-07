import { useEffect, useState } from "react";
import { Search } from "lucide-react";

export interface SearchBarProps {
	value: string;
	onChange: (value: string) => void;
}

const SearchBar = ({ value, onChange }: SearchBarProps) => {
	const [localValue, setLocalValue] = useState(value);

	useEffect(() => {
		setLocalValue(value);
	}, [value]);

	useEffect(() => {
		const handler = setTimeout(() => {
			onChange(localValue);
		}, 300);
		return () => {
			clearTimeout(handler);
		};
	}, [localValue, onChange]);
	
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key === "k") {
				event.preventDefault();
				const input = document.querySelector<HTMLInputElement>(
					'input[type="search"]',
				);
				input?.focus();
			}
		}
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		}
	}, []);

	return (
		<div className="relative flex-1">
			<Search
				size={18}
				className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
			/>
			<input
				type="search"
				value={localValue}
				onChange={(event) => setLocalValue(event.target.value)}
				aria-label="Search skills"
				placeholder="Search by skill, tag, or author"
				className="h-11 w-full border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 dark:border-gray-800 dark:bg-black dark:text-white"
			/>
		</div>
	);
};

export default SearchBar;
