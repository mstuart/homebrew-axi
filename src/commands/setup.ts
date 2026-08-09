import { AxiError, installSessionStartHooks } from "axi-sdk-js";

export async function setupCommand(args: string[]): Promise<Record<string, unknown>> {
  if (args.length !== 1 || args[0] !== "hooks") {
    throw new AxiError("unknown setup command", "VALIDATION_ERROR", [
      "Run `homebrew-axi setup hooks`",
    ]);
  }
  installSessionStartHooks({ marker: "homebrew-axi", binaryNames: ["homebrew-axi"] });
  return { setup: "hooks installed or already up to date" };
}
