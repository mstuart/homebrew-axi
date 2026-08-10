import { brewJson } from "./brew.js";

export interface OutdatedRow {
  installed: string;
  latest: string;
  name: string;
}

interface OutdatedEntry {
  current_version: string;
  installed_versions: string[];
  name: string;
}

interface OutdatedV2 {
  casks: OutdatedEntry[];
  formulae: OutdatedEntry[];
}

function toRow(entry: OutdatedEntry): OutdatedRow {
  return {
    installed: entry.installed_versions.join(", "),
    latest: entry.current_version,
    name: entry.name,
  };
}

/** Shared `brew outdated --json=v2` fetch + shape, used by `home` and `outdated`. */
export async function fetchOutdated(): Promise<{
  formulae: OutdatedRow[];
  casks: OutdatedRow[];
}> {
  const data = await brewJson<OutdatedV2>(["outdated", "--json=v2"]);
  return {
    casks: data.casks.map(toRow),
    formulae: data.formulae.map(toRow),
  };
}
