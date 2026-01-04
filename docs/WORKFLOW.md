<!--
FILE: docs/WORKFLOW.md
PURPOSE: Single source of truth for how work is executed in this repo (one section => one commit => checkboxes after verification), including Option A Workspace Packages model rules.
OWNERSHIP: MAINTAINERS
-->

# WORKFLOW (How to execute tasks in this repo)

This repo is developed by completing `docs/tasks/*` in a strict, auditable way.

---

## 1) Unit of work = ONE numbered section `NN.N`
**Unit of work is a numbered section header `## NN.N` inside a task file**  
(example: `## 01.2`, `## 02.1`, `## 09.4`).

A section contains multiple checklist lines.  
You must complete the entire section, then commit once.

**NOT allowed:**
- marking checkboxes across multiple sections in one commit
- “big-bang” commits that complete half the file

---

## 2) Verification before marking `[x]`
A checkbox inside section `NN.N` may be switched from `[ ]` to `[x]` **only after**:

- the code/templates/scripts for section `NN.N` are implemented
- the minimal acceptance for section `NN.N` is actually verified

If you cannot verify it, it stays `[ ]`.

---

## 3) One section `NN.N` = one commit (MANDATORY)
For every completed `## NN.N` section:

1) implement the required changes
2) verify acceptance for that section
3) mark the checkboxes under **that same section** as `[x]`
4) commit code + checkbox updates in the **same commit**

Do not mark checkboxes in other sections.

---

## 4) Commit message format (MANDATORY)
Use this exact format:

`task(<NN.N>): <short, concrete change>`

Examples:
- `task(01.2): build produces runnable dist entry`
- `task(05.3): pack variant resolver`
- `task(09.2): anchored text patch ops`

---

## 5) Option A — Workspace Packages model (HARD RULE)
All generated apps MUST follow **Option A**.

### 5.1 Ownership boundaries
**CLI-managed (CLI may create/update):**
- `packages/@rns/*` (runtime/core/plugins/modules)
- `.rns/**` (state/logs/backups/audit)

**Developer-owned (CLI must NOT touch):**
- `src/**` (business/app code)
- `assets/**` (unless a plugin explicitly owns a sub-path via pack)

### 5.2 Isolation guarantee
- Do **not** inject CLI “glue code” into developer-owned `src/**`.
- Runtime integration happens via:
  - minimal `App.tsx` entry → renders `@rns/runtime`
  - `packages/@rns/runtime` composition (providers/init/root/registries)
- If markers/patching exist, they are allowed **only inside CLI-owned packages**.

### 5.3 Platform/native integration
Native/config changes (Android/iOS/Expo) must be applied by CLI via **safe patch operations** with backups:
- anchors + idempotent edits
- never instruct users to do manual edits

---

## 6) No hidden changes outside the current section
While working on one section `NN.N`:
- do not introduce unrelated refactors
- do not change other task files
- do not mark other sections
- keep `src/commands/*` thin unless the current section requires entrypoint changes

If you discover a missing prerequisite:
- stop
- implement it in the **earliest required section**, in order
- one section per commit

---

## 7) Minimal acceptance examples (use only when relevant)
### 7.1 CLI foundation sections
- `npm run build` succeeds
- built entry runs: `node <built_entry> --help`
- dev runner runs: `npm run cli -- --help`

### 7.2 Init pipeline sections
- `npm run init -- ...` or `npm run cli -- init ...`
- generated app contains `packages/@rns/*` and `.rns/**`
- developer `src/**` remains clean (no CLI glue dumped there)

### 7.3 Plugin sections
- apply plugin via CLI
- re-run apply (no duplicates)
- plugin code stays in `packages/@rns/plugin-*`

---

## 8) Failure handling
If a section cannot be verified due to missing prerequisites:
- keep that section’s checkboxes `[ ]`
- implement the prerequisite in the correct earlier section
- never mark done “optimistically”

---

## 9) Repair rule (if you bulk-checked by mistake)
If you marked checkboxes outside the current section:
- restore the task file to last committed state
- redo section-by-section correctly

Typical:
`git restore docs/tasks/XX_*.md`

---

## 10) Source of truth for progress
Progress tracking is done only via:
- `docs/tasks/*` checkboxes (per section)
- git commits following the required message format
