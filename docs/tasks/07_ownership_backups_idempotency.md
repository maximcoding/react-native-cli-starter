<!--
FILE: docs/tasks/07_ownership_backups_idempotency.md
PURPOSE: Ownership tracking (managed vs detached), backups on change, and idempotency guarantees across packs/patches (Option A).
OWNERSHIP: CLI
-->

# 7) Ownership / Backups / Idempotency (Option A) — Task List

## 7.1 Ownership tracking (single source, managed vs detached)
- [ ] Define how a file becomes CLI-managed:
  - [ ] introduced by attach engine (pack delivery) OR created by patch engine
  - [ ] recorded in state under the installing pack (core/plugin/module)
- [ ] Persist management state in `.rn-init.json` (or state companion) with:
  - [ ] managed files list per pack
  - [ ] detached paths list (files/dirs that CLI must never modify)
- [ ] Provide helpers used everywhere:
  - [ ] `isManaged(path)` (true if recorded as managed and not detached)
  - [ ] `isDetached(path)` (true if path or parent path is detached)
  - [ ] `canWrite(path)` (managed and not detached)
- [ ] Workspace default rule:
  - [ ] anything under `packages/@rns/*` is treated as CLI-managed by default unless detached.

## 7.2 Detachment policy (user control without breaking cleanliness)
- [ ] Define how detachment is expressed:
  - [ ] state-only approach (recommended): `.rn-init.json` stores detached paths
  - [ ] optional file marker approach: `.rns/detached.json` or `.rns-detach` (only if needed)
- [ ] If a file/package is detached:
  - [ ] attach engine treats it as user-owned (conflict on write)
  - [ ] patch engine must refuse to patch it unless explicit override flag is set
- [ ] Provide a CLI-visible message policy for detached conflicts (actionable and non-noisy).

## 7.3 Backup system (mandatory for modifications)
- [ ] Before any modification of an existing file that the CLI is about to write (managed file or patch target), create backup under:
  - [ ] `.rns-backup/<timestamp>/<relativePath>`
- [ ] Backups must preserve original content exactly.
- [ ] Backups must be created only when a change is actually applied (not for no-op writes).

## 7.4 Idempotency rules (enforced across engines)
- [ ] Re-running init attach (CORE packs) must be safe and produce no duplicate changes.
- [ ] Re-running plugin apply must not duplicate:
  - [ ] marker inserts
  - [ ] config/native patches
  - [ ] dependency installs
  - [ ] workspace package attachment
- [ ] Every patch operation must be "detect -> skip" by default:
  - [ ] if already applied, report as skipped (no change)
- [ ] Ensure state updates are also idempotent (no duplicate managed file entries, stable pack records).

## 7.5 Conflict handling policy (strict)
- [ ] Never overwrite user-owned or detached files silently.
- [ ] If conflict occurs: fail with actionable output showing:
  - [ ] file path
  - [ ] operation (attach/patch)
  - [ ] reason (user-owned / detached / unknown ownership)
- [ ] Allow explicit override only via a global flag (not default):
  - [ ] override must still create backups
  - [ ] override must be logged clearly in the report

## 7.6 Dry-run consistency
- [ ] Dry-run must respect managed/detached/conflict rules and report exactly what would happen.
- [ ] Dry-run must never create backups or write files.

## 7.7 Acceptance
- [ ] Modifying any existing file via attach/patch creates a backup entry.
- [ ] Repeat apply produces no duplication (markers/config/native patches + workspace pack attachments).
- [ ] Detachment prevents writes consistently across attach and patch operations.
- [ ] Conflicts are detected and surfaced consistently with actionable reasons.
