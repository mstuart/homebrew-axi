import { AxiError } from "axi-sdk-js";
import { brewExec } from "./brew.js";
import { fetchOutdated, type OutdatedRow } from "./outdated.js";

const HELP = [
  "Run `homebrew-axi info <name>` for formula or cask details",
  "Run `homebrew-axi deps <name>` to list a formula's dependencies",
  "Run `homebrew-axi outdated` to see outdated installed packages",
  "Run `homebrew-axi installed` to list every installed formula and cask",
  'Run `homebrew-axi search "<query>"` to find packages',
];

const HOME_OUTDATED_CAP = 10;

function countLines(text: string): number {
  return text.split("\n").filter((line) => line.trim().length > 0).length;
}

export async function homeCommand(): Promise<Record<string, unknown>> {
  let outdated: { formulae: OutdatedRow[]; casks: OutdatedRow[] };
  let formulaeList: string;
  let caskList: string;
  try {
    [outdated, formulaeList, caskList] = await Promise.all([
      fetchOutdated(),
      brewExec(["list", "--versions"]),
      brewExec(["list", "--cask", "--versions"]),
    ]);
  } catch (error) {
    if (error instanceof AxiError && error.code === "BREW_MISSING") {
      return { help: HELP };
    }
    throw error;
  }

  const rows = [...outdated.formulae, ...outdated.casks];
  const totalInstalled = countLines(formulaeList) + countLines(caskList);

  const out: Record<string, unknown> = {
    count: `${rows.length} of ${totalInstalled} installed are outdated`,
  };
  if (rows.length > 0) {
    out.outdated = rows.slice(0, HOME_OUTDATED_CAP);
  }

  const help = [...HELP];
  if (rows.length > HOME_OUTDATED_CAP) {
    help.unshift(`Run \`homebrew-axi outdated\` to see all ${rows.length} outdated packages`);
  }
  out.help = help;
  return out;
}
