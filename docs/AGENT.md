<!--
FILE: AGENT.md
PURPOSE: One-page operational runbook for any AI agent to continue CliMobile work safely and fast (resume-ready).
OWNERSHIP: CLI
-->

# CliMobile — Agent Runbook (MANDATORY)

## 0) Start here (new chat / new agent)
1) Read `README.md` (single source spec).
2) Read `docs/WORKFLOW.md` (commit + verification rules).
3) Open `docs/tasks/` and find the **lowest-numbered** task file with unchecked items.
4) Continue from the **first unchecked checkbox**. Do not skip ahead.

## 1) Execution rule (hard)
- **One completed checkbox = one commit**, and the same commit must mark the checkbox `[x]`.
- Commit format: `task(<NN.N>): <short change>`
- Never mark `[x]` unless that item’s acceptance checks actually pass.

## 2) Repo rules (hard)
- `src/commands/*` must remain **thin** (parse args → call lib). No logic there.
- All logic must live under `src/lib/*` (fs/exec/logs/packs/patchers/state/deps/init/plugins/modules).
- Any generated-app changes must be done via:
  - template packs (`templates/*`) + attachment engine
  - workspace packages model (local packages under `packages/@rns/*`)
  - config/native patch engines (Android/iOS/Expo), with backups
  - dependency layer (PM-aware)
- **No manual steps** for users (no “go edit file X”).

## 3) Generated app model (Option A — hard rule)
Generated apps MUST use the **Workspace Packages model**:

- CLI-managed code lives in local workspace packages:
  - `packages/@rns/runtime` (composition + wiring)
  - `packages/@rns/core` (contracts + defaults)
  - `packages/@rns/plugin-*` (plugins)
- CLI state/logs/backups live under:
  - `.rns/**`
- User business code stays clean (developer-owned):
  - `src/**` (or another user-owned folder)
  - user assets under `assets/**`

Hard rule:
- **Do not inject CLI runtime glue into user `src/**`.**
- Any “markers / patching” (if ever used) are allowed **only inside CLI-managed packages** (e.g., in `packages/@rns/runtime/*`), not in user code.

## 4) Integration policy (hard)

### 4.1 Runtime integration (JS/TS)
- Integrate plugins by **runtime registration** into `@rns/runtime` composition:
  - providers
  - init steps
  - root wrappers
  - registries (features/modules)
- Generated app entrypoint must remain minimal:
  - `App.tsx` imports and renders `@rns/runtime` (no heavy glue).

### 4.2 Platform integration (Android/iOS/Expo)
- Native/config changes must go through **patch engines** + backups:
  - Android Gradle / Manifest
  - iOS Podfile / Info.plist / entitlements
  - Expo config (app.json/app.config.*)
- Never instruct the user to do manual platform steps.

## 5) Safety policy (hard)
- Plugins/modules must be **idempotent** (re-run safe; no duplicate registrations).
- Never overwrite developer-owned files silently.
- Always create backups before modifying existing files (where policy requires).
- Dependencies are handled **only** by the dependency layer (PM-aware). Don’t “merge deps” elsewhere.

## 6) Canonical entrypoints (do not invent new ones)
- Dev CLI runner: `npm run cli -- <args>`
- Dev init shortcut: `npm run init -- <args>` (must behave the same as `rns init`)
- Built CLI: `node <built_entry> <args>` and `rns <args>` when installed

## 7) Failure protocol (MANDATORY)

If ANY step fails (install/build/init/plugin/module), follow this protocol.

### 7.1 Do not mark checkboxes
- If acceptance/verification for the current checkbox item fails, keep it `[ ]`.
- Do not continue to the next checkbox item until the current one is verified.

### 7.2 Capture the minimum debug bundle (always)
Capture in the chat (or issue) for the current failed checkbox item:
- the exact command that failed
- full terminal output OR log file path under `.rns-logs/`
- OS + Node version + package manager version
- `git status` summary (clean/dirty + changed files)

### 7.3 Classify the failure (pick one)
- **ENV/PERMISSIONS**: EPERM/EACCES, cannot open files, read-only folder, antivirus/quarantine, locked node binary
- **DEPENDENCY/PM**: lockfile mismatch, peer deps, npm/pnpm/yarn install problems
- **REPO/BUILD**: TypeScript build errors, missing exports, broken CLI entry
- **PACK/ATTACH**: template pack conflicts, missing pack.json, wrong variant resolution
- **PATCH/ANCHOR**: marker/anchor not found, patch conflict, non-idempotent patch

### 7.4 Allowed recovery actions (safe-first)
Do safe recovery first (do not change scope):
- retry once after cleaning:
  - delete `node_modules`
  - delete the lockfile for the chosen PM (`package-lock.json` / `pnpm-lock.yaml` / `yarn.lock`)
  - reinstall using the SAME PM from repo root
- ensure the repo folder is writable and not under a protected location
- ensure Terminal/Cursor has permissions on macOS (Files & Folders / Full Disk Access if needed)

### 7.5 When to stop vs when to fix
- If **ENV/PERMISSIONS** → STOP and ask the user to fix the environment (repo code cannot fix OS permissions).
- If **REPO/BUILD / PACK/ATTACH / PATCH/ANCHOR** → fix within the current checkbox scope.
- If fixing requires prerequisites not yet implemented → STOP, and implement prerequisites first as earlier task items (in correct order).

### 7.6 Commit rule on failure
- Do not make “guess commits”.
- Commit only when:
  - the current checkbox acceptance passes, OR
  - you implemented a required prerequisite that belongs earlier in the task order.

## 8) Resume protocol (mandatory)
If you’re resuming work:
1) `git status`
2) `git log -20 --oneline`
3) Continue the tasks from the first unchecked checkbox in the current task file.

## 9) Copy/paste kickoff message (for a new agent chat)
Read `README.md`, `AGENT.md`, and `docs/WORKFLOW.md`.
Then execute `docs/tasks/*` strictly in order from the first unchecked checkbox.
One checkbox = one commit + mark it done in the same commit.
Keep `src/commands/*` thin; implement logic only in `src/lib/*`.
All integration must be FULL_AUTO (no manual user edits).
IMPORTANT: Use Option A Workspace Packages model — all CLI-managed code lives in `packages/@rns/*`, and user `src/**` stays clean.
