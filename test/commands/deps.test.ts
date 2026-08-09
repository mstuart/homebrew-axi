import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { depsCommand } from "../../src/commands/deps.js";
import { mockFetch } from "../helpers.js";

afterEach(() => vi.unstubAllGlobals());

function fixture(name: string): unknown {
  return JSON.parse(
    readFileSync(fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url)), "utf-8"),
  );
}

describe("deps", () => {
  it("splits build vs runtime dependencies with a total count", async () => {
    mockFetch({ "formula/wget.json": { json: fixture("wget-formula.json") } });
    const out = await depsCommand(["wget"]);
    expect(out.count).toBe(6);
    expect(out.buildDependencies).toEqual(["pkgconf"]);
    expect(out.dependencies).toEqual([
      "libidn2",
      "libpsl",
      "openssl@3",
      "gettext",
      "libunistring",
    ]);
  });

  it("returns a definitive empty state when there are no dependencies", async () => {
    mockFetch({
      "formula/nodeps.json": {
        json: { name: "nodeps", dependencies: [], build_dependencies: [] },
      },
    });
    const out = await depsCommand(["nodeps"]);
    expect(out.dependencies).toBe("0 dependencies for nodeps");
  });

  it("requires a formula name", async () => {
    await expect(depsCommand([])).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("rejects unknown flags", async () => {
    await expect(depsCommand(["wget", "--cask"])).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("translates a 404 into NOT_FOUND", async () => {
    mockFetch({ "formula/nope.json": { status: 404 } });
    await expect(depsCommand(["nope"])).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
