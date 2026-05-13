import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

type MarkdownContentProps = {
	content: string;
	baseRawUrl?: string;
	baseUrl?: string;
	className?: string;
};

function isAbsoluteUrl(value: string) {
	return /^(https?:)?\/\//i.test(value) || value.startsWith("data:");
}

function ensureTrailingSlash(value: string) {
	return value.endsWith("/") ? value : `${value}/`;
}

function resolveMarkdownUrl(value: string | undefined, baseRawUrl?: string) {
	if (!value) {
		return "";
	}

	if (isAbsoluteUrl(value) || value.startsWith("#")) {
		return value;
	}

	if (!baseRawUrl) {
		// TODO: callers for detail pages should pass a baseRawUrl that points at
		// the markdown file folder so relative assets can resolve correctly.
		return value;
	}

	try {
		return new URL(value, ensureTrailingSlash(baseRawUrl)).toString();
	} catch {
		return value;
	}
}

function isDirectVideoUrl(value: string) {
	return /\.(mp4|webm|mov)(?:[?#].*)?$/i.test(value);
}

function isHostedVideoUrl(value: string) {
	return /(?:youtube\.com|youtu\.be|vimeo\.com)/i.test(value);
}

export function MarkdownContent({
	baseRawUrl,
	baseUrl,
	className,
	content,
}: MarkdownContentProps) {
	const assetBaseUrl = baseRawUrl ?? baseUrl;

	return (
		<div
			className={cn(
				"markdown-content max-w-none text-zinc-300",
				"[&_a]:text-emerald-300 [&_a]:underline [&_a]:underline-offset-4",
				"[&_blockquote]:border-emerald-400 [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:text-zinc-400",
				"[&_code]:rounded [&_code]:border [&_code]:border-zinc-800 [&_code]:bg-black/40 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-marketplace-brown-soft",
				"[&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:text-zinc-50",
				"[&_h2]:mt-7 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-zinc-50",
				"[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-zinc-100",
				"[&_hr]:my-6 [&_hr]:border-zinc-800",
				"[&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-zinc-800",
				"[&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6",
				"[&_p]:my-4 [&_p]:leading-7",
				"[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-zinc-800 [&_pre]:bg-black/50 [&_pre]:p-4",
				"[&_pre_code]:border-0 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
				"[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-zinc-800 [&_td]:p-2 [&_th]:border [&_th]:border-zinc-800 [&_th]:bg-zinc-900 [&_th]:p-2 [&_th]:text-left",
				"[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6",
				className,
			)}
		>
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				rehypePlugins={[rehypeSanitize]}
				components={{
					a({ children, href, ...props }) {
						const resolvedHref = resolveMarkdownUrl(href, assetBaseUrl);

						if (isDirectVideoUrl(resolvedHref)) {
							return (
								<video
									className="my-4 max-w-full rounded-lg border border-zinc-800"
									controls
									preload="metadata"
									src={resolvedHref}
								>
									<track kind="captions" />
									<a href={resolvedHref} rel="noreferrer" target="_blank">
										{children}
									</a>
								</video>
							);
						}

						return (
							<a
								{...props}
								className={cn(
									isHostedVideoUrl(resolvedHref) &&
										"inline-flex rounded border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 no-underline",
								)}
								href={resolvedHref}
								rel="noreferrer"
								target="_blank"
							>
								{children}
							</a>
						);
					},
					img({ alt, src, ...props }) {
						return (
							<img
								{...props}
								alt={alt ?? ""}
								loading="lazy"
								src={resolveMarkdownUrl(src, assetBaseUrl)}
							/>
						);
					},
				}}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
