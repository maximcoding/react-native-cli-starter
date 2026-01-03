<!--
FILE: docs/WORKFLOW.md
PURPOSE: Single source of truth for how work is executed in this repo (one task => one commit => checkbox after verification), including Option A Workspace Packages model rules.
OWNERSHIP: MAINTAINERS
-->

# WORKFLOW (How to execute tasks in this repo)

This repo is developed by completing `docs/tasks/*` items in a strict, auditable way.

---

## 1) Unit of work = a numbered checkbox item

Work is done per **numbered sub-item** (e.g. `01.2`, `02.3`, `09.2`), not “whole files” or “whole milestones”.

---

## 2) Checkbox rule (do not mark early)

A checkbox may be switched from `[ ]` to `[x]` **only after**:

- the code/templates/scripts for that item are implemented
- the **acceptance** for that item is actually verified (at least minimal)
- the change is confirmed working (or failing cases are handled as specified)

If verification is not done, the checkbox must remain `[ ]`.

---

## 3) One task item = one commit (mandatory)

For every completed numbered item:

- update the corresponding `docs/tasks/XX_*.md` file and mark **only that item** as `[x]`
- commit the code + the checkbox update in the **same commit**

Do not bundle many task items in one commit.

---

## 4) Commit message format (mandatory)

Use this exact format:

`task(<NN.N>): <short, concrete change>`

Examples:

- `task(01.2): build produces runnable dist entry`
- `task(05.3): pack manifest format + resolver`
- `task(09.2): config/native patch ops (plist/json/xml/text)`

---

## 5) Option A — Workspace Packages model (hard rule)

All generated apps MUST follow **Option A**:

### 5.1 Ownership boundaries
- **CLI-managed** (generated and maintained by CLI):
  - `packages/@rns/*` (runtime/core/plugins/modules packs as local workspaces)
  - `.rns/**` (state, logs, backups, audit)
- **Developer-owned** (the app author edits freely):
  - `src/**` (or any developer folder declared as “user-owned”)
  - business assets under `assets/**` (unless a plugin explicitly owns a sub-path via pack)

### 5.2 Isolation guarantee
- Do **not** inject CLI “glue code” into developer-owned `src/**`.
- Runtime integration must be done through:
  - `App.tsx` minimal entry → imports `@rns/runtime` and renders it
  - `packages/@rns/runtime` composition (providers/init/root/registries)
- If “markers/patching” exist, they are allowed **only inside CLI-owned packages** (e.g. within `packages/@rns/runtime/*`), not in user-owned code.

### 5.3 Platform/native integration
Native/config changes (Android/iOS/Expo) must be applied by CLI via **safe patch operations** with backups:
- anchors + idempotent edits
- do not instruct users to manually edit platform files

---

## 6) Execution loop (always the same)

For a task item (example `06.4`):

1) Implement the item (code/templates/scripts).
2) Run the required verification for that item (acceptance check).
3) Mark the checkbox `[x]` for that item in the relevant `docs/tasks/XX_*.md`.
4) Commit everything in one commit using the required message format.

---

## 7) What may change during an item (no hidden scope creep)

While working on a single numbered item:

- do not introduce unrelated refactors
- do not change other task files except the one you are completing
- keep `src/commands/*` thin unless the item explicitly requires adding/modifying a command
- prefer adding new libs under `src/lib/*` rather than editing multiple unrelated files

If you discover a prerequisite:
- implement it as its **earlier** task item (in correct order)
- do not “smuggle” it into the current item

---

## 8) Minimal verification expectations

Each item’s acceptance should be **the smallest proof** that the work is correct.

Typical examples (use only when relevant to the current item):

### 8.1 CLI foundation items
- `npm run build` succeeds
- built entry runs: `node <built_entry> --help`
- dev runner runs: `npm run cli -- --help`

### 8.2 Init pipeline items
- run `npm run init -- ...` or `npm run cli -- init ...`
- verify the created app contains:
  - `packages/@rns/*` (CLI-owned workspaces)
  - `.rns/**` state folder
  - minimal `App.tsx` entry
  - user `src/**` remains clean (no CLI glue dumped there)
- verify “boots” requirement at least at the structural level for that item (the full boot smoke test belongs to later verification tasks)

### 8.3 Plugin items
- apply plugin using CLI
- confirm idempotency (run twice does not duplicate)
- confirm ownership boundaries preserved (plugin code goes into `packages/@rns/plugin-*` and runtime integration into `@rns/runtime`, not into user `src/**`)

---

## 9) Failure handling

If an item cannot be verified due to missing prerequisites:

- keep the checkbox `[ ]`
- commit only the prerequisite setup as its own earlier task item (in the correct order)
- never mark items as done “optimistically”

---

## 10) Source of truth

Progress tracking is done only via:

- `docs/tasks/*` checkboxes
- git commit history following the enforced format
