<!--
FILE: docs/tasks/09_patching_engines_v1.md
PURPOSE: Patch engines v1 for marker wiring + text/json/native config patches with idempotent anchored operations (Option A workspace packages).
OWNERSHIP: CLI
-->

# 9) Patching Engines v1 — Task List (Option A)

> Patch engines are the only allowed way to modify existing files in the generated app and workspace.
> Deps installation is handled ONLY by the dependency layer (task 11), not here.

## 9.1 Marker patch engine (Host glue JS/TS wiring)
- [ ] Implement marker patch ops for:
  - [ ] `<rns:imports />` (self-closing)
  - [ ] `<rns:imports>...</rns:imports>`
  - [ ] `<rns:providers>...</rns:providers>`
  - [ ] `<rns:init>...</rns:init>`
  - [ ] `<rns:root>...</rns:root>`
- [ ] Marker patching MUST be constrained strictly inside marker regions.
- [ ] All marker patches are idempotent:
  - [ ] no duplicate import lines
  - [ ] no duplicate provider wrappers
  - [ ] no duplicate init calls/blocks
  - [ ] stable output across re-runs (same input => same file)
- [ ] Marker patch engine must support inserting content with correct indentation for TSX/TS.

## 9.2 Text patch ops (anchor-based, idempotent)
- [ ] Provide generic text patch operations:
  - [ ] insert before anchor
  - [ ] insert after anchor
  - [ ] replace range between anchors
  - [ ] ensure line exists (idempotent)
  - [ ] ensure block exists (BEGIN/END anchor pair, idempotent)
- [ ] Anchor strategy must be stable:
  - [ ] anchors are explicit and unique
  - [ ] if anchor not found => fail with actionable error (file + anchor)
- [ ] Text patch ops must integrate with ownership + backup policy:
  - [ ] no silent overwrite
  - [ ] backup before any write
  - [ ] conflict if user-owned file (unless override flag is explicitly used)

## 9.3 JSON patch ops (idempotent, formatting-safe)
- [ ] Provide JSON patch operations:
  - [ ] set key
  - [ ] deep-merge objects
  - [ ] ensure array contains values (no duplicates)
  - [ ] remove values (for updates)
- [ ] Preserve formatting as much as possible:
  - [ ] stable indentation
  - [ ] stable key ordering policy (choose one policy and keep it consistent)
- [ ] JSON patch ops must integrate with ownership + backup policy (same as text).

## 9.4 Config patch ops (Option A workspace + Expo/Bare)
Patch ops must support BOTH:
A) host app configs (the app the user runs)  
B) workspace root configs (packages + resolution)

### 9.4.1 Host app config patch targets
- [ ] `package.json` (scripts/metadata merge; deps are NOT handled here)
- [ ] `babel.config.js` / `babel.config.ts` (alias/runtime resolver config)
- [ ] `tsconfig.json` (paths / references as needed)
- [ ] `metro.config.js` (SVG transformer/resolver + workspace watchFolders when required)
- [ ] `react-native.config.js` (fonts/assets linking for bare when applicable)

### 9.4.2 Expo config patch targets (host)
- [ ] `app.json` / `app.config.*` updates (Expo) via JSON/text ops when required
- [ ] plugin-required Expo config updates must be done here (never manual)

### 9.4.3 Bare native patch targets (host)
- [ ] Android:
  - [ ] `android/settings.gradle` (include builds when needed)
  - [ ] `android/app/build.gradle` or `android/build.gradle` (anchored edits)
  - [ ] `android/app/src/main/AndroidManifest.xml` (anchored edits)
  - [ ] `MainApplication.*` / `MainActivity.*` only via anchored ops
- [ ] iOS:
  - [ ] `Info.plist` via safe plist ops (or anchored text if plist op not available)
  - [ ] Podfile via anchored ops when needed
  - [ ] Xcode project edits ONLY if we implement a safe deterministic op; otherwise fail with actionable message (no manual steps policy still applies)

### 9.4.4 Workspace root config patch targets (Option A)
- [ ] Root `package.json`:
  - [ ] enable workspace packages layout required by Option A
  - [ ] add required scripts for workspace install/build (scripts only; deps elsewhere)
- [ ] Root `tsconfig.base.json` / `tsconfig.json` (shared paths for `@rns/*`)
- [ ] Root `metro.config.js` (if monorepo requires centralized Metro config)
- [ ] Ensure host can resolve workspace imports (`@rns/*`) after init and after plugin apply, via config patches only.

## 9.5 Patch planning + report (dry-run, multi-file)
- [ ] Provide a patch plan executor:
  - [ ] accepts a list of patch operations (marker/text/json/native-config)
  - [ ] applies in deterministic order
  - [ ] returns a patch report (file + ops summary + changed yes/no)
- [ ] `--dry-run` support:
  - [ ] produces a patch report
  - [ ] performs no writes
  - [ ] performs no backups
- [ ] Patch report must be printable in a readable way (file list + what changed).

## 9.6 Acceptance
- [ ] Re-applying the same patch set produces no duplicate changes (markers/text/json/config).
- [ ] Missing anchors produce actionable failures (file + expected anchor).
- [ ] Any modified file produces a backup entry.
- [ ] Option A sanity:
  - [ ] after init, host app can compile imports from `@rns/*` (config patched)
  - [ ] after applying a plugin pack, host still resolves `@rns/*` (no regression)
