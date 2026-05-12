export type GitHubRateLimitResource = "core" | "search" | "unknown";

export type GitHubRateLimitInfo = {
	resource: GitHubRateLimitResource;
	limit: number | null;
	remaining: number | null;
	used: number | null;
	resetAt: string | null;
	retryAfterSeconds: number | null;
};

function parseNumberHeader(value: string | null) {
	if (!value) return null;

	const parsed = Number(value);

	return Number.isFinite(parsed) ? parsed : null;
}

function parseResetAt(resetHeader: string | null) {
	const resetSeconds = parseNumberHeader(resetHeader);

	if (resetSeconds === null) {
		return {
			resetAt: null,
			retryAfterSeconds: null,
		};
	}

	const resetMs = resetSeconds * 1000;
	const nowMs = Date.now();

	return {
		resetAt: new Date(resetMs).toISOString(),
		retryAfterSeconds: Math.max(0, Math.ceil((resetMs - nowMs) / 1000)),
	};
}

export function getRateLimitInfoFromResponse(
	res: Response,
): GitHubRateLimitInfo {
	const limit = parseNumberHeader(res.headers.get("x-ratelimit-limit"));
	const remaining = parseNumberHeader(res.headers.get("x-ratelimit-remaining"));
	const used = parseNumberHeader(res.headers.get("x-ratelimit-used"));
	const resource =
		(res.headers.get(
			"x-ratelimit-resource",
		) as GitHubRateLimitResource | null) ?? "unknown";

	const { resetAt, retryAfterSeconds } = parseResetAt(
		res.headers.get("x-ratelimit-reset"),
	);

	return {
		resource,
		limit,
		remaining,
		used,
		resetAt,
		retryAfterSeconds,
	};
}

export class GitHubRateLimitError extends Error {
	readonly name = "GitHubRateLimitError";

	readonly status: number;
	readonly resource: GitHubRateLimitResource;
	readonly limit: number | null;
	readonly remaining: number | null;
	readonly used: number | null;
	readonly resetAt: string | null;
	readonly retryAfterSeconds: number | null;

	constructor({
		status,
		rateLimit,
		body,
	}: {
		status: number;
		rateLimit: GitHubRateLimitInfo;
		body?: string;
	}) {
		const resetMessage = rateLimit.resetAt
			? ` Try again after ${rateLimit.resetAt}.`
			: "";

		const resourceLabel =
			rateLimit.resource === "unknown"
				? "GitHub"
				: `GitHub ${rateLimit.resource}`;

		super(
			`${resourceLabel} rate limit reached. Remaining: ${
				rateLimit.remaining ?? "unknown"
			}.${resetMessage}${body ? ` ${body}` : ""}`,
		);

		this.status = status;
		this.resource = rateLimit.resource;
		this.limit = rateLimit.limit;
		this.remaining = rateLimit.remaining;
		this.used = rateLimit.used;
		this.resetAt = rateLimit.resetAt;
		this.retryAfterSeconds = rateLimit.retryAfterSeconds;
	}
}

export class GitHubApiError extends Error {
	readonly name = "GitHubApiError";

	readonly status: number;
	readonly rateLimit: GitHubRateLimitInfo;

	constructor({
		status,
		rateLimit,
		body,
	}: {
		status: number;
		rateLimit: GitHubRateLimitInfo;
		body?: string;
	}) {
		super(
			`GitHub API failed with status ${status}. Remaining: ${
				rateLimit.remaining ?? "unknown"
			}. Reset: ${rateLimit.resetAt ?? "unknown"}.${body ? ` ${body}` : ""}`,
		);

		this.status = status;
		this.rateLimit = rateLimit;
	}
}

export function isGitHubRateLimitError(
	error: unknown,
): error is GitHubRateLimitError {
	return error instanceof GitHubRateLimitError;
}

export async function fetchWithTimeout(
	url: string,
	options: RequestInit = {},
	timeoutMs = 10_000,
) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

	try {
		return await fetch(url, {
			...options,
			signal: controller.signal,
		});
	} finally {
		clearTimeout(timeoutId);
	}
}

export function getGitHubHeaders() {
	const token = process.env.GITHUB_TOKEN;

	if (!token) {
		throw new Error("GitHub token is missing from environment variables.");
	}

	return {
		Authorization: `Bearer ${token}`,
		Accept: "application/vnd.github+json",
		"User-Agent": "RepoRadar-App",
		"X-GitHub-Api-Version": "2022-11-28",
	};
}

export function shouldRetryStatus(status: number) {
	return status === 429 || status >= 500;
}

export function shouldTreatAsRateLimit(res: Response) {
	const rateLimit = getRateLimitInfoFromResponse(res);

	return (
		rateLimit.remaining === 0 ||
		res.status === 429 ||
		(res.status === 403 &&
			rateLimit.remaining !== null &&
			rateLimit.remaining <= 0)
	);
}

export function wait(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
