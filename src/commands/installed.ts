import { AxiError } from "axi-sdk-js";
import { assertKnownFlags, parseFlags, parseLimit, splitByLimit } from "../args.js";
import { brewExec } from "../brew.js";

const USAGE = "homebrew-axi installed [--limit N]";
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

export interface InstalledRow {
  name: string;
  version: string;
}

function parseVersionsOutput(text: string): InstalledRow[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [name, ...versions] = line.split(/\s+/);
      return { name, version: versions.join(", ") || "unknown" };
    });
}

export async function installedCommand(args: string[] = []): Promise<Record<string, unknown>> {
  const { positionals, flags } = parseFlags(args);
  assertKnownFlags(flags, ["limit"], USAGE);
  if (positionals.length > 0) {
    throw new AxiError(`unexpected argument "${positionals[0]}"`, "VALIDATION_ERROR", [USAGE]);
  }

  const limit = parseLimit(flags.limit, DEFAULT_LIMIT, MAX_LIMIT);
  const [formulaeOut, caskOut] = await Promise.all([
    brewExec(["list", "--versions"]),
    brewExec(["list", "--cask", "--versions"]),
  ]);

  const formulae = parseVersionsOutput(formulaeOut);
  const casks = parseVersionsOutput(caskOut);
  const total = formulae.length + casks.length;

  if (total === 0) {
    return { installed: "0 formulae or casks installed" };
  }

  const { first: formulaeShown, second: casksShown } = splitByLimit(formulae, casks, limit);
  const shown = formulaeShown.length + casksShown.length;

  const out: Record<string, unknown> = {
    count: shown === total ? total : `${shown} of ${total} total`,
  };
  if (formulaeShown.length > 0) out.formulae = formulaeShown;
  if (casksShown.length > 0) out.casks = casksShown;

  const help = [
    "Run `homebrew-axi outdated` to see which installed packages have updates",
    "Run `homebrew-axi info <name>` for details on a specific package",
  ];
  if (shown < total && limit < MAX_LIMIT) {
    const more = Math.min(limit + 50, MAX_LIMIT);
    help.push(`Run \`homebrew-axi installed --limit ${more}\` for more results`);
  }
  out.help = help;
  return out;
}
