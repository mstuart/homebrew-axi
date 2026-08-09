import { fetchOutdated } from "../outdated.js";

export async function outdatedCommand(): Promise<Record<string, unknown>> {
  const { formulae, casks } = await fetchOutdated();
  const rows = [...formulae, ...casks];

  if (rows.length === 0) {
    return { outdated: "0 outdated" };
  }

  return {
    count: rows.length,
    outdated: rows,
    help: ["Run `homebrew-axi info <name>` for details on a specific package"],
  };
}
