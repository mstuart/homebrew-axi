import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";

const execFileMock = vi.fn();

vi.mock("node:child_process", () => ({
  execFile: (...args: unknown[]) => execFileMock(...args),
}));

function respondJson(stdout: unknown) {
  execFileMock.mockImplementationOnce(
    (
      _cmd: string,
      _args: string[],
      _opts: unknown,
      callback: (error: Error | null, stdout: string, stderr: string) => void,
    ) => {
      callback(null, JSON.stringify(stdout), "");
      return new EventEmitter();
    },
  );
}

describe("outdated", () => {
  afterEach(() => execFileMock.mockReset());

  it("returns rows plus a count", async () => {
    const { outdatedCommand } = await import("../../src/commands/outdated.js");
    respondJson({
      formulae: [
        { name: "wget", installed_versions: ["1.24.0"], current_version: "1.25.0" },
      ],
      casks: [
        { name: "docker", installed_versions: ["4.0.0"], current_version: "4.1.0" },
      ],
    });
    const out = await outdatedCommand();
    expect(out.count).toBe(2);
    expect(out.outdated).toEqual([
      { name: "wget", installed: "1.24.0", latest: "1.25.0" },
      { name: "docker", installed: "4.0.0", latest: "4.1.0" },
    ]);
  });

  it("returns a definitive empty state when nothing is outdated", async () => {
    const { outdatedCommand } = await import("../../src/commands/outdated.js");
    respondJson({ formulae: [], casks: [] });
    const out = await outdatedCommand();
    expect(out.outdated).toBe("0 outdated");
    expect(out.count).toBeUndefined();
  });

  it("rejects an unknown flag instead of silently dropping it", async () => {
    const { outdatedCommand } = await import("../../src/commands/outdated.js");
    await expect(outdatedCommand(["--stat", "closed"])).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("rejects a stray positional argument", async () => {
    const { outdatedCommand } = await import("../../src/commands/outdated.js");
    await expect(outdatedCommand(["extra-arg"])).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("caps results to --limit and hints at more when truncated", async () => {
    const { outdatedCommand } = await import("../../src/commands/outdated.js");
    respondJson({
      formulae: [
        { name: "a", installed_versions: ["1"], current_version: "2" },
        { name: "b", installed_versions: ["1"], current_version: "2" },
        { name: "c", installed_versions: ["1"], current_version: "2" },
      ],
      casks: [],
    });
    const out = await outdatedCommand(["--limit", "2"]);
    expect(out.count).toBe("2 of 3 total");
    expect(out.outdated).toEqual([
      { name: "a", installed: "1", latest: "2" },
      { name: "b", installed: "1", latest: "2" },
    ]);
    expect(out.help).toContain("Run `homebrew-axi outdated --limit 52` for more results");
  });
});
