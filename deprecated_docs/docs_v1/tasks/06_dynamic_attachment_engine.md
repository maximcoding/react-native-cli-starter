<!--
FILE: docs/tasks/06_dynamic_attachment_engine.md
PURPOSE: Attach engine to apply template packs into apps safely and deterministically (Option A Workspace Packages).
OWNERSHIP: CLI
-->

# 6) Dynamic Attachment Engine (Option A) — Task List

## 6.1 Attach API (single entry)
- [ ] Provide one attach function used by init/plugins/modules:
  - [ ] inputs:
    - [ ] `projectRoot`
    - [ ] `packManifest` (includes `id`, `type`, `delivery`, `targets`, `languages`, destination hints)
    - [ ] `resolvedPackPath`
    - [ ] `target` (expo|bare)
    - [ ] `language` (ts|js)
    - [ ] `mode` (CORE|PLUGIN|MODULE)
    - [ ] `options` (normalized options key + raw options)
  - [ ] output: attachment report:
    - [ ] created / updated / skipped / conflicts
    - [ ] resolved destinations
    - [ ] ownedFilesCandidate (what CLI attempted to manage)

## 6.2 Destination resolver (delivery-aware)
- [ ] Resolve destination root deterministically from manifest `delivery`:
  - [ ] `workspace` packs -> `packages/@rns/<packageName>/...` (exact mapping is deterministic and centralized)
  - [ ] `user-code` packs -> user business area (default: `src/modules/<id>/...` or `src/features/<id>/...`)
- [ ] Destination resolution must be stable across runs (same inputs -> same dest paths).

## 6.3 Ownership model (CLI-managed vs user-owned) with detachment
- [ ] Define ownership rules for destination files:
  - [ ] CLI-managed: files introduced by packs and recorded by state system as managed.
  - [ ] User-owned: files not recorded as managed OR explicitly detached.
- [ ] Support detachment:
  - [ ] If a file is marked detached in state (or detected by a detach marker), attach engine must treat it as user-owned.
- [ ] Attach engine must never silently overwrite user-owned/detached files.

## 6.4 Deterministic copy + filtering
- [ ] Copy is deterministic (same inputs -> same output).
- [ ] Support ignore rules for pack content (internal metadata files, tests fixtures if excluded, etc.).
- [ ] Ensure dirs are created as needed.
- [ ] Preserve executable bits where relevant (scripts).

## 6.5 Overwrite policy (strict, delivery-aware)
- [ ] If destination file does not exist -> create.
- [ ] If destination exists and is CLI-managed -> update allowed (backup handled centrally).
- [ ] If destination exists and is user-owned or detached -> conflict:
  - [ ] default behavior: fail with actionable report (no overwrite)
  - [ ] optional override flag may exist, but must never be default behavior
- [ ] Workspace packs special rule:
  - [ ] All files under `packages/@rns/*` are treated as CLI-managed by default unless detached.

## 6.6 Merge vs replace strategy (workspace packages)
- [ ] Attachment must support "package-level update" without breaking user edits:
  - [ ] default: file-by-file strict policy (managed updates only)
  - [ ] no implicit merging of JSON/TS files here (patch engines handle structured merges)
- [ ] Any structured merges (package.json, app configs) must be delegated to patch engines, not attach engine.

## 6.7 State writing separation (no state logic here)
- [ ] Attach engine does not write `.rn-init.json`.
- [ ] State writer consumes attachment report to record managed files and pack install records.

## 6.8 Dry-run support
- [ ] `--dry-run` produces the same attachment report without writing files.
- [ ] Output clearly indicates what would change.

## 6.9 Acceptance
- [ ] Attach CORE workspace packs into a fresh app creates expected `packages/@rns/*` and minimal host glue.
- [ ] Re-attaching the same pack is idempotent (no duplicates; report is stable).
- [ ] Attempt to overwrite a user-owned/detached file is blocked and reported as conflict.
- [ ] `--dry-run` does not write anything and still reports changes.
