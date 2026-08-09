import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { infoCommand } from "../../src/commands/info.js";
import { mockFetch } from "../helpers.js";

afterEach(() => vi.unstubAllGlobals());

function fixture(name: string): unknown {
  return JSON.parse(
    readFileSync(fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url)), "utf-8"),
  );
}

describe("info (formula)", () => {
  it("returns core fields plus install analytics and dep count", async () => {
    mockFetch({ "formula/wget.json": { json: fixture("wget-formula.json") } });
    const out = await infoCommand(["wget"]);
    expect(out.name).toBe("wget");
    expect(out.desc).toBe("Internet file retriever");
    expect(out.license).toBe("GPL-3.0-or-later");
    expect(out.version).toBe("1.25.0");
    expect(out.depCount).toBe(6);
    expect(out.installs30d).toBe(17317);
    expect(out.installs90d).toBe(59331);
    expect(out.installs365d).toBe(336001);
    expect(out.deprecated).toBeUndefined();
    expect(out.disabled).toBeUndefined();
  });

  it("truncates a long description and hints --full", async () => {
    const longDesc = "word ".repeat(200); // ~1000 chars
    mockFetch({
      "formula/longdesc.json": { json: { name: "longdesc", desc: longDesc } },
    });
    const out = await infoCommand(["longdesc"]);
    expect((out.desc as string).endsWith("…")).toBe(true);
    expect(out.descChars).toBeGreaterThan(600);
    expect(out.help).toEqual([
      "Run `homebrew-axi info longdesc --full` for the complete description",
    ]);
  });

  it("returns the full description with --full and no truncation hint", async () => {
    const longDesc = "word ".repeat(200);
    mockFetch({
      "formula/longdesc.json": { json: { name: "longdesc", desc: longDesc } },
    });
    const out = await infoCommand(["longdesc", "--full"]);
    expect(out.descChars).toBeUndefined();
  });

  it("omits caveats unless --full, and hints when caveats exist", async () => {
    mockFetch({
      "formula/withcaveats.json": {
        json: { name: "withcaveats", caveats: "Some setup instructions." },
      },
    });
    const out = await infoCommand(["withcaveats"]);
    expect(out.caveats).toBeUndefined();
    expect(out.help).toContain(
      "Run `homebrew-axi info withcaveats --full` to see caveats",
    );

    const full = await infoCommand(["withcaveats", "--full"]);
    expect(full.caveats).toBe("Some setup instructions.");
  });

  it("surfaces deprecated and disabled reasons", async () => {
    mockFetch({
      "formula/dep.json": {
        json: {
          name: "dep",
          deprecated: true,
          deprecation_reason: "unmaintained",
          disabled: true,
          disable_reason: "does not build",
        },
      },
    });
    const out = await infoCommand(["dep"]);
    expect(out.deprecated).toBe("unmaintained");
    expect(out.disabled).toBe("does not build");
  });

  it("requires a package name", async () => {
    await expect(infoCommand([])).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("rejects unknown flags", async () => {
    await expect(infoCommand(["wget", "--verbose"])).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("translates a 404 into NOT_FOUND", async () => {
    mockFetch({ "formula/nope.json": { status: 404 } });
    await expect(infoCommand(["nope"])).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("info (cask)", () => {
  it("fetches the cask endpoint and returns cask-shaped fields", async () => {
    mockFetch({ "cask/visual-studio-code.json": { json: fixture("vscode-cask.json") } });
    const out = await infoCommand(["visual-studio-code", "--cask"]);
    expect(out.name).toBe("visual-studio-code");
    expect(out.title).toBe("Microsoft Visual Studio Code");
    expect(out.version).toBe("1.132.0");
    expect(out.depCount).toBeUndefined();
    expect(out.license).toBeUndefined();
  });
});
