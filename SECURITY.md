# Security Policy

## Scope

`homebrew-axi` is a local-first, read-only CLI. It:

- Calls exactly one external host: `https://formulae.brew.sh` (the public Homebrew API), for
  `info`, `deps`, and `search`. No other network endpoint is contacted.
- Shells out to the local `brew` CLI for `outdated` and `installed`, restricted at a single
  chokepoint (`src/brew.ts`) to a fixed allowlist of read-only subcommands
  (`outdated`, `list`, `search`, `info`, `--version`). It never invokes `install`, `upgrade`,
  `uninstall`, `tap`, `pin`, or any other mutating `brew` command.
- Requires no authentication, API keys, or secrets of any kind.
- Writes to disk only when explicitly asked to via `setup hooks`, which installs idempotent
  session-start hook entries into `~/.claude/settings.json`, `~/.codex/hooks.json`,
  `~/.codex/config.toml`, and `~/.config/opencode/plugins/` (delegated to `axi-sdk-js`).

## Supported Versions

Security fixes are provided for the latest published npm release and the default branch of
this repository.

## Reporting a Vulnerability

Please do not report security vulnerabilities through public GitHub issues.

Use GitHub's private vulnerability reporting for this repository:

https://github.com/mstuart/homebrew-axi/security/advisories/new

Include:

- Affected command or package version
- Steps to reproduce
- Expected impact
- Any suggested mitigation

Valid reports will be reviewed as quickly as possible and a fix coordinated before public
disclosure.
