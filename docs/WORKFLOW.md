<!--
FILE: docs/WORKFLOW.md
PURPOSE: Repo execution rules: how to run, verify, commit, and evolve the CLI safely without regressions.
OWNERSHIP: MAINTAINERS
-->

# Workflow (CliMobile / RNS)

This repo is **regression-intolerant**: if something already works, you must not break it.
Treat all previously completed TODO sections (`[x]`) as **protected smoke gates**.

---

## 1) Canonical local commands (do not invent new entrypoints)

- Dev CLI runner (must behave like released CLI):
  - `npm run cli -- <args>`

- Build:
  - `npm run build`

- Typical smoke (example set; adapt to current TODO scope):
  - `npm run cli -- --help`
  - `npm run cli -- doctor --env`
  - `npm run cli -- init MyApp --target expo`
  - `npm run cli -- plugin list`
  - `npm run cli -- plugin add <id> --dry-run`

If you add an entrypoint or rename one, you **must** update this file and keep it consistent across docs.

---

## 2) Work-order system (single source of truth)

Single source of truth:
- `docs/TODO.md`

Rules:
- Work strictly from the **first unchecked** `[ ]` section (top-to-bottom).
- Unit of work = **ONE section**.
- One section = **one commit**.
- Mark a section `[x]` **only after** its acceptance commands pass.

Commit message format:
`task(<sectionNumber>): <short concrete change>`

---

## 3) Scope control (no regressions / no scope creep)

While executing the active TODO section:

✅ Allowed:
- only files required to complete **that** section
- updating **that** section in `docs/TODO.md`

❌ Not allowed:
- drive-by refactors
- touching multiple TODO sections
- changing unrelated docs/types “because you noticed it”
- silently changing contracts that cause breaking behavior

If you discover a missing prerequisite:
- stop
- move to the **earliest** TODO section where it belongs
- implement it there (one section per commit)

---

## 4) Failure policy (how to handle blockers)

If anything fails (install/build/test/init/plugin):
- do **not** mark the section `[x]`
- capture the failure output (logs or notes)
- fix it **within the current section scope**

If it cannot be fixed without earlier prerequisites:
- leave the section `[ ]`
- implement prerequisites in the earlier section first (correct order)

---

## 5) Ownership zones (hard boundary)

CLI-managed (agent/maintainers MAY create/update):
- `packages/@rns/**`
- `.rns/**`

Developer-owned (forbidden by default):
- `src/**`
- `assets/**` (unless a plugin explicitly owns a declared sub-scope)

Hard rule:
- do not inject CLI runtime glue into developer `src/**`
- any need to touch developer-owned code must be explicitly defined in TODO and treated as a breaking behavior risk

---

## 6) Injection & patching rules

### 6.1 Runtime wiring (TS/JS)

- AST-only: **ts-morph**.
- Symbol-based injection (imports + registrations by symbol ref).
- No regex injection or raw code-string wiring into TS/JS.

### 6.2 Native/config changes

- Express changes as **patch operations** (idempotent).
- Apply changes using anchors/markers; “insert once” semantics.
- Create backups under `.rns/backups/<timestamp>/...` before modifying any existing file.
- Never instruct users to manually edit Podfile/Gradle/Manifest/Info.plist for shipped plugins.

---

## 7) Idempotency policy (mandatory)

Every command that changes state must be safe to re-run:

- `rns init` should refuse on existing projects (or be explicitly designed to be re-runnable), with a clear message.
- `rns plugin add <id>` repeated → **NO-OP** (no duplicate deps, imports, registrations, patches).
- `rns plugin remove <id>` repeated → **NO-OP**.

Verification should include “run twice” scenarios where applicable.

---

## 8) Contracts/types policy (docs-first)

**Canonical Docs Contract:** See `README.md` → Documentation for the complete canonical docs set.

Canonical contract:
- `docs/cli-interface-and-types.md` — **single source of truth** for all type names and schemas

Rules:
- code types must match the doc
- **no schema duplication** — types live in `cli-interface-and-types.md`; other docs reference it
- schema changes must be:
  - versioned (manifest `schemaVersion`)
  - migrated (explicit migration logic)
  - documented (update doc + TODO in the same section scope)

Prefer:
- additive changes (backward compatible)

Avoid:
- breaking shape changes without a migration path

---

## 9) Regression gates (required before marking `[x]`)

Before marking the active TODO section `[x]`:

- `npm run build` passes
- all acceptance commands for the active TODO section pass
- previously-working commands still work (at minimum: the latest `[x]` items’ acceptance checks)
- `plugin add` re-run is a NO-OP (when plugin pipeline exists)
- `doctor` passes (when doctor exists)
- backups are produced for patched files (when patching exists)

---

## 10) Repair / rollback helpers

If you accidentally edited the wrong scope or checked the wrong TODO section:

- Undo local doc changes:
  - `git restore docs/TODO.md`

- Undo local file changes (selectively):
  - `git restore <path>`

- Verify what changed:
  - `git status`
  - `git diff`

---

## 11) Resume protocol (when picking work back up)

1) `git status`
2) `git log -20 --oneline`
3) open `docs/TODO.md`
4) continue from the first unchecked `[ ]` section
5) complete one section → verify → mark `[x]` → commit
