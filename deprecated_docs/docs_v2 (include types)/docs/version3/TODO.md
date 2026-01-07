<!--
FILE: docs/TODO.md
PURPOSE: Single source of truth roadmap for CliMobile (RNS) v2. Each section is a deliverable with
         concrete acceptance criteria. Keep this doc updated as work completes.
OWNERSHIP: CLI
-->


# TODO — CliMobile (RNS) v2 — Capability Modulator Engine

## [x] 1) CLI Foundation (TypeScript repo, runner, logging/error model)
- Keep the repo buildable and runnable as a CLI binary + dev runner.
- Maintain step-based logs, clean failures, stable exit codes.

Acceptance
- `npm run build` works.
- `npm run cli -- --help` works.
- `node dist/index.js --help` works.

## [x] 2) INIT Pipeline (`npm run init` / `rns init`) generates Expo or Bare app
- Init collects inputs (selection UI) and generates a runnable project.
- Init writes state manifest file and basic markers/structure needed for v2.

Acceptance
- `npm run init` generates an app that boots (expo/bare depending on choice).
- State manifest exists and is readable by the CLI.
- No “manual edits” required to run the base app.

## [x] 3) CORE Base (baseline architecture + safe defaults)
- Base must compile and run even with zero optional plugins installed.
- Base must contain the minimal runtime composition entrypoint and contracts.

Acceptance
- Fresh init builds/runs.
- Runtime loads with default/noop implementations.

## [x] 4) DX Baseline (alias, svg, fonts, env) — must be truly zero-manual
- Ensure baseline DX works out-of-the-box and stays stable on reruns.

Acceptance
- `@/` alias works for TS + runtime.
- SVG imports work (transformer configured).
- Fonts pipeline works (drop font + run provided script).
- `.env.example` exists + typed access pattern exists.

---

## [ ] 5) v2 Documentation Split (versioned docs discipline)
Goal: keep v1 docs frozen, develop new docs only in v2.

Work
- Create `docs/` as the only place for new specs.
- Move/keep all previous docs under `docs/version1/` unchanged.
- Add v2 “reference specs” that the code must follow:
  - `docs/cli-interface-and-types.md`
  - `docs/plugins-permissions.md`

Acceptance
- Repo clearly separates v1 and v2 docs.
- v2 docs become the source of truth for new engine work (below).

---

## [ ] 6) V2 Interfaces + Manifest (single source of truth)
Goal: lock the high-level contracts the engine relies on (NOT over-engineered, but complete enough for Capability).

Work
- Define the “high-level type set” (names/roles) and then the actual TypeScript types referenced by the engine:
  - `RnsProjectManifest` (project state)
  - `PluginDescriptor` (plugin blueprint)
  - `InstalledPluginRecord` (installed instance)
  - `PermissionRequirement` + platform mapping (iOS/Android)
  - `PluginSupport` (expo/bare + expo-go/dev-client constraints)
  - `ConflictRule` (only for real conflicts like ui/framework or nav/root)
  - `RuntimeContribution` (symbol refs for ts-morph injection)
  - `NativePatchOps` (declarative idempotent patch operations)
- Keep the manifest minimal but future-proof:
  - identity + target + packageManager + language
  - installedPlugins list
  - aggregated permission summary (derived)
  - schemaVersion + migrations support

Acceptance
- Manifest can be read/written by CLI reliably.
- Manifest supports “stress scenarios” (marketplace, offline flashcards, social, etc.) without changing schema every time.
- A migration path exists from current state file format (if schema changes).

---

## [ ] 7) Plugin Catalog v2 (MVP set + permissions + compatibility)
Goal: ship a real catalog with official plugin IDs and metadata.

Work
- Create an “official catalog” (about ~30 plugins to start) with:
  - id, name, category, tier (core/recommended/advanced/paid-ready tag)
  - support (expo/bare/both + expoGo/devClient constraints)
  - required permissions (structured, not strings-only)
  - runtime contributions (symbol refs)
  - native patch ops (if needed)
  - npm deps/devDeps (pm-safe rules; no `workspace:*` with npm)
- Permissions spec must be consistent with `docs/plugins-permissions.md`:
  - iOS Info.plist keys
  - Android manifest permissions/features
  - notes about OS versions / Expo Go limitations
- Define a small compatibility matrix for each plugin:
  - works in Expo Go
  - works in Expo Dev Client
  - works in Bare

Acceptance
- `rns plugin list` can show the catalog.
- Each plugin has explicit support + permissions info (no guessing at install time).
- Catalog can be extended without changing engine code.

---

## [ ] 8) Modulator Engine v2 (plan/apply/remove) — the Capability installer
Goal: implement the 3–5 phase pipeline reliably: **Plan → Scaffold → Link → Inject → Patch → Verify → State update**.

Work
- Implement `plan()` producing a deterministic operation list (dry-run).
- Implement `apply()` and `remove()` as transactional operations:
  - scaffold plugin workspace package from templates/assets
  - link dependencies via pm layer
  - inject runtime wiring via ts-morph (symbol-based)
  - apply native patch ops (idempotent)
  - update manifest state
  - run verification checks for that plugin
- Idempotency is mandatory:
  - re-running apply must become no-op or clean update (no duplicates)
  - remove must only undo what the plugin owns

Acceptance
- Installing a plugin twice does not duplicate imports/registrations/patches.
- Removing a plugin restores runtime wiring and updates state safely.
- Engine emits clear errors with phase breakdown.

---

## [ ] 9) Workspace Linking + Dependency Layer (pm-aware, deterministic)
Goal: eliminate install failures and pm inconsistencies.

Work
- Single dependency executor used everywhere (init + plugins).
- Respect chosen package manager, never mix.
- Enforce “workspace protocol policy”:
  - If packageManager is npm, do not emit `workspace:*`
  - If pnpm/yarn, allow workspace links when appropriate
- Provide consistent logs for pm commands and capture errors cleanly.

Acceptance
- No `EUNSUPPORTEDPROTOCOL workspace:*` issues.
- Init and plugin install succeed on npm/yarn/pnpm when supported.

---

## [ ] 10) Runtime Injection (ts-morph only, symbol-based, no user code edits)
Goal: plugin wiring happens in CLI-managed runtime composition, not in user `src`.

Work
- Implement a runtime composition model that supports:
  - service registry (capability tokens)
  - optional provider chain (multiple providers where valid)
  - optional “wrappers” (provider components) registered centrally
  - optional init hooks
- Implement injector:
  - add import(s) if missing
  - add registration(s) if missing
  - preserve formatting, stable output
  - supports eject/remove

Acceptance
- After plugin install, runtime includes provider and registrations exactly once.
- Remove restores runtime to previous state.
- No modifications occur in developer-owned `src/**` by default.

---

## [ ] 11) Native Patch Ops Engine (idempotent, backed up, recorded)
Goal: permissions and native requirements are applied safely.

Work
- iOS: Info.plist patch ops (add/replace keys)
- Android: manifest patch ops (permissions/features)
- Build files: anchor-based “apply once” patch ops (Podfile/Gradle when needed)
- Every patch:
  - backup before write
  - record provenance (plugin id, timestamp, operations)
  - verify result (key exists, permission exists, etc.)

Acceptance
- Re-running patch ops does not duplicate lines/nodes.
- Backups exist for each modified file.
- Patch provenance is traceable.

---

## [ ] 12) CLI Commands v2 (plugin surface + doctor)
Goal: consistent UX and reliable automation.

Work
- Commands:
  - `rns init`
  - `rns plugin list`
  - `rns plugin add <id>`
  - `rns plugin remove <id>`
  - `rns plugin status`
  - `rns doctor` (project + plugins + permissions + native patches)
- UX rule: selection UI must be stable (no arrow-key spam / duplicated messages).
- Output rule: minimal, precise, actionable.

Acceptance
- Commands operate purely from manifest + filesystem checks.
- Doctor reports meaningful fixes and blocks incompatible installs.

---

## [ ] 13) Stress Tests (manifest + engine) for many app scenarios
Goal: prove the interfaces and state model support many real scenarios.

Work
- Create stress scenarios (as data tests, not “manual docs”):
  - marketplace (Turo/Airbnb-like)
  - social feed + chat
  - dating
  - offline flashcards with import/export/backup
  - real estate map search
- Validate:
  - manifest can represent installed stack
  - permissions aggregation works
  - conflict rules only block real conflicts
  - expo/bare compatibility gating works

Acceptance
- Tests cover scenario manifests + plugin sets + compatibility.
- No schema changes required to represent scenarios.

---

## [ ] 14) Extensibility Guide (how devs add plugins/commands)
Goal: developers can extend the CLI without breaking the engine.

Work
- Document how to:
  - add a new plugin descriptor
  - add permissions mapping
  - add native patch ops
  - add runtime contributions
  - add a custom command that uses the engine
- Provide “contract checklist” for new plugin authoring.

Acceptance
- A dev can add a new plugin by following the guide without modifying core engine logic.
- Extensions remain pm-safe and idempotent.

---

## [ ] 15) CI Gates (prevent regressions)
Goal: generation and plugin installs must not silently break.

Work
- CI runs:
  - typecheck + lint + tests
  - init expo + init bare smoke
  - install a few core plugins smoke
  - doctor must pass on generated output

Acceptance
- PR cannot merge if init/plugin smoke fails.
- Reproducible runs with consistent logs.

## [ ] 0) Type Contracts (source of truth)

**Goal:** the repo contains real TypeScript contracts that match the schemas described in the docs.

**Source of truth paths**
- CLI contracts: `src/lib/types/**`
- Runtime/app contracts: `packages/@rns/core/src/contracts/**`

**Acceptance**
- `npm run build` (typecheck passes)
- No duplicated schema definitions across docs (docs reference the TS contracts)

