import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const builtBin = join(repoRoot, "dist", "bin", "homebrew-axi.js");
const packageVersion = (
  JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as {
    version: string;
  }
).version;

let tempRoot = "";
let tarballPath = "";

function npmCommand(): string {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function npxCommand(): string {
  return process.platform === "win32" ? "npx.cmd" : "npx";
}

function installedBin(prefix: string): string {
  const binDirectory = process.platform === "win32" ? "" : "bin";
  const binaryName =
    process.platform === "win32" ? "homebrew-axi.cmd" : "homebrew-axi";
  return join(prefix, binDirectory, binaryName);
}

describe("packaged CLI smoke", () => {
  beforeAll(() => {
    tempRoot = mkdtempSync(join(tmpdir(), "homebrew-axi-package-smoke-"));
    execFileSync(npmCommand(), ["run", "build"], {
      cwd: repoRoot,
      stdio: "ignore",
    });
    const tarball = execFileSync(
      npmCommand(),
      ["pack", "--pack-destination", tempRoot, "--silent"],
      { cwd: repoRoot, encoding: "utf8" }
    ).trim();
    tarballPath = join(tempRoot, tarball);
  }, 120_000);

  afterAll(() => {
    if (tempRoot) {
      rmSync(tempRoot, { force: true, recursive: true });
    }
  });

  it("prints the package version after a packed global install", () => {
    const prefix = join(tempRoot, "global-prefix");
    execFileSync(
      npmCommand(),
      ["install", "--global", "--prefix", prefix, tarballPath],
      {
        cwd: repoRoot,
        stdio: "ignore",
      }
    );

    const stdout = execFileSync(installedBin(prefix), ["--version"], {
      encoding: "utf8",
    });

    expect(stdout).toBe(`${packageVersion}\n`);
  }, 120_000);

  it("prints the package version through npx --package", () => {
    const stdout = execFileSync(
      npxCommand(),
      ["--yes", "--package", tarballPath, "homebrew-axi", "--version"],
      {
        cwd: repoRoot,
        encoding: "utf8",
        env: { ...process.env, npm_config_cache: join(tempRoot, "npx-cache") },
      }
    );

    expect(stdout).toBe(`${packageVersion}\n`);
  }, 120_000);

  it("returns a structured BREW_MISSING error when PATH has no brew", () => {
    const result = spawnSync(process.execPath, [builtBin, "installed"], {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, PATH: "" },
    });

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toContain("BREW_MISSING");
  });
});
