import {
	Check,
	Copy,
	ExternalLink,
	FileText,
	Github,
	Star,
	X,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import type { AgentSkillInstallCommands } from "@/lib/agent-skills-utils";

export type AgentSkillCardProps = {
	skillFileId: string;
	skillName: string;
	fileName: string;
	filePath: string;
	fileUrl: string;
	category: string;
	status: string;
	confidence: string;
	repoFullName: string;
	repoUrl: string;
	description?: string | null;
	stars?: number;
	metadata?: Record<string, unknown> | null;
	onApprove?: (id: string) => void;
	onReject?: (id: string) => void;
	onViewDetails?: (id: string) => void;
	isPendingAction?: boolean;
};

export function AgentSkillCard({
	skillFileId,
	skillName,
	fileName,
	filePath,
	fileUrl,
	category,
	status,
	confidence,
	repoFullName,
	repoUrl,
	description,
	stars,
	metadata,
	onApprove,
	onReject,
	onViewDetails,
	isPendingAction = false,
}: AgentSkillCardProps) {
	const [isCopied, setIsCopied] = useState(false);

	const getStatusColor = (s: string) => {
		switch (s) {
			case "approved":
				return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
			case "rejected":
				return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
			default:
				return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
		}
	};

	// Derive install command for the card copy button.
	const installCommands = metadata?.installCommands as
		| AgentSkillInstallCommands
		| undefined;
	const copyCommand =
		installCommands?.recommended ?? `npx skills add ${repoFullName}`;

	async function handleCopyInstall(e: React.MouseEvent) {
		e.stopPropagation();
		try {
			await navigator.clipboard.writeText(copyCommand);
			setIsCopied(true);
			setTimeout(() => setIsCopied(false), 2000);
		} catch {
			// ignore
		}
	}

	return (
		<Card className="flex flex-col overflow-hidden transition-all hover:border-border/80">
			<CardHeader className="p-4 pb-2 space-y-0">
				<div className="flex items-start justify-between gap-2">
					<div className="space-y-1 overflow-hidden">
						<button
							type="button"
							className="font-semibold leading-none tracking-tight truncate text-left cursor-pointer hover:underline"
							onClick={() => onViewDetails?.(skillFileId)}
							onKeyDown={(e) =>
								e.key === "Enter" && onViewDetails?.(skillFileId)
							}
						>
							{skillName || fileName}
						</button>
						<p
							className="text-xs text-muted-foreground truncate"
							title={repoFullName}
						>
							from {repoFullName}
						</p>
					</div>
					<Badge variant="outline" className="shrink-0 capitalize">
						{category}
					</Badge>
				</div>
				<div className="flex flex-wrap gap-2 pt-3">
					<Badge variant="secondary" className={getStatusColor(status)}>
						{status}
					</Badge>
					<Badge variant="outline" className="bg-muted">
						{confidence} conf
					</Badge>
				</div>
			</CardHeader>
			<CardContent className="flex-1 p-4 pt-2">
				<p className="text-sm text-muted-foreground line-clamp-2">
					{description || "No description provided."}
				</p>
				<div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
					<div className="flex items-center gap-1">
						<FileText className="w-3 h-3" />
						<span className="truncate max-w-[120px]" title={filePath}>
							{fileName}
						</span>
					</div>
					{stars !== undefined && (
						<div className="flex items-center gap-1">
							<Star className="w-3 h-3" />
							<span>{stars}</span>
						</div>
					)}
				</div>

				{/* Quick copy install command */}
				<button
					type="button"
					onClick={handleCopyInstall}
					title={`Copy: ${copyCommand}`}
					className={`mt-3 w-full flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-xs font-mono transition-all ${
						isCopied
							? "border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400"
							: "border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
					}`}
				>
					<span className="truncate">
						{isCopied ? "Copied!" : `npx skills add ${repoFullName}`}
					</span>
					{isCopied ? (
						<Check className="w-3 h-3 shrink-0" />
					) : (
						<Copy className="w-3 h-3 shrink-0" />
					)}
				</button>
			</CardContent>
			<CardFooter className="p-4 pt-0 gap-2 grid grid-cols-2">
				<Button variant="outline" size="sm" asChild className="w-full">
					<a href={fileUrl} target="_blank" rel="noopener noreferrer">
						<ExternalLink className="w-4 h-4 mr-2" />
						Skill File
					</a>
				</Button>
				<Button variant="outline" size="sm" asChild className="w-full">
					<a href={repoUrl} target="_blank" rel="noopener noreferrer">
						<Github className="w-4 h-4 mr-2" />
						Repository
					</a>
				</Button>
				{status === "pending" && onApprove && onReject && (
					<>
						<Button
							variant="default"
							size="sm"
							className="w-full bg-green-600 hover:bg-green-700"
							onClick={() => onApprove(skillFileId)}
							disabled={isPendingAction}
						>
							<Check className="w-4 h-4 mr-2" />
							Approve
						</Button>
						<Button
							variant="destructive"
							size="sm"
							className="w-full"
							onClick={() => onReject(skillFileId)}
							disabled={isPendingAction}
						>
							<X className="w-4 h-4 mr-2" />
							Reject
						</Button>
					</>
				)}
			</CardFooter>
		</Card>
	);
}
