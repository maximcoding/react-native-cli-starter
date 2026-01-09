<!--
FILE: docs/TODO.md
PURPOSE: Technical TODO (main topics only). Checkbox only on section title. English. Low indentation.
OWNERSHIP: CLI
-->

# TODO — CliMobile (RNS Starter CLI) — Technical Work Order

## [x] 1) CLI Foundation

Build a stable TypeScript CLI repository designed for long-term maintenance. Output must be a runnable `rns` binary from
`dist/`, plus a local dev runner (`npm run cli`) that behaves the same as the built CLI. Establish a single
logging/error format (step-based execution, clean failures, no default stack spam) and enforce a repo structure where
`src/commands/*` are thin entrypoints and all real logic lives in `src/lib/*`.

## [x] 2) INIT Pipeline (`npm run init` / `rns init`)

Implement a full init flow that creates a new Expo Framework or Bare React Native app and finishes in a "ready-to-run" state with zero
manual edits. Init must collect inputs (wizard/flags), create the project, attach the CORE base pack, install required
dependencies, apply needed configs/scripts, create/validate markers, write `.rn-init.json`, run final integrity checks,
and print clear next steps. The acceptance bar is simple: the app boots immediately after init.

## [x] 3) CORE Base Pack (`templates/base`)

Lock and maintain a single CORE base template pack that is always attached by init. CORE is not a demo app; it is the
baseline architecture and infrastructure foundation for any app style (online/offline, multiple network adapters,
multiple storage backends, multiple auth providers, observability, etc.). CORE must include the app shell,
`app/core/infra/features` layering, assets structure, canonical markers, infrastructure contracts (interfaces/facades),
and safe defaults (noop/memory/stubs) so the project compiles and runs even with zero capability plugins installed.

## [x] 4) DX Baseline (out-of-the-box)

Guarantee zero-manual-setup developer experience immediately after init. `@/` alias must work for TypeScript and
runtime. SVG imports must work via normal code imports. Fonts pipeline must be ready for custom fonts without extra
steps. Env pipeline must exist with `.env.example` and a typed access pattern. The user must not open docs or hand-edit
configs to get these basics working.

## [x] 5) Docs Contract Set (canonical, non-duplicated)

Lock the canonical docs set and rules so work can be delegated safely:
- `README.md` high-level product model + quick start
- `docs/TODO.md` single work-order
- `docs/WORKFLOW.md` execution rules (run/verify/commit; no regressions)
- `docs/AGENT.md` AI agent rules (scope control + acceptance checks)
- `docs/cli-interface-and-types.md` canonical type names/shapes index (no duplicated schema elsewhere)
- `docs/plugins-permissions.md` permission catalog dataset (providers + mappings)
Rule: do not shrink or delete intent; move long lists to dedicated docs instead of removing them.

## [x] 6) Template Packs System (CORE / Plugin / Module packs)

Define the template-pack system as the core mechanism for "dynamic attachment" into the generated app. The CLI must
support CORE packs, plugin packs, and module packs with a consistent structure, clear ownership rules, and target
variants (Expo Framework/Bare React Native, TS/JS) without turning the repo into duplication chaos. This is how capabilities scale without
rewriting CORE.

## [x] 7) Dynamic Template Attachment Engine

Build the engine that deterministically selects and attaches the correct template packs/variants into the target app
based on init parameters and chosen capability options. It must understand targets (expo/bare, ts/js), apply
option-driven variants, merge safely by stable priorities, prevent destructive collisions, and guarantee repeatable
output (same inputs → same output). This engine is the backbone of "CLI does the setup automatically."

## [x] 8) Ownership, Backups, Idempotency

Enforce strict safety rules: which files are CLI-owned vs user-owned, which regions may be changed only through markers,
and how backups/rollback work. Any operation that edits files must create `.rns/backups/<timestamp>/...`. Any operation
must be idempotent: rerunning init (when applicable) or reapplying a plugin must never duplicate injections or break the
app. This is mandatory to support many plugins at scale.

## [x] 9) Marker Contract (canonical integration points)

Lock the canonical integration markers as the only supported wiring method for plugins/modules into the app shell.
Markers must always exist in CORE, be validated before patching, and produce clean, actionable errors when missing or
corrupted (which marker, which file, how to restore). This contract prevents plugins from rewriting app code and keeps
the system maintainable.

## [x] 10) Marker Patcher Engine v1

Implement a single patcher that safely injects changes only inside markers (imports/providers/init/root). It must
guarantee no duplicates, stable output, resilience to formatting/newlines, and traceability by capability id
(plugin/module). It must always backup before writing. All plugins/modules must use this patcher (no ad-hoc regex hacks
per plugin).

## [x] 11) Runtime Wiring Engine (AST-only, symbol-based)

Implement runtime wiring via ts-morph only (no regex, no raw code-string injection). Wiring must be symbol-based and
composed in SYSTEM ZONE (`packages/@rns/**`) so developer business code (`src/**`) remains untouched. Define stable
injection points for providers/wrappers/init steps/registrations and guarantee deterministic ordering.

## [x] 12) Patch Operations System (native/config, idempotent)

Define and implement patch operations as declarative, idempotent units for:
- Expo config (app.json/app.config.*)
- iOS plist keys / entitlements
- Android manifest permissions/features
- anchored text edits (Gradle/Podfile)
Rules: anchored, insert-once, backed up under `.rns/backups/...`, traceable by plugin id.

## [x] 13) Project State System (`.rns/rn-init.json`)

Make `.rns/rn-init.json` the single source of truth for what was generated and what is installed. Init writes base
parameters (target, language, package manager, toggles, versions). Plugin/module installs update state (id, version,
installedAt, options). Every CLI command must validate state before acting and refuse to run on non-initialized projects
with an actionable message. State enables correct status/doctor behavior and safe repeatable installs.

## [x] 14) Dependency Layer (pm-aware)

Build a unified dependency installation layer for npm/pnpm/yarn that guarantees deterministic installs for
init/plugins/modules. It must respect lockfile discipline, never mix package managers, log install commands, and provide
clear error output on failure. Plugins/modules must not run package-manager commands directly; they must go through the
dependency layer for consistent behavior.

## [x] 15) Modulator Engine v1 (plan/apply/remove)

Build the generic installation engine that:
- plans changes (dry-run) deterministically
- applies changes in stable phases
- can remove plugins safely (NO-OP if already absent; never touches USER ZONE)
Plan/apply/remove must report: deps, runtime wiring ops, patch ops, permissions summary, conflicts, and manifest updates.

## [x] 16) Permissions Model v1 (IDs + mapping + providers)

Make permissions data-driven:
- plugins declare PermissionIds (not raw platform strings)
- permissions resolve through `docs/plugins-permissions.md` dataset
- installers apply platform changes via patch ops
Manifest must store aggregated permissions plus per-plugin traceability (mandatory vs optional).

## [ ] 17) Environment Doctor (`rns doctor --env`)

Implement a machine preflight that checks required tooling for the chosen target:
- Node, package manager, git
- Expo toolchain (when target is Expo)
- Android toolchain (SDK/JDK/adb/gradle) and iOS toolchain (Xcode/CocoaPods) when target is Bare
Must fail early with actionable fixes and block destructive commands when critical items are missing.

## [ ] 18) Project Doctor (`rns doctor`, `rns doctor --fix`)

Implement project-level validation:
- manifest present + valid schema version (migrate when needed)
- ownership zones intact (no SYSTEM/USER contamination)
- no duplicate injections (markers/AST wiring/patch ops)
- installed plugins are consistent with workspace + deps
`--fix` may only apply safe fixes in SYSTEM ZONE (never touches `src/**`).

## [ ] 19) Plugin Framework (registry, apply, doctor)

Build a real plugin system where every shipped plugin is a fully automated capability (FULL_AUTO). The framework must
support stable plugin IDs, a registry/catalog, a standardized apply pipeline (deps + packs + wiring + state update), and
a `doctor` validation model. Installing any shipped plugin must never require manual file edits in the app; the CLI must
perform the entire setup.

## [ ] 20) Plugin Commands (list, add, remove, status, doctor)

Implement the plugin command surface: list catalog, add by IDs (or interactive selection), remove, status (installed vs
available), and doctor (validation/diagnostics). Commands must be state-driven, use the template attachment engine and
marker patcher, respect ownership/backup/idempotency policy, and output minimal but precise information to the user.

## [ ] 21) Module Framework (business scaffolds)

Design and implement the business module framework that generates feature code (screens/flows/domain/state) and
integrates through a stable registration model. Modules are not infrastructure; they consume CORE contracts and
installed capability plugins (navigation, auth, transport, storage, query). Module generation must result in a fully
integrated feature without manual wiring or CORE rewrites.

## [ ] 22) Module Commands (list, add, status, doctor)

Implement module list/add/status/doctor commands. Adding a module must automatically attach and register the module (no
manual “edit registry”), update state, and be diagnosable via doctor. Module removal is not required in MVP; stability
and automation of generation/integration is the priority.

## [ ] 23) Verification, Smoke, CI Gates

Introduce quality gates that prevent regressions: tests for key engines (attachment, patcher, state, dependency layer),
smoke flows (init expo, init bare, plugin install + doctor), and a CI pipeline that blocks changes that break generation
or integration. This is mandatory because the plugin surface is large and will otherwise become unstable quickly.
