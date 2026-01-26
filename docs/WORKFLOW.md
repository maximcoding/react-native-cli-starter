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

- Quality checks (use existing scripts; do not invent new names without updating this file):
  - `npm test`
  - `npm run typecheck` (if present)
  - `npm run lint` (if present)

- Typical smoke (example set; adapt to current TODO scope):
  - `npm run cli -- --help`
  - `npm run cli -- doctor --env`
  - `npm run cli -- init MyApp --target expo --lang ts --pm npm`
  - `npm run init -- MyApp --target expo --lang ts --pm npm` (alternative)
  - `npm run cli -- plugin list`
  - `npm run cli -- plugin add <id> --dry-run`

If you add an entrypoint, rename a script, or change CLI surface, you **must** update this file and keep it consistent across docs.

---

## 2) Work-order system (single source of truth)

Single source of truth:
- `docs/TODO.md`

Rules:
- Work strictly from the **first unchecked** `[ ]` section (top-to-bottom).
- Unit of work = **ONE section**.
- One section = **one change-set/commit**.
- Mark a section `[x]` **only after** its acceptance commands pass.

Commit message format:
`task(<sectionNumber>): <short concrete change>`

---

## 3) Scope control (no regressions / no scope creep)

While executing the active TODO section:

✅ Allowed:
- only files required to complete **that** section
- updating **that** section in `docs/TODO.md`
- adding tests that directly validate the section’s behavior/contracts

❌ Not allowed:
- drive-by refactors
- touching multiple TODO sections
- changing unrelated docs/types “because you noticed it”
- silently changing contracts that cause breaking behavior
- “cleanup” refactors without tests (refactor only with coverage)

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
- `src/**` (in generated apps)
- `assets/**` (in generated apps, unless explicitly owned by a plugin under a declared sub-scope)
- `App.tsx` / `App.js` (root entrypoint - user-editable, but CLI generates initial structure)

Hard rule:
- do not inject CLI runtime glue into developer `src/**`
- `App.tsx` is user-editable but CLI generates initial structure with providers and marker-based injection points
- any need to touch developer-owned code must be explicitly defined in TODO and treated as a breaking behavior risk

---

## 6) Injection & patching rules

### 6.1 Runtime wiring (TS/JS)

- AST-only: **ts-morph**.
- Symbol-based injection (imports + registrations by symbol ref).
- No regex injection or raw code-string wiring into TS/JS.
- Must be deterministic and idempotent (no duplicates on rerun).

### 6.2 Native/config changes

- Express changes as **Patch Operations** (idempotent).
- Apply changes using anchors/markers; “insert once” semantics.
- Create backups under `.rns/backups/<timestamp>/...` **only when modifying an existing file**.
- Never instruct users to manually edit Podfile/Gradle/Manifest/Info.plist for shipped plugins.

---

## 7) Idempotency policy (mandatory)

Every command that changes state must be safe to re-run:

- `rns init` should refuse on existing projects (or be explicitly designed to be re-runnable), with a clear message.
- `rns plugin add <id>` repeated → **NO-OP** (no duplicate deps, imports, registrations, patches).
- `rns plugin remove <id>` repeated → **NO-OP**.
- `rns module add <id>` repeated → either NO-OP or a safe “already present” outcome (no duplicates).

Verification should include “run twice” scenarios where applicable.

---

## 8) Contracts/types policy (docs-first)

**Canonical Docs Contract:** See `README.md` → Documentation for the complete canonical docs set.

Canonical contract:
- `docs/cli-interface-and-types.md` — **single source of truth** for all type names and schemas

Rules:
- code types must match the doc
- **no schema duplication** — other docs reference the canonical type names
- schema changes must be:
  - versioned (manifest `schemaVersion`)
  - migrated (explicit migration logic)
  - documented (update doc + TODO in the same section scope)

Prefer:
- additive changes (backward compatible)

Avoid:
- breaking shape changes without a migration path

---

## 9) Functional vs Non-functional requirements (how we use them)

Definitions:
- **Functional requirements** = what the system does (features/behaviors/commands).
- **Non-functional requirements** = quality attributes (determinism, idempotency, safety, testability, UX of errors, performance, maintainability).

Policy:
- Each TODO section’s acceptance criteria must include both:
  - at least one functional acceptance check (a command/behavior)
  - at least one non-functional gate (e.g., idempotency, determinism, “no USER ZONE edits”, actionable errors)

Non-functional requirements we enforce by default:
- deterministic output for same inputs
- strict ownership boundaries (no USER ZONE mutations)
- idempotent operations (rerun safe)
- actionable failures (clear error + fix hints)
- test coverage for critical engines and commands

---

## 10) Testing strategy (unit/spec/smoke) — required going forward

Test types:
- **Unit tests**: pure functions/modules (fast, isolated).
- **Spec tests**: behavior-level tests for engines/commands that assert contracts and invariants
  (e.g., “rerun add produces NO-OP”, “patch inserts once”, “plan is deterministic”).
- **Smoke tests**: end-to-end flows (init → plugin/module → doctor), using fixtures and temp dirs.

Rules:
- Tests must be deterministic: no real network, no relying on local machine state unless explicitly gated.
- Prefer table-driven specs for matrices (target=expo/bare, lang=ts/js, pm=npm/pnpm/yarn, runtime constraints, slots).
- When refactoring, add/adjust tests in the same change-set.

---

## 11) Regression gates (required before marking `[x]`)

Before marking the active TODO section `[x]`:

- `npm run build` passes
- `npm test` passes (and includes new unit/spec coverage relevant to the section)
- all acceptance commands for the active TODO section pass
- previously-working commands still work (at minimum: the latest `[x]` items’ acceptance checks)
- idempotency checks are verified (run twice scenarios) where applicable
- `doctor` passes (when doctor exists)
- backups are produced for patched files **when patching modifies existing files** (no extra backup layers)

---

## 12) CI gate policy (must block regressions)

CI must run at least:
- build
- unit/spec tests
- smoke tests (where feasible)
- lint/typecheck if present

If CI is red, the change is not acceptable (do not mark TODO sections `[x]`).

---

## 13) Repair / rollback helpers

If you accidentally edited the wrong scope or checked the wrong TODO section:

- Undo local doc changes:
  - `git restore docs/TODO.md`

- Undo local file changes (selectively):
  - `git restore <path>`

- Verify what changed:
  - `git status`
  - `git diff`

---

## 14) Resume protocol (when picking work back up)

1) `git status`
2) `git log -20 --oneline`
3) open `docs/TODO.md`
4) continue from the first unchecked `[ ]` section
5) complete one section → verify → mark `[x]` → commit

---

## 15) Local test apps and manual verification

- **Generated test apps** (e.g. `MyApp/`): May be gitignored for local use. See `.gitignore`. Run `rns init <name> ...` to recreate.
- **Manual init tests** (e.g. `rns init TestExpo`, `rns init TestBare`, `rns doctor` in generated app): Require **network** (npm registry, `create-expo-app`). Run them locally; CI/sandbox may block outbound access.
