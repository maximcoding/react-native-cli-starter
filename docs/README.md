<!--
FILE: README.md
PURPOSE: Single-source, human-readable specification for CliMobile (RNS Starter CLI)
OWNERSHIP: CLI
-->

<div align="center">

# 🚀 CliMobile (RNS)

**Generate production-ready React Native apps (Expo or Bare) in minutes — with zero manual setup.**  
Base App first. Then add capabilities as Plugins (safe, conflict-aware, permission-aware, idempotent).

[![Node.js](https://img.shields.io/badge/Node.js-≥18-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-TypeScript-blue.svg)](https://www.typescriptlang.org/)

[Quick Start](#-quick-start) • [Key Features](#-key-features) • [Generated App Structure](#-generated-app-structure) • [Plugins Catalog](#-plugins-optional--full-catalog) • [Docs](#-documentation) • [Contributing](#-contributing)

</div>

---

## ✨ What is CliMobile?

CliMobile is a **React Native project generator + expander**:

1) **Generate** a runnable Base App (Expo or Bare RN) with a strong CORE baseline  
2) **Extend** the app over time via **Plugins** (capabilities) without hand-editing native/config files

### Why CliMobile?

| Traditional RN setup | With CliMobile |
|---|---|
| ⏱️ Manual setup & config | ⚡ **Automated generation** |
| 🧩 Copy/paste glue code | 🧱 **Plugins install end-to-end** |
| 🧨 Native config edits (Gradle/Podfile/Manifest/Info.plist) | ✅ **Patch-ops (idempotent + backed up)** |
| 🔄 Repeating the same “starter” work | ♻️ **Reusable CORE + installable capabilities** |
| 😵 Conflicts are discovered late | 🧭 **Slot-based conflict model** |
| 🔐 Permissions are tribal knowledge | 📋 **Permission IDs → mapped deterministically** |

### The non-negotiable promise

- `rns init ...` → app **boots immediately** (no manual edits)
- `rns plugin add ...` → installs capability **fully automatically**
- Re-running commands is safe (**idempotent**)
- CLI does **not** rewrite your business code (`src/**`)

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

### 2) Preflight (recommended)

Validate your environment before generating projects:

```bash
rns doctor --env
```

### 3) Create a Base App

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

### 4) Add capabilities (Plugins)

```bash
rns plugin add <pluginId...> --dry-run
rns plugin add <pluginId...>
rns doctor
```

> Tip: `--dry-run` should print a deterministic plan (deps, patches, permissions, wiring).

---

## 💡 Key Features

### 🏗️ CORE Baseline (always included)

Every generated app includes a stable foundation designed for long-term evolution:

| Area | What you get |
|---|---|
| 📦 Workspace packages | `packages/@rns/*` holds CLI-managed core/runtime/plugins (local code, maintainable) |
| 🧩 Contract-first architecture | stable capability contracts in `@rns/core` with safe defaults/stubs |
| 🔌 Runtime composition | centralized wiring in `@rns/runtime` so plugins don’t patch your app code |
| 🎨 DX baseline | aliases (`@/`, `@rns/*`), SVG/font/env pipelines, scripts, sane defaults |
| 📋 Project passport | `.rns/rn-init.json` records target, pm, schemaVersion, installed plugins, derived permissions |
| 🩺 Doctor gates | environment doctor (tools) + project doctor (consistency, duplicates, zones, manifest) |
| 🛡️ Safety model | ownership zones + backups + idempotency rules |
| 🧱 Extensibility | add capabilities by descriptor-driven plugin installs |

### 🔐 Permission-aware installs (data-driven)

Plugins declare **permission IDs** (not raw platform strings).  
The CLI resolves those IDs using `docs/plugins-permissions.md` and applies changes via patch-ops.

### 🧭 Conflict-aware installs (slot model)

Only **real conflicts** are blocked:

- `navigation.root` → **single** (choose one)
- `ui.framework` → **single** (choose one)
- `network.transport` → **multi** (stack REST + GraphQL + WS)

---

## 🎨 Generated App Structure

CliMobile enforces a strict boundary between **User Zone** (your business code) and **System Zone** (CLI-managed infrastructure).

```txt
MyApp/
├── src/                          # 👤 USER ZONE (CLI must not edit)
│   ├── app/                      # your app shell / screens / features
│   ├── features/
│   └── ...
├── assets/                       # your assets (optional)
├── packages/                     # 🤖 SYSTEM ZONE (CLI-managed)
│   └── @rns/
│       ├── core/                 # stable contracts + defaults
│       ├── runtime/              # composition + wiring target (AST injections)
│       └── plugin-*/             # installed plugins as workspace packages
├── .rns/                         # SYSTEM ZONE (state/logs/backups)
│   ├── rn-init.json              # project manifest (single source of truth)
│   ├── logs/
│   └── backups/
└── (target-specific folders)     # Expo / Bare structure
```

**Key principles**
- ✅ **Your `src/**` stays clean** — plugins integrate via `@rns/runtime`, not by editing your app
- ✅ **System code is local** — `packages/@rns/*` is in your repo (customizable, reviewable)
- ✅ **All changes are auditable** — backups + manifest traceability

---

## 🔌 Plugins (Optional — Full Catalog)

This is the **capability universe** the platform is designed to support. Not all items are implemented yet.
Concrete availability depends on the current plugin catalog (`rns plugin list`) and `docs/TODO.md`.

### Foundations (almost every app)
- UI system / theming
- Navigation root
- State management
- Data fetching + cache
- Networking / transports (REST, GraphQL, WS, SSE, gRPC)
- Authentication & session management
- Storage (KV, secure, DB, files)
- Offline-first (connectivity, outbox, sync)
- Forms + validation

### Device & OS (hardware + platform features)
- Permissions providers (Expo modules / RN permissions)
- Camera & microphone
- Media library / gallery
- Location & maps (geocoding, routing)
- Sensors (motion, pedometer, bluetooth, NFC)
- Biometrics
- Contacts / calendar
- File system
- Share / import / export (backup/restore)
- Deep linking (universal links / app links)

### Product capabilities
- Search
- Realtime primitives (presence, typing, messaging building blocks)
- Payments (Stripe)
- Subscriptions / IAP
- Notifications (push + local)
- Background tasks & scheduling
- Media upload pipeline (compress/resize/resumable)
- Feature flags / remote config
- OTA updates (Expo Updates / other mechanisms)

### Observability, security, compliance
- Structured logging + redaction
- Crash reporting / monitoring (Sentry/Bugsnag)
- Analytics & attribution hooks
- Privacy & consent (ATT, consent gating)
- Security helpers / optional integrity checks

### DX & delivery
- Env/config system (typed)
- Assets pipeline (SVG, fonts, icons, splash)
- Testing (unit/integration/e2e)
- CI/CD templates (GitHub Actions, EAS/Fastlane)
- Code quality (eslint/prettier/husky/lint-staged)
- Internationalization (i18n)

### Modules (future: business scaffolds)
- Feature generators that create app features (screens/flows/domain/state) in a deterministic way

---

## 📖 Commands Reference

### Core
```bash
rns --help
rns --version
```

### Doctor
```bash
rns doctor --env           # environment prerequisites
rns doctor                 # project consistency checks
```

### Init
```bash
rns init <Name> --target expo|bare --lang ts|js --pm pnpm|npm|yarn
```

### Plugins
```bash
rns plugin list
rns plugin add <id...> [--dry-run]
rns plugin remove <id...> [--dry-run]
rns plugin status
rns plugin doctor [<id>]
```

> If a command is not yet available, the roadmap for it must live in `docs/TODO.md` (single work-order).

---

## 🧠 How It Works (high level)

When installing a plugin, the Modulator pipeline is deterministic:

1. **Doctor gate** (project initialized + environment sane)
2. **Plan** (deps + conflicts + permissions + patches + runtime ops)
3. **Scaffold** (ensure plugin package exists in `packages/@rns/plugin-*`)
4. **Link** (workspace wiring + dependency install via one PM-aware layer)
5. **Wire runtime** (AST edits, ts-morph, symbol-based injection)
6. **Patch native/config** (idempotent patch ops + backups)
7. **Update manifest** (`.rns/rn-init.json`)
8. **Verify** (no duplicates, markers/anchors intact)

---

## 📚 Documentation

All docs live in `/docs` (flat).

### Canonical Docs Contract

The following six documents form the **canonical, non-duplicated** documentation set. This contract ensures work can be delegated safely without schema duplication or intent loss.

1. **`README.md`** — high-level product model + quick start
   - Purpose: User-facing introduction and getting started guide
   - Audience: End users, contributors, maintainers
   - Rule: Keep high-level; detailed specs belong in other docs

2. **`docs/TODO.md`** — single work-order
   - Purpose: Technical work order (execute top-to-bottom)
   - Audience: Maintainers, AI agents
   - Rule: One section = one commit; checkbox only on section title

3. **`docs/WORKFLOW.md`** — execution rules
   - Purpose: Repo execution rules (run/verify/commit; no regressions)
   - Audience: Maintainers, AI agents
   - Rule: Defines mandatory workflow gates and regression policy

4. **`docs/AGENT.md`** — AI agent rules
   - Purpose: Scope control + acceptance checks for AI-assisted development
   - Audience: AI agents, maintainers delegating work
   - Rule: Defines task format and non-negotiable constraints

5. **`docs/cli-interface-and-types.md`** — canonical type names/shapes index
   - Purpose: Single source of truth for all type names, interfaces, and schemas
   - Audience: Developers, maintainers, AI agents
   - Rule: **No duplicated schema elsewhere**; code types must match this doc

6. **`docs/plugins-permissions.md`** — permission catalog dataset
   - Purpose: Permission IDs + platform mapping (providers + mappings)
   - Audience: Plugin authors, permission resolution logic
   - Rule: Machine-readable catalog; JSON blobs must match `PermissionObject` in `cli-interface-and-types.md`

### Documentation Rules

- **Do not shrink or delete intent** — if content is too long, move it to a dedicated doc instead of removing it
- **No schema duplication** — type definitions live in `cli-interface-and-types.md`; code must reference this doc
- **Cross-reference, don't duplicate** — docs should reference each other, not copy content
- **Source of truth** — TypeScript code is authoritative; docs describe the contracts

---

## 🤝 Contributing

### Workflow rules (mandatory)

- Work from the first unchecked section in `docs/TODO.md`
- One section = one commit: `task(<sectionNumber>): ...`
- No drive-by refactors, no multi-section changes
- Never break what already works — verify acceptance commands before marking `[x]`

Canonical development commands:

```bash
npm run build
npm run cli -- --help
npm run cli -- doctor --env
npm run cli -- init MyApp --target expo
npm run cli -- plugin add <id> --dry-run
```

See `docs/WORKFLOW.md` for full rules.

---

## 📝 License

ISC

<div align="center">

**Built to keep `src/**` clean and your infrastructure installable.**  
[⬆ Back to Top](#-climobile-rns)

</div>
