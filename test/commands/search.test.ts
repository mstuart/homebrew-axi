import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";

const execFileMock = vi.fn();

vi.mock("node:child_process", () => ({
  execFile: (...args: unknown[]) => execFileMock(...args),
}));

function respond(exitCode: number, stdout: string, stderr: string) {
  execFileMock.mockImplementationOnce(
    (
      _cmd: string,
      _args: string[],
      _opts: unknown,
      callback: (error: (Error & { code?: number }) | null, stdout: string, stderr: string) => void,
    ) => {
      const error = exitCode === 0 ? null : Object.assign(new Error("failed"), { code: exitCode });
      callback(error, stdout, stderr);
      return new EventEmitter();
    },
  );
}

describe("search", () => {
  afterEach(() => execFileMock.mockReset());

  it("splits formula and cask matches with a total count", async () => {
    const { searchCommand } = await import("../../src/commands/search.js");
    respond(0, "sqlite\nsqlite-utils\n", "");
    respond(0, "db-browser-for-sqlite\n", "");
    const out = await searchCommand(["sqlite"]);
    expect(out.count).toBe(3);
    expect(out.formulae).toEqual(["sqlite", "sqlite-utils"]);
    expect(out.casks).toEqual(["db-browser-for-sqlite"]);
  });

  it("treats brew's 'no matches' exit code as zero results, not an error", async () => {
    const { searchCommand } = await import("../../src/commands/search.js");
    respond(1, "", 'Error: No formulae or casks found for "zzz".\n');
    respond(1, "", 'Error: No formulae or casks found for "zzz".\n');
    const out = await searchCommand(["zzz"]);
    expect(out.packages).toBe('0 packages found for "zzz"');
  });

  it("handles a scope with matches and a scope with none", async () => {
    const { searchCommand } = await import("../../src/commands/search.js");
    respond(1, "", 'Error: No formulae or casks found for "1password".\n');
    respond(0, "1password\n1password-cli\n", "");
    const out = await searchCommand(["1password"]);
    expect(out.formulae).toBeUndefined();
    expect(out.casks).toEqual(["1password", "1password-cli"]);
    expect(out.count).toBe(2);
  });

  it("requires a query", async () => {
    const { searchCommand } = await import("../../src/commands/search.js");
    await expect(searchCommand([])).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("propagates a genuine brew failure", async () => {
    const { searchCommand } = await import("../../src/commands/search.js");
    respond(1, "", "Error: something else broke\n");
    respond(0, "", "");
    await expect(searchCommand(["x"])).rejects.toMatchObject({ code: "UNKNOWN" });
  });
});
