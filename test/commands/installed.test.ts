import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";

const execFileMock = vi.fn();

vi.mock("node:child_process", () => ({
  execFile: (...args: unknown[]) => execFileMock(...args),
}));

function queue(stdout: string) {
  execFileMock.mockImplementationOnce(
    (
      _cmd: string,
      _args: string[],
      _opts: unknown,
      callback: (error: Error | null, stdout: string, stderr: string) => void
    ) => {
      callback(null, stdout, "");
      return new EventEmitter();
    }
  );
}

describe("installed", () => {
  afterEach(() => execFileMock.mockReset());

  it("splits formulae and casks with a total count", async () => {
    const { installedCommand } = await import(
      "../../src/commands/installed.js"
    );
    queue("wget 1.25.0\ngit 2.52.0\n");
    queue("docker 4.1.0\n");
    const out = await installedCommand();
    expect(out.count).toBe(3);
    expect(out.formulae).toEqual([
      { name: "wget", version: "1.25.0" },
      { name: "git", version: "2.52.0" },
    ]);
    expect(out.casks).toEqual([{ name: "docker", version: "4.1.0" }]);
  });

  it("joins multiple installed versions of one formula", async () => {
    const { installedCommand } = await import(
      "../../src/commands/installed.js"
    );
    queue("python 3.11 3.12\n");
    queue("");
    const out = await installedCommand();
    expect(out.formulae).toEqual([{ name: "python", version: "3.11, 3.12" }]);
    expect(out.casks).toBeUndefined();
  });

  it("returns a definitive empty state when nothing is installed", async () => {
    const { installedCommand } = await import(
      "../../src/commands/installed.js"
    );
    queue("");
    queue("");
    const out = await installedCommand();
    expect(out.installed).toBe("0 formulae or casks installed");
  });

  it("rejects a stray positional argument instead of silently dropping it", async () => {
    const { installedCommand } = await import(
      "../../src/commands/installed.js"
    );
    await expect(installedCommand(["extra-arg"])).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("rejects an unknown flag", async () => {
    const { installedCommand } = await import(
      "../../src/commands/installed.js"
    );
    await expect(installedCommand(["--verbose"])).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("caps results to --limit, splitting the budget across formulae then casks", async () => {
    const { installedCommand } = await import(
      "../../src/commands/installed.js"
    );
    queue("a 1\nb 1\nc 1\n");
    queue("docker 4.0.0\n");
    const out = await installedCommand(["--limit", "2"]);
    expect(out.count).toBe("2 of 4 total");
    expect(out.formulae).toEqual([
      { name: "a", version: "1" },
      { name: "b", version: "1" },
    ]);
    expect(out.casks).toBeUndefined();
    expect(out.help).toContain(
      "Run `homebrew-axi installed --limit 52` for more results"
    );
  });
});
