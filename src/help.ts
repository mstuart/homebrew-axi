export const TOP_LEVEL_HELP = `homebrew-axi — inspect Homebrew formulae, casks, and installed packages (read-only)

Usage: homebrew-axi <command> [args] [flags]

Commands:
  info <name> [--cask] [--full]   Formula or cask details: version, license, deps, install analytics
  deps <name>                     Build vs runtime dependencies for a formula
  outdated                        Outdated installed formulae and casks
  installed                       Every installed formula and cask with its version
  search "<query>"                Find formulae and casks by name
  setup hooks                     Install agent session-start hooks (ambient context)

Run with no arguments to see outdated installed packages at a glance.
Run \`homebrew-axi <command> --help\` for per-command details.

homebrew-axi never installs, upgrades, uninstalls, taps, or pins — read-only.
`;

export const COMMAND_HELP: Record<string, string> = {
  info: `homebrew-axi info <name> [--cask] [--full]

Show formula (or cask, with --cask) details: description, homepage, license, stable
version, dependency count, install analytics (30d/90d/365d), and deprecated/disabled
status.

Flags:
  --cask   Look up a cask instead of a formula
  --full   Print the complete description and caveats instead of a preview

Examples:
  homebrew-axi info wget
  homebrew-axi info visual-studio-code --cask
  homebrew-axi info git --full
`,
  deps: `homebrew-axi deps <name>

List a formula's build-time and runtime dependencies, plus a total count.

Examples:
  homebrew-axi deps git
  homebrew-axi deps wget
`,
  outdated: `homebrew-axi outdated

List installed formulae and casks with a newer version available, plus a count.

Examples:
  homebrew-axi outdated
`,
  installed: `homebrew-axi installed

List every installed formula and cask with its installed version, plus a count.

Examples:
  homebrew-axi installed
`,
  search: `homebrew-axi search "<query>"

Search Homebrew formulae and casks by name. Output splits matches into formulae
and casks, plus a total count.

Examples:
  homebrew-axi search sqlite
  homebrew-axi search "visual studio"
`,
  setup: `homebrew-axi setup hooks

Install or repair session-start hooks so agents see homebrew-axi guidance at the
start of each session. Supports Claude Code, Codex, and OpenCode. Idempotent.

Examples:
  homebrew-axi setup hooks
`,
};
