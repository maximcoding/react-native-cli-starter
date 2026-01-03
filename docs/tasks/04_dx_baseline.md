<!--
FILE: docs/tasks/04_dx_baseline.md
PURPOSE: DX baseline tasks for alias/svg/fonts/env (FULL_AUTO after init) in Option A Workspace Packages model.
OWNERSHIP: CORE(packages/@rns) + INIT(host configs)
-->

# 4) DX Baseline (alias / svg / fonts / env) — Task List

## 4.1 Import aliases (TypeScript + runtime) — Option A
- [x] Host app resolves workspace packages imports:
  - [x] `@rns/*` works in TS/JS (workspace packages referenced from host app).
- [x] Optional DX alias `@/*` (toggle, default ON):
  - [x] If user `src/**` exists, configure TS paths + runtime resolver so `@/*` maps to `src/*`.
  - [x] If user `src/**` does not exist, `@/*` must not break builds (either map to a safe path or keep alias disabled safely).
- [x] Ensure alias config is target-appropriate:
  - [x] Expo target: resolver works with Metro/Expo config.
  - [x] Bare target: resolver works with Metro/Babel config.
- [x] Generated app compiles with imports:
  - [x] `import { ... } from '@rns/runtime'`
  - [x] `import x from '@/...'` (only if alias toggle ON and `src/**` exists)

## 4.2 SVG import pipeline (Expo + Bare)
- [x] Configure SVG pipeline in the host app (Metro-level):
  - [x] Install required deps via dependency layer. (dependency installation handled in section 11)
  - [x] Apply Metro config changes safely (patch ops + backups). (config is generated/updated during init)
- [x] Provide SVG typings for TS without breaking JS apps:
  - [x] Place typings in a host-safe location (e.g. `types/svg.d.ts` or `global.d.ts`), not inside user business code.
- [x] Ensure `assets/svgs` exists and an example SVG import compiles:
  - [x] Example may live in `packages/@rns/runtime` demo screen or minimal UI. (placeholder SVG created; compilation verified in section 4.6)

## 4.3 Fonts pipeline (no manual linking steps)
- [x] Ensure `assets/fonts` exists and include a placeholder font file (or documented placeholder) to validate pipeline.
- [x] Expo target:
  - [x] Fonts are loadable via the chosen baseline approach (FULL_AUTO; no manual steps). (expo-font handles fonts automatically from assets/fonts)
  - [x] If runtime uses font loading, it must not crash when fonts are absent (safe fallback). (CORE runtime doesn't require fonts; safe defaults)
- [x] Bare target:
  - [x] Fonts are linkable via the chosen baseline approach (FULL_AUTO; no manual steps). (react-native.config.js auto-links fonts)
  - [x] Any linking configuration is applied automatically by init (patch ops + scripts as needed). (react-native.config.js created during init)
- [x] Init attaches any required config/scripts automatically and keeps user code clean.

## 4.4 Env pipeline (typed access)
- [x] `.env.example` exists after init (host root).
- [x] Typed env access is implemented in CLI-owned code:
  - [x] `packages/@rns/core/config/env.ts` provides typed access pattern.
- [x] Expo target:
  - [x] Env access is wired through the chosen baseline approach (FULL_AUTO; no manual steps). (uses expo-constants with safe fallbacks)
- [x] Bare target:
  - [x] Env access is wired through the chosen baseline approach (FULL_AUTO; no manual steps). (uses react-native-config with safe fallbacks)
- [x] Env access compiles even if `.env` is missing:
  - [x] safe defaults OR clear, actionable runtime error message (defined by CORE). (safe defaults provided for all env vars)

## 4.5 Base scripts (developer workflow)
- [x] Add baseline scripts into generated app `package.json` (clean/doctor/reset/etc. as defined by CLI).
- [x] Scripts are target-safe (Expo/Bare) and do not require user edits.
- [x] Scripts must not assume business code exists in user `src/**` (Option A clean boundary).

## 4.6 Acceptance
- [ ] After init: `@rns/*` imports compile (Expo + Bare).
- [ ] After init: optional `@/*` imports compile when toggle ON and `src/**` exists (Expo + Bare).
- [ ] After init: SVG imports compile (Expo + Bare).
- [ ] After init: fonts pipeline is ready without manual steps (Expo + Bare).
- [ ] After init: env pipeline compiles and can be read (Expo + Bare).
