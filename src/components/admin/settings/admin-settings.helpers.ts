export function parseNumberList(value: string): number[] {
	return value
		.split(",")
		.map((item) => Number(item.trim()))
		.filter((item) => Number.isFinite(item) && item > 0);
}

export function stringifyNumberList(value: number[]) {
	return value.join(", ");
}

export function parseStarRanges(value: string) {
	return value
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean)
		.map((item) => {
			const [rawMin, rawMax] = item.split("-").map((part) => part.trim());

			const min = Number(rawMin);
			const max = rawMax ? Number(rawMax) : undefined;

			if (!Number.isFinite(min) || min < 0) {
				return null;
			}

			if (max !== undefined && (!Number.isFinite(max) || max <= min)) {
				return null;
			}

			return max === undefined ? { min } : { min, max };
		})
		.filter((item): item is { min: number; max?: number } => item !== null);
}

export function stringifyStarRanges(
	value: Array<{
		min: number;
		max?: number;
	}>,
) {
	return value
		.map((range) =>
			range.max === undefined ? String(range.min) : `${range.min}-${range.max}`,
		)
		.join(", ");
}
