<!--
FILE: AGENT.md
PURPOSE: One-page operational runbook for any AI agent to continue CliMobile work safely and fast (resume-ready).
OWNERSHIP: CLI
-->

# CliMobile — Agent Runbook (MANDATORY)

## 0) Start here (new chat / new agent)
1) Read `README.md` (single source spec).
2) Read `docs/WORKFLOW.md` (execution + commit rules).
3) Open `docs/tasks/` and find the **lowest-numbered task file** that still has incomplete sections.
4) In that file, continue from the **first section `## X.Y` that still has unchecked items**.

---

## 1) Unit of work (HARD RULE)
**Unit of work = one numbered section in ONE task file.**

### 1.1 What “NN.N” means (IMPORTANT)
- `NN` = the **task file number** from the filename (`01..16`)
- `.N` = the **section number inside that file** (`1.1`, `1.2`, `2.1`, etc)
- Example:
  - File: `docs/tasks/01_cli_foundation.md`
  - Section header: `## 1.2 Build output is runnable`
  - Commit tag MUST be: `task(01.2): ...` 

This means:
- You complete **everything inside that single section** (e.g. `## 1.2`) in the current file.
- You do **NOT** touch other sections.
- You do **NOT** mark checkboxes in other sections.

> IMPORTANT: The unit of work is NOT “one checkbox”.
> The unit of work is the whole section (e.g. `## 1.2`) inside the current task file.

---

## 2) Commit rule (HARD RULE)
For every completed section:

- **One section = one commit**
- The commit must include:
  1) the implementation changes (code/templates)
  2) the task-file update marking **only that section’s checkboxes** `[x]`

Commit message format (mandatory):
`task(<NN.N>): <short, concrete change>`

Examples:
- `task(01.2): build produces runnable dist entry`
- `task(06.4): block overwriting user-owned files in attach engine`

---

## 3) What you may edit during a section (NO SCOPE CREEP)
While executing the current section:
- only change files required to complete this section
- only update the corresponding `docs/tasks/XX_*.md` file
- do not “fix” other tasks “while here”
- if you discover a missing prerequisite:
  - stop
  - go back to the earliest section that should introduce it
  - complete it there (in correct order), one section per commit

---

## 4) If something fails / environment problems (HARD RULE)
If commands fail (install/build/test/init), you MUST:

- **Do NOT mark the section as done**
- **Do NOT bulk-check boxes “optimistically”**
- Capture the failure in the log / terminal output and fix it inside the same section scope.

### 4.1 NPM/Node failures (example: EPERM/EACCES)
- Do **not** use `sudo npm install`
- Prefer fixing permissions / Node environment:
  - ensure correct Node is active (`node -v`, `npm -v`)
  - re-run in a clean state if needed (`rm -rf node_modules`, remove lockfile only if policy allows)
  - use the repo’s selected package manager and respect lockfile rules
- If the failure is not solvable within this section due to missing prerequisites:
  - keep the section unchecked
  - implement prerequisites in earlier sections (in correct order)

---

## 5) Repo rules (HARD)
- `src/commands/*` must remain **thin** (parse args → call lib). No logic there.
- All logic lives under `src/lib/*` (fs/exec/logs/packs/patchers/state/deps/init/plugins/modules).
- Any generated-app changes must be done via:
  - template packs (`templates/*`) + attachment engine
  - workspace packages model (local packages under `packages/@rns/*`)
  - config/native patch engines (Android/iOS/Expo), with backups
  - dependency layer (PM-aware)
- **No manual steps** for users (no “go edit file X”).

---

## 6) Generated app model (Option A — HARD RULE)
Generated apps MUST use the **Workspace Packages model**:

### 6.1 CLI-managed (CLI may create/update)
- `packages/@rns/*` (runtime/core/plugins/modules)
- `.rns/**` (state/logs/backups/audit)

### 6.2 Developer-owned (CLI must NOT touch)
- `src/**` (business/app code)
- `assets/**` (except explicitly owned plugin subpaths if ever declared)

Hard rule:
- **Do not inject CLI runtime glue into developer `src/**`.**
- Any markers/patching (if used) are allowed **only inside CLI-owned packages** (e.g. `packages/@rns/runtime/*`), not in developer-owned code.

---

## 7) Integration policy (HARD)
### 7.1 Runtime integration (JS/TS)
- Integrate plugins by **runtime registration** inside `@rns/runtime`:
  - providers
  - init steps
  - root wrappers
  - registries
- Generated app entrypoint must remain minimal:
  - `App.tsx` imports and renders `@rns/runtime`

### 7.2 Platform integration (Android/iOS/Expo)
- Native/config changes must go through **patch engines + backups**:
  - Android Gradle / Manifest
  - iOS Podfile / Info.plist / entitlements
  - Expo config (app.json/app.config.*)
- Never instruct the user to do manual platform steps.

---

## 8) Safety policy (HARD)
- Plugins/modules must be **idempotent** (re-run safe; no duplicate registrations).
- Never overwrite developer-owned files silently.
- Always create backups before modifying existing files (where policy requires).
- Dependencies are handled **only** by the dependency layer (PM-aware).

---

## 9) Canonical entrypoints (do not invent new ones)
- Dev CLI runner: `npm run cli -- <args>`
- Dev init shortcut: `npm run init -- <args>` (must behave the same as `rns init`)
- Built CLI: `node <built_entry> <args>` and `rns <args>` when installed

---

## 10) Resume protocol (MANDATORY)
If you’re resuming:
1) `git status`
2) `git log -20 --oneline`
3) Find the **first incomplete section** in the **lowest-numbered task file**, and continue from it.
4) Complete **one section** → verify → mark only that section `[x]` → commit.

---

## 11) If you accidentally marked multiple sections (REPAIR RULE)
If you checked boxes outside the current section:
- **Undo the task file changes** (restore it to last commit)
- Re-apply section-by-section correctly

Typical repair command:
`git restore docs/tasks/XX_*.md`

---

## 12) Copy/paste kickoff message (new agent chat)
Read `README.md`, `AGENT.md`, and `docs/WORKFLOW.md`.
Then execute `docs/tasks/*` strictly in order from the first incomplete section in the lowest-numbered task file.
Unit of work is ONE section = ONE commit + mark only that section done in the same commit.
Keep `src/commands/*` thin; implement logic only in `src/lib/*`.
All integration must be FULL_AUTO (no manual user edits).
IMPORTANT: Use Option A Workspace Packages model — all CLI-managed code lives in `packages/@rns/*`, and developer `src/**` stays clean.
