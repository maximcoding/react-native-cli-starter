<!--
FILE: README.md
PURPOSE: High-level overview + quick start for CliMobile (RNS).
         This README explains the product model (Base App + Capabilities)
         and links to the versioned docs for implementation details.
OWNERSHIP: CLI
-->

<div align="center">

# 🚀 CliMobile (RNS)

**Universal React Native Platform CLI**  
Generate a clean **Base App** (Expo or Bare RN) and then install **Capabilities (Plugins)** safely — *zero manual setup, permission-aware, conflict-aware, idempotent.*

</div>

---

## Table of Contents

- [1. What is CliMobile](#1-what-is-climobile)
- [2. The Problem It Solves](#2-the-problem-it-solves)
- [3. Core Philosophy](#3-core-philosophy)
- [4. Quick Start](#4-quick-start)
- [5. CLI Commands](#5-cli-commands)
- [6. How It Works](#6-how-it-works)
- [7. Ownership Zones (Project Structure)](#7-ownership-zones-project-structure)
- [8. Runtime Wiring Model](#8-runtime-wiring-model)
- [9. Plugins Catalog](#9-plugins-catalog)
- [10. Permissions Model](#10-permissions-model)
- [11. Expo vs Bare Support Rules](#11-expo-vs-bare-support-rules)
- [12. Conflicts & Compatibility (Slots)](#12-conflicts--compatibility-slots)
- [13. Project Manifest](#13-project-manifest)
- [14. Doctor & Validation](#14-doctor--validation)
- [15. Stress Tests (App Archetypes)](#15-stress-tests-app-archetypes)
- [16. Create a New Plugin (Developer Guide)](#16-create-a-new-plugin-developer-guide)
- [17. Repo Development (Build / Run / Contribute)](#17-repo-development-build--run--contribute)
- [18. Working With an AI Agent](#18-working-with-an-ai-agent)
- [19. Versioned Docs](#19-versioned-docs)
- [20. Roadmap / TODO](#20-roadmap--todo)

---

## 1) What is CliMobile

CliMobile (RNS) is a **platform CLI** that builds React Native apps using a **Base + Capabilities** model:

- **Base App:** generates a clean, runnable project using **Expo** or **Bare React Native**.
- **Plugins (Capabilities):** add features like **auth, networking, storage, offline, maps, payments, i18n, analytics**.
- **Modulator Engine:** installs plugins **end-to-end** (deps + runtime wiring + native/config patches + permissions)
  in a deterministic, repeatable pipeline.

### What makes it different from “starters” or “boilerplates”?

A starter is a snapshot. CliMobile is an **evolution system**:

- start from a minimal, production-ready **CORE base**
- add capabilities over time using **installable plugins**
- the CLI owns the “glue code” and native/config work, not the developer

**Promise:**
- `rns init ...` → app boots immediately (**no manual edits**)
- `rns plugin add ...` → capability installs fully; re-running is safe (**idempotent**)

---

## 2) The Problem It Solves

React Native projects become hard to maintain when infrastructure is added by hand:

- “paste this provider into App.tsx”
- “add these permissions to AndroidManifest”
- “edit Gradle / Podfile / Info.plist”
- “this package conflicts with that package”
- “upgrade broke the bootstrap file again”

CliMobile solves this by enforcing ownership boundaries and treating each capability as a **declarative plugin**
that the CLI can install and validate.

---

## 3) Core Philosophy

Hard rules that keep the system scalable:

- **Base first, then plugins.** The base is always runnable.
- **Zero manual setup for shipped plugins.** If a plugin is official, the CLI does all required work.
- **Idempotent operations.** Run the same command twice → no duplicates.
- **No user-zone edits.** Your business code (`src/**`) stays clean.
- **Data-driven engine.** The engine runs generic operations; plugin descriptors describe *what* to do.
- **Block only real conflicts.** Slot-based single conflicts are blocked; everything else can stack.

Type model: `docs/cli-interface-and-types.md`.

---

## 4) Quick Start

### 4.0 Requirements (MANDATORY)

**Required**
- Node.js **18+**
- Git
- One package manager: **pnpm** (recommended) / npm / yarn

**For iOS (macOS)**
- Xcode + Command Line Tools
- CocoaPods (`sudo gem install cocoapods`) if using Bare RN

**For Android**
- Android Studio + SDK + emulator (or a device)

Before you generate anything, validate your environment:

```bash
rns doctor --env
```

### 4.1 Install the CLI

> Note: the npm package name is currently `climobile`, but it installs the `rns` command.

```bash
npm i -g climobile
# or: pnpm add -g climobile
# or: yarn global add climobile
```

### 4.2 Create a Base App

Expo base:

```bash
rns init MyApp --target expo --lang ts --pm pnpm
cd MyApp
pnpm start
```

Bare RN base:

```bash
rns init MyApp --target bare --lang ts --pm pnpm --platforms ios,android
cd MyApp
pnpm ios
pnpm android
```

### 4.3 Install capabilities

```bash
rns plugin add data.react-query storage.mmkv state.zustand
rns doctor
```

---

## 5) CLI Commands

This repo tracks implementation status in `docs/TODO.md`.
If a command is listed as “Planned”, it becomes “Implemented” once its TODO section is marked `[x]`.

### 5.1 Implemented (minimum surface)

- `rns init <Name> [--target expo|bare] [--lang ts|js] [--pm pnpm|npm|yarn]`
- `rns doctor --env`
- `rns doctor`

### 5.2 Planned / In Progress

- `rns plugin list`
- `rns plugin add <id...> [--dry-run]`
- `rns plugin remove <id...> [--dry-run]`
- `rns plugin status`
- `rns plugin doctor [<id>]`

---

## 6) How It Works

When you run `rns plugin add <id>` the Modulator Engine executes:

1. **Doctor gate** (project initialized + tools present)
2. **Plan** (compute deps, conflicts, permissions, patch ops, runtime injections)
3. **Scaffold** (ensure plugin package exists in `packages/@rns/plugin-*`)
4. **Link** (workspace + dependency installation via one PM-aware layer)
5. **Wire runtime** (AST edits only, ts-morph, symbol references)
6. **Patch native/config** (declarative ops, idempotent, backed up)
7. **Update manifest** (single source of truth)
8. **Verify** (no duplicates, markers/anchors intact)

Type model: `docs/cli-interface-and-types.md`.

---

## 7) Ownership Zones (Project Structure)

CliMobile enforces a strict boundary:

- **USER ZONE (`src/**`)**: your business code. The CLI must never edit it.
- **SYSTEM ZONE (`packages/@rns/**` + `.rns/**`)**: CLI-managed infrastructure and plugins.

Generated layout (conceptual):

```txt
MyApp/
├── .rns/                       # manifest, logs, backups (SYSTEM)
│   └── rn-init.json             # project manifest (source of truth)
├── src/                         # business code (USER)
└── packages/@rns/               # core/runtime/plugins (SYSTEM)
    ├── core/
    ├── runtime/
    └── plugin-*/
```

---

## 8) Runtime Wiring Model

Plugins integrate by contributing **runtime building blocks** (providers/wrappers/init steps/bindings)
that are composed by `@rns/runtime`, without touching `src/**`.

See: `docs/cli-interface-and-types.md` → `RuntimeContribution`.

---

## 9) Plugins Catalog

The public “catalog” is data:

- plugin IDs, categories, support rules
- slot conflicts
- declared permissions and patch ops
- runtime contributions
- required npm deps

Descriptor schema: `docs/cli-interface-and-types.md` → `PluginDescriptor`.

---

## 10) Permissions Model

Permissions are **attached to plugins**, not hard-coded in the engine.

Permission catalog: `docs/plugins-permissions.md`

---

## 11) Expo vs Bare Support Rules

Every plugin declares support:

- `target`: `expo | bare | both`
- Expo runtime constraints: `expo-go | dev-client | standalone`
- `platforms`: `ios | android | web` (optional)

The CLI must refuse incompatible installs early with clear errors.

---

## 12) Conflicts & Compatibility (Slots)

We block only real conflicts using **slots**:

- `navigation.root` = `single` → choose one (React Navigation OR Expo Router)
- `ui.framework` = `single` → choose one (Tamagui OR NativeBase OR Paper)
- `network.transport` = `multi` → REST + GraphQL + WS can coexist

Slot model types: `docs/cli-interface-and-types.md` → `ConflictRule`.

---

## 13) Project Manifest

`.rns/rn-init.json` is the project passport:

- base target (expo/bare), language, package manager
- installed plugins + versions + applied ops
- aggregated permissions + per-plugin traceability
- schema version for migrations

Schema: `docs/cli-interface-and-types.md` → `RnsProjectManifest`.

---

## 14) Doctor & Validation

Doctor is the “safety gate”:

- `rns doctor --env`: machine prerequisites
- `rns doctor`: project consistency (manifest, wiring, ownership zones, duplicates)
- `rns doctor --fix`: only safe auto-fixes (never touches user zone)

---

## 15) Stress Tests (App Archetypes)

CliMobile must support many app shapes (mix & match) while blocking true conflicts:

- marketplace (maps + payments + push)
- realtime chat (ws + offline queue)
- offline-first study app (local DB + import/export)
- content feed (cache + offline reading)

Stress tests live in: `docs/TODO.md`.

---

## 16) Create a New Plugin (Developer Guide)

Plugin workflow and descriptor schema:
- `docs/WORKFLOW.md`
- `docs/cli-interface-and-types.md`

---

## 17) Repo Development (Build / Run / Contribute)

Repo workflow: `docs/WORKFLOW.md`

Typical:

```bash
npm install
npm run build
npm run cli -- --help
npm run cli -- init MyApp --target expo
```

---

## 18) Working With an AI Agent

AI agent runbook: `docs/AGENT.md`.

---

## 19) Versioned Docs

- v1 docs: `docs/deprecated_docs/**` (frozen)
- v2 docs: `docs/**` (active)

---

## 20) Roadmap / TODO

Single source of truth: `docs/TODO.md`
