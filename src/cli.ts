import { runAxiCli } from "axi-sdk-js";
import { depsCommand } from "./commands/deps.js";
import { infoCommand } from "./commands/info.js";
import { installedCommand } from "./commands/installed.js";
import { outdatedCommand } from "./commands/outdated.js";
import { searchCommand } from "./commands/search.js";
import { setupCommand } from "./commands/setup.js";
import { COMMAND_HELP, TOP_LEVEL_HELP } from "./help.js";
import { homeCommand } from "./home.js";
import { VERSION } from "./version.js";

export const DESCRIPTION =
  "Inspect Homebrew formulae, casks, and installed packages — read-only.";

export async function main(): Promise<void> {
  await runAxiCli({
    commands: {
      deps: (args) => depsCommand(args),
      info: (args) => infoCommand(args),
      installed: (args) => installedCommand(args),
      outdated: (args) => outdatedCommand(args),
      search: (args) => searchCommand(args),
      setup: (args) => setupCommand(args),
    },
    description: DESCRIPTION,
    getCommandHelp: (command) => COMMAND_HELP[command] ?? null,
    home: () => homeCommand(),
    topLevelHelp: TOP_LEVEL_HELP,
    version: VERSION,
  });
}
