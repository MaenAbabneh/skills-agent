import { Link } from "@tanstack/react-router";
import {
	BookOpen,
	CheckCircle2,
	FileText,
	RefreshCcw,
	ShieldAlert,
} from "lucide-react";
import { AdminPageHeader } from "#/components/admin/common";
import { Button } from "#/components/ui/button";
import { SECTION_CONFIGS } from "#/lib/sections";
import { buildSearchParams } from "./admin-repos.helpers";
import type { AdminReposSearch } from "./admin-repos.schema";
import type { ReadmeEnrichResult } from "./useAdminRepoReadmeEnrichment";

type AdminReposHeaderProps = {
	search: AdminReposSearch;
	isRevalidatingAgentSkills?: boolean;
	onRevalidateAgentSkills?: () => void;
	isEnrichingAgentSkills?: boolean;
	onEnrichAgentSkills?: () => void;
	isRefreshingDerivedMetadata?: boolean;
	onRefreshDerivedMetadata?: () => void;
	// 3d-motion README enrichment
	isEnrichingMissingReadmes?: boolean;
	onEnrichMissingReadmes?: () => void;
	isRefreshingExistingReadmes?: boolean;
	onRefreshExistingReadmes?: () => void;
	readmeEnrichResult?: ReadmeEnrichResult | null;
};

export function AdminReposHeader({
	search,
	isRevalidatingAgentSkills = false,
	onRevalidateAgentSkills,
	isEnrichingAgentSkills = false,
	onEnrichAgentSkills,
	isRefreshingDerivedMetadata = false,
	onRefreshDerivedMetadata,
	isEnrichingMissingReadmes = false,
	onEnrichMissingReadmes,
	isRefreshingExistingReadmes = false,
	onRefreshExistingReadmes,
	readmeEnrichResult,
}: AdminReposHeaderProps) {
	const sectionLabel = SECTION_CONFIGS[search.section].label;
	const canRevalidateAgentSkills =
		search.section === "agent-skills" && onRevalidateAgentSkills;
	const canEnrichAgentSkills =
		search.section === "agent-skills" && onEnrichAgentSkills;
	const canRefreshDerivedMetadata =
		search.section === "agent-skills" && onRefreshDerivedMetadata;
	const canEnrichReadmes =
		search.section === "3d-motion" && onEnrichMissingReadmes;
	const canRefreshReadmes =
		search.section === "3d-motion" && onRefreshExistingReadmes;
	const isAnyReadmeRunning =
		isEnrichingMissingReadmes || isRefreshingExistingReadmes;

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
						{canRevalidateAgentSkills && (
							<Button
								type="button"
								variant="outline"
								disabled={isRevalidatingAgentSkills || isEnrichingAgentSkills}
								onClick={onRevalidateAgentSkills}
							>
								<RefreshCcw
									className={`mr-2 h-4 w-4 ${isRevalidatingAgentSkills ? "animate-spin" : ""}`}
								/>
								{isRevalidatingAgentSkills
									? "Revalidating..."
									: "Revalidate Skills"}
							</Button>
						)}

						{canEnrichAgentSkills && (
							<Button
								type="button"
								variant="outline"
								disabled={isEnrichingAgentSkills || isRevalidatingAgentSkills}
								onClick={onEnrichAgentSkills}
							>
								<FileText
									className={`mr-2 h-4 w-4 ${isEnrichingAgentSkills ? "animate-pulse" : ""}`}
								/>
								{isEnrichingAgentSkills ? "Enriching..." : "Enrich Metadata"}
							</Button>
						)}

						{canRefreshDerivedMetadata && (
							<Button
								type="button"
								variant="outline"
								disabled={
									isRefreshingDerivedMetadata ||
									isEnrichingAgentSkills ||
									isRevalidatingAgentSkills
								}
								onClick={onRefreshDerivedMetadata}
							>
								<RefreshCcw
									className={`mr-2 h-4 w-4 ${isRefreshingDerivedMetadata ? "animate-spin" : ""}`}
								/>
								{isRefreshingDerivedMetadata
									? "Refreshing..."
									: "Refresh Commands"}
							</Button>
						)}

						{canEnrichReadmes && (
							<Button
								type="button"
								variant="outline"
								disabled={isAnyReadmeRunning}
								onClick={onEnrichMissingReadmes}
							>
								<BookOpen
									className={`mr-2 h-4 w-4 ${isEnrichingMissingReadmes ? "animate-pulse" : ""}`}
								/>
								{isEnrichingMissingReadmes
									? "Enriching..."
									: "Enrich Missing READMEs"}
							</Button>
						)}

						{canRefreshReadmes && (
							<Button
								type="button"
								variant="outline"
								disabled={isAnyReadmeRunning}
								onClick={onRefreshExistingReadmes}
							>
								<RefreshCcw
									className={`mr-2 h-4 w-4 ${isRefreshingExistingReadmes ? "animate-spin" : ""}`}
								/>
								{isRefreshingExistingReadmes
									? "Refreshing..."
									: "Refresh Existing READMEs"}
							</Button>
						)}

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

			{search.section === "3d-motion" && canRefreshReadmes && (
				<p className="text-xs text-muted-foreground">
					Re-fetches README content from GitHub for existing accepted 3D Motion
					repositories. Existing README content is kept if GitHub fetch fails.
				</p>
			)}

			{readmeEnrichResult && (
				<div className="rounded-md border bg-muted/40 px-4 py-3 text-sm">
					<p className="font-medium mb-1">README Enrichment Result</p>
					<div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
						<span>Checked: {readmeEnrichResult.checked}</span>
						<span>Updated: {readmeEnrichResult.updated}</span>
						<span>Refreshed: {readmeEnrichResult.refreshed}</span>
						<span>Missing: {readmeEnrichResult.missing}</span>
						<span>Failed: {readmeEnrichResult.failed}</span>
						<span>Skipped: {readmeEnrichResult.skipped}</span>
					</div>
				</div>
			)}
		</>
	);
}
