import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { detectAgentSkillFiles } from "./agent-skill-files";

function jsonResponse(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"content-type": "application/json",
			"x-ratelimit-remaining": "100",
		},
	});
}

describe("detectAgentSkillFiles", () => {
	beforeEach(() => {
		process.env.GITHUB_TOKEN = "test-token";
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		delete process.env.GITHUB_TOKEN;
	});

	it("finds nested skill files and sorts by file strength then path", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			jsonResponse({
				truncated: true,
				tree: [
					{ path: "docs/readme.md", type: "blob" },
					{ path: "zeta/skills.md", type: "blob" },
					{ path: ".factory/skills/humanizer/SKILL.md", type: "blob" },
					{ path: "packages/foo/skills/bar/skill.md", type: "blob" },
					{ path: "alpha/SKILL.md", type: "blob" },
				],
			}),
		);

		vi.stubGlobal("fetch", fetchMock);

		const result = await detectAgentSkillFiles({
			owner: "zed-industries",
			repo: "zed",
			defaultBranch: "main",
		});

		expect(result.found).toBe(true);
		expect(result.truncated).toBe(true);
		expect(result.files.map((file) => file.path)).toEqual([
			".factory/skills/humanizer/SKILL.md",
			"alpha/SKILL.md",
			"packages/foo/skills/bar/skill.md",
			"zeta/skills.md",
		]);
		expect(result.files[0]).toMatchObject({
			fileName: "SKILL.md",
			skillName: "humanizer",
			confidence: "high",
			url: "https://github.com/zed-industries/zed/blob/main/.factory/skills/humanizer/SKILL.md",
		});
		expect(result.files[3]).toMatchObject({
			fileName: "skills.md",
			confidence: "medium",
		});
	});

	it("falls back to branch commit sha when the branch tree ref fails", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(jsonResponse({ message: "not found" }, 404))
			.mockResolvedValueOnce(
				jsonResponse({
					commit: {
						sha: "abc123",
					},
				}),
			)
			.mockResolvedValueOnce(
				jsonResponse({
					truncated: false,
					tree: [{ path: "skills/writer/SKILL.md", type: "blob" }],
				}),
			);

		vi.stubGlobal("fetch", fetchMock);

		const result = await detectAgentSkillFiles({
			owner: "owner",
			repo: "repo",
			defaultBranch: "feature/skills",
		});

		expect(result.found).toBe(true);
		expect(fetchMock).toHaveBeenCalledTimes(3);
		expect(fetchMock.mock.calls[2]?.[0]).toContain("abc123");
		expect(result.files[0]?.url).toBe(
			"https://github.com/owner/repo/blob/feature/skills/skills/writer/SKILL.md",
		);
	});

	it("returns an empty result instead of throwing when tree lookup fails", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(jsonResponse({ message: "not found" }, 404))
			.mockResolvedValueOnce(jsonResponse({ message: "not found" }, 404));

		vi.stubGlobal("fetch", fetchMock);

		const result = await detectAgentSkillFiles({
			owner: "owner",
			repo: "repo",
			defaultBranch: "main",
		});

		expect(result).toMatchObject({
			found: false,
			files: [],
		});
		expect(result.debugError).toBeTruthy();
	});
});
