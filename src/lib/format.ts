export function formatNumber(value: number) {
	return new Intl.NumberFormat("en", {
		notation: value >= 1000 ? "compact" : "standard",
		maximumFractionDigits: 1,
	}).format(value);
}

export function formatDate(value?: string | null) {
	if (!value) return "recent";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "recent";

	return date.toISOString().slice(0, 10);
}
