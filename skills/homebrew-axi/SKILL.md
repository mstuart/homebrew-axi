---
name: homebrew-axi
description: "Inspect Homebrew formulae, casks, and installed packages through the homebrew-axi CLI — formula/cask details, dependencies, outdated packages, installed packages, and search. Use whenever a task touches Homebrew: checking what a formula does, what it depends on, whether an installed package is outdated, what's installed, or finding a package by name. Read-only — never installs, upgrades, uninstalls, taps, or pins."
user-invocable: false
author: Mark Stuart
---

# homebrew-axi

Inspect Homebrew formulae, casks, and installed packages — read-only.

You do not need homebrew-axi installed globally - invoke it with `npx -y homebrew-axi <command>`.
If homebrew-axi output shows a follow-up command starting with `homebrew-axi`, run it as
`npx -y homebrew-axi ...` instead.

homebrew-axi shells out to the local [`brew`](https://brew.sh) CLI for installed-package state
(`outdated`, `installed`) and calls the public formulae.brew.sh JSON API for catalog data
(`info`, `deps`, `search`). If `brew` is not installed, `outdated` and `installed` fail with a
clear error and `info`/`deps`/`search` still work since they only need network access.

## When to use

Use homebrew-axi whenever a task touches Homebrew: looking up a formula or cask's description,
license, version, or dependencies; checking install popularity; listing a formula's build vs
runtime dependencies; checking which installed packages are outdated; listing every installed
formula and cask; or searching for a package by name.

homebrew-axi is strictly read-only. It never installs, upgrades, uninstalls, taps, or pins
anything. For those operations, ask the user to run `brew` directly.

## Workflow

1. Run `npx -y homebrew-axi` with no arguments to see outdated installed packages at a glance.
2. Look up a formula with `info <name>`, or a cask with `info <name> --cask`.
3. Drill into dependencies with `deps <name>`.
4. Find a package by name with `search "<query>"`.
5. Every response ends with contextual next-step hints under `help:` - follow them.

## Commands

```
Commands:
  info <name> [--cask] [--full]   Formula or cask details: version, license, deps, install analytics
  deps <name>                     Build vs runtime dependencies for a formula
  outdated                        Outdated installed formulae and casks
  installed                       Every installed formula and cask with its version
  search "<query>"                Find formulae and casks by name
  setup hooks                     Install agent session-start hooks (ambient context)
```

Installed copies also inherit the SDK built-in `update` command.
Run `homebrew-axi update --check` to compare the installed version with npm, or
`homebrew-axi update` to upgrade.
When using `npx -y homebrew-axi`, npx already resolves the package on demand.

Run `npx -y homebrew-axi --help` for global flags, or `npx -y homebrew-axi <command> --help`
for per-command usage.

## Tips

- Output is TOON-encoded and token-efficient.
- `info` truncates the description around 600 characters and caveats are omitted unless
  `--full` is passed; a `help` line tells you when more is available.
- `deps` splits `buildDependencies` (needed only to build the formula) from
  `dependencies` (needed at runtime).
- `search` and `info` hit the network (formulae.brew.sh); `outdated` and `installed` shell out
  to the local `brew` CLI and require it to be installed.
