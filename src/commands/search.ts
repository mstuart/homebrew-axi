import { AxiError } from "axi-sdk-js";
import {
  assertKnownFlags,
  parseFlags,
  parseLimit,
  splitByLimit,
} from "../args.js";
import { brewRaw, isNoMatchesError, mapBrewError } from "../brew.js";

const USAGE = 'homebrew-axi search "<query>" [--limit N]';
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 250;

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
async function searchScope(
  scope: "--formula" | "--cask",
  query: string
): Promise<string[]> {
  const result = await brewRaw(["search", scope, query]);
  if (result.exitCode === 0) {
    return parseNames(result.stdout);
  }
  if (isNoMatchesError(result.stderr)) {
    return [];
  }
  throw mapBrewError(result.stderr, result.exitCode);
}

export async function searchCommand(
  args: string[]
): Promise<Record<string, unknown>> {
  const { positionals, flags } = parseFlags(args);
  assertKnownFlags(flags, ["limit"], USAGE);
  const query = positionals.join(" ").trim();
  if (!query) {
    throw new AxiError("a search query is required", "VALIDATION_ERROR", [
      USAGE,
    ]);
  }

  const limit = parseLimit(flags.limit, DEFAULT_LIMIT, MAX_LIMIT);
  const [formulae, casks] = await Promise.all([
    searchScope("--formula", query),
    searchScope("--cask", query),
  ]);
  const total = formulae.length + casks.length;

  if (total === 0) {
    return { packages: `0 packages found for "${query}"` };
  }

  const { first: formulaeShown, second: casksShown } = splitByLimit(
    formulae,
    casks,
    limit
  );
  const shown = formulaeShown.length + casksShown.length;

  const out: Record<string, unknown> = {
    count: shown === total ? total : `${shown} of ${total} total`,
  };
  if (formulaeShown.length > 0) {
    out.formulae = formulaeShown;
  }
  if (casksShown.length > 0) {
    out.casks = casksShown;
  }

  const help = [
    "Run `homebrew-axi info <name>` for details on a specific package",
  ];
  if (shown < total && limit < MAX_LIMIT) {
    const more = Math.min(limit + 30, MAX_LIMIT);
    help.push(
      `Run \`homebrew-axi search "${query}" --limit ${more}\` for more results`
    );
  }
  out.help = help;
  return out;
}
