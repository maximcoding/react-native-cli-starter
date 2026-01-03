<!--
FILE: docs/tasks/01_cli_foundation.md
PURPOSE: CLI repo foundation tasks (build/run/runtime/fs/logs), incl. Option A workspace model baseline.
OWNERSHIP: CLI
-->

# 1) CLI Foundation — Task List

## 1.1 Lock repo structure (no logic in commands)
- [x] Ensure `src/commands/*` are thin entrypoints only (args → call lib).
- [x] Ensure all logic lives under `src/lib/*` (runtime ctx, exec, fs, logs, packs, attach, patch, state, deps, init, plugins, modules).
- [x] Define Option A baseline in code (single source): generated apps use workspace packages `packages/@rns/*`; user-owned `src/**` stays clean (no CLI glue injected).
- [x] Define stable paths/constants in one place:
  - [x] `.rn-init.json` (project state marker)
  - [x] `.rns/` (root folder for CLI-managed state)
  - [x] `.rns/logs/` (logs per run)
  - [x] `.rns/backups/` (backups before any modification)
  - [x] `.rns/audit/` (optional plugin/module audit records)

## 1.2 Build output is runnable
- [x] `npm run build` produces `dist/`.
- [x] One canonical built entry exists (Node runnable).
- [x] `package.json` `bin` points to the built entry.
- [x] Running built CLI works: `node <built_entry> --help`.

## 1.3 Dev runner is runnable and equivalent
- [x] Add `npm run cli` (dev mode).
- [x] Support args: `npm run cli -- --help`.
- [x] Add `npm run init` dev shortcut (must be equivalent to `rns init`).
- [x] Ensure dev runner matches built CLI behavior and command surface.

## 1.4 Version + identity (debuggable)
- [x] `rns --version` prints CLI version.
- [x] Provide a single `getCliVersion()` helper used everywhere (init/plugins/modules/log headers).

## 1.5 Global flags are wired through runtime context
- [x] Support: `--cwd`, `--yes`, `--verbose`, `--dry-run`.
- [x] Ensure every command receives a single runtime context object (resolvedRoot + flags + logger + runId).

## 1.6 Standard filesystem layer (single source)
- [ ] Implement one FS utility module used everywhere:
  - [ ] atomic write (temp → rename)
  - [ ] ensureDir
  - [ ] copyDir (deterministic; stable ordering)
  - [ ] exists/stat helpers
  - [ ] safe read/write text + json helpers (no JSON comments)

## 1.7 Step runner + logs baseline
- [ ] Implement a step runner utility (start/ok/fail) shared by init/plugins/modules.
- [ ] Ensure each run creates a log file under `.rns/logs/` (timestamp + runId).
- [ ] Failure output: failed step name + log path; stack trace only with `--verbose`.

## 1.8 Exit codes (CI-friendly)
- [ ] Define stable exit codes:
  - [ ] `0` success
  - [ ] `1` generic failure
  - [ ] `2` validation/state failure
  - [ ] `3` dependency/install failure

## 1.9 Acceptance
- [ ] Build passes on clean repo.
- [ ] Dev CLI and built CLI run `--help`.
- [ ] `rns --version` prints version.
- [ ] Forced error prints standard failure format, prints log path, and returns non-zero exit code.
