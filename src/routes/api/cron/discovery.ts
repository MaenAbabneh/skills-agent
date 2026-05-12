import { createFileRoute } from "@tanstack/react-router";

import { runDiscoveryCron } from "@/server/cron/discovery-cron.service";
import { isSectionId, SECTION_IDS } from "@/server/sections/sections.config";

function jsonResponse(data: unknown, init?: ResponseInit) {
	return new Response(JSON.stringify(data), {
		...init,
		headers: {
			"Content-Type": "application/json",
			...(init?.headers ?? {}),
		},
	});
}

function isAuthorized(request: Request) {
	const cronSecret = process.env.CRON_SECRET;

	const authHeader = request.headers.get("authorization");

	if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
		return true;
	}

	const url = new URL(request.url);
	const secret = url.searchParams.get("secret");

	if (cronSecret && secret === cronSecret) {
		return true;
	}

	const vercelCronHeader = request.headers.get("x-vercel-cron");

	if (process.env.VERCEL === "1" && vercelCronHeader === "1") {
		return true;
	}

	return false;
}

function getCronErrorDetails(error: unknown) {
	if (!(error instanceof Error)) {
		return {
			message: "Unknown error",
			cause: null,
			stack: null,
		};
	}

	const cause = error.cause;

	return {
		message: error.message,
		cause:
			cause && typeof cause === "object"
				? JSON.stringify(cause, null, 2)
				: cause
					? String(cause)
					: null,
		stack: error.stack ?? null,
	};
}

export const Route = createFileRoute("/api/cron/discovery")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				if (!isAuthorized(request)) {
					return jsonResponse(
						{
							ok: false,
							error: "Unauthorized",
						},
						{
							status: 401,
						},
					);
				}

				try {
					const url = new URL(request.url);
					const requestedSection = url.searchParams.get("section");

					if (requestedSection !== null && !isSectionId(requestedSection)) {
						return jsonResponse(
							{
								ok: false,
								error: `Invalid discovery section "${requestedSection}".`,
								allowedSections: SECTION_IDS,
							},
							{
								status: 400,
							},
						);
					}

					const result = await runDiscoveryCron(
						requestedSection ?? "3d-motion",
					);

					return jsonResponse({
						ok: true,
						result,
					});
				} catch (error) {
					const details = getCronErrorDetails(error);

					console.error("Discovery cron failed:", {
						message: details.message,
						cause: details.cause,
						stack: details.stack,
					});

					return jsonResponse(
						{
							ok: false,
							error: details.message,
							cause: details.cause,
						},
						{
							status: 500,
						},
					);
				}
			},
		},
	},
});
