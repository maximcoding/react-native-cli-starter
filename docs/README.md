<!--
FILE: README.md
PURPOSE: Single-source, professional specification for CliMobile (RNS Starter CLI): scope, architecture, guarantees, clean user-project layout via local workspace packages, capability matrix, and blueprint usage.
OWNERSHIP: CLI
-->

# CliMobile — RNS Starter CLI

CliMobile is a **React Native project generator + expander**.

It has one mission:

1) **Generate** a new Expo or Bare React Native app that is **immediately runnable** with a strong baseline (**CORE**).  
2) **Extend** that app over time using **Plugins** (infrastructure capabilities) and **Business Modules** (feature scaffolds), with **zero manual setup**.

---

## Workflow (MANDATORY)

Before changing anything in this repo, read: **`AGENT.md`** and **`docs/WORKFLOW.md`**.

Rules:
- Work is done strictly by completing numbered checkbox items in **`docs/tasks/*`** (e.g. `02.2`, `09.2`).
- A checkbox can be marked `[x]` **only after verification** (the acceptance for that item actually passed).
- **One completed item = one commit**, and the same commit must include the checkbox update.
- Commit message format is mandatory: `task(<NN.N>): <short change>`.

---

## Quick Start (New Agent / New Chat)

1) Read `README.md`, `AGENT.md`, and `docs/WORKFLOW.md`.  
2) Open `docs/tasks/` and continue from the **first unchecked checkbox**.  
3) One checkbox = one commit, and the same commit marks it done.

Copy/paste kickoff message:
> Read `README.md`, `AGENT.md`, and `docs/WORKFLOW.md`.  
> Then execute `docs/tasks/*` strictly in order from the first unchecked checkbox.  
> One checkbox = one commit + mark it done in the same commit (`task(NN.N): ...`).  
> Keep `src/commands/*` thin; implement logic only in `src/lib/*`.  
> All integration must be FULL_AUTO (no manual user edits).  
> IMPORTANT: Generated app must use the **Workspace Packages model** (`packages/@rns/*`), keep user `src/` clean, and never inject CLI glue into user `src/`.

---

## TODO Steps (Execution Order)

The official implementation plan is the task list under **`docs/tasks/`**. Execute tasks **in order**:

1. `docs/tasks/01_cli_foundation.md`
2. `docs/tasks/02_init_pipeline.md`
3. `docs/tasks/03_core_base_pack.md`
4. `docs/tasks/04_dx_baseline.md`
5. `docs/tasks/05_template_packs_system.md`
6. `docs/tasks/06_dynamic_attachment_engine.md`
7. `docs/tasks/07_ownership_backups_idempotency.md`
8. `docs/tasks/08_marker_contract.md`
9. `docs/tasks/09_patching_engines_v1.md`
10. `docs/tasks/10_project_state_rn_init_json.md`
11. `docs/tasks/11_dependency_layer_pm_aware.md`
12. `docs/tasks/12_plugin_framework.md`
13. `docs/tasks/13_plugin_commands.md`
14. `docs/tasks/14_module_framework.md`
15. `docs/tasks/15_module_commands.md`
16. `docs/tasks/16_verification_smoke_ci.md`

---

## Canonical Entrypoints

Use these entrypoints only (don’t invent new ones):
- Dev runner: `npm run cli -- <args>`
- Dev init shortcut: `npm run init -- <args>` (equivalent to `rns init`)
- Built CLI: `rns <args>` (when installed) or `node <built_entry> <args>`

---

## 1) Product Guarantees (Non-Negotiable)

### 1.1 Zero-Manual Setup Guarantee (Init)

After `rns init` completes, the generated app must:
- compile and boot
- include the full CORE baseline (contracts + safe defaults)
- keep the user project **clean**: CLI glue and plugin code must live in **workspace packages** (`packages/@rns/*`)
- require **zero manual tweaks** for:
  - `@/` alias (user code)
  - importing `@rns/*` packages (workspace setup)
  - SVG imports
  - fonts pipeline
  - env pipeline
- include `.rn-init.json` state marker at project root

### 1.2 Zero-Manual Setup Guarantee (Plugins)

When a plugin is installed via `rns plugin add`, the CLI performs **full integration automatically**.

**User interaction is limited to selecting options (if the plugin has a wizard).**  
After the plugin finishes, the app must be **ready-to-run** without manual edits.

Full integration means the CLI must do all of the following automatically:
- install all required dependencies (runtime + dev)
- apply required configuration (Expo/Bare variants)
- attach plugin packs as **workspace packages** under `packages/@rns/*` (not under user `src/`)
- wire runtime integration via the **runtime package** (not by injecting code into user `src/`)
- apply platform integration via safe config/native patch operations (Android/iOS/Expo config), with backups + anchors
- update `.rn-init.json` with plugin + options + version
- run validation (`plugin doctor` or post-check) and show only actionable results

Not allowed:
- “go edit file X manually”
- “paste this snippet into App.tsx yourself”
- “follow 10 manual steps”
- requiring the user to search docs to finish setup

---

## 2) Glossary (Terms Used in This Project)

### Workspace Packages Model (Core Principle)

The generated app uses **local workspace packages** to isolate CLI-managed code from user business code.

- CLI-managed code lives under `packages/@rns/*`
- User business code remains clean (usually under `src/*`)
- Users can still edit/override packages if they want (they are local, not remote)

### Base (Template Pack)

A **template pack** stored inside the CLI repository that can be attached into a generated app.

- **CORE Base Pack**: always attached during init
- **Plugin Packs**: attached when a plugin is applied
- **Module Packs**: attached when a business module is generated

### CORE (Always After Init)

The baseline installed by the first generation (`rns init` / repo dev shortcut `npm run init`):
- a minimal app shell that imports `@rns/runtime`
- workspace packages layout (`packages/@rns/*`)
- infrastructure contracts + safe defaults (noop/memory stubs where appropriate)
- DX readiness: `@/`, SVG, fonts, env

### Plugins (Infrastructure Capabilities)

Optional capabilities that make the app “real” in specific directions: navigation, i18n, transport adapters, offline engine, storage backends, auth, observability, analytics, notifications, payments, tooling, CI workflows, etc.

Plugins:
- create/update local workspace packages under `packages/@rns/*`
- integrate by registering into `@rns/runtime` composition (providers/init/root/registry)
- apply platform integration via safe config/native patch ops (Android/iOS/Expo), no manual steps
- record install state in `.rn-init.json`

### Business Modules (Feature Scaffolds / Flows)

App-specific features (auth/profile/marketplace/orders/chat/settings…).

Modules:
- scaffold **user-owned business code** (typically under `src/features/*` or another user zone)
- register into runtime via stable contracts (registry)
- integrate with installed capabilities (when required plugins exist)

---

## 3) How the CLI Works (High-Level)

### 3.1 `rns init` (or repo dev shortcut `npm run init`)

Creates a new Expo or Bare RN project and attaches the **CORE Base Pack**:
- sets up a workspace (pnpm/yarn/npm workspaces)
- generates local packages under `packages/@rns/*` (starting with `@rns/runtime` + CORE contracts)
- produces a runnable app whose root `App.tsx` is minimal and imports the runtime package

### 3.2 `rns plugin add`

Adds selected capabilities to an initialized app via:
- attaching/updating plugin workspace packages under `packages/@rns/*`
- runtime registration (composition in `@rns/runtime`)
- config/native patching (Android/iOS/Expo integration)
- state update
- validation

### 3.3 `rns module add` (later phase)

Scaffolds business modules into the user’s business area and registers them via runtime contracts.

---

## 4) Clean Generated App Layout (Workspace Isolation)

The generated app must look like a “clean real project” to the user.

### 4.1 User-owned area (clean)
The user should be able to develop business logic without touching CLI internals:
- `src/**` (or another configured app folder)
- user assets under `assets/**`

### 4.2 CLI-managed area (isolated but editable)
CLI-managed infrastructure lives in local packages:
- `packages/@rns/runtime` (composition and wiring)
- `packages/@rns/core` (contracts, types, helpers)
- `packages/@rns/plugin-*` (plugins)
- `.rns/**` (state/logs/backups/receipts)

### 4.3 Minimal App entrypoint
The generated app entrypoints must stay minimal (examples, not exact code):
- `App.tsx` imports and renders `@rns/runtime`
- user modules are discovered via registry contracts, not via patching user `src/`

---

## 5) Canonical Integration Model (No Markers In User `src/`)

Plugins must not inject “glue code” into user business folders.

Canonical integration is done through:
- `@rns/runtime` composition (providers/init/root)
- plugin registration APIs (runtime reads installed plugins state / registry)
- config/native patching for platform integration

Markers (if ever used) must live only inside CLI-managed packages (e.g., inside `packages/@rns/runtime/*`), never inside user `src/*`.

---

## 6) Blueprint Usage (Reference, Not a Copy)

The repository contains a reference implementation at:
- `docs/ReactNativeCLITemplate/`

This is a **blueprint** used to:
- define file shapes, contracts, and patterns
- decide what belongs to CORE vs what must be a plugin/module

**Rule:** We do not copy-paste the entire blueprint folder into the app’s `src/`.  
Instead we:
- implement CORE and plugins as local workspace packages under `packages/@rns/*`
- keep user code clean for real-world development

---

## 7) Commands (Product Surface)

### 7.1 Init
- `rns init` — create RN/Expo app + attach CORE (workspace packages) + verify

### 7.2 Plugins
- `rns plugin list` — available plugins
- `rns plugin add [ids...]` — FULL_AUTO install (workspace packs + deps + runtime registration + config/native integration)
- `rns plugin status` — installed vs available
- `rns plugin doctor` — consistency validation (deps/state/packs/config-native)

### 7.3 Modules (later)
- `rns module list`
- `rns module add`
- `rns module status`
- `rns module doctor`

---

## 8) Repository Layout (CLI Repository)

- `src/cli.ts` — root command router
- `src/commands/*` — thin entrypoints
- `src/lib/*` — all real logic:
  - execution/logging, filesystem/backup, deps install, attachment engine, patch engines, state, verification
- `src/plugins/*` — plugin interface + registry
- `src/modules/*` — module interface + registry (later)
- `templates/base/*` — CORE Base Pack attached by init
- `templates/plugins/*` — Plugin Packs (now: pack contents are workspace packages)
- `templates/modules/*` — Module Packs (later)
- `docs/tasks/*` — executable task plan (checkbox-driven)
- `docs/ReactNativeCLITemplate/*` — blueprint reference only

---

## 9) Capabilities Matrix (Base vs CORE vs Plugins vs Business Modules)

**Legend**
- **Type**: `CORE` (always installed by init), `PLUGIN` (optional), `MODULE` (business)
- **Default**: installed at init (Yes/No)
- **Platforms**: Expo / Bare
- **Integration**: how it attaches (Base Pack / Plugin Pack / Module Pack + Runtime registration + Config/Native patches)
- **Setup**: always `FULL_AUTO` (zero manual setup)

### 9.1 CORE Baseline (installed at init)

| Capability | Type | Default | Platforms | Setup | Outcome (high-level) | Integration |
|---|---:|:---:|---|---|---|---|
| Workspace layout (`packages/@rns/*`) | CORE | Yes | Expo+Bare | FULL_AUTO | CLI-managed infra isolated as editable local packages | Base Pack |
| Runtime package `@rns/runtime` | CORE | Yes | Expo+Bare | FULL_AUTO | single composition entry for providers/init/root | Base Pack |
| Project State `.rn-init.json` | CORE | Yes | Expo+Bare | FULL_AUTO | CLI-manageable app with recorded settings | Base Pack |
| `@/` Path Alias (user code) | CORE | Yes | Expo+Bare | FULL_AUTO | clean imports in user code without manual config | Base Pack |
| `@rns/*` Imports (workspace) | CORE | Yes | Expo+Bare | FULL_AUTO | runtime/plugins importable without manual config | Base Pack |
| SVG Import Pipeline | CORE | Yes | Expo+Bare | FULL_AUTO | SVG imports work immediately | Base Pack |
| Fonts Pipeline | CORE | Yes | Expo+Bare | FULL_AUTO | fonts assets pipeline ready | Base Pack |
| Env Pipeline | CORE | Yes | Expo+Bare | FULL_AUTO | `.env.example` + typed access pattern | Base Pack |
| Logging Contract + Default Logger | CORE | Yes | Expo+Bare | FULL_AUTO | stable logging API with safe default | `@rns/core` |
| Error Normalization Contract | CORE | Yes | Expo+Bare | FULL_AUTO | unified error shape across layers | `@rns/core` |
| Storage Contracts | CORE | Yes | Expo+Bare | FULL_AUTO | stable storage APIs with safe defaults | `@rns/core` |
| Network/Transport/Offline Contracts | CORE | Yes | Expo+Bare | FULL_AUTO | app compiles even with no backend + offline-ready contracts | `@rns/core` |

### 9.2 Plugin Catalog (Infrastructure Capabilities)

> Stable plugin IDs (expected). Each plugin must provide FULL_AUTO setup via the CLI and live as a local workspace package under `packages/@rns/*`.

#### UX / App Shell
| Plugin | Type | Default | Platforms | Setup | Outcome | Integration |
|---|---:|:---:|---|---|---|---|
| `ui.theme` | PLUGIN | No | Expo+Bare | FULL_AUTO | theme provider + tokens | `@rns/plugin-ui-theme` + runtime registration |
| `ui.safe-area` | PLUGIN | No | Expo+Bare | FULL_AUTO | safe area baseline | `@rns/plugin-ui-safe-area` + runtime registration |
| `ui.gesture-handler` | PLUGIN | No | Expo+Bare | FULL_AUTO | gesture root wiring | `@rns/plugin-ui-gesture-handler` + runtime registration |
| `ui.reanimated` | PLUGIN | No | Expo+Bare | FULL_AUTO | reanimated wiring | `@rns/plugin-ui-reanimated` + config/native patches |
| `ui.lottie` | PLUGIN | No | Expo+Bare | FULL_AUTO | lottie support | `@rns/plugin-ui-lottie` |
| `ui.icons` | PLUGIN | No | Expo+Bare | FULL_AUTO | icons pipeline | `@rns/plugin-ui-icons` |
| `ui.splash.bootsplash` | PLUGIN | No | Expo+Bare | FULL_AUTO | splash screen integration | `@rns/plugin-ui-bootsplash` + config/native patches |

#### Navigation
| Plugin | Type | Default | Platforms | Setup | Outcome | Integration |
|---|---:|:---:|---|---|---|---|
| `nav.core` | PLUGIN | No | Expo+Bare | FULL_AUTO | navigation container + root wiring | `@rns/plugin-nav-core` + runtime registration |
| `nav.flows` | PLUGIN | No | Expo+Bare | FULL_AUTO | ROOT_AUTH/APP/ONBOARD flows | `@rns/plugin-nav-flows` + registry contract |
| `nav.typed-routes` | PLUGIN | No | Expo+Bare | FULL_AUTO | typed route params/constants | `@rns/plugin-nav-typed-routes` |

#### i18n
| Plugin | Type | Default | Platforms | Setup | Outcome | Integration |
|---|---:|:---:|---|---|---|---|
| `i18n.core` | PLUGIN | No | Expo+Bare | FULL_AUTO | language detection + translations | `@rns/plugin-i18n-core` + runtime registration |

#### Data / Query / Caching
| Plugin | Type | Default | Platforms | Setup | Outcome | Integration |
|---|---:|:---:|---|---|---|---|
| `data.react-query` | PLUGIN | No | Expo+Bare | FULL_AUTO | query client + patterns | `@rns/plugin-data-react-query` + runtime registration |
| `data.query-persist` | PLUGIN | No | Expo+Bare | FULL_AUTO | query cache persistence | `@rns/plugin-data-query-persist` |
| `data.pagination` | PLUGIN | No | Expo+Bare | FULL_AUTO | pagination helpers | `@rns/plugin-data-pagination` |

#### Transport Adapters
| Plugin | Type | Default | Platforms | Setup | Outcome | Integration |
|---|---:|:---:|---|---|---|---|
| `transport.rest` | PLUGIN | No | Expo+Bare | FULL_AUTO | REST adapter | `@rns/plugin-transport-rest` + runtime registration |
| `transport.graphql` | PLUGIN | No | Expo+Bare | FULL_AUTO | GraphQL adapter | `@rns/plugin-transport-graphql` |
| `transport.websocket` | PLUGIN | No | Expo+Bare | FULL_AUTO | WebSocket adapter | `@rns/plugin-transport-websocket` |
| `transport.mock` | PLUGIN | No | Expo+Bare | FULL_AUTO | mock backend adapter | `@rns/plugin-transport-mock` |
| `transport.local` | PLUGIN | No | Expo+Bare | FULL_AUTO | local/offline adapter | `@rns/plugin-transport-local` |

#### Offline-first
| Plugin | Type | Default | Platforms | Setup | Outcome | Integration |
|---|---:|:---:|---|---|---|---|
| `offline.netinfo` | PLUGIN | No | Expo+Bare | FULL_AUTO | real connectivity detection | `@rns/plugin-offline-netinfo` + config/native patches (if needed) |
| `offline.outbox` | PLUGIN | No | Expo+Bare | FULL_AUTO | offline mutation queue | `@rns/plugin-offline-outbox` |
| `offline.sync` | PLUGIN | No | Expo+Bare | FULL_AUTO | sync engine wiring | `@rns/plugin-offline-sync` |
| `offline.policies` | PLUGIN | No | Expo+Bare | FULL_AUTO | conflict/retry/backoff policies | `@rns/plugin-offline-policies` |

#### Storage
| Plugin | Type | Default | Platforms | Setup | Outcome | Integration |
|---|---:|:---:|---|---|---|---|
| `storage.mmkv` | PLUGIN | No | Bare (+expo if supported) | FULL_AUTO | persistent KV backend | `@rns/plugin-storage-mmkv` + config/native patches |
| `storage.sqlite` | PLUGIN | No | Expo+Bare | FULL_AUTO | SQLite backend | `@rns/plugin-storage-sqlite` |
| `storage.secure` | PLUGIN | No | Expo+Bare | FULL_AUTO | secure storage backend | `@rns/plugin-storage-secure` |
| `storage.files` | PLUGIN | No | Expo+Bare | FULL_AUTO | file storage helpers | `@rns/plugin-storage-files` |

#### State Management
| Plugin | Type | Default | Platforms | Setup | Outcome | Integration |
|---|---:|:---:|---|---|---|---|
| `state.zustand` | PLUGIN | No | Expo+Bare | FULL_AUTO | store patterns + persistence | `@rns/plugin-state-zustand` |
| `state.redux-toolkit` | PLUGIN | No | Expo+Bare | FULL_AUTO | RTK scaffold | `@rns/plugin-state-rtk` |

#### Auth & Security
| Plugin | Type | Default | Platforms | Setup | Outcome | Integration |
|---|---:|:---:|---|---|---|---|
| `auth.foundation` | PLUGIN | No | Expo+Bare | FULL_AUTO | session/tokens/guards wiring | `@rns/plugin-auth-foundation` + runtime registration |
| `auth.cognito` | PLUGIN | No | Expo+Bare | FULL_AUTO | Cognito integration | `@rns/plugin-auth-cognito` + config/native patches |
| `auth.auth0` | PLUGIN | No | Expo+Bare | FULL_AUTO | Auth0 integration | `@rns/plugin-auth-auth0` + config/native patches |
| `auth.firebase` | PLUGIN | No | Expo+Bare | FULL_AUTO | Firebase auth integration | `@rns/plugin-auth-firebase` + config/native patches |
| `auth.custom` | PLUGIN | No | Expo+Bare | FULL_AUTO | custom backend auth scaffold | `@rns/plugin-auth-custom` |

#### Observability / Analytics / Notifications / Payments / DevOps (including CI)
| Plugin | Type | Default | Platforms | Setup | Outcome | Integration |
|---|---:|:---:|---|---|---|---|
| `obs.sentry` | PLUGIN | No | Expo+Bare | FULL_AUTO | error reporting | `@rns/plugin-obs-sentry` + config/native patches |
| `analytics.firebase` | PLUGIN | No | Expo+Bare | FULL_AUTO | analytics wiring | `@rns/plugin-analytics-firebase` + config/native patches |
| `notify.fcm` | PLUGIN | No | Expo+Bare | FULL_AUTO | push notifications | `@rns/plugin-notify-fcm` + config/native patches |
| `pay.stripe` | PLUGIN | No | Expo+Bare | FULL_AUTO | payments scaffold | `@rns/plugin-pay-stripe` + config/native patches |
| `dev.tooling` | PLUGIN | No | Expo+Bare | FULL_AUTO | lint/format + optional CI workflows | `@rns/plugin-dev-tooling` (+ `.github/workflows/*`) |

### 9.3 Business Modules (feature scaffolds / flows — later)

| Module | Type | Default | Platforms | Setup | Outcome | Integration |
|---|---:|:---:|---|---|---|---|
| `module.auth` | MODULE | No | Expo+Bare | FULL_AUTO | auth screens + flow integration | generates user code + registry |
| `module.onboarding` | MODULE | No | Expo+Bare | FULL_AUTO | onboarding screens + completion flag | generates user code + registry |
| `module.user-profile` | MODULE | No | Expo+Bare | FULL_AUTO | profile screens/models | generates user code + registry |
| `module.settings` | MODULE | No | Expo+Bare | FULL_AUTO | preferences screens | generates user code + registry |
| `module.marketplace` | MODULE | No | Expo+Bare | FULL_AUTO | marketplace scaffolds | generates user code + registry |
| `module.orders` | MODULE | No | Expo+Bare | FULL_AUTO | orders/bookings scaffolds | generates user code + registry |
| `module.chat` | MODULE | No | Expo+Bare | FULL_AUTO | chat scaffolds | generates user code + registry |

---

## 10) Success Criteria (Definition of Done)

### After init
- app compiles and boots (Expo or Bare)
- CORE baseline exists (workspace packages + contracts + safe defaults)
- alias/svg/fonts/env are ready with no manual steps
- `.rn-init.json` exists and is valid
- user `src/` stays clean (no CLI glue injected)

### After plugin add
- plugin is fully installed and wired automatically (FULL_AUTO)
- plugin lives as workspace package under `packages/@rns/*`
- state updated
- doctor validation passes (or prints actionable issues)

---

## 11) Standards: File Header Policy

Every created source file in this repo and generated packs must start with a header that includes:
- `FILE: <path>`
- `PURPOSE: <one line>`
- `OWNERSHIP: CLI | CORE(template) | PLUGIN(<id>) | MODULE(<id>) | GENERATED`

Formats without comments (e.g., JSON) must remain valid JSON; do not add comments.
