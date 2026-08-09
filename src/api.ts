import { AxiError } from "axi-sdk-js";

const API_BASE = "https://formulae.brew.sh/api";

export interface FormulaJson {
  name: string;
  desc?: string;
  license?: string | null;
  homepage?: string;
  versions?: { stable?: string; head?: string | null; bottle?: boolean };
  dependencies?: string[];
  build_dependencies?: string[];
  caveats?: string | null;
  deprecated?: boolean;
  deprecation_reason?: string | null;
  disabled?: boolean;
  disable_reason?: string | null;
  analytics?: AnalyticsBlock;
}

export interface CaskJson {
  token: string;
  name?: string[];
  desc?: string;
  homepage?: string;
  version?: string;
  caveats?: string | null;
  deprecated?: boolean;
  deprecation_reason?: string | null;
  disabled?: boolean;
  disable_reason?: string | null;
  analytics?: AnalyticsBlock;
}

export type AnalyticsPeriod = "30d" | "90d" | "365d";

export interface AnalyticsBlock {
  install?: Partial<Record<AnalyticsPeriod, Record<string, number>>>;
}

function notFound(name: string, kind: "formula" | "cask"): AxiError {
  return new AxiError(`${kind} "${name}" not found`, "NOT_FOUND", [
    `Run \`homebrew-axi search "${name}"\` to find similar packages`,
  ]);
}

/** Single chokepoint for all formulae.brew.sh HTTP calls. */
async function getJson<T>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { headers: { accept: "application/json" } });
  } catch {
    throw new AxiError("could not reach formulae.brew.sh", "NETWORK", [
      "Check your network connection and try again",
    ]);
  }
  if (response.status === 404) {
    const error = new Error("HTTP 404") as Error & { status?: number };
    error.status = 404;
    throw error;
  }
  if (!response.ok) {
    throw new AxiError(
      `formulae.brew.sh returned HTTP ${response.status}`,
      "API_ERROR",
      ["Try again in a moment"],
    );
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw new AxiError(
      "formulae.brew.sh returned an unexpected response",
      "API_ERROR",
      ["Try again in a moment"],
    );
  }
}

/** Fetch a formula's JSON, translating a 404 into a NOT_FOUND AxiError. */
export async function fetchFormula(name: string): Promise<FormulaJson> {
  try {
    return await getJson<FormulaJson>(`${API_BASE}/formula/${encodeURIComponent(name)}.json`);
  } catch (error) {
    if (error instanceof AxiError) throw error;
    if ((error as { status?: number }).status === 404) throw notFound(name, "formula");
    throw new AxiError("formulae.brew.sh returned an unexpected error", "API_ERROR", [
      "Try again in a moment",
    ]);
  }
}

/** Fetch a cask's JSON, translating a 404 into a NOT_FOUND AxiError. */
export async function fetchCask(token: string): Promise<CaskJson> {
  try {
    return await getJson<CaskJson>(`${API_BASE}/cask/${encodeURIComponent(token)}.json`);
  } catch (error) {
    if (error instanceof AxiError) throw error;
    if ((error as { status?: number }).status === 404) throw notFound(token, "cask");
    throw new AxiError("formulae.brew.sh returned an unexpected error", "API_ERROR", [
      "Try again in a moment",
    ]);
  }
}

/**
 * Sum an analytics install block for `name` over `period`. The API keys
 * install counts per invocation form (e.g. "wget" and "wget --HEAD"), so this
 * sums every key belonging to the package rather than assuming a single exact
 * match.
 */
export function installsForPeriod(
  analytics: AnalyticsBlock | undefined,
  period: AnalyticsPeriod,
  name: string,
): number | undefined {
  const bucket = analytics?.install?.[period];
  if (!bucket) return undefined;

  let total = 0;
  let found = false;
  for (const [key, count] of Object.entries(bucket)) {
    if (key === name || key.startsWith(`${name} `)) {
      total += count;
      found = true;
    }
  }
  return found ? total : undefined;
}
