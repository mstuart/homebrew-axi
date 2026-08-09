import { AxiError } from "axi-sdk-js";
import {
  fetchCask,
  fetchFormula,
  installsForPeriod,
  type CaskJson,
  type FormulaJson,
} from "../api.js";
import { assertKnownFlags, parseFlags } from "../args.js";
import { collapseWhitespace } from "../format.js";

const USAGE = "homebrew-axi info <name> [--cask] [--full] [--fields a,b,c]";
const DESC_PREVIEW = 600;
const CAVEATS_PREVIEW = 300;

export async function infoCommand(args: string[]): Promise<Record<string, unknown>> {
  const { positionals, flags } = parseFlags(args, ["full", "cask"]);
  assertKnownFlags(flags, ["full", "cask", "fields"], USAGE);
  const name = positionals[0];
  if (!name) {
    throw new AxiError("a package name is required", "VALIDATION_ERROR", [USAGE]);
  }

  const full = flags.full === true;
  const fields = parseFields(flags.fields);
  return flags.cask === true
    ? formatCask(await fetchCask(name), full, fields)
    : formatFormula(await fetchFormula(name), full, fields);
}

function parseFields(value: string | boolean | undefined): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((field) => field.trim())
    .filter((field) => field.length > 0);
}

function withDescription(
  out: Record<string, unknown>,
  help: string[],
  name: string,
  desc: string | undefined,
  full: boolean,
): void {
  if (!desc) return;
  const collapsed = collapseWhitespace(desc);
  if (full || collapsed.length <= DESC_PREVIEW) {
    out.desc = collapsed;
    return;
  }
  out.desc = `${collapsed.slice(0, DESC_PREVIEW).trimEnd()} …`;
  out.descChars = collapsed.length;
  help.push(`Run \`homebrew-axi info ${name} --full\` for the complete description`);
}

function withCaveats(
  out: Record<string, unknown>,
  help: string[],
  name: string,
  caskFlag: boolean,
  caveats: string | null | undefined,
  full: boolean,
): void {
  if (!caveats) return;
  const collapsed = collapseWhitespace(caveats);
  if (full) {
    out.caveats = caveats.trim();
    return;
  }
  if (collapsed.length <= CAVEATS_PREVIEW) {
    out.caveats = collapsed;
    return;
  }
  out.caveats = `${collapsed.slice(0, CAVEATS_PREVIEW).trimEnd()} …`;
  help.push(
    `Run \`homebrew-axi info ${name}${caskFlag ? " --cask" : ""} --full\` to see the complete caveats`,
  );
}

function withLifecycleFlags(
  out: Record<string, unknown>,
  data: Pick<
    FormulaJson | CaskJson,
    "deprecated" | "deprecation_reason" | "disabled" | "disable_reason"
  >,
): void {
  if (data.deprecated) {
    out.deprecated = data.deprecation_reason ? data.deprecation_reason : true;
  }
  if (data.disabled) {
    out.disabled = data.disable_reason ? data.disable_reason : true;
  }
}

function withInstalls(out: Record<string, unknown>, data: FormulaJson | CaskJson, name: string): void {
  const installs30d = installsForPeriod(data.analytics, "30d", name);
  const installs90d = installsForPeriod(data.analytics, "90d", name);
  const installs365d = installsForPeriod(data.analytics, "365d", name);
  if (installs30d !== undefined) out.installs30d = installs30d;
  if (installs90d !== undefined) out.installs90d = installs90d;
  if (installs365d !== undefined) out.installs365d = installs365d;
}

/** Opt-in fields beyond the default schema, requested via `--fields a,b,c`. */
function withFields(
  out: Record<string, unknown>,
  data: Record<string, unknown>,
  fields: string[],
): void {
  for (const field of fields) {
    if (field in out) continue;
    const value = data[field];
    if (value !== undefined) out[field] = value;
  }
}

function formatFormula(formula: FormulaJson, full: boolean, fields: string[]): Record<string, unknown> {
  const help: string[] = [];
  const out: Record<string, unknown> = { name: formula.name };
  withDescription(out, help, formula.name, formula.desc, full);
  if (formula.homepage) out.homepage = formula.homepage;
  if (formula.license) out.license = formula.license;
  if (formula.versions?.stable) out.version = formula.versions.stable;

  const depCount = (formula.dependencies?.length ?? 0) + (formula.build_dependencies?.length ?? 0);
  out.depCount = depCount;

  withInstalls(out, formula, formula.name);
  withLifecycleFlags(out, formula);
  withCaveats(out, help, formula.name, false, formula.caveats, full);
  withFields(out, formula, fields);

  if (depCount > 0) {
    help.push(`Run \`homebrew-axi deps ${formula.name}\` to see the dependency breakdown`);
  }
  if (help.length > 0) out.help = help;
  return out;
}

function formatCask(cask: CaskJson, full: boolean, fields: string[]): Record<string, unknown> {
  const help: string[] = [];
  const out: Record<string, unknown> = { name: cask.token };
  if (cask.name && cask.name.length > 0) out.title = cask.name[0];
  withDescription(out, help, cask.token, cask.desc, full);
  if (cask.homepage) out.homepage = cask.homepage;
  if (cask.version) out.version = cask.version;

  withInstalls(out, cask, cask.token);
  withLifecycleFlags(out, cask);
  withCaveats(out, help, cask.token, true, cask.caveats, full);
  withFields(out, cask, fields);

  if (help.length > 0) out.help = help;
  return out;
}
