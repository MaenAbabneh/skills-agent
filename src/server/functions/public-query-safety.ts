type FallbackFactory<T> = () => T;

function getErrorMessage(error: unknown) {
	if (error instanceof Error) {
		return error.message;
	}

	return String(error ?? "");
}

function isMissingSchemaError(error: unknown) {
	const message = getErrorMessage(error).toLowerCase();

	return (
		message.includes("does not exist") ||
		message.includes("relation") ||
		message.includes("column") ||
		message.includes("schema")
	);
}

/**
 * Development safety wrapper for public pages during local/schema reset workflows.
 *
 * In production we always rethrow to avoid hiding real failures.
 */
export async function withSafePublicQuery<T>(
	label: string,
	queryFn: () => Promise<T>,
	fallbackFactory: FallbackFactory<T>,
): Promise<T> {
	try {
		return await queryFn();
	} catch (error) {
		if (process.env.NODE_ENV !== "production" && isMissingSchemaError(error)) {
			console.warn(
				`[public-query-safety] ${label} failed; returning fallback in non-production mode.`,
				error,
			);
			return fallbackFactory();
		}

		throw error;
	}
}
