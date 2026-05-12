export function getScoreBadgeVariant(score: number) {
	if (score >= 70) return "default";
	if (score >= 55) return "secondary";

	return "outline";
}

export function getStatusBadgeVariant(status: string) {
	if (status === "approved") return "default";
	if (status === "rejected") return "destructive";
	if (status === "hidden") return "outline";

	return "secondary";
}

export function formatRepoNumber(value: number) {
	return new Intl.NumberFormat("en").format(value);
}

export function hasRepoDemo(homepage: string | null) {
	return Boolean(homepage?.trim());
}
