<!--
FILE: docs/WORKFLOW.md
PURPOSE: Contributor workflow + repo rules (build/run/verify) under v3.
OWNERSHIP: CLI
-->

# Workflow (v3)

This document describes **how to work in this repo** without breaking the platform guarantees.

If you are an AI agent or a new maintainer, also read: `docs/AGENT.md`.

---

## 1) Non-negotiable rules

- **One TODO section at a time** (see `docs/TODO.md`).
- **No scope creep**: change only what the active TODO section requires.
- **No manual steps for users**: if a feature is shipped, the CLI does all setup.
- **Never touch user zone** (`src/**` inside generated apps).
- **AST-only for TS/JS wiring**: use `ts-morph` (no regex injection).
- **Native/config patches are ops-based**: anchored, idempotent, backed up.
- **All dependency installs go through one dependency layer** (PM-aware).
- **Idempotency required**: running the same command twice must not duplicate anything.

---

## 2) Repo setup (local)

### 2.1 Requirements

- Node.js **18+**
- Git
- One package manager: pnpm (preferred) / npm / yarn

### 2.2 Install + build

```bash
npm install
npm run build
```

### 2.3 Run the CLI in dev mode

```bash
npm run cli -- --help
npm run cli -- init MyApp --target expo --lang ts --pm pnpm
```

> Canonical dev runner is always: `npm run cli -- <args>`

---

## 3) Folder structure (must keep consistent)

```txt
src/
  commands/          # thin: parse args -> call lib
  lib/               # all real logic lives here
    deps/            # package manager + workspace installs (PM-aware)
    init/            # base app generation
    plugins/         # plugin catalog + orchestration
    patchers/        # patch ops engines + backups
    ast/             # ts-morph wiring helpers
    state/           # manifest read/write + audit logs
packages/@rns/
  core/              # app/runtime contracts (immutable interfaces)
  runtime/           # runtime composition layer
  plugin-*/          # plugin packages (installed capabilities)
docs/
  TODO.md            # work order (single source of truth)
  cli-interface-and-types.md
  plugins-permissions.md
  AGENT.md
  WORKFLOW.md
```

---

## 4) Build / test / verify (minimum)

Your TODO section defines acceptance, but these are the baseline checks:

```bash
npm run build
npm test
npm run cli -- doctor --env
```

If you generate a sample app, ensure it boots:

```bash
npm run cli -- init SmokeApp --target expo
cd SmokeApp
pnpm start
```

---

## 5) Implementation guidelines

### 5.1 Error handling

- Errors must be actionable (what failed, why, how to fix).
- Prefer stable error codes (see `src/lib/types/commands.ts`).

### 5.2 Logging

- Keep logs structured and scoped to operations.
- Plan output must be deterministic and easy to diff.

### 5.3 Ownership safety

- Treat generated app `src/**` as user-owned by default.
- Any glue/runtime integration belongs in `packages/@rns/**`.

### 5.4 AST wiring (ts-morph)

- Inject by **symbols** (import + registry registration).
- Never inject raw code strings or regex patches in TS/JS.

### 5.5 Patch ops (native/config)

- Use declarative patch ops (see `src/lib/types/patch-ops.ts`).
- Always:
  - anchor edits
  - ensure idempotency (no duplicates)
  - write backups under `.rns/backups/<timestamp>/...`
  - record provenance (plugin id + op id)

---

## 6) Adding a new plugin (high-level)

A new plugin consists of:

1) **Descriptor** (data):
   - id/category/support/conflicts
   - dependencies
   - permissions
   - patch ops
   - runtime contributions

2) **Workspace package** (`packages/@rns/plugin-...`):
   - adapter implementation (optional)
   - exports for runtime injection

3) **Modulator integration**:
   - plan/apply/remove behavior stays generic; plugin data drives actions

Reference schemas:
- `docs/cli-interface-and-types.md`

---

## 7) Docs rules

- v3 docs are **active**: `docs/**`
- v1/v2 docs are **frozen**
- Do not copy/paste type definitions into multiple docs.
  - Types live in one place (see `cli-interface-and-types.md`).

---

## 8) Commit discipline

One TODO section = one commit.

Format:
`task(v3-<sectionNumber>): <short concrete change>`

Update only the active section checkbox when done.
