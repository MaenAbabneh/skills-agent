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
