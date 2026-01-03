<!--
FILE: docs/tasks/11_dependency_layer_pm_aware.md
PURPOSE: Dependency install layer (npm/pnpm/yarn) used by init and all plugins/modules, supporting Option A workspace (host app + packages) with deterministic installs.
OWNERSHIP: CLI
-->

# 11) Dependency Layer (PM-aware) — Task List (Option A)

> This layer is the only place allowed to install/remove dependencies.
> It must support:
> - single-app installs (legacy)
> - Option A workspace installs (host app + packages)
> - deterministic lockfile behavior
> - idempotent operations + actionable failures

## 11.1 Package manager selection + validation (strict)
- [ ] Respect init choice (npm/pnpm/yarn) as the primary PM.
- [ ] Provide `resolvePackageManager()`:
  - [ ] uses init choice from `.rn-init.json` when available
  - [ ] optionally detects from existing lockfiles if state is missing (but still validates)
- [ ] Enforce “no PM mixing”:
  - [ ] if conflicting lockfiles exist → fail with actionable error
  - [ ] if user tries to run with a different PM than state → fail unless explicit override flag exists (not default)
- [ ] Ensure all installs run from correct root depending on layout:
  - [ ] workspace root for workspace-level operations
  - [ ] host app path for app-local operations (when required)

## 11.2 Unified dependency API (single source)
- [ ] Provide one dependency API used everywhere (init/plugins/modules):
  - [ ] `addRuntime({scope, deps})`
  - [ ] `addDev({scope, deps})`
  - [ ] optional `remove({scope, deps})` (only if required by updates)
- [ ] Scope must support Option A:
  - [ ] `scope = 'workspace'` (root `package.json`)
  - [ ] `scope = 'host'` (host app `package.json`, e.g. `apps/mobile`)
  - [ ] `scope = 'package:@rns/core'` (a specific workspace package)
- [ ] Each operation returns a structured report:
  - [ ] executed commands (or planned commands in dry-run)
  - [ ] deps requested
  - [ ] deps skipped (already satisfied)
  - [ ] lockfile touched (yes/no)

## 11.3 Workspace semantics (Option A required)
- [ ] For workspace mode:
  - [ ] prefer installing shared deps at workspace root when appropriate
  - [ ] allow per-package installs (for `@rns/*` internal packages) when pack manifest says so
- [ ] Ensure correct command strategy per PM:
  - [ ] pnpm workspaces support `-w` / workspace root install
  - [ ] yarn workspaces support workspace root install and per-workspace targeting where needed
  - [ ] npm workspaces support `--workspace` targeting (modern npm)
- [ ] Provide helper to resolve workspace package path by id (from `.rn-init.json.layout.packageIds` or workspace `package.json`).

## 11.4 Lockfile behavior (deterministic)
- [ ] Installs must generate/update the correct lockfile for chosen PM:
  - [ ] npm → `package-lock.json`
  - [ ] pnpm → `pnpm-lock.yaml`
  - [ ] yarn → `yarn.lock`
- [ ] Never generate multiple lockfiles:
  - [ ] if different lockfile exists → fail with actionable error
- [ ] Ensure install does not accidentally run in wrong folder (would create wrong lockfile):
  - [ ] verify cwd before command execution
  - [ ] assert lockfile location after install (optional check)

## 11.5 Idempotency + minimal detection (skip redundant installs)
- [ ] Installing the same dep twice must be safe.
- [ ] Provide minimal detection:
  - [ ] read `package.json` deps/devDeps at the target scope
  - [ ] if dep exists and version range satisfies request → skip
  - [ ] if dep exists but version differs → install/upgrade according to policy (default: upgrade to requested range)
- [ ] Avoid expensive “node_modules scanning”; rely on manifests + lockfile.

## 11.6 Dry-run + verbose
- [ ] Support `--dry-run`:
  - [ ] no installs executed
  - [ ] return a dependency plan (commands that would run)
  - [ ] clearly show scope (workspace/host/package) per command
- [ ] Support `--verbose`:
  - [ ] shows full executed command lines
  - [ ] streams stdout/stderr into `.rns-logs/*`

## 11.7 Logging + failure format
- [ ] All PM commands executed through shared exec/log system.
- [ ] On failure return actionable error:
  - [ ] PM command
  - [ ] cwd
  - [ ] log path
  - [ ] hint (e.g. “lockfile conflict”, “workspace package not found”)

## 11.8 Acceptance
- [ ] CORE deps install works for npm, pnpm, yarn (workspace root + host app).
- [ ] Plugin deps install works for npm, pnpm, yarn (workspace + per-package when required).
- [ ] `--dry-run` produces a dependency plan without running installs.
- [ ] Mixing lockfiles/PMs fails early with actionable output.
