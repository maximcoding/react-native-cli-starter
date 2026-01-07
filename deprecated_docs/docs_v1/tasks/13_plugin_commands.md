<!--
FILE: docs/tasks/13_plugin_commands.md
PURPOSE: CLI commands for plugins (list/add/status/doctor) wired to plugin framework, aligned with Option A isolation (plugins live in CLI-owned packages; host app stays clean).
OWNERSHIP: CLI
-->

# 13) Plugin Commands — Task List (Option A: Isolated)

## 13.1 `rns plugin list`
- [ ] Lists all available plugins from the registry (id + title + short description + supports targets).
- [ ] Output is stable and usable for scripting:
  - [ ] default: human readable
  - [ ] optional flag: `--json` outputs machine-readable list (stable schema)

## 13.2 `rns plugin add [ids...]`
- [ ] Pre-checks (fail fast, actionable):
  - [ ] `.rn-init.json` exists + valid (initialized project)
  - [ ] marker contract passes (wiring points exist)
- [ ] If ids are provided: apply them in the given order (no re-sorting).
- [ ] If no ids: interactive checkbox selection from registry (selection-first UX).
- [ ] If plugin has wizard: run wizard **after selection** and before planning/apply.
- [ ] Uses the standard plugin apply pipeline (plan → attach packs → patches → deps → state → validate).
- [ ] Supports global flags:
  - [ ] `--yes` uses plugin defaults and skips wizards where possible
  - [ ] `--dry-run` prints plan only (no writes/installs/backups)
  - [ ] `--verbose` prints underlying exec output/log paths
- [ ] Produces a clear per-plugin summary:
  - [ ] `installed` / `skipped(already-installed)` / `failed`
  - [ ] For installed: list what changed at high level (packs attached, wiring patched, deps installed)
- [ ] Option A enforcement:
  - [ ] command must not dump large plugin code into host app `src/`
  - [ ] summary must indicate where plugin code was attached (workspace packages / `.rns/*`)

## 13.3 `rns plugin status`
- [ ] Reads installed plugins from `.rn-init.json`.
- [ ] Compares against registry and prints:
  - [ ] Installed (known) plugins
  - [ ] Installed but missing from registry (unknown ids)
  - [ ] Available but not installed
- [ ] Optional flags:
  - [ ] `--json` stable schema for automation
  - [ ] `--details` includes installedAt + options snapshot (redacted if needed)

## 13.4 `rns plugin doctor`
- [ ] Validates (actionable only):
  - [ ] `.rn-init.json` exists and validates (schemaVersion + required fields)
  - [ ] marker contract is valid
  - [ ] pack attachments consistency (expected CLI-owned files exist)
  - [ ] Option A isolation:
    - [ ] workspace packages (or `.rns/*`) recorded in state exist
    - [ ] plugin entrypoints that should be importable are present
  - [ ] basic dependency consistency:
    - [ ] correct lockfile exists for selected PM
    - [ ] installed deps match expectation (best-effort; no heavy audits)
  - [ ] config/native patch expectations:
    - [ ] required config entries exist (Expo app config / Android / iOS) when plugins declare them
- [ ] Output rules:
  - [ ] only actionable messages (what to run / what is missing / what file is broken)
  - [ ] show file paths + required anchors if a patch check fails
  - [ ] return non-zero exit code on failure (uses repo exit code policy)

## 13.5 Command wiring + help UX
- [ ] `rns plugin --help` lists subcommands and flags.
- [ ] `rns plugin add --help` includes examples and explains `--dry-run`, `--yes`, `--json`.
- [ ] Dev + built modes behave identically (`npm run cli -- ...` vs built `rns ...`).

## 13.6 Acceptance
- [ ] `plugin list` works in dev and built modes (human + `--json` stable).
- [ ] `plugin add` installs at least one plugin end-to-end and updates state.
- [ ] `plugin status` reflects installed plugins correctly and surfaces unknown ids.
- [ ] `plugin doctor` reports clean state after successful init + plugin add.
- [ ] Option A check: after plugin add, host app `src/` has only minimal wiring changes (n
::contentReference[oaicite:0]{index=0}
