<!--
FILE: docs/README.md
PURPOSE: Entry point for v3 implementation docs (schemas + workflow).
OWNERSHIP: CLI
-->

# CliMobile (RNS) — Docs v3

This folder is the **active** spec for CliMobile v3.

## Read in this order

1. `README.md` (repo root) — product overview
2. `WORKFLOW.md` — how to build/run/contribute (rules)
3. `TODO.md` — work order (one section = one commit)
4. `cli-interface-and-types.md` — canonical schemas (CLI + runtime contracts)
5. `plugins-permissions.md` — permission catalog + provider list

## Source of truth for types

- CLI contracts: `src/lib/types/**`
- Runtime/app contracts: `packages/@rns/core/src/contracts/**`
