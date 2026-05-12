export function formatAdminDate(value: string) {
	return new Intl.DateTimeFormat("en", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));
}

export function formatAdminNumber(value: number) {
	return new Intl.NumberFormat("en").format(value);
}

export function formatShowingRange({
	page,
	pageSize,
	total,
	count,
}: {
	page: number;
	pageSize: number;
	total: number;
	count: number;
}) {
	if (total === 0 || count === 0) {
		return "Showing 0 of 0";
	}

	const start = (page - 1) * pageSize + 1;
	const end = Math.min(start + count - 1, total);

	return `Showing ${formatAdminNumber(start)}-${formatAdminNumber(end)} of ${formatAdminNumber(total)}`;
}
