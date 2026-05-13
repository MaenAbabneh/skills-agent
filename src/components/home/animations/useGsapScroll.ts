import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type RefObject, useRef } from "react";

gsap.registerPlugin(useGSAP);

function hasReducedMotion() {
	if (typeof window === "undefined") {
		return true;
	}

	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function canAnimate() {
	return typeof window !== "undefined" && !hasReducedMotion();
}

function registerScrollTrigger() {
	if (typeof window === "undefined") {
		return false;
	}

	gsap.registerPlugin(ScrollTrigger);
	return true;
}

export function useHomeRevealAnimations(
	scopeRef: RefObject<HTMLElement | null>,
) {
	useGSAP(
		() => {
			if (!canAnimate() || !registerScrollTrigger()) {
				return;
			}

			if (!scopeRef.current) {
				return;
			}

			gsap.set(".home-card-reveal", { autoAlpha: 0, y: 18 });

			const revealItems = gsap.utils.toArray<HTMLElement>(".home-reveal");

			for (const item of revealItems) {
				gsap.fromTo(
					item,
					{ autoAlpha: 0, y: 18 },
					{
						autoAlpha: 1,
						duration: 0.45,
						ease: "power2.out",
						y: 0,
						scrollTrigger: {
							once: true,
							start: "top 88%",
							trigger: item,
						},
					},
				);
			}

			ScrollTrigger.batch(".home-card-reveal", {
				once: true,
				onEnter: (batch) => {
					gsap.fromTo(
						batch,
						{ autoAlpha: 0, y: 18 },
						{
							autoAlpha: 1,
							duration: 0.45,
							ease: "power2.out",
							stagger: 0.06,
							y: 0,
						},
					);
				},
				start: "top 90%",
			});
		},
		{ scope: scopeRef },
	);
}

export function useStickySearchEnhancement(
	sectionRef: RefObject<HTMLElement | null>,
	searchRef: RefObject<HTMLElement | null>,
) {
	useGSAP(
		() => {
			if (!canAnimate() || !registerScrollTrigger()) {
				return;
			}

			const section = sectionRef.current;
			const search = searchRef.current;

			if (!section || !search) {
				return;
			}

			const setActive = (isActive: boolean) => {
				search.classList.toggle("is-active", isActive);
				gsap.to(search, {
					autoAlpha: isActive ? 0.98 : 1,
					duration: 0.18,
					ease: "power2.out",
					overwrite: true,
					y: isActive ? -2 : 0,
				});
			};

			ScrollTrigger.create({
				end: "bottom top+=220",
				onEnter: () => setActive(true),
				onEnterBack: () => setActive(true),
				onLeave: () => setActive(false),
				onLeaveBack: () => setActive(false),
				start: "top top+=120",
				trigger: section,
			});

			return () => {
				search.classList.remove("is-active");
				gsap.killTweensOf(search);
			};
		},
		{ scope: sectionRef },
	);
}

export function useFaqAnswerAnimation(
	answerRef: RefObject<HTMLElement | null>,
	isOpen: boolean,
) {
	const didMountRef = useRef(false);

	useGSAP(
		() => {
			const answer = answerRef.current;

			if (!answer) {
				return;
			}

			if (!canAnimate()) {
				answer.style.height = isOpen ? "auto" : "0px";
				answer.style.opacity = isOpen ? "1" : "0";
				answer.style.transform = "translateY(0px)";
				return;
			}

			gsap.killTweensOf(answer);

			if (!didMountRef.current) {
				gsap.set(answer, {
					autoAlpha: isOpen ? 1 : 0,
					height: isOpen ? "auto" : 0,
					y: 0,
				});
				didMountRef.current = true;
				return;
			}

			if (isOpen) {
				gsap.fromTo(
					answer,
					{ autoAlpha: 0, height: 0, y: -4 },
					{
						autoAlpha: 1,
						duration: 0.3,
						ease: "power2.out",
						height: "auto",
						overwrite: true,
						y: 0,
					},
				);
				return;
			}

			gsap.to(answer, {
				autoAlpha: 0,
				duration: 0.2,
				ease: "power2.inOut",
				height: 0,
				overwrite: true,
				y: -2,
			});

			return () => {
				gsap.killTweensOf(answer);
			};
		},
		{ dependencies: [isOpen], scope: answerRef },
	);
}
