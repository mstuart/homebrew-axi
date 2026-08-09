import { execFile } from "node:child_process";
import { AxiError } from "axi-sdk-js";

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

const MAX_BUFFER_BYTES = 10 * 1024 * 1024; // 10 MB

// Read-only subcommands this tool is allowed to invoke. This is a defense-in-depth
// guarantee, not just call-site discipline: `brew()` refuses anything outside this
// set, so a mutating command (install/upgrade/uninstall/tap/pin/...) can never reach
// the `brew` CLI even by future accident.
const ALLOWED_SUBCOMMANDS = new Set([
  "outdated",
  "list",
  "search",
  "info",
  "--version",
]);

function assertReadOnly(args: string[]): void {
  const subcommand = args[0];
  if (!subcommand || !ALLOWED_SUBCOMMANDS.has(subcommand)) {
    throw new Error(
      `homebrew-axi refuses to run non-read-only brew subcommand: ${JSON.stringify(args)}`,
    );
  }
}

function toExecResult(
  resolve: (result: ExecResult) => void,
): (error: Error | null, stdout: string, stderr: string) => void {
  return (error, stdout, stderr) => {
    if (error && (error as NodeJS.ErrnoException).code === "ENOENT") {
      resolve({ stdout: "", stderr: "ENOENT", exitCode: 127 });
      return;
    }
    const exitCode = error
      ? ((error as Error & { code?: string | number }).code ?? 1)
      : 0;
    resolve({
      stdout: stdout ?? "",
      stderr: stderr ?? "",
      exitCode: typeof exitCode === "number" ? exitCode : 1,
    });
  };
}

/** Single chokepoint for all `brew` CLI invocations. Read-only subcommands only. */
function run(args: string[]): Promise<ExecResult> {
  assertReadOnly(args);
  return new Promise((resolve) => {
    execFile("brew", args, { maxBuffer: MAX_BUFFER_BYTES }, toExecResult(resolve));
  });
}

export function brewMissingError(): AxiError {
  return new AxiError("Homebrew is not installed", "BREW_MISSING", [
    "Install from https://brew.sh",
  ]);
}

/** True when brew's failure just means "no matches", not a real error. */
export function isNoMatchesError(stderr: string): boolean {
  return /No formulae or casks found|No available formula|No formulae found/i.test(stderr);
}

export function mapBrewError(stderr: string, exitCode: number): AxiError {
  const firstLine = stderr.trim().split("\n")[0] ?? "";

  if (isNoMatchesError(stderr)) {
    return new AxiError(firstLine || "not found", "NOT_FOUND");
  }
  if (/No such keg|is not installed/i.test(stderr)) {
    return new AxiError(firstLine || "package is not installed", "NOT_FOUND");
  }

  return new AxiError(firstLine || `brew exited with code ${exitCode}`, "UNKNOWN");
}

/** Execute `brew` and return parsed JSON. */
export async function brewJson<T = unknown>(args: string[]): Promise<T> {
  const result = await run(args);
  if (result.stderr === "ENOENT") throw brewMissingError();
  if (result.exitCode !== 0) throw mapBrewError(result.stderr, result.exitCode);
  try {
    return JSON.parse(result.stdout) as T;
  } catch {
    throw new AxiError(`Unexpected brew output: ${result.stdout.slice(0, 200)}`, "UNKNOWN");
  }
}

/** Execute `brew` and return raw stdout. */
export async function brewExec(args: string[]): Promise<string> {
  const result = await run(args);
  if (result.stderr === "ENOENT") throw brewMissingError();
  if (result.exitCode !== 0) throw mapBrewError(result.stderr, result.exitCode);
  return result.stdout;
}

/**
 * Execute `brew` without throwing on a non-zero exit. Used where "no matches"
 * legitimately exits non-zero (e.g. `brew search`) and callers need to tell
 * that apart from a real failure themselves.
 */
export async function brewRaw(args: string[]): Promise<ExecResult> {
  const result = await run(args);
  if (result.stderr === "ENOENT") throw brewMissingError();
  return result;
}

/** Whether `brew` is reachable on PATH at all, without throwing. */
export async function isBrewInstalled(): Promise<boolean> {
  const result = await run(["--version"]);
  return result.stderr !== "ENOENT";
}
