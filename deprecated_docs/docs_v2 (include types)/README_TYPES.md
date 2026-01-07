# RNS Types & Contracts Skeleton

This folder contains a **code-first** baseline for:
- `packages/@rns/core/src/*` — runtime contracts ("sockets") for plugins
- `src/lib/types/*` — CLI-facing types (manifest, plugin descriptor, patch ops, permissions, conflicts)

Intended workflow:
1) Use these TypeScript definitions as the **single source of truth**.
2) Update `docs/cli-interface-and-types.md` to reference these files instead of duplicating types.
3) Implement validators (e.g., zod) and runtime/engine logic on top.

Note: Names intentionally follow your docs (`AuthInterface`, `StorageInterface`, etc.) to avoid drift.
