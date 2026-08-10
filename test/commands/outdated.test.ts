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
      callback: (error: Error | null, stdout: string, stderr: string) => void
    ) => {
      callback(null, JSON.stringify(stdout), "");
      return new EventEmitter();
    }
  );
}

describe("outdated", () => {
  afterEach(() => execFileMock.mockReset());

  it("returns rows plus a count", async () => {
    const { outdatedCommand } = await import("../../src/commands/outdated.js");
    respondJson({
      casks: [
        {
          current_version: "4.1.0",
          installed_versions: ["4.0.0"],
          name: "docker",
        },
      ],
      formulae: [
        {
          current_version: "1.25.0",
          installed_versions: ["1.24.0"],
          name: "wget",
        },
      ],
    });
    const out = await outdatedCommand();
    expect(out.count).toBe(2);
    expect(out.outdated).toEqual([
      { installed: "1.24.0", latest: "1.25.0", name: "wget" },
      { installed: "4.0.0", latest: "4.1.0", name: "docker" },
    ]);
  });

  it("returns a definitive empty state when nothing is outdated", async () => {
    const { outdatedCommand } = await import("../../src/commands/outdated.js");
    respondJson({ casks: [], formulae: [] });
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
      casks: [],
      formulae: [
        { current_version: "2", installed_versions: ["1"], name: "a" },
        { current_version: "2", installed_versions: ["1"], name: "b" },
        { current_version: "2", installed_versions: ["1"], name: "c" },
      ],
    });
    const out = await outdatedCommand(["--limit", "2"]);
    expect(out.count).toBe("2 of 3 total");
    expect(out.outdated).toEqual([
      { installed: "1", latest: "2", name: "a" },
      { installed: "1", latest: "2", name: "b" },
    ]);
    expect(out.help).toContain(
      "Run `homebrew-axi outdated --limit 52` for more results"
    );
  });
});
