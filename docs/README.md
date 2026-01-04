<!--
FILE: README.md
PURPOSE: Single-source, professional specification for CliMobile (RNS Starter CLI)
OWNERSHIP: CLI
-->

# 🚀 CliMobile — React Native Starter CLI

> **Generate production-ready React Native apps in seconds. Zero manual setup. Full control.**

[![Node.js](https://img.shields.io/badge/Node.js-≥18-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

---

## ✨ What is CliMobile?

CliMobile is a **React Native project generator + expander** that creates production-ready apps with:

- ✅ **Zero manual setup** — Everything works out of the box
- ✅ **Clean architecture** — Workspace packages isolate CLI code from your business logic
- ✅ **Plugin system** — Add features with one command, no configuration needed
- ✅ **Blueprint-based** — Battle-tested patterns from real-world apps
- ✅ **Full TypeScript** — Type-safe contracts and APIs

### 🎯 One Mission

1. **Generate** a new Expo or Bare React Native app that is **immediately runnable** with a strong baseline (CORE)
2. **Extend** that app over time using **Plugins** (infrastructure) and **Modules** (features), with **zero manual setup**

---

## 🚀 Quick Start

```bash
# Install globally
npm install -g climobile

# Create a new app
rns init MyApp

# Add features
rns plugin add transport.rest nav.core
```

**That's it!** Your app is ready to run. 🎉

---

## 💡 Key Features

### 🏗️ **CORE Baseline** (Always Included)

Every generated app comes with:

- 📦 **Workspace Packages** — Clean isolation (`packages/@rns/*`)
- 🔌 **Runtime Composition** — Single entry point, plugin-ready
- 📝 **Contracts & Defaults** — Logging, Error, Storage, Transport, Offline (all with safe defaults)
- 🎨 **DX Ready** — SVG pipeline, fonts, env variables, import aliases (`@/`, `@rns/*`)
- 🛠️ **Native Utilities** — Device info, haptics, permissions (plugin-free placeholders)
- ⚙️ **Config System** — Constants and feature flags with extensible registry pattern

### 🔌 **Plugin System** (Add What You Need)

Add infrastructure capabilities with one command:

- 🧭 **Navigation** — `nav.core`, `nav.flows`, `nav.typed-routes`
- 🌐 **Transport** — `transport.rest`, `transport.graphql`, `transport.websocket`
- 💾 **Storage** — `storage.mmkv`, `storage.sqlite`, `storage.secure`
- 🔐 **Auth** — `auth.cognito`, `auth.auth0`, `auth.firebase`
- 📊 **Data** — `data.react-query`, `data.query-persist`
- 🌍 **i18n** — `i18n.core`
- 🎨 **UI** — `ui.theme`, `ui.reanimated`, `ui.splash.bootsplash`
- 📱 **Offline** — `offline.netinfo`, `offline.outbox`, `offline.sync`
- 🔔 **Notifications** — `notify.fcm`
- 💳 **Payments** — `pay.stripe`
- 📈 **Analytics** — `analytics.firebase`
- 🐛 **Observability** — `obs.sentry`

**All plugins:** Full auto-setup, zero manual configuration.

### 📦 **Business Modules** (Coming Soon)

Scaffold complete features:

- `module.auth` — Auth screens + flow
- `module.onboarding` — Onboarding screens
- `module.user-profile` — Profile management
- `module.marketplace` — Marketplace scaffold
- `module.orders` — Orders/bookings
- `module.chat` — Chat functionality

---

## 🎨 Generated App Structure

```
MyApp/
├── src/                    # 👤 Your business code (clean!)
├── assets/                 # 🎨 Your assets
├── packages/               # 🔧 CLI-managed (editable)
│   └── @rns/
│       ├── core/          # Contracts + defaults
│       ├── runtime/       # Composition layer
│       └── plugin-*/      # Installed plugins
└── .rns/                  # 📋 CLI state/logs
```

**Key Principle:** Your `src/` stays clean. CLI code lives in `packages/@rns/*`.

---

## 📖 Commands

### Init
```bash
rns init <AppName>          # Create new Expo or Bare RN app
```

### Plugins
```bash
rns plugin list             # List available plugins
rns plugin add <ids...>     # Install plugins (FULL_AUTO)
rns plugin status           # Show installed vs available
rns plugin doctor           # Validate installation
```

### Modules (Coming Soon)
```bash
rns module list             # List available modules
rns module add <ids...>     # Generate business modules
```

---

## 🎯 Guarantees

### ✅ Zero-Manual Setup (Init)
After `rns init`, your app:
- ✅ Compiles and boots immediately
- ✅ Has full CORE baseline (contracts + defaults)
- ✅ Has working aliases (`@/`, `@rns/*`)
- ✅ Has SVG, fonts, env pipelines ready
- ✅ Keeps your `src/` clean (no CLI glue)

### ✅ Zero-Manual Setup (Plugins)
When you run `rns plugin add`:
- ✅ All dependencies installed automatically
- ✅ Configuration applied (Expo/Bare variants)
- ✅ Runtime integration wired
- ✅ Native patches applied (Android/iOS)
- ✅ Ready to run — no manual steps

**Never:** "Go edit file X manually" or "Paste this snippet"

---

## 🏗️ Architecture Highlights

### Workspace Packages Model
- **CLI-managed code** → `packages/@rns/*` (isolated, editable)
- **Your code** → `src/**` (clean, yours)
- **No pollution** → CLI never touches your business code

### Registry Pattern
- **Constants Registry** — Plugins extend app constants (values: numbers, strings, storage keys)
- **Feature Flags Registry** — Plugins extend feature toggles (booleans)
- **Runtime Registry** — Plugins register into composition

### Contract-Based Design
- **Interfaces first** — All contracts defined upfront
- **Safe defaults** — Noop/memory implementations (plugin-free)
- **Plugin replacement** — Plugins swap implementations via setters (`setTransport`, `setKeyValueStorage`, etc.)

---

## 📚 Documentation

- **[AGENT.md](docs/AGENT.md)** — For AI agents working on this repo
- **[WORKFLOW.md](docs/WORKFLOW.md)** — Development workflow
- **[Tasks](docs/tasks/)** — Implementation task list

---

## 🛠️ Development

### For Contributors

```bash
# Clone and setup
git clone <repo>
cd CliMobile
npm install

# Run CLI in dev mode
npm run cli -- init MyApp

# Build
npm run build
```

**Workflow:** See `docs/WORKFLOW.md` and `docs/AGENT.md`

---

## 📋 Capabilities Matrix

### CORE (Always Installed)

| Capability | Platforms | Setup |
|-----------|-----------|-------|
| Workspace Packages | Expo + Bare | ✅ FULL_AUTO |
| Runtime Composition | Expo + Bare | ✅ FULL_AUTO |
| Contracts (Logging, Error, Storage, Transport, Offline) | Expo + Bare | ✅ FULL_AUTO |
| DX Baseline (Aliases, SVG, Fonts, Env) | Expo + Bare | ✅ FULL_AUTO |
| Native Utilities | Expo + Bare | ✅ FULL_AUTO |
| Config System (Constants, Feature Flags) | Expo + Bare | ✅ FULL_AUTO |

### Plugins (Optional)

| Category | Examples | Setup |
|----------|----------|-------|
| 🧭 Navigation | `nav.core`, `nav.flows` | ✅ FULL_AUTO |
| 🌐 Transport | `transport.rest`, `transport.graphql` | ✅ FULL_AUTO |
| 💾 Storage | `storage.mmkv`, `storage.sqlite` | ✅ FULL_AUTO |
| 🔐 Auth | `auth.cognito`, `auth.auth0` | ✅ FULL_AUTO |
| 📊 Data | `data.react-query`, `data.query-persist` | ✅ FULL_AUTO |
| 🎨 UI | `ui.theme`, `ui.reanimated` | ✅ FULL_AUTO |
| 📱 Offline | `offline.netinfo`, `offline.outbox` | ✅ FULL_AUTO |

---

## 🎓 How It Works

### 1. `rns init`
Creates a new Expo or Bare RN app and attaches the **CORE Base Pack**:
- Sets up workspace (pnpm/yarn/npm workspaces)
- Generates `packages/@rns/*` (runtime + contracts)
- Produces runnable app with minimal `App.tsx`

### 2. `rns plugin add`
Adds capabilities via:
- Attaching plugin workspace packages
- Runtime registration
- Config/native patching
- State update + validation

### 3. `rns module add` (Coming Soon)
Scaffolds business modules into your `src/` and registers them.

---

## 🔍 Blueprint Reference

The repository includes a reference implementation at `docs/ReactNativeCLITemplate/`:

- Defines file shapes, contracts, and patterns
- Decides what belongs to CORE vs plugins
- **Not copied** into your app — only used as reference

---

## 📝 License

ISC

---

## 🤝 Contributing

See `docs/WORKFLOW.md` for development workflow and `docs/AGENT.md` for AI agent guidelines.

---

**Made with ❤️ for the React Native community**
