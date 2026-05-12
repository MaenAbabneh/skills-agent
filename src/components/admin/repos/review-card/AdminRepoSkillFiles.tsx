import { ExternalLink, FileText } from "lucide-react";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import type { SectionId } from "#/lib/sections";
import type {
	AgentSkillMetadata,
	RepoSectionMetadata,
} from "#/lib/validations/repo-metadata";

type DetectedAgentSkillFile = {
	path: string;
	url: string;
	fileName: string;
	skillName: string;
	confidence: "high" | "medium";
};

type AgentSkillDisplayMetadata = AgentSkillMetadata & {
	skillDetected?: boolean;
	skillFileUrl?: string;
	skillFileName?: string;
	skillName?: string;
	skillFiles?: DetectedAgentSkillFile[];
	skillFileCount?: number;
	skillTreeTruncated?: boolean;
	skillDetectionError?: string;
};

type AdminRepoSkillFilesProps = {
	section: SectionId;
	metadata?: RepoSectionMetadata | null;
};

function isAgentSkillDisplayMetadata(
	metadata?: RepoSectionMetadata | null,
): metadata is AgentSkillDisplayMetadata {
	return metadata?.kind === "agent-skills";
}

export function AdminRepoSkillFiles({
	section,
	metadata,
}: AdminRepoSkillFilesProps) {
	if (section !== "agent-skills" || !isAgentSkillDisplayMetadata(metadata)) {
		return null;
	}

	if (!metadata.skillDetected || !metadata.skillFileUrl) {
		return (
			<div className="rounded-lg border p-3 text-sm">
				<div className="flex flex-wrap items-center gap-2">
					<Badge variant="outline">No skill file detected</Badge>
				</div>
			</div>
		);
	}

	const skillFileCount =
		metadata.skillFileCount ?? metadata.skillFiles?.length ?? 1;
	const moreSkillsCount = Math.max(0, skillFileCount - 1);

	return (
		<div className="rounded-lg border p-3 text-sm">
			<div className="flex flex-wrap items-center gap-2">
				<Badge variant="secondary">Skill file detected</Badge>
				{metadata.skillName && (
					<Badge variant="outline">{metadata.skillName}</Badge>
				)}
				{moreSkillsCount > 0 && (
					<Badge variant="outline">+{moreSkillsCount} more skills</Badge>
				)}
			</div>

			<div className="mt-3 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex min-w-0 items-center gap-2 text-muted-foreground">
					<FileText className="h-4 w-4 shrink-0" />
					<span className="truncate font-mono text-xs">
						{metadata.skillFilePath}
					</span>
				</div>

				<Button variant="outline" size="sm" asChild>
					<a href={metadata.skillFileUrl} target="_blank" rel="noreferrer">
						<ExternalLink className="mr-2 h-4 w-4" />
						View Skill File
					</a>
				</Button>
			</div>
		</div>
	);
}
