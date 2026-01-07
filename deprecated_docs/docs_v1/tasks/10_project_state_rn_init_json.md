<!--
FILE: docs/tasks/10_project_state_rn_init_json.md
PURPOSE: Project state system (.rn-init.json) as single source of truth for init settings, workspace layout (Option A), ownership, installed packs/plugins/modules.
OWNERSHIP: CLI
-->

# 10) Project State (`.rn-init.json`) — Task List (Option A)

> `.rn-init.json` is the single source of truth to decide:
> - what was generated/attached by the CLI
> - what files are CLI-owned (safe to update with backup policy)
> - what packs/plugins/modules are installed and with what options
> - how the workspace is laid out (Option A: host + packages)

## 10.1 State file presence + location (fixed)
- [ ] State file is always created at workspace root: `.rn-init.json`.
- [ ] CLI refuses plugin/module operations if state is missing or invalid.
- [ ] State read must support `--cwd` so CLI can locate workspace root deterministically.

## 10.2 State schema (minimum required)
- [ ] Include `schemaVersion` (number) at top-level.
- [ ] Store CLI identity:
  - [ ] `cliVersion`
  - [ ] `createdAt` (ISO timestamp)
- [ ] Store init choices:
  - [ ] `target` (expo|bare)
  - [ ] `language` (ts|js)
  - [ ] `packageManager` (npm|pnpm|yarn)
  - [ ] `coreToggles` (alias/svg/fonts/env)
- [ ] Store workspace layout (Option A required):
  - [ ] `layout.mode` = `workspace`
  - [ ] `layout.hostAppPath` (relative, e.g. `apps/mobile`)
  - [ ] `layout.packagesRoot` (relative, e.g. `packages`)
  - [ ] `layout.rnsScope` (e.g. `@rns`)
  - [ ] `layout.packageIds` list (e.g. `@rns/core`, `@rns/infra`, `@rns/plugins/*` if created)
- [ ] Store attached packs:
  - [ ] CORE pack record
  - [ ] plugin pack records
  - [ ] module pack records (reserved for later)

## 10.3 Pack records (uniform shape)
- [ ] Define a uniform record shape used for CORE/plugin/module packs:
  - [ ] `id`
  - [ ] `type` (core|plugin|module)
  - [ ] `installedAt` (ISO timestamp)
  - [ ] `packVersion` (string; can mirror CLI version initially)
  - [ ] `target` + `language` used for resolution
  - [ ] `options` snapshot (object; empty for CORE)
  - [ ] `files` (list of CLI-owned files introduced/managed by this pack)
  - [ ] `checksums` optional (future) to detect drift (reserved field)
- [ ] State must allow multiple plugin pack records installed over time.

## 10.4 Ownership tracking (Option A: host vs packages)
- [ ] Track CLI-owned files per pack (required) using workspace-relative paths.
- [ ] Ownership must cover BOTH areas:
  - [ ] host app files (e.g. `apps/mobile/App.tsx`, `apps/mobile/metro.config.js`)
  - [ ] workspace package files (e.g. `packages/core/src/index.ts`)
- [ ] Provide helper APIs:
  - [ ] read state
  - [ ] validate state (schema + required fields)
  - [ ] write/update state (atomic)
  - [ ] `isCliOwned(relPath)` based on state ownership lists
- [ ] Ownership lookups must be fast (cache in-memory during a run).

## 10.5 Plugin state recording (required)
- [ ] On `plugin add`, record a pack record with:
  - [ ] plugin id
  - [ ] installedAt
  - [ ] options snapshot (wizard selections)
  - [ ] resolved pack variant info (target/language)
  - [ ] file list introduced/managed (host + packages)
- [ ] Plugin re-apply must not create duplicate state records:
  - [ ] if already installed: update existing record (or create a new entry only if policy explicitly says versioned history)
  - [ ] must remain idempotent by default

## 10.6 Module state recording (reserved / later compatibility)
- [ ] Reserve structure for module pack records (even if module engine comes later):
  - [ ] modules list with the same uniform pack record shape
  - [ ] module instance id (if modules can be added multiple times with params)

## 10.7 Atomic writes + corruption safety
- [ ] State updates must be atomic:
  - [ ] write to temp file
  - [ ] fsync (where applicable)
  - [ ] rename/replace
- [ ] On read: detect invalid JSON and fail with actionable message:
  - [ ] show file path
  - [ ] suggest restoring from `.rns-backup/*` if available

## 10.8 Migration strategy (forward-safe)
- [ ] Include `schemaVersion`.
- [ ] Provide minimal migration hook:
  - [ ] if schemaVersion older -> migrate to newest in memory
  - [ ] write back only when safe (and backup before writing)
- [ ] Migration must never drop unknown fields (preserve forward additions).

## 10.9 Acceptance
- [ ] `.rn-init.json` is created during init and validates (Option A fields present).
- [ ] State updates are atomic and survive reruns.
- [ ] CLI-owned file detection works based on state (host + packages).
- [ ] Plugin add updates state deterministically (no duplicates on rerun).
