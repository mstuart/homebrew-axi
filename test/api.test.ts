import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCask, fetchFormula, installsForPeriod } from "../src/api.js";
import { mockFetch } from "./helpers.js";

afterEach(() => vi.unstubAllGlobals());

function fixture(name: string): unknown {
  return JSON.parse(
    readFileSync(fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)), "utf-8"),
  );
}

describe("fetchFormula", () => {
  it("returns the parsed formula JSON", async () => {
    mockFetch({ "formula/wget.json": { json: fixture("wget-formula.json") } });
    const formula = await fetchFormula("wget");
    expect(formula.name).toBe("wget");
    expect(formula.desc).toBe("Internet file retriever");
    expect(formula.versions?.stable).toBe("1.25.0");
    expect(formula.dependencies).toContain("libidn2");
    expect(formula.build_dependencies).toEqual(["pkgconf"]);
  });

  it("returns a formula with a compound SPDX license string (git)", async () => {
    mockFetch({ "formula/git.json": { json: fixture("git-formula.json") } });
    const formula = await fetchFormula("git");
    expect(formula.name).toBe("git");
    expect(formula.build_dependencies).toEqual(["gettext", "pkgconf"]);
    expect(formula.dependencies).toEqual(["pcre2", "gettext"]);
    expect(formula.license).toContain("MIT");
  });

  it("translates a 404 into NOT_FOUND", async () => {
    mockFetch({ "formula/nope.json": { status: 404 } });
    await expect(fetchFormula("nope")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("translates a network failure into NETWORK", async () => {
    mockFetch({ "formula/wget.json": { reject: true } });
    await expect(fetchFormula("wget")).rejects.toMatchObject({ code: "NETWORK" });
  });

  it("translates a non-404 non-ok response into API_ERROR", async () => {
    mockFetch({ "formula/wget.json": { status: 500 } });
    await expect(fetchFormula("wget")).rejects.toMatchObject({ code: "API_ERROR" });
  });
});

describe("fetchCask", () => {
  it("returns the parsed cask JSON", async () => {
    mockFetch({ "cask/visual-studio-code.json": { json: fixture("vscode-cask.json") } });
    const cask = await fetchCask("visual-studio-code");
    expect(cask.token).toBe("visual-studio-code");
    expect(cask.version).toBe("1.132.0");
    expect(cask.name?.[0]).toBe("Microsoft Visual Studio Code");
  });

  it("translates a 404 into NOT_FOUND", async () => {
    mockFetch({ "cask/nope.json": { status: 404 } });
    await expect(fetchCask("nope")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("installsForPeriod", () => {
  it("sums every key belonging to the package name", () => {
    const analytics = { install: { "30d": { wget: 17288, "wget --HEAD": 29 } } };
    expect(installsForPeriod(analytics, "30d", "wget")).toBe(17317);
  });

  it("returns undefined when the period is missing", () => {
    expect(installsForPeriod({ install: {} }, "30d", "wget")).toBeUndefined();
    expect(installsForPeriod(undefined, "30d", "wget")).toBeUndefined();
  });
});
