export type AdminAutoTuneQueryInput = {
	id: string;
	query: string;
	enabled: boolean;
	priority: number;
	totalRuns: number;
	totalNew: number;
	totalAccepted: number;
	totalRejected: number;
};

export type AdminAutoTuneRunContext = {
	totalNew: number;
	totalCandidates: number;
	totalExistingInSection: number;
	preventBoosts?: boolean;
};

export type AdminAutoTuneRecentStats = {
	recentRuns: number;
	recentNew: number;
	recentAccepted: number;
	recentRejected: number;
	recentCandidates: number;
	recentAcceptanceRate: number;
	recentNewRate: number;
};

export type AdminAutoTuneDecision = {
	id: string;
	query: string;
	currentPriority: number;
	nextPriority: number;
	reason: string;
	changed: boolean;
};

function clampPriority(value: number) {
	return Math.max(1, Math.min(100, value));
}

function getAcceptanceRate(query: AdminAutoTuneQueryInput) {
	if (query.totalNew <= 0) {
		return 0;
	}

	return query.totalAccepted / query.totalNew;
}

function calculateRecentStatsDecision({
	query,
	recentStats,
}: {
	query: AdminAutoTuneQueryInput;
	recentStats: AdminAutoTuneRecentStats;
}) {
	let nextPriority = query.priority;
	let reason = "No change.";

	if (recentStats.recentRuns >= 5 && recentStats.recentNew === 0) {
		nextPriority -= 2;
		reason = "No new repositories in the latest query runs.";
	} else if (
		recentStats.recentRuns >= 3 &&
		(recentStats.recentNew === 0 || recentStats.recentNewRate < 0.02)
	) {
		nextPriority -= 1;
		reason = "Weak recent new repository rate.";
	} else if (
		recentStats.recentRuns >= 2 &&
		recentStats.recentNewRate >= 0.05 &&
		recentStats.recentAcceptanceRate >= 0.6
	) {
		nextPriority += 1;
		reason = "Strong recent query performance.";
	}

	return {
		nextPriority,
		reason,
	};
}

export function calculateAdminAutoTuneDecision(
	query: AdminAutoTuneQueryInput,
	context?: AdminAutoTuneRunContext,
	recentStats?: AdminAutoTuneRecentStats,
): AdminAutoTuneDecision {
	if (!query.enabled) {
		return {
			id: query.id,
			query: query.query,
			currentPriority: query.priority,
			nextPriority: query.priority,
			reason: "Query is disabled.",
			changed: false,
		};
	}

	if (recentStats && recentStats.recentRuns > 0) {
		const decision = calculateRecentStatsDecision({
			query,
			recentStats,
		});
		const nextPriority = clampPriority(decision.nextPriority);

		if (context?.preventBoosts && nextPriority > query.priority) {
			return {
				id: query.id,
				query: query.query,
				currentPriority: query.priority,
				nextPriority: query.priority,
				reason: "Boost prevented because latest run is saturated.",
				changed: false,
			};
		}

		return {
			id: query.id,
			query: query.query,
			currentPriority: query.priority,
			nextPriority,
			reason: decision.reason,
			changed: nextPriority !== query.priority,
		};
	}

	if (query.totalRuns < 2) {
		return {
			id: query.id,
			query: query.query,
			currentPriority: query.priority,
			nextPriority: query.priority,
			reason: "Not enough runs yet.",
			changed: false,
		};
	}

	const acceptanceRate = getAcceptanceRate(query);

	let nextPriority = query.priority;
	let reason = "No change.";

	if (query.totalNew === 0 && query.totalRuns >= 3) {
		nextPriority -= 2;
		reason = "No new repositories after multiple runs.";
	} else if (query.totalNew > 0 && acceptanceRate >= 0.7) {
		nextPriority += 1;
		reason = "Strong acceptance rate.";
	} else if (query.totalNew > 0 && acceptanceRate < 0.35) {
		nextPriority -= 1;
		reason = "Weak acceptance rate.";
	}

	nextPriority = clampPriority(nextPriority);

	if (context?.preventBoosts && nextPriority > query.priority) {
		return {
			id: query.id,
			query: query.query,
			currentPriority: query.priority,
			nextPriority: query.priority,
			reason: "Boost prevented because latest run is saturated.",
			changed: false,
		};
	}

	return {
		id: query.id,
		query: query.query,
		currentPriority: query.priority,
		nextPriority,
		reason,
		changed: nextPriority !== query.priority,
	};
}
