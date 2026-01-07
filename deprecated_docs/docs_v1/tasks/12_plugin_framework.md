<!--
FILE: docs/tasks/12_plugin_framework.md
PURPOSE: Plugin system contract + registry + apply pipeline (FULL_AUTO) aligned with Option A isolation (host app stays clean; plugin code lives in CLI-owned packages).
OWNERSHIP: CLI
-->

# 12) Plugin Framework — Task List (Option A: Isolated)

> Option A policy: **plugins do NOT dump code into the user’s `src/`**.
> Plugin code lives in **CLI-owned workspace packages** (example: `packages/@rns/plugin-<id>`),
> and the host app only receives **minimal wiring** via markers/config patch ops.

## 12.1 Plugin contract (single standard interface)
- [ ] Define one plugin type with:
  - [ ] `id`, `title`, `description`
  - [ ] `supportsTargets` (expo|bare) and `supportsLang` (ts|js) (if needed)
  - [ ] `packs` (one or more pack ids to attach; variants resolved by target/lang/options)
  - [ ] `deps` / `devDeps` (declared; installed only by Dependency Layer)
  - [ ] optional `wizard(ctx)` → returns typed `options`
  - [ ] optional `detect(ctx)` → returns `{installed:boolean, reason?:string}` (should use state-first, then file markers)
  - [ ] `applyPlan(ctx, options)` → returns a **plan** (attach packs + patches + deps) (no writes)
  - [ ] `apply(ctx, options)` → executes the plan through standard pipeline (must be idempotent)

## 12.2 Isolation rules (hard)
- [ ] Plugin code/assets must be CLI-owned and isolated:
  - [ ] attach into workspace packages (e.g. `packages/@rns/*`) and/or `.rns/*` internal area only
  - [ ] host app `src/` modifications are limited to **marker wiring** and minimal bootstrap glue
- [ ] If a plugin truly requires host-level files, it must:
  - [ ] introduce them via a pack and record them as CLI-owned
  - [ ] never overwrite user-owned files silently (ownership/conflict rules apply)

## 12.3 Plugin registry (single source)
- [ ] One registry lists all available plugins (id → plugin definition).
- [ ] IDs must be unique and stable.
- [ ] Registry supports:
  - [ ] list (for `plugin list`)
  - [ ] checkbox selection UI (for interactive `plugin add`)
  - [ ] resolution by id for init “apply plugins after init” flow

## 12.4 Standard plugin apply pipeline (shared, fixed order)
- [ ] Pipeline order is fixed (no custom ad-hoc flows):
  - [ ] validate project state (`.rn-init.json`) + target/lang/layout
  - [ ] marker validator must pass before wiring
  - [ ] resolve pack variants (target/lang/options)
  - [ ] attach plugin pack(s) (workspace packages / assets / workflows / config fragments)
  - [ ] apply marker patches (host wiring only) via marker patch engine
  - [ ] apply config/native patches (Android/iOS/Expo) via patch engines + backups
  - [ ] install deps/devDeps via Dependency Layer (scope-aware: workspace/host/package)
  - [ ] update `.rn-init.json`:
    - [ ] plugin record (id, installedAt, options, pack ids, versions)
    - [ ] owned files introduced/managed by packs
    - [ ] any package ids introduced (workspace packages list)
  - [ ] run post-apply validation:
    - [ ] marker validator
    - [ ] required files presence (if plugin declares them)
    - [ ] optional plugin doctor hook (if declared)
- [ ] Pipeline supports `--dry-run` (plan/report only; no writes, no backups, no installs).

## 12.5 FULL_AUTO requirement (non-negotiable)
- [ ] Plugins must never require manual steps by the user.
- [ ] Any required integration must be performed by the CLI via:
  - [ ] pack attachment
  - [ ] patch engines (markers + config/native)
  - [ ] dependency layer (PM-aware)
- [ ] Not allowed:
  - [ ] “go edit file X manually”
  - [ ] “paste snippet into App.tsx”
  - [ ] “follow external docs to finish setup”

## 12.6 Idempotency + re-apply behavior (required)
- [ ] Re-applying the same plugin must be safe:
  - [ ] no duplicate marker inserts
  - [ ] no duplicate config/native patches
  - [ ] deps install is idempotent / skipped when satisfied
- [ ] If plugin detects existing install:
  - [ ] default behavior: skip and report “already installed”
  - [ ] optional behavior: allow explicit `--reapply` or `--upgrade` flag (not default)

## 12.7 Acceptance
- [ ] Registry lists plugins.
- [ ] Applying any plugin follows the standard pipeline and updates state.
- [ ] Re-applying the same plugin is idempotent (no duplicates).
- [ ] `--dry-run` reports a plugin plan without writing/installing.
- [ ] After apply, the generated app still boots, and plugin code is isolated (not dumped into user `src/`).
