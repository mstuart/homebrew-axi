import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";

const execFileMock = vi.fn();
const REFUSES_TO_RUN_PATTERN = /refuses to run/;

vi.mock("node:child_process", () => ({
  execFile: (...args: unknown[]) => execFileMock(...args),
}));

function respond(
  error: (Error & { code?: string | number }) | null,
  stdout: string,
  stderr: string
) {
  execFileMock.mockImplementationOnce(
    (
      _cmd: string,
      _args: string[],
      _opts: unknown,
      callback: (error: Error | null, stdout: string, stderr: string) => void
    ) => {
      callback(error, stdout, stderr);
      return new EventEmitter();
    }
  );
}

describe("brew.ts", () => {
  afterEach(() => {
    execFileMock.mockReset();
    vi.resetModules();
  });

  it("refuses to run a subcommand outside the read-only allowlist", async () => {
    const { brewExec } = await import("../src/brew.js");
    await expect(brewExec(["install", "wget"])).rejects.toThrow(
      REFUSES_TO_RUN_PATTERN
    );
    expect(execFileMock).not.toHaveBeenCalled();
  });

  it("translates ENOENT into a BREW_MISSING AxiError", async () => {
    const { brewExec } = await import("../src/brew.js");
    const enoent = Object.assign(new Error("not found"), { code: "ENOENT" });
    respond(enoent, "", "");
    await expect(brewExec(["list", "--versions"])).rejects.toMatchObject({
      code: "BREW_MISSING",
    });
  });

  it("brewJson parses stdout as JSON on success", async () => {
    const { brewJson } = await import("../src/brew.js");
    respond(null, JSON.stringify({ casks: [], formulae: [] }), "");
    await expect(brewJson(["outdated", "--json=v2"])).resolves.toEqual({
      casks: [],
      formulae: [],
    });
  });

  it("brewJson throws UNKNOWN on unparsable stdout", async () => {
    const { brewJson } = await import("../src/brew.js");
    respond(null, "not json", "");
    await expect(brewJson(["outdated", "--json=v2"])).rejects.toMatchObject({
      code: "UNKNOWN",
    });
  });

  it("brewExec throws a mapped error on non-zero exit", async () => {
    const { brewExec } = await import("../src/brew.js");
    const failure = Object.assign(new Error("failed"), { code: 1 });
    respond(failure, "", "Error: No such keg wget in the Cellar\n");
    await expect(brewExec(["list", "--versions"])).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("brewRaw does not throw on non-zero exit, only on ENOENT", async () => {
    const { brewRaw } = await import("../src/brew.js");
    const failure = Object.assign(new Error("failed"), { code: 1 });
    respond(failure, "", 'Error: No formulae or casks found for "zzz".\n');
    const result = await brewRaw(["search", "--formula", "zzz"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("No formulae or casks found");
  });

  it("isBrewInstalled is false on ENOENT and true otherwise", async () => {
    const { isBrewInstalled } = await import("../src/brew.js");
    const enoent = Object.assign(new Error("not found"), { code: "ENOENT" });
    respond(enoent, "", "");
    await expect(isBrewInstalled()).resolves.toBe(false);

    respond(null, "Homebrew 6.0.15\n", "");
    await expect(isBrewInstalled()).resolves.toBe(true);
  });
});
