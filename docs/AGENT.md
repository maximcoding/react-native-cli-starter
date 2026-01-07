<!--
FILE: docs/AGENT.md
PURPOSE: Rules + task format for using an AI agent to develop CliMobile (RNS) safely.
OWNERSHIP: CLI
-->

# AI Agent Guide (CliMobile / RNS)

Treat the agent like a fast junior maintainer. It can work only if the rules are strict.

## Required reading (always)

**Canonical Docs Contract:** These six docs form the canonical, non-duplicated set (see `README.md` → Documentation).

1. `README.md`
2. `docs/TODO.md` (single work-order)
3. `docs/WORKFLOW.md`
4. `docs/cli-interface-and-types.md`
5. `docs/plugins-permissions.md` (when touching permissions/plugins)

## Non-negotiable rules

- Work **top-to-bottom** in `docs/TODO.md`. Unit of work is **ONE section**.
- **Do not break what already works.** No regressions in init/build/run.
- No scope creep, no drive-by refactors, no “cleanup while here”.
- Never edit generated app **USER ZONE** (`src/**`). Integration must happen only via SYSTEM ZONE (`packages/@rns/**` + `.rns/**`) and declarative ops.
- Runtime wiring is **AST-only** (ts-morph), **symbol-based**. No regex injection, no raw code strings.
- Native/config edits must be **patch ops**: anchored, idempotent, backed up.
- Dependency installs must go through the **dependency layer** (pm-aware). Never run `npm install` ad-hoc inside plugin logic.
- Idempotency is mandatory: re-run `plugin add` / re-run apply → no duplicates.
- Update docs only when they diverge from reality; do not shrink intent by deleting content. Move long lists to dedicated docs instead of removing them.

## Task format (the only format you should give the agent)

Provide a single task block per run:

- Goal (1–2 lines)
- Scope (files it may touch)
- Do not touch (forbidden files/areas)
- Acceptance (commands that must pass)
- Output (what to update in TODO.md)

Example:

- Goal: Implement `rns plugin add --dry-run` plan output.
- Scope: `src/lib/modulator/**`, `src/commands/plugin/**`, `docs/TODO.md`
- Do not touch: templates, unrelated refactors, generated app `src/**`
- Acceptance: `npm test`, `npm run build`, `npm run cli -- plugin add <id> --dry-run`
- Output: mark the exact TODO section `[x]` only after acceptance passes

## What the agent must report back

- Files changed (list)
- What was verified (exact commands + results)
- What TODO section was completed (and why)
- Risks / follow-ups (if any)

## Quick review checklist (for maintainers)

- Did the agent stay within scope?
- Did it keep init/build/run working?
- Did it avoid touching generated app user `src/**`?
- Are wiring changes AST-only (ts-morph)?
- Are patches anchored + backed up?
- Is the operation idempotent (run twice)?
- Was `docs/TODO.md` updated correctly?
