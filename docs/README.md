<!--
FILE: README.md
PURPOSE: Single-source, professional specification for CliMobile (RNS Starter CLI)
OWNERSHIP: CLI
-->

<div align="center">

# 🚀 CliMobile

**Generate production-ready React Native apps in seconds. Zero manual setup. Full control.**

[![Node.js](https://img.shields.io/badge/Node.js-≥18-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

[Quick Start](#-quick-start) • [Features](#-key-features) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## ✨ What is CliMobile?

CliMobile is a **React Native project generator + expander** that eliminates boilerplate and manual configuration. Create production-ready apps with a strong foundation, then extend them with plugins—all with zero manual setup.

### 🎯 Why CliMobile?

| Traditional Setup | With CliMobile |
|------------------|----------------|
| ⏱️ Hours of configuration | ⚡ **Seconds** |
| 🔧 Manual dependency management | 🤖 **Automatic** |
| 📝 Copy-paste boilerplate | 🎨 **Clean architecture** |
| 🐛 Configuration errors | ✅ **Zero manual setup** |
| 🔄 Repeated setup for each project | 🚀 **One command** |

### 🎯 One Mission

1. **Generate** a new Expo or Bare React Native app that is **immediately runnable** with a strong baseline (CORE)
2. **Extend** that app over time using **Plugins** (infrastructure) and **Modules** (features), with **zero manual setup**

---

## 🚀 Quick Start

### Installation

```bash
npm install -g climobile
```

### Create Your First App

```bash
# Create a new app (Expo or Bare)
rns init MyApp

# Add features
rns plugin add transport.rest nav.core

# That's it! Your app is ready 🎉
cd MyApp
npm start
```

**Result:** A fully configured, production-ready React Native app with:
- ✅ Workspace packages architecture
- ✅ Type-safe contracts and defaults
- ✅ SVG, fonts, env pipelines ready
- ✅ Import aliases configured
- ✅ Clean `src/` folder for your code

---

## 💡 Key Features

### 🏗️ **CORE Baseline** (Always Included)

Every generated app comes with a production-ready foundation:

| Feature | Description |
|---------|-------------|
| 📦 **Workspace Packages** | Clean isolation (`packages/@rns/*`) - CLI code separate from yours |
| 🔌 **Runtime Composition** | Single entry point, plugin-ready architecture |
| 📝 **Contracts & Defaults** | Logging, Error, Storage, Transport, Offline (all with safe defaults) |
| 🎨 **DX Ready** | SVG pipeline, fonts, env variables, import aliases (`@/`, `@rns/*`) |
| 🛠️ **Native Utilities** | Device info, haptics, permissions (plugin-free placeholders) |
| ⚙️ **Config System** | Constants and feature flags with extensible registry pattern |

### 🔌 **Plugin System** (Add What You Need)

Add infrastructure capabilities with **one command**—no configuration needed:

#### 🧭 Navigation
```bash
rns plugin add nav.core nav.flows nav.typed-routes
```
- Navigation container + root wiring
- Auth/App/Onboarding flows
- Typed route params

#### 🌐 Transport Adapters
```bash
rns plugin add transport.rest transport.graphql transport.websocket
```
- REST, GraphQL, WebSocket adapters that implement the Transport interface
- CORE provides the Transport contract; plugins provide concrete adapters
- Operation-based transport interface
- Offline queue integration

#### 💾 Storage
```bash
rns plugin add storage.mmkv storage.sqlite storage.secure
```
- Persistent key-value storage
- SQLite backend
- Secure storage for sensitive data

#### 🔐 Authentication
```bash
rns plugin add auth.cognito auth.auth0 auth.firebase
```
- AWS Cognito, Auth0, Firebase Auth
- Session management
- Token handling

#### 📊 Data & Caching
```bash
rns plugin add data.react-query data.query-persist
```
- React Query integration
- Query cache persistence
- Pagination helpers

#### 🎨 UI & Animations
```bash
rns plugin add ui.theme ui.reanimated ui.splash.bootsplash
```
- Theme provider + tokens
- Reanimated animations
- Splash screen integration

#### 📱 Offline-First
```bash
rns plugin add offline.netinfo offline.outbox offline.sync
```
- Real connectivity detection
- Offline mutation queue
- Sync engine

**All plugins:** Full auto-setup, zero manual configuration. ✅

### 📦 **Business Modules** (Coming Soon)

Scaffold complete features into your `src/` folder:

- `module.auth` — Complete auth screens + flow
- `module.onboarding` — Onboarding screens + completion tracking
- `module.user-profile` — Profile management screens
- `module.marketplace` — Marketplace scaffold
- `module.orders` — Orders/bookings system
- `module.chat` — Chat functionality

---

## 🎨 Generated App Structure

```
MyApp/
├── src/                    # 👤 Your business code (100% yours!)
│   ├── features/          # Your features
│   └── components/        # Your components
├── assets/                 # 🎨 Your assets
│   ├── fonts/
│   ├── images/
│   └── svgs/
├── packages/               # 🔧 CLI-managed (editable if needed)
│   └── @rns/
│       ├── core/          # Contracts + defaults
│       │   ├── contracts/ # Logging, Error, Storage, Transport, Offline
│       │   ├── config/    # Constants, Feature Flags, Env
│       │   └── native/    # Device info, Haptics, Permissions
│       ├── runtime/       # Composition layer
│       └── plugin-*/      # Installed plugins
└── .rns/                  # 📋 CLI state/logs (internal)
```

**Key Principle:** Your `src/` stays clean. CLI code lives in `packages/@rns/*` and never pollutes your business logic.

---

## 📖 Commands Reference

### Init
```bash
rns init <AppName>          # Create new Expo or Bare RN app
```

### Plugins
```bash
rns plugin list             # List all available plugins
rns plugin add <ids...>     # Install plugins (FULL_AUTO setup)
rns plugin status           # Show installed vs available
rns plugin doctor           # Validate installation & consistency
```

### Modules (Coming Soon)
```bash
rns module list             # List available business modules
rns module add <ids...>     # Generate business modules
```

---

## 🎯 Guarantees

### ✅ Zero-Manual Setup (Init)

After `rns init`, your app:
- ✅ **Compiles and boots immediately** — No configuration needed
- ✅ **Full CORE baseline** — Contracts + safe defaults included
- ✅ **Working aliases** — `@/` and `@rns/*` imports work out of the box
- ✅ **Pipelines ready** — SVG, fonts, env variables configured
- ✅ **Clean separation** — Your `src/` folder stays untouched

### ✅ Zero-Manual Setup (Plugins)

When you run `rns plugin add`:
- ✅ **Dependencies installed** — All runtime + dev deps automatically
- ✅ **Configuration applied** — Expo/Bare variants handled
- ✅ **Runtime integration** — Wired into composition layer
- ✅ **Native patches** — Android/iOS integration done
- ✅ **Ready to run** — No manual steps required

**We guarantee:** Never "go edit file X manually" or "paste this snippet"

---

## 🏗️ Architecture Highlights

### Workspace Packages Model
```
Your Code (src/)          CLI Code (packages/@rns/*)
     │                            │
     ├── features/               ├── core/          (contracts)
     ├── components/             ├── runtime/      (composition)
     └── utils/                  └── plugin-*/     (plugins)
```

- **CLI-managed code** → `packages/@rns/*` (isolated, editable)
- **Your code** → `src/**` (clean, yours)
- **No pollution** → CLI never touches your business code

### Registry Pattern

Extensible configuration system:

```typescript
// Plugins extend constants (values)
constantsRegistry.register('auth-core', {
  AUTH_TOKEN: 'auth.token',
  REFRESH_TOKEN: 'auth.refreshToken',
});

// Plugins extend feature flags (booleans)
featureFlagsRegistry.register('auth-core', {
  enableAuth: true,
  enableMFA: false,
});
```

### Contract-Based Design

- **Interfaces first** — All contracts defined upfront
- **Safe defaults** — Noop/memory implementations (plugin-free)
- **Plugin replacement** — Plugins swap implementations via setters

---

## 📋 Capabilities Matrix

### CORE (Always Installed)

| Capability | Targets | Setup |
|-----------|---------|-------|
| 📦 Workspace Packages | Expo + Bare | ✅ FULL_AUTO |
| 🔌 Runtime Composition | Expo + Bare | ✅ FULL_AUTO |
| 📝 Contracts (Logging, Error, Storage, Transport Interface, Offline) | Expo + Bare | ✅ FULL_AUTO |
| 🎨 DX Baseline (Aliases, SVG, Fonts, Env) | Expo + Bare | ✅ FULL_AUTO |
| 🛠️ Native Utilities | Expo + Bare | ✅ FULL_AUTO |
| ⚙️ Config System (Constants, Feature Flags) | Expo + Bare | ✅ FULL_AUTO |

**Note:** Transport Interface is the contract defined in CORE. Plugins provide adapters (REST/GraphQL/WebSocket) that implement this interface.

### Plugins (Optional - Full Catalog)

| Category | Plugins | Setup |
|----------|---------|-------|
| 🧭 **Navigation** | `nav.core`, `nav.flows`, `nav.typed-routes` | ✅ FULL_AUTO |
| 🌐 **Transport Adapters** | `transport.rest`, `transport.graphql`, `transport.websocket`, `transport.mock` | ✅ FULL_AUTO |
| 💾 **Storage** | `storage.mmkv`, `storage.sqlite`, `storage.secure`, `storage.files` | ✅ FULL_AUTO |
| 🔐 **Auth** | `auth.cognito`, `auth.auth0`, `auth.firebase`, `auth.custom` | ✅ FULL_AUTO |
| 📊 **Data** | `data.react-query`, `data.query-persist`, `data.pagination` | ✅ FULL_AUTO |
| 🌍 **i18n** | `i18n.core` | ✅ FULL_AUTO |
| 🎨 **UI** | `ui.theme`, `ui.reanimated`, `ui.splash.bootsplash`, `ui.lottie` | ✅ FULL_AUTO |
| 📱 **Offline** | `offline.netinfo`, `offline.outbox`, `offline.sync` | ✅ FULL_AUTO |
| 🔔 **Notifications** | `notify.fcm` | ✅ FULL_AUTO |
| 💳 **Payments** | `pay.stripe` | ✅ FULL_AUTO |
| 📈 **Analytics** | `analytics.firebase` | ✅ FULL_AUTO |
| 🐛 **Observability** | `obs.sentry` | ✅ FULL_AUTO |

---

## 🎓 How It Works

### 1️⃣ `rns init`
Creates a new Expo or Bare RN app and attaches the **CORE Base Pack**:
- Sets up workspace (pnpm/yarn/npm workspaces)
- Generates `packages/@rns/*` (runtime + contracts)
- Produces runnable app with minimal `App.tsx`

### 2️⃣ `rns plugin add`
Adds capabilities via:
- Attaching plugin workspace packages
- Runtime registration
- Config/native patching
- State update + validation

### 3️⃣ `rns module add` (Coming Soon)
Scaffolds business modules into your `src/` and registers them.

---

## 🔍 Blueprint Reference

The repository includes a reference implementation at `docs/ReactNativeCLITemplate/`:

- Defines file shapes, contracts, and patterns
- Decides what belongs to CORE vs plugins
- **Not copied** into your app — only used as reference

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

## 📝 License

ISC

---

## 🤝 Contributing

See `docs/WORKFLOW.md` for development workflow and `docs/AGENT.md` for AI agent guidelines.

---

<div align="center">

**Made with ❤️ for the React Native community**

[⬆ Back to Top](#-climobile)

</div>
