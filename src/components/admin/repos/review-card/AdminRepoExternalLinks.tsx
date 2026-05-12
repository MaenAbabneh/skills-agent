import { ExternalLink, Github } from "lucide-react";

import { Button } from "#/components/ui/button";

import { hasRepoDemo } from "./admin-repo-review-card.helpers";

type AdminRepoExternalLinksProps = {
	url: string;
	homepage: string | null;
};

export function AdminRepoExternalLinks({
	url,
	homepage,
}: AdminRepoExternalLinksProps) {
	const hasDemo = hasRepoDemo(homepage);

	return (
		<div className="flex flex-wrap gap-2">
			<Button variant="outline" size="sm" asChild>
				<a href={url} target="_blank" rel="noreferrer">
					<Github className="mr-2 h-4 w-4" />
					GitHub
				</a>
			</Button>

			{hasDemo && (
				<Button variant="outline" size="sm" asChild>
					<a href={homepage ?? "#"} target="_blank" rel="noreferrer">
						<ExternalLink className="mr-2 h-4 w-4" />
						Demo
					</a>
				</Button>
			)}
		</div>
	);
}
