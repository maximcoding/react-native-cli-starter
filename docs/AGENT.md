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

## 7) Resume protocol (mandatory)
If you’re resuming work:
1) `git status`
2) `git log -20 --oneline`
3) Continue the tasks from the first unchecked checkbox in the current task file.

## 8) Copy/paste kickoff message (for a new agent chat)
Read `README.md`, `AGENT.md`, and `docs/WORKFLOW.md`.
Then execute `docs/tasks/*` strictly in order from the first unchecked checkbox.
One checkbox = one commit + mark it done in the same commit.
Keep `src/commands/*` thin; implement logic only in `src/lib/*`.
All integration must be FULL_AUTO (no manual user edits).
IMPORTANT: Use Option A Workspace Packages model — all CLI-managed code lives in `packages/@rns/*`, and user `src/**` stays clean.
