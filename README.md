<!--
FILE: README.md
PURPOSE: High-level, human-readable overview + quick start for CliMobile (RNS).
         Explains the product model (Base App + Plugins) and links to /docs for the canonical contracts and workflow.
         This is the root README.md for GitHub. The canonical version is in docs/README.md.
OWNERSHIP: CLI
-->

<div align="center">

# 🚀 CliMobile (RNS)

**Universal React Native "LEGO Platform" CLI**  
Generate a clean **Base App** (Expo or Bare RN) and then install **Capabilities (Plugins)** safely — *zero manual setup, permission-aware, conflict-aware, idempotent.*

[![Node.js](https://img.shields.io/badge/Node.js-≥18-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![npm version](https://img.shields.io/npm/v/climobile.svg)](https://www.npmjs.com/package/climobile)

[Quick Start](#-quick-start) • [Key Features](#-key-features) • [Generated App Structure](#-generated-app-structure) • [Plugin Catalog](#-plugins-optional---full-catalog) • [Docs](#-documentation) • [Contributing](#-contributing)

</div>

---

## ✨ What is CliMobile?

CliMobile is a **React Native project generator + expander** built around a strict model:

- **Base App**: `rns init` creates a runnable project (**Expo** or **Bare React Native**) that boots immediately.
- **Plugins (Capabilities)**: `rns plugin add <id...>` installs infrastructure capabilities end‑to‑end (**deps + runtime wiring + native/config patch ops + permissions + manifest update**).
- **Modulator Engine**: the deterministic installer pipeline (**Plan → Apply → Verify**) that makes installs repeatable.

### Why it exists

React Native projects become brittle when infrastructure is added manually:

- "paste this provider into App.tsx"
- "edit AndroidManifest / Info.plist / Gradle / Podfile"
- "this package conflicts with that package"
- "upgrade broke wiring again"

CliMobile solves this by enforcing **ownership zones** and using **data-driven plugin descriptors** + **idempotent patch operations**.

### The Problem vs The Solution

| Traditional RN Setup | With CliMobile |
|---|---|
| ⏱️ Manual config edits | ⚡ **Automated generation** |
| 🧩 Copy/paste glue code | 🧱 **Plugins install end-to-end** |
| 🧨 Native config conflicts | ✅ **Conflict-aware installs** |
| 🔄 Repeating starter work | ♻️ **Reusable CORE + plugins** |
| 😵 Late conflict discovery | 🧭 **Slot-based conflict model** |
| 🔐 Permission tribal knowledge | 📋 **Permission IDs → mapped** |

---

## 🎯 Non‑negotiables (Platform rules)

- **Base first, then plugins.** Base App is always runnable.
- **Zero manual setup for shipped plugins.** If we ship it, the CLI installs it fully.
- **Idempotent operations.** Run the same command twice → **NO duplicates**.
- **No user-zone edits.** Your business code (`src/**`) stays clean by default.
- **Block only real conflicts.** Slot conflicts (single vs multi) prevent only true incompatibilities.
- **Docs-first contracts.** If code and `docs/cli-interface-and-types.md` diverge → treat as a bug.

---

## 🚀 Quick Start

### 1) Install

```bash
npm i -g climobile
# or: pnpm add -g climobile
# or: yarn global add climobile
```

Verify:

```bash
rns --help
rns --version
```

### 2) Preflight (MANDATORY)

Validate your machine before generating a project:

```bash
rns doctor --env
```

### 3) Create a Base App

Expo:

```bash
rns init MyApp --target expo --lang ts --pm pnpm
cd MyApp
pnpm start
```

Bare RN:

```bash
rns init MyApp --target bare --lang ts --pm pnpm --platforms ios,android
cd MyApp
pnpm ios
pnpm android
```

### 4) Add capabilities (Plugins)

```bash
rns plugin list
rns plugin add data.react-query storage.mmkv state.zustand --dry-run
rns plugin add data.react-query storage.mmkv state.zustand
rns doctor
```

---

## 💡 Key Features

### 🧱 Base App (CORE) — always included

The Base App is designed to be a stable foundation for **any app archetype** (online, offline-first, marketplace, chat, real-estate, etc.):

- **Ownership zones** (System vs User) enforced
- **Workspace packages layout** under `packages/@rns/**`
- **Runtime composition layer** under `packages/@rns/runtime/**`
- **Kernel contracts + safe defaults** under `packages/@rns/core/**`
- **DX baseline**: aliases (`@/`), SVG, fonts, env pipeline (no manual setup)
- **Project manifest** `.rns/rn-init.json` (single source of truth)
- **Doctor tooling**: environment + project validation gates
- **Navigation infrastructure** (Bare RN): React Navigation presets with registry-based screen registration (see `docs/navigation.md`)

> CORE provides *contracts and defaults*. Concrete capabilities (auth, adapters, payments, etc.) come from plugins.

### 🔌 Plugin system (Capabilities)

Each plugin is a **declarative blueprint** (descriptor) that can express:

- support rules (Expo/Bare + Expo runtime constraints)
- slot conflicts (single vs multi)
- permission IDs (resolved via dataset)
- runtime contributions (AST‑only; ts‑morph; symbol references)
- patch operations (native/config edits; anchored; idempotent; backed up)
- required npm deps (pm-aware install)

### 🛡️ Safety & repeatability

- **Plan first** (`--dry-run`) → see exactly what will change
- **Backups** before patching under `.rns/backups/<timestamp>/...`
- **Re-run safe**: apply twice is either a NO‑OP or a clean reconcile
- **Doctor gates** to prevent half‑applied / broken states

---

## 🎨 Generated App Structure

> **User Zone** = your business code (`src/**`)  
> **System Zone** = CLI-managed (`packages/@rns/**` + `.rns/**`)

```txt
MyApp/
├── .rns/                       # SYSTEM: manifest, logs, backups
│   └── rn-init.json            # Project Manifest (source of truth)
├── src/                        # USER: your business code (CLI must not edit)
├── packages/                   # SYSTEM: CLI-managed workspace packages
│   └── @rns/
│       ├── core/               # kernel contracts + safe defaults
│       ├── runtime/            # runtime composition + wiring targets
│       └── plugin-*/           # installed plugins as local packages
└── ...                         # Expo/Bare native scaffolding (target-specific)
```

**Key principle:** plugins integrate via `packages/@rns/runtime/**`, not by patching your `src/**`.

**Navigation (Bare RN):** The CORE navigation system (`packages/@rns/navigation/**`) includes React Navigation with preset support (stack, tabs, drawer, modals). Users can register their own screens from User Zone via a registry file (`src/app/navigation/registry.ts`) without modifying System Zone. See [`docs/navigation.md`](docs/navigation.md) for complete guide.

---

## 📋 Capabilities Matrix

### CORE (Always Installed)

| Capability | Targets | Notes |
|---|---|---|
| Workspace packages (`packages/@rns/**`) | Expo + Bare | Isolation and maintainability |
| Runtime composition (`@rns/runtime`) | Expo + Bare | Single wiring hub |
| Kernel contracts (`@rns/core`) | Expo + Bare | Stable, additive contracts + defaults |
| Ownership zones | Expo + Bare | CLI edits System Zone only |
| Manifest (`.rns/rn-init.json`) | Expo + Bare | Project passport + migrations |
| Doctor (`doctor --env`, `doctor`) | Expo + Bare | Safety gate for changes |
| DX baseline (alias/SVG/fonts/env) | Expo + Bare | Zero manual setup |
| CI/CD Workflows (GitHub Actions templates) | Expo + Bare | ⚠️ PLANNED - Implementation in TODO Section 24 |
| Theme System (dark/light) | Expo + Bare | Theme provider + tokens |
| Splash Screen | Expo + Bare | Boot splash screen |
| Feature Flags Registry | Expo + Bare | Local feature flags (extendable by plugins) |
| Code Quality Tools (Prettier, Husky, ESLint) | Expo + Bare | Formatting, git hooks, linting |
| Navigation Infrastructure | Expo + Bare | React Navigation presets (Bare RN). Registry-based screen registration (see `docs/navigation.md`) |
| Cache Engine | Expo + Bare | Snapshot cache contract + in-memory default |
| UI Components | Expo + Bare | Minimal UI components (MinimalUI, basic components) |
| Development Scripts | Expo + Bare | Clean, and other dev scripts (beyond doctor) |

### Plugins (Optional - Full Catalog)

> This is a **capability catalog**. Concrete shipped plugin IDs and their exact support rules live in the plugin catalog & docs.

| Category | Examples (IDs) | Slot mode |
|---|---|---|
| Navigation root | `nav.react-navigation`, `nav.expo-router` | **single** |
| UI framework | `ui.paper`, `ui.tamagui`, `ui.nativebase` | **single** |
| Animations | `animation.reanimated`, `animation.lottie` | multi |
| State | `state.zustand`, `state.xstate`, `state.mobx` | multi |
| Data fetching / cache | `data.react-query`, `data.apollo`, `data.swr` | multi |
| Network transport | `transport.axios`, `transport.fetch`, `transport.graphql`, `transport.websocket`, `transport.firebase` | **multi** |
| Auth | `auth.firebase`, `auth.cognito`, `auth.auth0`, `auth.custom-jwt` | multi |
| AWS Services | `aws.amplify`, `aws.appsync`, `aws.dynamodb`, `aws.s3` | multi |
| Storage | `storage.mmkv`, `storage.sqlite`, `storage.secure`, `storage.filesystem` | multi |
| Firebase Products | `firebase.firestore`, `firebase.realtime-database`, `firebase.storage`, `firebase.remote-config` | multi |
| Offline-first | `offline.netinfo`, `offline.outbox`, `offline.sync` | multi |
| Notifications | `notify.expo`, `notify.fcm`, `notify.onesignal` | multi |
| Maps / location | `geo.location`, `maps.mapbox`, `maps.google` | multi |
| Camera / media | `media.camera`, `media.vision-camera`, `media.picker` | multi |
| Payments | `pay.stripe` | multi |
| Subscriptions / IAP | `iap.revenuecat`, `iap.adapty`, `iap.app-store`, `iap.play-billing` | **single** |
| Analytics / observability | `analytics.firebase`, `analytics.amplitude`, `obs.sentry`, `obs.bugsnag` | multi |
| i18n | `i18n.i18next`, `i18n.lingui` | multi |
| Search | `search.algolia`, `search.local-index` | multi |
| OTA Updates | `ota.expo-updates`, `ota.code-push` | **single** |
| Background Tasks | `background.tasks`, `background.geofencing`, `background.fetch` | multi |
| Privacy & Consent | `privacy.att`, `privacy.consent`, `privacy.gdpr` | multi |
| Device / Hardware | `device.biometrics`, `device.bluetooth` | multi |
| Testing | `test.detox` | multi |

---

## 🧭 Expo vs Bare support rules

Every plugin declares support:

- **Targets**: `expo | bare | both`
- **Expo runtime**: `expo-go | dev-client | standalone` (when relevant)
- **Platforms**: `ios | android | web` (optional)

The CLI must refuse incompatible installs early with clear errors.

---

## 🔐 Permissions model (IDs + mapping)

Plugins declare **permission IDs**, not raw platform strings.

- Dataset: `docs/plugins-permissions.md`
- The CLI resolves IDs into:
  - iOS `Info.plist` keys (+ notes)
  - Android `AndroidManifest` permissions/features (+ notes)
  - provider SDK notes (Expo module vs bare provider)

---

## 🧠 How it works (Modulator Engine)

When you run `rns plugin add <id>`, the engine executes:

1. **Doctor gate** (project initialized + env sane)
2. **Plan** (deps, slots, permissions, patch ops, runtime ops)
3. **Scaffold** (ensure plugin packages exist in System Zone)
4. **Link** (workspace + pm-aware installs)
5. **Wire runtime** (AST edits only; ts-morph; symbol refs)
6. **Patch native/config** (declarative ops; idempotent; backed up)
7. **Update manifest** (single source of truth)
8. **Verify** (no duplicates; markers/anchors intact)

---

## 💼 Example Use Cases

### E-commerce App
```bash
rns init ShopApp --target expo --lang ts
rns plugin add pay.stripe auth.firebase storage.mmkv state.zustand
```
**Result**: Full payment processing, authentication, fast storage, and state management — zero manual wiring.

### Social Media App
```bash
rns init SocialApp --target bare --lang ts
rns plugin add notify.fcm media.camera geo.location data.react-query
```
**Result**: Push notifications, camera access, location services, and data fetching — all configured automatically.

### Offline-First App
```bash
rns init OfflineApp --target expo --lang ts
rns plugin add offline.netinfo offline.outbox storage.sqlite
```
**Result**: Connectivity detection, offline queue, and local database — ready for sync logic.

---

## 🗺️ Project Status

- ✅ **Core Features**: Base app generation (Expo/Bare), plugin system foundation, CORE baseline
- ✅ **Completed**: CLI foundation, init pipeline, DX baseline, docs contract
- 🚧 **In Progress**: Template packs system, dynamic attachment engine, marker patcher
- 📋 **Roadmap**: See `docs/TODO.md` for detailed work order (23 sections total)

---

## 📚 Documentation

All canonical documentation lives under `docs/`:

- **`docs/README.md`** — high-level product model + quick start (canonical version)
- **`docs/TODO.md`** — single work-order (execute top-to-bottom)
- **`docs/WORKFLOW.md`** — repo execution rules (run/verify/commit/no regressions)
- **`docs/AGENT.md`** — AI agent rules (scope control + acceptance checks)
- **`docs/cli-interface-and-types.md`** — canonical contracts/types (**no duplicated schema elsewhere**)
- **`docs/plugins-permissions.md`** — permission IDs dataset + platform mapping
- **`docs/navigation.md`** — navigation registry system guide (Bare RN projects)

<details>
<summary><b>📋 Canonical Docs Contract</b> (for maintainers)</summary>

The following six documents form the **canonical, non-duplicated** documentation set. This contract ensures work can be delegated safely without schema duplication or intent loss.

1. **`docs/README.md`** — high-level product model + quick start
2. **`docs/TODO.md`** — single work-order (execute top-to-bottom)
3. **`docs/WORKFLOW.md`** — repo execution rules (run/verify/commit/no regressions)
4. **`docs/AGENT.md`** — AI agent rules (scope control + acceptance checks)
5. **`docs/cli-interface-and-types.md`** — canonical type names/shapes index (**no duplicated schema elsewhere**)
6. **`docs/plugins-permissions.md`** — permission IDs dataset + platform mapping

**Documentation Rules:**
- **Do not shrink or delete intent** — if content is too long, move it to a dedicated doc instead of removing it
- **No schema duplication** — type definitions live in `cli-interface-and-types.md`; other docs reference it
- **Cross-reference, don't duplicate** — docs should reference each other, not copy content
- **Source of truth** — TypeScript code is authoritative; docs describe the contracts

</details>

---

## 🤝 Contributing

Canonical dev runner (must behave like released CLI):

```bash
npm run cli -- --help
npm run cli -- doctor --env
npm run cli -- init MyApp --target expo
```

Workflow rules (mandatory):
- Work strictly top‑to‑bottom from the first unchecked section in `docs/TODO.md`
- Unit of work = one TODO section = one commit
- No drive‑by refactors, no scope creep, no regressions

See: `docs/WORKFLOW.md`.

---

## 📄 License

ISC

