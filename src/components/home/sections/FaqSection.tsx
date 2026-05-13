import { useId, useRef, useState } from "react";
import { useFaqAnswerAnimation } from "../animations/useGsapScroll";
import { faqItems } from "../data/home.constants";

import { HomeSectionFrame } from "../section-shell/HomeSectionFrame";
import { HomeButton } from "../ui/HomeButton";

export function FaqSection() {
	return (
		<section
			id="faq"
			className="home-reveal mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8"
		>
			<div className="mx-auto mb-12 max-w-4xl">
				<HomeSectionFrame
					title="Frequently Asked Questions"
					fileLabel="FAQ.md"
					statusLabel={`${faqItems.length} questions`}
					showStatusDot={false}
					titlePrefix="#"
					titlePrefixColor="text-white"
					alignTitle="left"
				>
					<div className="mt-4 border-marketplace-brown/50 border-l-2 bg-marketplace-brown/10 px-4 py-3">
						<p className="text-base leading-6 text-zinc-400">
							Your guide to agent skills for Claude Code, OpenAI Codex, and AI
							coding tools — discover, install, and create custom skills in 2026
						</p>
					</div>
				</HomeSectionFrame>
			</div>
			<FaqTerminal />
			<div className="mt-8 flex justify-center">
				<HomeButton
					href="https://docs.anthropic.com/en/docs/claude-code/skills"
					variant="docs"
					external
				>
					Read Official Skills Documentation
				</HomeButton>
			</div>
		</section>
	);
}
// TODO: link to /doc when the public FAQ page is implemented.

function FaqTerminal() {
	const [openIndex, setOpenIndex] = useState<number | null>(0);

	function toggleQuestion(index: number) {
		setOpenIndex((currentIndex) => (currentIndex === index ? null : index));
	}

	return (
		<div className="home-card-reveal mx-auto max-w-3xl space-y-3">
			{faqItems.map((item, index) => {
				const isOpen = openIndex === index;
				const number = String(index + 1).padStart(2, "0");

				return (
					<FaqItem
						key={item.question}
						answer={item.answer}
						isOpen={isOpen}
						number={number}
						onToggle={() => toggleQuestion(index)}
						question={item.question}
					/>
				);
			})}
		</div>
	);
}

function FaqItem({
	answer,
	isOpen,
	number,
	onToggle,
	question,
}: {
	answer: string;
	isOpen: boolean;
	number: string;
	onToggle: () => void;
	question: string;
}) {
	const answerRef = useRef<HTMLElement>(null);
	const reactId = useId();
	const answerId = `faq-answer-${reactId}`;
	const buttonId = `faq-button-${reactId}`;
	const initialAnswerStyle = useRef({
		height: isOpen ? "auto" : 0,
		opacity: isOpen ? 1 : 0,
	}).current;

	useFaqAnswerAnimation(answerRef, isOpen);

	return (
		<div
			className={`rounded-xl border transition-all ${
				isOpen
					? "border-marketplace-brown/50 bg-zinc-950 shadow-[0_0_24px_color-mix(in_srgb,var(--color-marketplace-brown)_10%,transparent)]"
					: "border-zinc-800 bg-black/20"
			}`}
		>
			<button
				id={buttonId}
				type="button"
				onClick={onToggle}
				aria-controls={answerId}
				aria-expanded={isOpen}
				className="flex w-full items-center gap-3 px-3 py-4 text-left"
			>
				<span className="font-mono text-sm text-zinc-600">{number}</span>
				<span className="font-mono text-base text-blue-400">Q:</span>
				<span className="min-w-0 flex-1 text-lg font-medium text-zinc-300">
					{question}
				</span>
				<span className="shrink-0 font-mono text-xs text-zinc-500">
					{isOpen ? "[-] ^" : "[+] v"}
				</span>
			</button>
			<section
				id={answerId}
				ref={answerRef}
				aria-labelledby={buttonId}
				className="overflow-hidden px-4"
				style={initialAnswerStyle}
			>
				<div className="pb-4">
					<div className="bg-emerald-500/10 border-emerald-400 border-l bg-emerald-400/0.06 px-4 py-3">
						<div className="font-mono text-sm leading-6 text-zinc-500">
							<span className="text-emerald-500 text-xl">/**</span>
							<div className="flex">
								<span className="mr-2 text-emerald-500 text-xl">{"*"}</span>
								<span className="font-sans text-zinc-300">{answer}</span>
							</div>
							<span className="text-emerald-500 text-xl">{"*/"}</span>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
