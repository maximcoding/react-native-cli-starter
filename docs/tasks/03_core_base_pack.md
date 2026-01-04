<!--
FILE: docs/tasks/03_core_base_pack.md
PURPOSE: CORE baseline tasks for Option A Workspace Packages (bootable CORE for every case).
OWNERSHIP: CORE(packages/@rns)
-->

# 3) CORE Baseline (Option A Workspace Packages) — Task List

## 3.1 Canonical host entry (minimal app-owned surface)
- [x] Host `App.tsx` is minimal and only mounts `@rns/runtime` (no heavy glue in user `src/**`).
- [x] Host keeps developer code isolated: user-owned `src/**` (if present) is not required for CORE to run.
- [x] Host remains stable across plugins/modules (plugins must not rewrite user-owned code).

## 3.2 CORE packages exist (stable layout)
- [x] `packages/@rns/core/*` exists (pure contracts + safe defaults; zero plugin deps).
- [x] `packages/@rns/runtime/*` exists (composition layer that wires CORE into the app).
- [x] `packages/@rns/shared/*` exists if needed for shared types/utils (optional, but if created it must be stable). (not needed yet - will be created if required)
- [x] `.rns/` exists (state/logs/backups), created by init pipeline.

## 3.3 CORE contracts + safe defaults (no plugins required)
All must live under `packages/@rns/core` (or `@rns/shared` when appropriate) and be plugin-free:

- [x] Logging: stable logger API + default implementation. (implemented in template)
- [x] Error: normalization contract + safe default normalizer. (implemented in template - fixed 2026-01-04)
- [x] Storage: kv + cache engine APIs with memory fallback default. (implemented in template - fixed 2026-01-04)
- [x] Network: connectivity API with stub default. (implemented in template)
- [x] Transport: transport facade + types + noop adapter default. (implemented in template - fixed 2026-01-04)
- [x] Offline: offline/outbox/sync contracts with noop defaults (no background work without plugin). (implemented in template - fixed 2026-01-04)

**Note:** Initially marked complete based on CLI code, but template files were missing 4 contracts. Fixed by adding missing contracts to `templates/base/packages/@rns/core/contracts/`.

## 3.3.1 CORE native utilities (plugin-free)
All must live under `packages/@rns/core/native` and be plugin-free:

- [x] Device info: platform detection utilities (isAndroid, isIOS, platform). (implemented in template - added 2026-01-04)
- [x] Haptics: haptic feedback placeholder (plugins provide real implementation). (implemented in template - added 2026-01-04)
- [x] Permissions: permissions request placeholder (plugins provide real implementation). (implemented in template - added 2026-01-04)

## 3.3.2 CORE config files (extensible via registry pattern)
All must live under `packages/@rns/core/config` and be plugin-free:

- [x] Env: typed environment variable access with safe defaults. (implemented in template)
- [x] Constants: app-wide constants (storage keys, limits, defaults) - VALUES ONLY (numbers, strings). (implemented in template - added 2026-01-04)
- [x] Feature flags: feature flags (booleans) - ALL booleans consolidated here (USE_MOCK, enableNewOnboarding, etc.). (implemented in template - added 2026-01-04, consolidated 2026-01-04)
- [x] App config: app metadata (name, version, build, logs). (implemented in template - added 2026-01-04)

**Registry Pattern:**
- Constants registry (`constantsRegistry`): Extensible registry for VALUES (numbers, strings, storage keys). Plugins register via `constantsRegistry.register(pluginId, constants)`.
- Feature flags registry (`featureFlagsRegistry`): Extensible registry for BOOLEANS (feature toggles). Plugins register via `featureFlagsRegistry.register(pluginId, flags)`.
- Clear separation: constants = values, featureFlags = booleans. This avoids confusion and keeps concerns separate.
- All feature flags (including USE_MOCK) are consolidated in `feature-flags.ts` - no more split between "flags" and "featureFlags".

## 3.4 Runtime composition (bootable without plugins)
All must live under `packages/@rns/runtime`:

- [x] `@rns/runtime` exposes a single app component (e.g. `RnsApp`) that can render without any plugins.
- [x] Runtime calls CORE init exactly once (equivalent to prior `appInit()` behavior).
- [x] Runtime provides a minimal provider/root composition that is stable for future plugin integration.
- [x] Runtime renders a minimal UI (not blank) without requiring navigation/i18n/query/auth.

## 3.5 Plugin-free guarantee (hard)
- [x] No imports of plugin-only dependencies inside `packages/@rns/core` or `packages/@rns/runtime`.
- [x] Optional capabilities are accessed only via CORE contracts (noop/memory fallback).
- [x] Any plugin integration must be additive via runtime registries/hooks (not direct imports inside CORE).

## 3.6 Audit marker for "CORE installed"
- [x] Init pipeline drops `.rns/BASE_INSTALLED.txt` (or equivalent) to mark CORE baseline installed.
- [x] Marker content includes: CLI version + init timestamp + workspace model = Option A.

## 3.7 Acceptance
- [x] New app created by init boots with CORE installed and with zero plugins applied.
- [x] Ownership boundary holds: CLI-owned code is in `packages/@rns/*` + `.rns/*`; user `src/**` is not polluted.
- [x] CORE packages compile without requiring any plugin dependencies.
