// Live integration test: hits the real formulae.brew.sh API and, when `brew`
// is on PATH, the real local `brew` CLI. Skips cleanly (via the test context's
// `skip()`) rather than failing when the network or `brew` is unavailable,
// since this suite runs against live external state outside this repo's
// control.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { depsCommand } from "../src/commands/deps.js";
import { infoCommand } from "../src/commands/info.js";
import { installedCommand } from "../src/commands/installed.js";
import { outdatedCommand } from "../src/commands/outdated.js";

const execFileAsync = promisify(execFile);

async function networkReachable(): Promise<boolean> {
  try {
    const response = await fetch("https://formulae.brew.sh/api/formula/wget.json");
    return response.ok;
  } catch {
    return false;
  }
}

async function brewAvailable(): Promise<boolean> {
  try {
    await execFileAsync("brew", ["--version"]);
    return true;
  } catch {
    return false;
  }
}

describe("live: formulae.brew.sh", () => {
  it("info wget returns real formula data", async (ctx) => {
    if (!(await networkReachable())) {
      ctx.skip();
      return;
    }
    const out = await infoCommand(["wget"]);
    expect(out.name).toBe("wget");
    expect(typeof out.desc).toBe("string");
    expect(typeof out.version).toBe("string");
    expect(typeof out.depCount).toBe("number");
  });

  it("deps git returns real dependency data", async (ctx) => {
    if (!(await networkReachable())) {
      ctx.skip();
      return;
    }
    const out = await depsCommand(["git"]);
    expect(out.name).toBe("git");
    expect(typeof out.count).toBe("number");
    expect(out.count as number).toBeGreaterThan(0);
  });
});

describe("live: brew CLI", () => {
  it("outdated returns a well-shaped result against the real system", async (ctx) => {
    if (!(await brewAvailable())) {
      ctx.skip();
      return;
    }
    const out = await outdatedCommand();
    if (typeof out.outdated === "string") {
      expect(out.outdated).toBe("0 outdated");
    } else {
      expect(Array.isArray(out.outdated)).toBe(true);
      expect(typeof out.count).toBe("number");
    }
  });

  it("installed returns a well-shaped result against the real system", async (ctx) => {
    if (!(await brewAvailable())) {
      ctx.skip();
      return;
    }
    const out = await installedCommand();
    if (typeof out.installed === "string") {
      expect(out.installed).toBe("0 formulae or casks installed");
    } else {
      expect(typeof out.count).toBe("number");
      expect(out.formulae ?? out.casks).toBeDefined();
    }
  });
});
