import { createServerFn } from "@tanstack/react-start";

import { getGitHubRateLimitStatus } from "@/server/github/rate-limit";

function serializeBucket(
	bucket: Awaited<ReturnType<typeof getGitHubRateLimitStatus>>["search"],
) {
	if (!bucket) {
		return null;
	}

	return {
		limit: bucket.limit,
		used: bucket.used,
		remaining: bucket.remaining,
		resetAt: bucket.resetAt,
		retryAfterSeconds: bucket.retryAfterSeconds,
	};
}

export const getAdminGitHubRateLimit = createServerFn({
	method: "GET",
}).handler(async () => {
	const status = await getGitHubRateLimitStatus();

	return {
		search: serializeBucket(status.search),
		core: serializeBucket(status.core),
	};
});
