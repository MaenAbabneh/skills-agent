import {
	fetchWithTimeout,
	getGitHubHeaders,
	getRateLimitInfoFromResponse,
} from "./client";

export type FetchRepositoryReadmeResult =
	| {
			ok: true;
			path: string;
			htmlUrl: string;
			rawUrl: string;
			content: string;
			sha: string;
	  }
	| {
			ok: false;
			error: string;
	  };

function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : "Unknown fetch error";
}

function isTimeoutError(error: unknown): boolean {
	if (error instanceof Error) {
		return (
			error.name === "AbortError" ||
			error.message.includes("timeout") ||
			error.message.includes("aborted") ||
			error.message.includes("signal is aborted")
		);
	}
	return false;
}

/**
 * Fetch the README for a GitHub repository using the Contents API.
 *
 * - Uses GET /repos/{owner}/{repo}/readme
 * - Decodes base64-encoded content from the API response
 * - Returns ok=false with error="not_found" for 404
 * - Returns ok=false with error="timeout" for timeouts
 * - Never throws — all errors are captured in the return value
 */
export async function fetchRepositoryReadme({
	owner,
	repo,
	defaultBranch: _defaultBranch,
}: {
	owner: string;
	repo: string;
	defaultBranch: string;
}): Promise<FetchRepositoryReadmeResult> {
	const timeoutMs = Number(process.env.REPO_README_FETCH_TIMEOUT_MS) || 8_000;

	const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`;

	try {
		const res = await fetchWithTimeout(
			url,
			{ headers: getGitHubHeaders() },
			timeoutMs,
		);

		if (res.status === 404) {
			return { ok: false, error: "not_found" };
		}

		if (!res.ok) {
			const rateLimit = getRateLimitInfoFromResponse(res);
			const body = await res.text().catch(() => "");
			return {
				ok: false,
				error: `GitHub API failed with status ${res.status}. Remaining: ${
					rateLimit.remaining ?? "unknown"
				}.${body ? ` ${body}` : ""}`,
			};
		}

		const json = (await res.json()) as {
			path?: string;
			html_url?: string;
			download_url?: string;
			content?: string;
			encoding?: string;
			sha?: string;
		};

		if (!json.path || !json.sha) {
			return { ok: false, error: "Invalid README response from GitHub API" };
		}

		let content = "";

		if (json.encoding === "base64" && json.content) {
			// GitHub API returns content with newlines — strip them before decoding
			const rawBase64 = json.content.replace(/\n/g, "");
			content = Buffer.from(rawBase64, "base64").toString("utf-8");
		} else if (json.download_url) {
			// Fallback: fetch raw content directly
			const rawRes = await fetchWithTimeout(
				json.download_url,
				{ headers: getGitHubHeaders() },
				timeoutMs,
			);
			if (!rawRes.ok) {
				return {
					ok: false,
					error: `Failed to fetch raw README content: ${rawRes.status}`,
				};
			}
			content = await rawRes.text();
		} else if (json.content) {
			content = json.content;
		}

		return {
			ok: true,
			path: json.path,
			htmlUrl: json.html_url ?? `https://github.com/${owner}/${repo}`,
			rawUrl:
				json.download_url ??
				`https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${json.path}`,
			content,
			sha: json.sha,
		};
	} catch (error) {
		if (isTimeoutError(error)) {
			return { ok: false, error: "timeout" };
		}
		return { ok: false, error: getErrorMessage(error) };
	}
}
