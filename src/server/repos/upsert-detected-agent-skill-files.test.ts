import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GitHubRepo } from "@/lib/validations/github";
import {
	agentSkillCategories,
	agentSkillSubcategories,
} from "@/server/db/schema";

const state = vi.hoisted(() => ({
	categories: [] as Array<{ id: string; name: string; slug: string }>,
	subcategories: [] as Array<{
		id: string;
		categoryId: string;
		name: string;
		slug: string;
	}>,
	insertedValues: null as Record<string, unknown> | null,
}));

const fetchAgentSkillFileContentMock = vi.hoisted(() => vi.fn());
const selectMock = vi.hoisted(() => vi.fn());
const insertMock = vi.hoisted(() => vi.fn());

vi.mock("@/server/db", () => ({
	db: {
		select: selectMock,
		insert: insertMock,
	},
}));

vi.mock("@/server/github/agent-skill-files", () => ({
	fetchAgentSkillFileContent: fetchAgentSkillFileContentMock,
}));

async function loadSubject() {
	return import("./agent-skills-upsert");
}

function createRepository(overrides: Partial<GitHubRepo> = {}): GitHubRepo {
	return {
		id: 101,
		name: "agent-humanizer",
		full_name: "example/agent-humanizer",
		description: "A writing assistant skill repository.",
		html_url: "https://github.com/example/agent-humanizer",
		homepage: null,
		stargazers_count: 12,
		forks_count: 1,
		open_issues_count: 0,
		language: "Markdown",
		topics: ["agent", "skills"],
		archived: false,
		fork: false,
		license: null,
		owner: {
			login: "example",
			avatar_url: "https://github.com/example.png",
			html_url: "https://github.com/example",
		},
		default_branch: "main",
		created_at: "2026-01-01T00:00:00Z",
		updated_at: "2026-02-01T00:00:00Z",
		pushed_at: "2026-02-01T00:00:00Z",
		...overrides,
	};
}

describe("upsertDetectedAgentSkillFiles", () => {
	beforeEach(() => {
		state.categories = [];
		state.subcategories = [];
		state.insertedValues = null;

		selectMock.mockReset();
		insertMock.mockReset();
		fetchAgentSkillFileContentMock.mockReset();

		selectMock.mockImplementation(() => ({
			from: (table: unknown) => {
				if (table === agentSkillCategories) {
					return state.categories;
				}

				if (table === agentSkillSubcategories) {
					return state.subcategories;
				}

				return [];
			},
		}));

		insertMock.mockImplementation(() => ({
			values: (values: Record<string, unknown>) => {
				state.insertedValues = values;

				return {
					onConflictDoUpdate: () => undefined,
				};
			},
		}));
	});

	it("creates an approved skill row with content and metadata", async () => {
		state.categories = [
			{
				id: "cat-writing",
				name: "Writing",
				slug: "writing",
			},
		];

		fetchAgentSkillFileContentMock.mockResolvedValue({
			ok: true,
			content: [
				"---",
				'name: "Humanizer"',
				"description: Improve prose for AI outputs.",
				"allowed-tools:",
				"  - Read",
				"  - Write",
				"---",
				"",
				"Humanizer skill content.",
			].join("\n"),
		});

		const { upsertDetectedAgentSkillFiles } = await loadSubject();

		const result = await upsertDetectedAgentSkillFiles({
			repoId: "repo-1",
			repoSectionId: "section-1",
			repository: createRepository(),
			detectedFiles: [
				{
					path: ".factory/skills/humanizer/SKILL.md",
					url: "https://github.com/example/agent-humanizer/blob/main/.factory/skills/humanizer/SKILL.md",
					fileName: "SKILL.md",
					skillName: "humanizer",
					confidence: "high",
				},
			],
			querySources: ["SKILL.md agent", "agent skill"],
		});

		expect(result).toEqual({
			processed: 1,
			upserted: 1,
			failed: 0,
			strictDetected: true,
		});
		expect(state.insertedValues).toMatchObject({
			repoId: "repo-1",
			repoSectionId: "section-1",
			section: "agent-skills",
			skillName: "Humanizer",
			status: "approved",
			isAccepted: true,
			category: "Writing",
			categoryId: "cat-writing",
			subcategoryId: null,
			fileName: "SKILL.md",
			confidence: "high",
			contentPreview: expect.stringContaining("Humanizer skill content."),
			rawFileUrl:
				"https://raw.githubusercontent.com/example/agent-humanizer/main/.factory/skills/humanizer/SKILL.md",
			skillFolderPath: ".factory/skills/humanizer",
			downloadZipUrl:
				"https://github.com/example/agent-humanizer/archive/refs/heads/main.zip",
		});

		expect(state.insertedValues?.metadata).toMatchObject({
			discovery: {
				section: "agent-skills",
				detectedFilePath: ".factory/skills/humanizer/SKILL.md",
				detectedFileName: "SKILL.md",
				detectionConfidence: "high",
				querySources: ["SKILL.md agent", "agent skill"],
			},
			taxonomy: {
				categorySlug: "writing",
				fallbackReason: "matched-category",
				confidence: "high",
			},
			installCommands: {
				recommended: "npx skills add example/agent-humanizer",
			},
		});
	});

	it("stores fetch failures in metadata and still inserts the row", async () => {
		state.categories = [
			{
				id: "cat-writing",
				name: "Writing",
				slug: "writing",
			},
		];

		fetchAgentSkillFileContentMock.mockResolvedValue({
			ok: false,
			error: "timeout",
		});

		const { upsertDetectedAgentSkillFiles } = await loadSubject();

		await upsertDetectedAgentSkillFiles({
			repoId: "repo-2",
			repoSectionId: "section-2",
			repository: createRepository({
				name: "agent-editor",
				full_name: "example/agent-editor",
				html_url: "https://github.com/example/agent-editor",
				description: "Agent skill for editing prose.",
			}),
			detectedFiles: [
				{
					path: "skills/editor/SKILL.md",
					url: "https://github.com/example/agent-editor/blob/main/skills/editor/SKILL.md",
					fileName: "SKILL.md",
					skillName: "editor",
					confidence: "high",
				},
			],
			querySources: ["agent skill"],
		});

		expect(state.insertedValues).toMatchObject({
			content: null,
			contentPreview: null,
			status: "approved",
			isAccepted: true,
		});
		expect(state.insertedValues?.metadata).toMatchObject({
			contentFetchError: "timeout",
			installCommands: {
				recommended: "npx skills add example/agent-editor",
			},
		});
	});

	it("falls back to Other when taxonomy tables are empty", async () => {
		fetchAgentSkillFileContentMock.mockResolvedValue({
			ok: true,
			content: "---\nname: Root Skill\n---\n\nRoot skill content.",
		});

		const { upsertDetectedAgentSkillFiles } = await loadSubject();

		await upsertDetectedAgentSkillFiles({
			repoId: "repo-3",
			repoSectionId: "section-3",
			repository: createRepository({
				name: "agent-root-skill",
				full_name: "example/agent-root-skill",
			}),
			detectedFiles: [
				{
					path: "SKILL.md",
					url: "https://github.com/example/agent-root-skill/blob/main/SKILL.md",
					fileName: "SKILL.md",
					skillName: "root-skill",
					confidence: "medium",
				},
			],
			querySources: [],
		});

		expect(state.insertedValues).toMatchObject({
			category: "Other",
			categoryId: null,
			subcategoryId: null,
		});
		expect(state.insertedValues?.metadata).toMatchObject({
			taxonomy: {
				fallbackReason: "taxonomy-table-empty",
				confidence: "low",
			},
		});
	});
});
