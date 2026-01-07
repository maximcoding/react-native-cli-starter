<!--
FILE: docs/tasks/16_verification_smoke_ci.md
PURPOSE: Verification + smoke tests + CI for the CLI repo (init/plugin/module flows) with Option A isolation and realistic CI constraints.
OWNERSHIP: CLI
-->

# 16) Verification / Smoke / CI — Task List

## 16.1 Smoke scenarios (local, must exist)
- [ ] Smoke: build CLI (`npm run build`) and run built `--help`.
- [ ] Smoke: built CLI prints `--version`.
- [ ] Smoke: `rns init` (Expo) → generated app is bootable without manual edits.
- [ ] Smoke: `rns init` (Bare) → generated app is bootable without manual edits.
- [ ] Smoke: `rns plugin add` (at least one plugin) → app remains bootable.
- [ ] Smoke: `rns plugin doctor` reports clean after successful apply.
- [ ] Smoke: `rns module add` (at least one module) → host wiring updated + state updated (Option A isolation preserved).

## 16.2 Non-interactive mode coverage (local + CI-safe)
- [ ] Smoke: init with `--yes` completes without prompts (defaults chosen).
- [ ] Smoke: plugin add with explicit ids completes without prompts.
- [ ] Smoke: module add with explicit ids completes without prompts.

## 16.3 Dry-run coverage (local)
- [ ] Smoke: `--dry-run` for init produces a deterministic plan without writing.
- [ ] Smoke: `--dry-run` for plugin add produces a plan without writing/installing.
- [ ] Smoke: `--dry-run` for module add produces a plan without writing/installing.

## 16.4 Smoke runner scripts (single source)
- [ ] Add `scripts/smoke/` with:
  - [ ] `smoke-build.sh` (help/version against dist entry)
  - [ ] `smoke-init-expo.sh` (init + boot sanity checks)
  - [ ] `smoke-init-bare.sh` (init + boot sanity checks)
  - [ ] `smoke-plugin-add.sh` (apply one plugin + verify)
  - [ ] `smoke-module-add.sh` (generate one module + verify Option A isolation)
- [ ] Each script must:
  - [ ] create a temp workspace under `.tmp/smoke/<timestamp>/`
  - [ ] clean up on success (or keep on failure with printed path)
  - [ ] write logs under `.rns-logs/` and print log path on failure
- [ ] Add npm scripts:
  - [ ] `npm run smoke` (runs CI-safe subset)
  - [ ] `npm run smoke:local` (runs full local set including Bare if desired)

## 16.5 CI for CLI repo (realistic constraints)
- [ ] Add GitHub Actions workflow:
  - [ ] runs on PR/push
  - [ ] installs deps
  - [ ] builds CLI
  - [ ] runs CI-safe smoke: `help`, `version`, and at least one scripted flow that does not require iOS/Android toolchains
- [ ] If full Bare/boot is not feasible on CI:
  - [ ] CI must still run: `--dry-run` plans for init/plugin/module (to validate pipeline + manifests + patch logic)
  - [ ] full Bare boot remains a required **local** smoke
- [ ] CI must fail fast with actionable logs (print failing script + log file path).

## 16.6 Verification checks (what "bootable" means here)
- [ ] Expo "bootable" verification includes:
  - [ ] required marker files exist
  - [ ] `.rn-init.json` exists and validates
  - [ ] `npx expo --version` (if used) is available OR skip with actionable note
  - [ ] project installs dependencies successfully (unless `--dry-run`)
- [ ] Bare "bootable" verification includes (local):
  - [ ] required marker files exist
  - [ ] `.rn-init.json` exists and validates
  - [ ] `npm run android` / `npm run ios` is **not** required here (too heavy), but:
    - [ ] `node`-level config checks pass (package.json, metro/babel/tsconfig integrity)
    - [ ] `npx react-native --version` exists OR skip with actionable note

## 16.7 Acceptance
- [ ] `npm run smoke` passes on a clean CI environment.
- [ ] Full local smoke suite is reproducible and documented:
  - [ ] commands
  - [ ] expected outputs
  - [ ] where logs and temp workspaces are created
