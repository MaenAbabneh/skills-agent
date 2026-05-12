import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DetectAgentSkillFilesResult } from "@/server/github/agent-skill-files";

const detectAgentSkillFilesMock = vi.hoisted(() => vi.fn());

vi.mock("@/server/github/agent-skill-files", () => ({
	detectAgentSkillFiles: detectAgentSkillFilesMock,
}));

import { createAgentSkillDetectionContext } from "./agent-skills-detection";

const emptyResult: DetectAgentSkillFilesResult = {
	found: false,
	files: [],
};

function createRepo(name: string) {
	return {
		owner: {
			login: "example",
		},
		name,
		full_name: `example/${name}`,
		description: null,
		topics: [],
		default_branch: "main",
	};
}

describe("createAgentSkillDetectionContext", () => {
	beforeEach(() => {
		detectAgentSkillFilesMock.mockReset();
		detectAgentSkillFilesMock.mockResolvedValue(emptyResult);
	});

	it("skips tree detection when no likely agent skill signal exists", async () => {
		const context = createAgentSkillDetectionContext();

		const result = await context.detectForRepo({
			repo: createRepo("weather-dashboard"),
		});

		expect(result.found).toBe(false);
		expect(detectAgentSkillFilesMock).not.toHaveBeenCalled();
	});

	it("caches duplicate repo detections within a run", async () => {
		const context = createAgentSkillDetectionContext();
		const repo = createRepo("agent-humanizer");

		await context.detectForRepo({ repo, force: true });
		await context.detectForRepo({ repo, force: true });

		expect(detectAgentSkillFilesMock).toHaveBeenCalledTimes(1);
	});

	it("limits concurrent tree detections", async () => {
		let activeCount = 0;
		let maxActiveCount = 0;

		detectAgentSkillFilesMock.mockImplementation(
			async (): Promise<DetectAgentSkillFilesResult> => {
				activeCount += 1;
				maxActiveCount = Math.max(maxActiveCount, activeCount);

				await new Promise((resolve) => setTimeout(resolve, 5));

				activeCount -= 1;

				return emptyResult;
			},
		);

		const context = createAgentSkillDetectionContext({ concurrency: 2 });

		await Promise.all(
			Array.from({ length: 8 }, (_, index) =>
				context.detectForRepo({
					repo: createRepo(`agent-skill-${index}`),
					force: true,
				}),
			),
		);

		expect(maxActiveCount).toBeLessThanOrEqual(2);
		expect(detectAgentSkillFilesMock).toHaveBeenCalledTimes(8);
	});
});
