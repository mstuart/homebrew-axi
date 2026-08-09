<h1 align="center">homebrew-axi</h1>

<p align="center">Inspect Homebrew formulae, casks, and installed packages with token-efficient output — an <a href="https://github.com/kunchenguid/axi">AXI</a> (Agent eXperience Interface).</p>

---

`homebrew-axi` wraps the public [formulae.brew.sh](https://formulae.brew.sh/) JSON API and the local
`brew` CLI in an agent-ergonomic wrapper. It returns [TOON](https://toonformat.dev/) output (~40%
fewer tokens than JSON), minimal default schemas, pre-computed aggregates, and structured errors —
so an agent can answer "what does this formula do", "what does it depend on", or "which of my
installed packages are outdated" in a single call.

**homebrew-axi is strictly read-only.** It never installs, upgrades, uninstalls, taps, or pins
anything — see [SECURITY.md](SECURITY.md) for the enforced allowlist.

## Install

```sh
npm install -g homebrew-axi
```

Or run without installing:

```sh
npx -y homebrew-axi <command>
```

`outdated`, `installed`, and the no-args home view shell out to a local `brew` install; `info`,
`deps`, and `search` only need network access to formulae.brew.sh.

## Usage

The examples below are snapshots of live output from formulae.brew.sh and a real `brew`
installation; versions, dates, and counts will drift as packages and this machine's installed
packages change.

### info

```sh
$ homebrew-axi info wget
name: wget
desc: Internet file retriever
homepage: "https://www.gnu.org/software/wget/"
license: GPL-3.0-or-later
version: 1.25.0
depCount: 6
installs30d: 17317
installs90d: 59331
installs365d: 336001
help[1]: Run `homebrew-axi deps wget` to see the dependency breakdown
```

```sh
$ homebrew-axi info visual-studio-code --cask
name: visual-studio-code
title: Microsoft Visual Studio Code
desc: Open-source code editor
homepage: "https://code.visualstudio.com/"
version: 1.132.0
installs30d: 43644
installs90d: 139616
installs365d: 496670
```

The description truncates around 600 characters; pass `--full` to see the complete description
and caveats. Deprecated/disabled formulae and casks surface a `deprecated`/`disabled` field with
the reason.

### deps

```sh
$ homebrew-axi deps git
name: git
count: 4
buildDependencies[2]: gettext,pkgconf
dependencies[2]: pcre2,gettext
```

A formula with no dependencies returns a definitive empty state:
`dependencies: 0 dependencies for <name>`.

### outdated

```sh
$ homebrew-axi outdated
count: 75
outdated[75]{name,installed,latest}:
  ada-url,3.4.4,4.0.0
  beads,1.0.3,1.1.2
  c-ares,1.34.6,1.34.8
  ...
```

Nothing outdated returns `outdated: 0 outdated`.

### installed

```sh
$ homebrew-axi installed
count: 139
formulae[135]{name,version}:
  ada-url,3.4.4
  bash,5.3.15
  ...
casks[4]{name,version}:
  claudebar,0.4.63
  gcloud-cli,564.0.0
  ...
```

### search

```sh
$ homebrew-axi search sqlite
count: 16
formulae[10]: mysql-to-sqlite3,sqlite,sqlite-analyzer,sqlite-rsync,sqlite-utils,sqlite3-to-mysql,sqlitecpp,sqliteodbc,rqlite,dqlite
casks[6]: db-browser-for-sqlite,db-browser-for-sqlite@nightly,navicat-for-sqlite,slite,sqlitemanager,sqlpro-for-sqlite
help[1]: Run `homebrew-axi info <name>` for details on a specific package
```

No matches returns `packages: 0 packages found for "<query>"`.

### Errors

```sh
$ homebrew-axi info nonexistent-xyz-formula-123
error: formula "nonexistent-xyz-formula-123" not found
code: NOT_FOUND
help[1]: Run `homebrew-axi search "nonexistent-xyz-formula-123"` to find similar packages
```

If `brew` is not installed, `outdated` and `installed` fail with a `BREW_MISSING` error pointing
to https://brew.sh — and the no-args home view degrades to a short command-hint list instead of
erroring.

### No arguments

Running `homebrew-axi` with no arguments shows outdated installed packages at a glance — the same
data as `outdated`, plus a `count: N of M installed are outdated` line against every installed
formula and cask.

## Agent integration

`homebrew-axi` follows the AXI principle of offering an opt-in session integration first, and an
on-demand skill second.

**Session hooks (ambient context):**

```sh
homebrew-axi setup hooks
```

Installs idempotent `SessionStart` hooks for Claude Code, Codex, and OpenCode so agents see
homebrew-axi guidance at the start of each session.

**Agent Skill (on-demand):**

```sh
npx skills add mstuart/homebrew-axi --skill homebrew-axi
```

You only need one of these — they complement each other when both are installed.

## How it maps to the 10 AXI principles

| # | Principle | In homebrew-axi |
| --- | --- | --- |
| 1 | Token-efficient output | TOON on stdout via `axi-sdk-js` |
| 2 | Minimal default schemas | `search`/`outdated`/`installed` return name + version-shaped rows |
| 3 | Content truncation | `info` description preview with `descChars` + `--full`; caveats gated behind `--full` |
| 4 | Pre-computed aggregates | total counts, `depCount`, `installs30d`/`90d`/`365d` |
| 5 | Definitive empty states | `0 outdated`, `0 dependencies for <name>`, `0 packages found for "<query>"` |
| 6 | Structured errors & exit codes | TOON errors; `0`/`1`/`2` exit codes; no prompts |
| 7 | Ambient context | `setup hooks` + installable skill |
| 8 | Content first | no-args shows outdated packages, or a help list if `brew` is missing |
| 9 | Contextual disclosure | next-step `help` lines on lists and errors |
| 10 | Consistent help | `homebrew-axi <command> --help`, fast `--version` |

## Development

```sh
npm install
npm run build        # tsc -> dist
npm run build:skill   # regenerate skills/homebrew-axi/SKILL.md from src/skill.ts
npm test              # vitest: unit tests (mocked fetch/brew) + live integration
npm run dev -- info wget   # run from source
```

The live integration suite (`test/live.integration.test.ts`) calls the real formulae.brew.sh API
and, if `brew` is on PATH, the real `brew` CLI. It skips cleanly rather than failing when either
is unavailable.

## License

[MIT](LICENSE)
