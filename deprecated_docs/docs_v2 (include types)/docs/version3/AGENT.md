<!--
FILE: docs/AGENT.md
PURPOSE: One-page operational runbook for any AI agent / junior maintainer to work safely under v3 rules.
OWNERSHIP: CLI
-->

# CliMobile (RNS) — Agent Runbook (v3) — MANDATORY

You are acting as a maintainer building a React Native platform CLI:
generate a **Base App** (Expo or Bare), then install **Capabilities (Plugins)** via:

**Plan → Scaffold → Link → AST Wire → Patch Ops → Verify → Update State**

This repo uses **ONE** work-order file: `docs/TODO.md`.

---

## 0) Start / Resume protocol (MANDATORY)

1) Read repo `README.md` (overview + constraints).  
2) Read `docs/WORKFLOW.md` (execution + commit rules).  
3) Open `docs/TODO.md` and locate the **first section still `[ ]`**.  
4) Continue strictly from that section, in order.

When resuming work:
1) `git status`
2) `git log -20 --oneline`
3) continue from first unchecked TODO section

---

## 1) Unit of work (HARD RULE)

**Unit of work = ONE numbered section in `docs/TODO.md`.**

Example:
- `## [ ] 8) Modulator Engine v3 ...`

You complete the entire section’s scope, verify acceptance, then mark it `[x]`.

NOT allowed:
- working on multiple TODO sections in one commit
- “quick fixes” outside the active section scope
- marking `[x]` without verification

---

## 2) Commit rule (HARD RULE)

**One TODO section = one commit.**

The commit must include:
1) implementation changes
2) update to `docs/TODO.md` marking ONLY that section `[x]`

Commit message format (mandatory):

`task(v3-<sectionNumber>): <short concrete change>`

Examples:
- `task(v3-1): implement env doctor (node/git/android/xcode)`
- `task(v3-8): implement modulator plan/apply pipeline`

---

## 3) Verification rule (HARD RULE)

A TODO section may be switched to `[x]` only after:
- the code is implemented
- the section acceptance criteria are actually verified

If blocked:
- leave it `[ ]`
- write the blocker into that section’s notes (do not “optimistically complete”)

---

## 4) Architecture rules (HARD)

### 4.1 Ownership zones (Workspace Barrier)

CLI-managed (agent MAY create/update):
- `packages/@rns/**`
- `.rns/**`

Developer-owned (agent MUST NOT modify by default):
- `src/**`
- `assets/**` (unless a plugin explicitly owns a declared sub-scope)

Default: **do not inject glue into developer `src/**`.**  
Runtime integration happens through CLI-owned runtime composition.

### 4.2 Code modification policy (JS/TS)

- **No regex/sed** for code injection.
- Use **ts-morph** for AST edits.
- Use **symbol-based injection** (imports + registrations), not raw code strings.

### 4.3 CLI layering rule (keep commands thin)

- `src/commands/*` must remain **thin** (parse args → call lib).
- All logic lives under `src/lib/*` (fs/exec/logs/packs/patchers/state/deps/init/plugins).

### 4.4 Idempotency (required)

- Re-running `plugin add` must not duplicate anything (imports, registrations, native nodes).
- Removing must revert only plugin-owned changes.

### 4.5 Backups (required for modifications)

Before modifying any existing file:
- write backups under `.rns/backups/<timestamp>/...`
- record provenance (which plugin/operation changed it)

---

## 5) Reference specs (must follow)

When implementing interfaces/types/enums and permissions rules:
- `docs/cli-interface-and-types.md`
- `docs/plugins-permissions.md`

Do not invent new schemas silently. If schema must change:
- update docs in the SAME TODO section scope.

---

## 6) Plugin compatibility + conflicts (HARD)

### 6.1 Conflicts (block only real conflicts)

Block only “same-slot” systems that cannot coexist:
- two navigation roots at once
- two UI frameworks at once

Do NOT block normal stacking:
- REST + WebSockets + GraphQL can coexist
- Zustand + TanStack Query can coexist

### 6.2 Expo vs Bare gates

Every plugin must declare support:
- `target`: `expo | bare | both`
- Expo runtime: `expo-go | dev-client | standalone`
- platforms: `ios | android | web`

Install command must enforce these gates and produce actionable errors.

---

## 7) Modulator pipeline contract (HARD)

All plugin installs must follow the Modulator pipeline:

1) **Plan** (dry-run): compute deterministic operations (deps/patches/injections)
2) **Scaffold**: ensure plugin workspace package exists (`packages/@rns/plugin-*`)
3) **Link**: pm-aware install via dependency layer (never shell out ad-hoc)
4) **Wire**: AST inject into CLI-owned runtime composition (ts-morph)
5) **Patch**: apply patch ops (Android/iOS/Expo/text anchors) idempotently + backups
6) **Verify**: validate expected state (imports, permissions, anchors)
7) **State**: update manifest (`.rns/rn-init.json`)

---

## 8) Stress tests (must validate manifest + engine)

The interfaces + manifest must support without schema changes:

- Marketplace: auth + payments + maps + notifications + realtime
- Social/chat: feed + media + realtime + push
- Dating: privacy + verification + chat + analytics
- Offline flashcards: offline DB + import/export/backup + optional sync
- Real estate: maps + filters + saved searches + analytics

These are used as validation scenarios (fixtures/tests), not just docs.

---

## 9) What the agent must report (every task)

For every completed TODO section, report:

- files changed (list)
- commands executed + results
- which TODO section was marked complete
- risks / follow-ups (if any)

---

## 10) Repair rule (if you marked wrong sections)

If you marked multiple sections incorrectly:
- restore `docs/TODO.md` to last correct state
- redo section-by-section

Typical:
`git restore docs/TODO.md`

---

## 11) Copy/paste kickoff message (new agent chat)

Read `README.md`, `docs/AGENT.md`, `docs/WORKFLOW.md`, and `docs/TODO.md`.
Continue from the first unchecked TODO section.
Unit of work = ONE TODO section = ONE commit + mark that section `[x]` only after verification.
Follow Workspace Barrier: do not modify developer `src/**`.
Use ts-morph for AST wiring and declarative idempotent patch ops with backups.
