import { Badge } from "#/components/ui/badge";

type AdminRepoTopicsProps = {
	topics: string[];
	maxVisible?: number;
};

export function AdminRepoTopics({
	topics,
	maxVisible = 8,
}: AdminRepoTopicsProps) {
	if (topics.length === 0) {
		return null;
	}

	const visibleTopics = topics.slice(0, maxVisible);
	const hiddenCount = Math.max(0, topics.length - maxVisible);

	return (
		<div className="flex max-h-20 flex-wrap gap-2 overflow-hidden">
			{visibleTopics.map((topic) => (
				<Badge key={topic} variant="outline">
					{topic}
				</Badge>
			))}

			{hiddenCount > 0 && <Badge variant="outline">+{hiddenCount}</Badge>}
		</div>
	);
}
