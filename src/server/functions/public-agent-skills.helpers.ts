type InstallCommandsMetadata = {
	recommended?: unknown;
	specificNpx?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getPublicAgentSkillInstallCommand({
	filePath,
	metadata,
	repoFullName,
}: {
	filePath: string;
	metadata: unknown;
	repoFullName: string;
}) {
	const installCommands = isRecord(metadata)
		? (metadata.installCommands as InstallCommandsMetadata | undefined)
		: undefined;
	const isNestedSkill = filePath.split("/").length > 1;
	const preferredCommand = isNestedSkill
		? installCommands?.specificNpx
		: installCommands?.recommended;
	const fallbackCommand = installCommands?.recommended;

	if (typeof preferredCommand === "string" && preferredCommand.trim()) {
		return preferredCommand;
	}

	if (typeof fallbackCommand === "string" && fallbackCommand.trim()) {
		return fallbackCommand;
	}

	return `npx skills add ${repoFullName}`;
}
