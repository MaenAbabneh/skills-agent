import { Link } from "@tanstack/react-router";
import { Activity, Github } from "lucide-react";
import { AdminPageHeader } from "#/components/admin/common";
import { Button } from "#/components/ui/button";
import { getAdminReposDefaultSearch } from "#/constants/admin/navigation";
import type { SectionId } from "#/lib/sections";

type AdminDiscoveryHeaderProps = {
	section: SectionId;
};

export function AdminDiscoveryHeader({ section }: AdminDiscoveryHeaderProps) {
	return (
		<AdminPageHeader
			title="Discovery"
			description="Run repository discovery and sync jobs for sections. Discovery uses the GitHub search budget and saves all new repositories as pending."
			actions={
				<>
					<Button asChild variant="outline">
						<Link
							to="/admin/sync-logs"
							search={{
								section,
							}}
						>
							<Activity className="mr-2 h-4 w-4" />
							View Logs
						</Link>
					</Button>

					<Button asChild>
						<Link
							to="/admin/repos"
							search={getAdminReposDefaultSearch(section)}
						>
							<Github className="mr-2 h-4 w-4" />
							Review Repos
						</Link>
					</Button>
				</>
			}
		/>
	);
}
