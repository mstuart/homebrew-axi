import { brewExec } from "../brew.js";

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

export async function installedCommand(): Promise<Record<string, unknown>> {
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

  const out: Record<string, unknown> = { count: total };
  if (formulae.length > 0) out.formulae = formulae;
  if (casks.length > 0) out.casks = casks;
  out.help = [
    "Run `homebrew-axi outdated` to see which installed packages have updates",
    "Run `homebrew-axi info <name>` for details on a specific package",
  ];
  return out;
}
