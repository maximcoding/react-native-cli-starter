<!--
FILE: docs/tasks/03_core_base_pack.md
PURPOSE: CORE baseline tasks for Option A Workspace Packages (bootable CORE for every case).
OWNERSHIP: CORE(packages/@rns)
-->

# 3) CORE Baseline (Option A Workspace Packages) — Task List

## 3.1 Canonical host entry (minimal app-owned surface)
- [ ] Host `App.tsx` is minimal and only mounts `@rns/runtime` (no heavy glue in user `src/**`).
- [ ] Host keeps developer code isolated: user-owned `src/**` (if present) is not required for CORE to run.
- [ ] Host remains stable across plugins/modules (plugins must not rewrite user-owned code).

## 3.2 CORE packages exist (stable layout)
- [ ] `packages/@rns/core/*` exists (pure contracts + safe defaults; zero plugin deps).
- [ ] `packages/@rns/runtime/*` exists (composition layer that wires CORE into the app).
- [ ] `packages/@rns/shared/*` exists if needed for shared types/utils (optional, but if created it must be stable).
- [ ] `.rns/` exists (state/logs/backups), created by init pipeline.

## 3.3 CORE contracts + safe defaults (no plugins required)
All must live under `packages/@rns/core` (or `@rns/shared` when appropriate) and be plugin-free:

- [ ] Logging: stable logger API + default implementation.
- [ ] Error: normalization contract + safe default normalizer.
- [ ] Storage: kv + cache engine APIs with memory fallback default.
- [ ] Network: connectivity API with stub default.
- [ ] Transport: transport facade + types + noop adapter default.
- [ ] Offline: offline/outbox/sync contracts with noop defaults (no background work without plugin).

## 3.4 Runtime composition (bootable without plugins)
All must live under `packages/@rns/runtime`:

- [ ] `@rns/runtime` exposes a single app component (e.g. `RnsApp`) that can render without any plugins.
- [ ] Runtime calls CORE init exactly once (equivalent to prior `appInit()` behavior).
- [ ] Runtime provides a minimal provider/root composition that is stable for future plugin integration.
- [ ] Runtime renders a minimal UI (not blank) without requiring navigation/i18n/query/auth.

## 3.5 Plugin-free guarantee (hard)
- [ ] No imports of plugin-only dependencies inside `packages/@rns/core` or `packages/@rns/runtime`.
- [ ] Optional capabilities are accessed only via CORE contracts (noop/memory fallback).
- [ ] Any plugin integration must be additive via runtime registries/hooks (not direct imports inside CORE).

## 3.6 Audit marker for “CORE installed”
- [ ] Init pipeline drops `.rns/BASE_INSTALLED.txt` (or equivalent) to mark CORE baseline installed.
- [ ] Marker content includes: CLI version + init timestamp + workspace model = Option A.

## 3.7 Acceptance
- [ ] New app created by init boots with CORE installed and with zero plugins applied.
- [ ] Ownership boundary holds: CLI-owned code is in `packages/@rns/*` + `.rns/*`; user `src/**` is not polluted.
- [ ] CORE packages compile without requiring any plugin dependencies.
