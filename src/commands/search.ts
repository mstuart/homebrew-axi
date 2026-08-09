import { AxiError } from "axi-sdk-js";
import { parseFlags } from "../args.js";
import { brewRaw, isNoMatchesError, mapBrewError } from "../brew.js";

function parseNames(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * `brew search --formula|--cask <query>` exits non-zero (with a "no matches"
 * message) when a scope has zero results, even though that's a normal empty
 * result for this command — so it's shaped here rather than via `brewExec`.
 */
async function searchScope(scope: "--formula" | "--cask", query: string): Promise<string[]> {
  const result = await brewRaw(["search", scope, query]);
  if (result.exitCode === 0) return parseNames(result.stdout);
  if (isNoMatchesError(result.stderr)) return [];
  throw mapBrewError(result.stderr, result.exitCode);
}

export async function searchCommand(args: string[]): Promise<Record<string, unknown>> {
  const { positionals } = parseFlags(args);
  const query = positionals.join(" ").trim();
  if (!query) {
    throw new AxiError("a search query is required", "VALIDATION_ERROR", [
      'homebrew-axi search "<query>"',
    ]);
  }

  const [formulae, casks] = await Promise.all([
    searchScope("--formula", query),
    searchScope("--cask", query),
  ]);
  const total = formulae.length + casks.length;

  if (total === 0) {
    return { packages: `0 packages found for "${query}"` };
  }

  const out: Record<string, unknown> = { count: total };
  if (formulae.length > 0) out.formulae = formulae;
  if (casks.length > 0) out.casks = casks;
  out.help = ["Run `homebrew-axi info <name>` for details on a specific package"];
  return out;
}
