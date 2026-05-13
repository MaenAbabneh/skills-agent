import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({
	textToCopy,
	ariaLabel,
}: {
	textToCopy: string;
	ariaLabel?: string;
}) {
	const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

	const handleCopy = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		try {
			if (navigator?.clipboard?.writeText) {
				await navigator.clipboard.writeText(textToCopy);
				setCopyState("copied");
				setTimeout(() => setCopyState("idle"), 1200);
			} else {
				// Fallback
				const textArea = document.createElement("textarea");
				textArea.value = textToCopy;
				textArea.style.position = "fixed";
				textArea.style.opacity = "0";
				document.body.appendChild(textArea);
				textArea.focus();
				textArea.select();
				document.execCommand("copy");
				document.body.removeChild(textArea);
				setCopyState("copied");
				setTimeout(() => setCopyState("idle"), 1200);
			}
		} catch (err) {
			console.error("Failed to copy", err);
		}
	};

	return (
		<button
			type="button"
			onClick={handleCopy}
			className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded border border-zinc-700 bg-zinc-950 px-2 text-[11px] text-zinc-300 transition-colors hover:border-emerald-400/50 hover:text-emerald-200"
			aria-label={ariaLabel || "Copy to clipboard"}
		>
			{copyState === "copied" ? <Check size={12} /> : <Copy size={12} />}
			<span>{copyState === "copied" ? "Copied" : "Copy"}</span>
		</button>
	);
}
