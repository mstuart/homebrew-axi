import { AxiError } from "axi-sdk-js";
import { assertKnownFlags, parseFlags, parseLimit } from "../args.js";
import { fetchOutdated } from "../outdated.js";

const USAGE = "homebrew-axi outdated [--limit N]";
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

export async function outdatedCommand(
  args: string[] = []
): Promise<Record<string, unknown>> {
  const { positionals, flags } = parseFlags(args);
  assertKnownFlags(flags, ["limit"], USAGE);
  if (positionals.length > 0) {
    throw new AxiError(
      `unexpected argument "${positionals[0]}"`,
      "VALIDATION_ERROR",
      [USAGE]
    );
  }

  const limit = parseLimit(flags.limit, DEFAULT_LIMIT, MAX_LIMIT);
  const { formulae, casks } = await fetchOutdated();
  const rows = [...formulae, ...casks];

  if (rows.length === 0) {
    return { outdated: "0 outdated" };
  }

  const shown = rows.slice(0, limit);
  const help = [
    "Run `homebrew-axi info <name>` for details on a specific package",
  ];
  if (shown.length < rows.length && limit < MAX_LIMIT) {
    const more = Math.min(limit + 50, MAX_LIMIT);
    help.push(`Run \`homebrew-axi outdated --limit ${more}\` for more results`);
  }

  return {
    count:
      shown.length === rows.length
        ? rows.length
        : `${shown.length} of ${rows.length} total`,
    help,
    outdated: shown,
  };
}
