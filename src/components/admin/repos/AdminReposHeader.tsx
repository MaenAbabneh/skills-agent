import { Link } from "@tanstack/react-router";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { AdminPageHeader } from "#/components/admin/common";
import { Button } from "#/components/ui/button";
import { SECTION_CONFIGS } from "#/lib/sections";
import { buildSearchParams } from "./admin-repos.helpers";
import type { AdminReposSearch } from "./admin-repos.schema";

type AdminReposHeaderProps = {
	search: AdminReposSearch;
};

export function AdminReposHeader({ search }: AdminReposHeaderProps) {
	const sectionLabel = SECTION_CONFIGS[search.section].label;

	const reviewAcceptedSearch = buildSearchParams(search, {
		status: "pending",
		algorithm: "accepted",
		query: "",
		page: 1,
	});
	const needsReviewSearch = buildSearchParams(search, {
		status: "pending",
		algorithm: "rejected",
		query: "",
		page: 1,
	});
	return (
		<>
			<AdminPageHeader
				title="Repos Review"
				description={`Review discovered repositories for ${sectionLabel}, approve high-quality projects, and hide irrelevant results.`}
				actions={
					<>
						<Button asChild>
							<Link to="/admin/repos" search={reviewAcceptedSearch}>
								<CheckCircle2 className="mr-2 h-4 w-4" />
								Review Accepted
							</Link>
						</Button>

						<Button variant="outline" asChild>
							<Link to="/admin/repos" search={needsReviewSearch}>
								<ShieldAlert className="mr-2 h-4 w-4" />
								Needs Review
							</Link>
						</Button>
					</>
				}
			/>

			<div className="text-sm font-medium text-muted-foreground">
				Reviewing: {sectionLabel}
			</div>
		</>
	);
}
