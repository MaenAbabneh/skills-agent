import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HomeButtonVariant = "primary" | "outline" | "docs";

const variantClasses: Record<HomeButtonVariant, string> = {
	primary:
		"border-marketplace-brown bg-marketplace-brown text-zinc-950 hover:bg-marketplace-brown-soft hover:shadow-[0_0_24px_rgba(217,145,120,0.22)]",
	outline:
		"border-marketplace-brown/50 bg-marketplace-brown/10 text-marketplace-brown hover:border-marketplace-brown hover:bg-marketplace-brown/15",
	docs: "border-marketplace-brown bg-transparent text-white hover:bg-marketplace-brown/10 hover:shadow-[0_0_24px_rgba(217,145,120,0.16)]",
};

const arrowClasses: Record<HomeButtonVariant, string> = {
	primary: "text-zinc-950",
	outline: "text-marketplace-brown",
	docs: "text-marketplace-brown",
};

export function HomeButton({
	children,
	className,
	external = false,
	href,
	variant = "primary",
}: {
	children: ReactNode;
	className?: string;
	external?: boolean;
	href: string;
	variant?: HomeButtonVariant;
}) {
	return (
		<a
			href={href}
			target={external ? "_blank" : undefined}
			rel={external ? "noreferrer" : undefined}
			className={cn(
				"inline-flex items-center gap-2 rounded-full border px-6 py-4 text-base font-semibold transition-all",
				variantClasses[variant],
				className,
			)}
		>
			{children}
			<ArrowRight className={arrowClasses[variant]} size={16} />
		</a>
	);
}
