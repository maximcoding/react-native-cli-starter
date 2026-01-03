<!--
FILE: docs/tasks/05_template_packs_system.md
PURPOSE: Standardize pack layout + discovery + variants rules for Option A Workspace Packages model.
OWNERSHIP: CLI
-->

# 5) Template Packs System (Option A) — Task List

## 5.1 Standardize pack locations (fixed)
- [x] CORE packs live under `templates/packs/core/*` and are attached into generated app as workspace packages under `packages/@rns/*`.
- [x] Plugin packs live under `templates/packs/plugins/<pluginId>/...` and are attached into generated app as workspace packages:
  - [x] default target path: `packages/@rns/plugin-<pluginId>/...` (or a stable naming scheme defined by CLI)
- [x] Module packs live under `templates/packs/modules/<moduleId>/...` and generate **user-owned business code** by default:
  - [x] default target path: `src/modules/<moduleId>/...` (or `src/features/<moduleId>`), configurable by CLI policy
  - [x] any CLI-owned module helpers (if needed) must live in `packages/@rns/*`, not in user business folders

## 5.2 Pack manifest (required)
- [x] Each pack has a manifest file named `pack.json`, containing:
  - [x] `id`
  - [x] `type` (`core` | `plugin` | `module`)
  - [x] `delivery` (`workspace` | `user-code`)  // defines attachment destination ownership
  - [x] supported targets (`expo`, `bare`)
  - [x] supported languages (`ts`, `js`)
  - [x] variant resolution hints (if any)
  - [x] default destination mapping (optional, but must be deterministic if present)
- [x] CORE packs must have a manifest (no implicit packs in Option A). (validated in loadPackManifest - fails if manifest missing)

## 5.3 Variant convention (deterministic)
- [ ] Variants must be resolvable deterministically by:
  - [ ] target (expo/bare)
  - [ ] language (ts/js)
  - [ ] pack delivery type (workspace/user-code)
  - [ ] plugin/module options (only if required and only from a normalized options key)
- [ ] If no matching variant exists: fail with actionable error (shows expected variant path(s) + inputs used).

## 5.4 Pack discovery (single source)
- [ ] Implement a single pack discovery module that:
  - [ ] lists CORE/plugin/module packs
  - [ ] loads manifests
  - [ ] validates uniqueness of ids per type (core/plugin/module)
  - [ ] resolves a pack path by id + target + language (+ normalized options key when required)
  - [ ] returns delivery + destination mapping for the attachment engine

## 5.5 Pack content rules (what packs may include)
- [ ] Packs may include: source code, assets, config fragments, CI workflow files.
- [ ] Workspace-delivered packs may include:
  - [ ] full package structure (`package.json`, `src/*`, `tsconfig`, etc.) intended to live under `packages/@rns/*`
- [ ] User-code-delivered packs may include only business code scaffolds and must not include CLI-owned glue/runtime (that belongs in workspace packs).
- [ ] Packs may include native files only when intended as CLI-owned workspace attachments; otherwise native changes must be patch-ops (handled by patch engines).
- [ ] Packs must not include secrets (tokens/keys).

## 5.6 Acceptance
- [ ] Discovery can list all available CORE/plugin/module packs with their delivery type.
- [ ] Resolving a pack by id + target + language returns exactly one deterministic path and a delivery/destination plan.
- [ ] Missing/invalid manifest fails early with actionable output.
