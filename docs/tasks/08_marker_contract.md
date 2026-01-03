<!--
FILE: docs/tasks/08_marker_contract.md
PURPOSE: Canonical markers definition + validation (host glue for Option A workspace packages).
OWNERSHIP: CLI
-->

# 8) Marker Contract (Option A) — Task List

## 8.1 Canonical markers are fixed and required in HOST glue (CORE)
Markers live in the generated app “host glue” files (minimal surface), not inside workspace packages.

Required files + markers:
- [ ] `App.tsx`: `<rns:imports />` and `<rns:root>...</rns:root>`
- [ ] `src/app/providers/AppProviders.tsx`: `<rns:imports>...</rns:imports>` and `<rns:providers>...</rns:providers>`
- [ ] `src/app/init/app-init.ts`: `<rns:init>...</rns:init>`

Policy:
- [ ] Plugins/modules may patch only inside these markers for JS/TS runtime wiring.
- [ ] The code injected should primarily import from workspace packages (e.g. `@rns/...`) rather than generating large host code.

## 8.2 Marker validator exists (host + Option A sanity)
- [ ] Implement validator that checks:
  - [ ] each required file exists
  - [ ] each required marker exists (by name)
- [ ] Add Option A host sanity checks (minimal):
  - [ ] host glue can resolve workspace imports (at least one known `@rns/*` import path is valid by config)
    - [ ] validator only checks config presence (tsconfig/babel resolver) — it does not execute builds
  - [ ] workspace root folder exists: `packages/@rns/` (created by CORE attach)
- [ ] Failure message contains:
  - [ ] file path
  - [ ] missing marker
  - [ ] recovery hint (which CORE task restores the file/marker)

## 8.3 Enforcement
- [ ] Plugin apply refuses to patch markers if validator fails.
- [ ] Module add refuses to patch markers if validator fails.
- [ ] Patch engines must never operate outside markers for runtime wiring (except structured config/native patch ops).

## 8.4 Acceptance
- [ ] CORE always passes marker validation immediately after init.
- [ ] After attaching a plugin pack, marker validator still passes (no marker corruption).
