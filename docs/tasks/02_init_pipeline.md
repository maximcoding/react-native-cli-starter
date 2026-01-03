<!--
FILE: docs/tasks/02_init_pipeline.md
PURPOSE: INIT pipeline tasks producing bootable CORE app (Expo/Bare) using Option A Workspace Packages model.
OWNERSHIP: CLI
-->

# 2) INIT Pipeline (`rns init` / `npm run init`) — Task List

## 2.1 Init inputs (selection-first UX)
- [x] Project name (text).
- [x] Destination path (default: `./<ProjectName>`).
- [x] Target: Expo or Bare (select).
- [x] Language: TS or JS (select).
- [x] Package manager: npm / pnpm / yarn (select).
- [x] Bare-only: RN version (select) if needed by creation step.
- [x] CORE toggles (checkbox, defaults ON): alias / svg / fonts / env.
- [x] Optional: apply plugins right after init (checkbox list from registry).
- [x] Support non-interactive mode: `--yes` selects defaults and skips prompts.

## 2.2 Init pipeline steps (implemented in `src/lib/init/*`)
- [ ] Resolve destination (from `--cwd` + destination + project name).
- [ ] Preflight: fail if destination exists (actionable error).
- [ ] Create the host app (Expo or Bare).
- [ ] Initialize CLI-managed folders in the host app:
  - [ ] Create `.rns/` (state/logs/backups layout from constants).
- [ ] Install **Option A Workspace Packages model** into the host app:
  - [ ] Create `packages/@rns/*` in the generated app (CORE packages at minimum: `@rns/runtime`, `@rns/core`).
  - [ ] Configure workspaces in the host app package manager (npm/pnpm/yarn):
    - [ ] workspace globs include `packages/*` and `packages/@rns/*` as needed
    - [ ] ensure installs work from app root
  - [ ] Ensure host app entrypoint stays minimal:
    - [ ] `App.tsx` imports and renders `@rns/runtime` (no heavy glue in user `src/**`)
- [ ] Apply CORE DX configs for selected toggles (alias/svg/fonts/env) in the **correct place**:
  - [ ] host-level config files (babel/tsconfig/metro/expo config) when required
  - [ ] shared runtime/core code inside `packages/@rns/*` when it belongs to CLI-owned code
- [ ] Install CORE dependencies (via dependency layer) required for selected toggles + baseline runtime/core.
- [ ] Write `.rn-init.json` (includes CLI version + init choices + workspace model = Option A).
- [ ] Validate init result (ownership + structure):
  - [ ] `.rn-init.json` exists and is valid JSON
  - [ ] `.rns/` exists with required subfolders
  - [ ] `packages/@rns/runtime` and `packages/@rns/core` exist
  - [ ] `App.tsx` is minimal and points to `@rns/runtime`
  - [ ] user-owned `src/**` (if present) remains clean (no CLI glue dumped there)
- [ ] Run boot sanity checks (minimum: required files present; dependency install completed; workspace packages resolvable).
- [ ] If selected: apply plugins using the standard plugin apply pipeline (plugins attach into `packages/@rns/plugin-*` + integrate via `@rns/runtime`).
- [ ] Print next steps (commands to run).

## 2.3 Logs (mandatory)
- [ ] Create one init log file per run (timestamp naming).
- [ ] On failure: print failed step + log path.

## 2.4 Blueprint reference rule
- [ ] Use `docs/ReactNativeCLITemplate/*` as reference for shapes/config patterns.
- [ ] Do not copy the entire blueprint folder into generated app; only:
  - [ ] host app skeleton (created by Expo/RN)
  - [ ] CLI-owned workspace packages under `packages/@rns/*`
  - [ ] optional plugin packs selected by user

## 2.5 Acceptance
- [ ] Expo init → generated app boots without manual edits AND Option A workspace packages are present.
- [ ] Bare init → generated app boots without manual edits AND Option A workspace packages are present.
- [ ] `.rn-init.json` exists and validates.
- [ ] `--yes` init completes using defaults.
- [ ] Ownership boundary check passes: CLI-managed code is in `packages/@rns/*` + `.rns/*`, not injected into user `src/**`.
