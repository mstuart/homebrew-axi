import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { infoCommand } from "../../src/commands/info.js";
import { mockFetch } from "../helpers.js";

afterEach(() => vi.unstubAllGlobals());

function fixture(name: string): unknown {
  return JSON.parse(
    readFileSync(
      fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url)),
      "utf-8"
    )
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
    expect(out.installs30d).toBe(17_317);
    expect(out.installs90d).toBe(59_331);
    expect(out.installs365d).toBe(336_001);
    expect(out.deprecated).toBeUndefined();
    expect(out.disabled).toBeUndefined();
  });

  it("truncates a long description and hints --full", async () => {
    const longDesc = "word ".repeat(200); // ~1000 chars
    mockFetch({
      "formula/longdesc.json": { json: { desc: longDesc, name: "longdesc" } },
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
      "formula/longdesc.json": { json: { desc: longDesc, name: "longdesc" } },
    });
    const out = await infoCommand(["longdesc", "--full"]);
    expect(out.descChars).toBeUndefined();
  });

  it("shows short caveats inline without needing --full", async () => {
    mockFetch({
      "formula/withcaveats.json": {
        json: { caveats: "Some setup instructions.", name: "withcaveats" },
      },
    });
    const out = await infoCommand(["withcaveats"]);
    expect(out.caveats).toBe("Some setup instructions.");
    expect(out.help).toBeUndefined();
  });

  it("truncates long caveats to a preview and hints --full", async () => {
    const longCaveats = "word ".repeat(100); // ~500 chars
    mockFetch({
      "formula/longcaveats.json": {
        json: { caveats: longCaveats, name: "longcaveats" },
      },
    });
    const out = await infoCommand(["longcaveats"]);
    expect((out.caveats as string).endsWith("…")).toBe(true);
    expect((out.caveats as string).length).toBeLessThan(longCaveats.length);
    expect(out.help).toContain(
      "Run `homebrew-axi info longcaveats --full` to see the complete caveats"
    );

    const full = await infoCommand(["longcaveats", "--full"]);
    expect(full.caveats).toBe(longCaveats.trim());
    expect(full.help).toBeUndefined();
  });

  it("surfaces deprecated and disabled reasons", async () => {
    mockFetch({
      "formula/dep.json": {
        json: {
          deprecated: true,
          deprecation_reason: "unmaintained",
          disable_reason: "does not build",
          disabled: true,
          name: "dep",
        },
      },
    });
    const out = await infoCommand(["dep"]);
    expect(out.deprecated).toBe("unmaintained");
    expect(out.disabled).toBe("does not build");
  });

  it("opts into extra fields beyond the default schema via --fields", async () => {
    mockFetch({
      "formula/extra.json": {
        json: { aliases: ["ex"], desc: "d", keg_only: true, name: "extra" },
      },
    });
    const out = await infoCommand([
      "extra",
      "--fields",
      "aliases,keg_only,missing_field",
    ]);
    expect(out.aliases).toEqual(["ex"]);
    expect(out.keg_only).toBe(true);
    expect(out.missing_field).toBeUndefined();
  });

  it("does not let --fields override an already-populated default field", async () => {
    mockFetch({
      "formula/extra2.json": { json: { desc: "real desc", name: "extra2" } },
    });
    const out = await infoCommand(["extra2", "--fields", "desc"]);
    expect(out.desc).toBe("real desc");
  });

  it("requires a package name", async () => {
    await expect(infoCommand([])).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("rejects unknown flags", async () => {
    await expect(infoCommand(["wget", "--verbose"])).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("translates a 404 into NOT_FOUND", async () => {
    mockFetch({ "formula/nope.json": { status: 404 } });
    await expect(infoCommand(["nope"])).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("info (cask)", () => {
  it("fetches the cask endpoint and returns cask-shaped fields", async () => {
    mockFetch({
      "cask/visual-studio-code.json": { json: fixture("vscode-cask.json") },
    });
    const out = await infoCommand(["visual-studio-code", "--cask"]);
    expect(out.name).toBe("visual-studio-code");
    expect(out.title).toBe("Microsoft Visual Studio Code");
    expect(out.version).toBe("1.132.0");
    expect(out.depCount).toBeUndefined();
    expect(out.license).toBeUndefined();
  });
});
