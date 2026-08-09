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

function respondText(stdout: string) {
  execFileMock.mockImplementationOnce(
    (
      _cmd: string,
      _args: string[],
      _opts: unknown,
      callback: (error: Error | null, stdout: string, stderr: string) => void,
    ) => {
      callback(null, stdout, "");
      return new EventEmitter();
    },
  );
}

function respondEnoent() {
  execFileMock.mockImplementationOnce(
    (
      _cmd: string,
      _args: string[],
      _opts: unknown,
      callback: (error: Error & { code?: string }, stdout: string, stderr: string) => void,
    ) => {
      callback(Object.assign(new Error("not found"), { code: "ENOENT" }), "", "");
      return new EventEmitter();
    },
  );
}

describe("home", () => {
  afterEach(() => execFileMock.mockReset());

  it("shows outdated count against total installed", async () => {
    const { homeCommand } = await import("../src/home.js");
    respondJson({
      formulae: [{ name: "wget", installed_versions: ["1.24.0"], current_version: "1.25.0" }],
      casks: [],
    });
    respondText("wget 1.24.0\ngit 2.52.0\n");
    respondText("docker 4.0.0\n");
    const out = await homeCommand();
    expect(out.count).toBe("1 of 3 installed are outdated");
    expect(out.outdated).toEqual([{ name: "wget", installed: "1.24.0", latest: "1.25.0" }]);
    expect(Array.isArray(out.help)).toBe(true);
  });

  it("returns a small help list instead of an error when brew is missing", async () => {
    const { homeCommand } = await import("../src/home.js");
    respondEnoent();
    const out = await homeCommand();
    expect(out.outdated).toBeUndefined();
    expect(out.count).toBeUndefined();
    expect(Array.isArray(out.help)).toBe(true);
    expect((out.help as string[]).length).toBeGreaterThan(0);
  });
});
