import { AxiError, installSessionStartHooks } from "axi-sdk-js";

export async function setupCommand(
  args: string[]
): Promise<Record<string, unknown>> {
  await Promise.resolve();
  if (args.length !== 1 || args[0] !== "hooks") {
    throw new AxiError("unknown setup command", "VALIDATION_ERROR", [
      "Run `homebrew-axi setup hooks`",
    ]);
  }
  installSessionStartHooks({
    binaryNames: ["homebrew-axi"],
    marker: "homebrew-axi",
  });
  return { setup: "hooks installed or already up to date" };
}
