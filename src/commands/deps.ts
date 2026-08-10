import { AxiError } from "axi-sdk-js";
import { fetchFormula } from "../api.js";
import { assertKnownFlags, parseFlags } from "../args.js";

const USAGE = "homebrew-axi deps <name>";

export async function depsCommand(
  args: string[]
): Promise<Record<string, unknown>> {
  const { positionals, flags } = parseFlags(args);
  assertKnownFlags(flags, [], USAGE);
  const [name] = positionals;
  if (!name) {
    throw new AxiError("a formula name is required", "VALIDATION_ERROR", [
      USAGE,
    ]);
  }

  const formula = await fetchFormula(name);
  const buildDependencies = formula.build_dependencies ?? [];
  const dependencies = formula.dependencies ?? [];
  const total = buildDependencies.length + dependencies.length;

  if (total === 0) {
    return { dependencies: `0 dependencies for ${formula.name}` };
  }

  const out: Record<string, unknown> = { count: total, name: formula.name };
  if (buildDependencies.length > 0) {
    out.buildDependencies = buildDependencies;
  }
  if (dependencies.length > 0) {
    out.dependencies = dependencies;
  }
  return out;
}
