import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useState } from "react";
import { Toaster } from "#/components/ui/sonner";
import { TooltipProvider } from "#/components/ui/tooltip";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "RepoRadar",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
	errorComponent: ({ error }) => (
		<div className="flex min-h-screen items-center justify-center bg-background px-4">
			<div className="w-full max-w-3xl rounded-lg border border-border bg-card p-6 shadow-lg">
				<h1 className="text-xl font-semibold">Application Error</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					An unexpected error occurred while loading this route.
				</p>
				<pre className="mt-4 overflow-x-auto rounded-md bg-muted p-4 font-mono text-xs text-foreground">
					{process.env.NODE_ENV === "production"
						? "An unexpected error occurred."
						: error instanceof Error
							? error.message
							: String(error)}
				</pre>
				<div className="mt-4">
					<a
						href="/"
						className="inline-flex rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
					>
						Go Home
					</a>
				</div>
			</div>
		</div>
	),
	notFoundComponent: () => (
		<div className="flex items-center justify-center min-h-screen">
			<div className="text-center">
				<h1 className="text-4xl font-bold">404</h1>
				<p className="mt-2 text-muted-foreground">Page not found</p>
			</div>
		</div>
	),
});

function RootDocument({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 1000 * 60 * 5,
						retry: false,
						refetchOnWindowFocus: false,
					},
				},
			}),
	);

	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>

			<body>
				<QueryClientProvider client={queryClient}>
					<TooltipProvider>
						{children}
						<Toaster
							position="bottom-right"
							toastOptions={{
								duration: 5000,
								style: {
									borderRadius: "8px",
									background: "#333",
									color: "#fff",
								},
							}}
						/>
					</TooltipProvider>
				</QueryClientProvider>

				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>

				<Scripts />
			</body>
		</html>
	);
}
