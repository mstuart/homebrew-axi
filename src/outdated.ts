import { brewJson } from "./brew.js";

export interface OutdatedRow {
  name: string;
  installed: string;
  latest: string;
}

interface OutdatedEntry {
  name: string;
  installed_versions: string[];
  current_version: string;
}

interface OutdatedV2 {
  formulae: OutdatedEntry[];
  casks: OutdatedEntry[];
}

function toRow(entry: OutdatedEntry): OutdatedRow {
  return {
    name: entry.name,
    installed: entry.installed_versions.join(", "),
    latest: entry.current_version,
  };
}

/** Shared `brew outdated --json=v2` fetch + shape, used by `home` and `outdated`. */
export async function fetchOutdated(): Promise<{ formulae: OutdatedRow[]; casks: OutdatedRow[] }> {
  const data = await brewJson<OutdatedV2>(["outdated", "--json=v2"]);
  return {
    formulae: data.formulae.map(toRow),
    casks: data.casks.map(toRow),
  };
}
