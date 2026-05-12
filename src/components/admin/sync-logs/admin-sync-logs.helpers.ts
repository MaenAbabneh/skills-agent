export function parseSyncLogWarning(error: string | null) {
	if (!error) {
		return null;
	}

	try {
		const parsed = JSON.parse(error);

		if (parsed.rateLimitHit) {
			return "Rate limit warning";
		}

		if (Array.isArray(parsed.failedRepos) && parsed.failedRepos.length > 0) {
			return `${parsed.failedRepos.length} failed repo(s)`;
		}

		if (
			Array.isArray(parsed.partialErrors) &&
			parsed.partialErrors.length > 0
		) {
			return `${parsed.partialErrors.length} partial error(s)`;
		}

		return "Warnings";
	} catch {
		return error.slice(0, 120);
	}
}

export function formatSyncLogError(error: string | null) {
	if (!error) {
		return "No error details were recorded.";
	}

	try {
		return JSON.stringify(JSON.parse(error), null, 2);
	} catch {
		return error;
	}
}
