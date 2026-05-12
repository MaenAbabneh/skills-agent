"use client";

import { useRouter } from "@tanstack/react-router";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { AgentSkillInstallCommands } from "@/lib/agent-skills-utils";
import {
	approveAgentSkillFileAction,
	rejectAgentSkillFileAction,
} from "@/server/functions/admin-agent-skills";
import { AgentSkillCard } from "./AgentSkillCard";

export type AgentSkillReviewItem = {
	id: string;
	skillName: string;
	slug: string;
	category: string;
	filePath: string;
	fileUrl: string;
	fileName: string;
	confidence: string;
	status: string;
	isAccepted: boolean;
	description: string | null;
	repoFullName: string;
	repoUrl: string;
	repoStars: number;
	metadata?: Record<string, unknown> | null;
};

type CommandTab = "npx" | "bun" | "pnpm" | "global" | "manual";

function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false);

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// ignore
		}
	}

	return (
		<button
			type="button"
			onClick={handleCopy}
			className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all shrink-0 ${
				copied
					? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
					: "text-muted-foreground hover:bg-muted hover:text-foreground"
			}`}
			aria-label="Copy command"
		>
			{copied ? <Check size={12} /> : <Copy size={12} />}
			<span>{copied ? "Copied" : "Copy"}</span>
		</button>
	);
}

function CommandBlock({
	command,
	multiLine = false,
}: {
	command: string;
	multiLine?: boolean;
}) {
	return (
		<div className="flex items-start gap-2 bg-muted/60 rounded-md p-3 font-mono text-sm border border-border/60">
			<code
				className={`flex-1 text-foreground whitespace-pre${multiLine ? "" : " truncate"}`}
			>
				{command}
			</code>
			<CopyButton text={command} />
		</div>
	);
}

type InstallBlockProps = {
	commands: AgentSkillInstallCommands;
	skillFolderPath: string;
};

function InstallBlock({ commands, skillFolderPath }: InstallBlockProps) {
	const [activeTab, setActiveTab] = useState<CommandTab>("npx");
	const isNested = skillFolderPath !== ".";

	const tabs: { id: CommandTab; label: string }[] = [
		{ id: "npx", label: "npx" },
		{ id: "bun", label: "bun" },
		{ id: "pnpm", label: "pnpm" },
		{ id: "global", label: "global" },
		{ id: "manual", label: "manual" },
	];

	const baseCommand: Record<CommandTab, string> = {
		npx: commands.npx,
		bun: commands.bunx,
		pnpm: commands.pnpm,
		global: commands.global,
		manual: commands.sparseCheckout,
	};

	const specificCommand: Record<Exclude<CommandTab, "manual">, string> = {
		npx: commands.specificNpx,
		bun: commands.specificBunx,
		pnpm: commands.specificPnpm,
		global: commands.specificGlobal,
	};

	return (
		<div className="space-y-3">
			{/* Tab bar */}
			<div className="flex gap-1 border-b border-border pb-1">
				{tabs.map((tab) => (
					<button
						key={tab.id}
						type="button"
						onClick={() => setActiveTab(tab.id)}
						className={`px-3 py-1.5 text-xs font-mono rounded-t transition-colors ${
							activeTab === tab.id
								? "bg-background border border-border border-b-background text-foreground -mb-px"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{activeTab === "manual" ? (
				<div className="space-y-2">
					<p className="text-xs text-muted-foreground">
						Sparse-checkout (downloads only the skill folder):
					</p>
					<CommandBlock command={commands.sparseCheckout} multiLine />
					<p className="text-xs text-muted-foreground pt-2">
						Single file (downloads only SKILL.md):
					</p>
					<CommandBlock command={commands.singleFileCurl} multiLine />
				</div>
			) : (
				<div className="space-y-2">
					<p className="text-xs text-muted-foreground">Install entire repo:</p>
					<CommandBlock command={baseCommand[activeTab]} />
					{isNested && (
						<>
							<p className="text-xs text-muted-foreground pt-1">
								Install this specific skill only:
							</p>
							<CommandBlock
								command={
									specificCommand[activeTab as Exclude<CommandTab, "manual">]
								}
							/>
						</>
					)}
				</div>
			)}
		</div>
	);
}

export function AgentSkillReviewGrid({
	items,
}: {
	items: AgentSkillReviewItem[];
}) {
	const router = useRouter();
	const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
	const [isPendingAction, setIsPendingAction] = useState(false);

	async function runAction(id: string, action: "approve" | "reject") {
		try {
			setIsPendingAction(true);
			if (action === "approve") {
				await approveAgentSkillFileAction({ data: { skillFileId: id } });
				toast.success("Skill file approved");
			} else {
				await rejectAgentSkillFileAction({ data: { skillFileId: id } });
				toast.success("Skill file rejected");
			}
			await router.invalidate();
		} catch (_error) {
			toast.error(`Failed to ${action} skill file`);
		} finally {
			setIsPendingAction(false);
		}
	}

	if (items.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed">
				<h3 className="text-lg font-medium">No skills found</h3>
				<p className="text-sm text-muted-foreground mt-1">
					No agent skills match the current filters.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{items.map((item) => (
					<AgentSkillCard
						key={item.id}
						skillFileId={item.id}
						skillName={item.skillName}
						fileName={item.fileName}
						filePath={item.filePath}
						fileUrl={item.fileUrl}
						category={item.category}
						status={item.status}
						confidence={item.confidence}
						repoFullName={item.repoFullName}
						repoUrl={item.repoUrl}
						description={item.description}
						stars={item.repoStars}
						metadata={item.metadata}
						isPendingAction={isPendingAction}
						onApprove={(id) => runAction(id, "approve")}
						onReject={(id) => runAction(id, "reject")}
						onViewDetails={(id) => setSelectedSkillId(id)}
					/>
				))}
			</div>

			{selectedSkillId &&
				(() => {
					const item = items.find((i) => i.id === selectedSkillId);
					if (!item) return null;

					const meta = item.metadata as
						| Record<string, unknown>
						| null
						| undefined;
					const installCommands = meta?.installCommands as
						| AgentSkillInstallCommands
						| undefined;
					const skillFolderPath =
						(meta?.skillFolderPath as string | undefined) ?? ".";

					return (
						<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
							<div className="bg-background rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
								<div className="flex justify-between items-start mb-4">
									<h2 className="text-2xl font-bold">Skill Details</h2>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => setSelectedSkillId(null)}
									>
										<span className="sr-only">Close</span>
										<svg
											width="15"
											height="15"
											viewBox="0 0 15 15"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
											className="h-4 w-4"
											aria-hidden="true"
										>
											<path
												d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
												fill="currentColor"
												fillRule="evenodd"
												clipRule="evenodd"
											></path>
										</svg>
									</Button>
								</div>

								<div className="space-y-5">
									<div>
										<h3 className="font-semibold">
											{item.skillName || item.fileName}
										</h3>
										<p className="text-sm text-muted-foreground">
											Path: {item.filePath}
										</p>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<p className="text-sm font-medium">Category</p>
											<p className="text-sm text-muted-foreground">
												{item.category}
											</p>
										</div>
										<div>
											<p className="text-sm font-medium">Status</p>
											<p className="text-sm text-muted-foreground">
												{item.status}
											</p>
										</div>
										<div>
											<p className="text-sm font-medium">Confidence</p>
											<p className="text-sm text-muted-foreground">
												{item.confidence}
											</p>
										</div>
										<div>
											<p className="text-sm font-medium">Repository</p>
											<p className="text-sm text-muted-foreground">
												{item.repoFullName}
											</p>
										</div>
									</div>
									<div>
										<p className="text-sm font-medium">Description</p>
										<p className="text-sm text-muted-foreground">
											{item.description || "No description provided."}
										</p>
									</div>

									{/* Install Commands Block */}
									{installCommands && (
										<div className="border-t pt-4 space-y-2">
											<p className="text-sm font-medium">Install</p>
											<InstallBlock
												commands={installCommands}
												skillFolderPath={skillFolderPath}
											/>
										</div>
									)}

									{!installCommands && (
										<div className="border-t pt-4 space-y-2">
											<p className="text-sm font-medium">Install</p>
											<div className="flex items-center gap-2 bg-muted/60 rounded-md p-3 font-mono text-sm border border-border/60">
												<code className="flex-1 truncate text-muted-foreground">
													npx skills add {item.repoFullName}
												</code>
												<CopyButton
													text={`npx skills add ${item.repoFullName}`}
												/>
											</div>
											<p className="text-xs text-muted-foreground">
												Run enrichment to generate all install command variants.
											</p>
										</div>
									)}

									<div className="pt-4 border-t flex justify-end gap-2">
										<Button variant="outline" asChild>
											<a
												href={item.fileUrl}
												target="_blank"
												rel="noopener noreferrer"
											>
												View File
											</a>
										</Button>
										<Button variant="outline" asChild>
											<a
												href={item.repoUrl}
												target="_blank"
												rel="noopener noreferrer"
											>
												View Repo
											</a>
										</Button>
									</div>
								</div>
							</div>
						</div>
					);
				})()}
		</div>
	);
}
