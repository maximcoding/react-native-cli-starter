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

[Quick Start](#-quick-start) • [Features](#-key-features) • [What Can You Build](#-what-can-you-build) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## ✨ What is CliMobile?

CliMobile is a **React Native project generator + expander** that eliminates boilerplate and manual configuration. Create production-ready apps with a strong foundation, then extend them with plugins—all with zero manual setup.

**Focus on what matters:** Your generated project is designed so you can **focus entirely on business logic**, not on setup, integration, or time-consuming installations. All infrastructure is handled automatically.

**Generated code is isolated but maintainable:** CLI-managed code lives in local workspace packages (`packages/@rns/*`), not remote dependencies. You can **edit, customize, and extend** it as needed—it's your code, just organized and maintained by the CLI.

### 🎯 Why CliMobile?

| Traditional Setup | With CliMobile |
|------------------|----------------|
| ⏱️ Hours of configuration | ⚡ **Seconds** |
| 🔧 Manual dependency management | 🤖 **Automatic** |
| 📝 Copy-paste boilerplate | 🎨 **Complete app structure** |
| 🐛 Configuration errors | ✅ **Zero manual setup** |
| 🔄 Repeated setup for each project | 🚀 **One command** |
| ⏰ Time wasted on infrastructure | 💼 **Time for business features** |
| 🏗️ Manual CI/CD setup | 🚀 **Auto-configured workflows** |

### 🎯 One Mission

1. **Generate** a new Expo Framework or Bare React Native app that is **immediately runnable** with a complete baseline (CORE)
2. **Extend** that app over time using **Plugins** (infrastructure) and **Modules** (features), with **zero manual setup**

---

## 🚀 Quick Start

### Installation

```bash
npm install -g climobile
```

### Create Your First App

```bash
# Create a new app (Expo Framework or Bare React Native)
rns init MyApp

# Add features
rns plugin add network.rest nav.core

# That's it! Your app is ready 🎉
cd MyApp
npm start
```

**Result:** A fully configured, production-ready React Native app with:
- ✅ Complete app structure (navigation, state, components, bootstrap)
- ✅ Workspace packages architecture
- ✅ Type-safe contracts and defaults
- ✅ SVG, fonts, env pipelines ready
- ✅ Import aliases configured
- ✅ State management setup (Zustand with MMKV persistence)
- ✅ Cache engine for offline-first patterns
- ✅ Bootstrap routing logic (Onboarding → Auth → App)
- ✅ CI/CD workflows (GitHub Actions templates)
- ✅ Clean `src/` folder for your code

---

## 💡 Key Features

### 🏗️ **CORE Baseline** (Always Included)

Every generated app comes with a production-ready foundation:

| Feature | Description |
|---------|-------------|
| 📦 **Workspace Packages** | Clean isolation (`packages/@rns/*`) - CLI code separate from yours |
| 🔌 **Runtime Composition** | Single entry point, plugin-ready architecture |
| 📝 **Contracts & Defaults** | Logging, Error, Storage, Network Interface, Offline (all with safe defaults) |
| 🎨 **DX Baseline** | SVG pipeline, fonts, env variables, import aliases (`@/`, `@rns/*`) |
| 🛠️ **Native Utilities** | Device info, haptics, permissions (plugin-free placeholders) |
| ⚙️ **Config System** | Constants and feature flags with extensible registry pattern |
| 🧭 **Navigation Infrastructure** | React Navigation base with bootstrap routing (Onboarding/Auth/App) |
| 🗄️ **State Management** | Zustand setup with MMKV persistence, store factory pattern |
| 💾 **Cache Engine** | Lightweight snapshot cache for offline-first patterns |
| 🎨 **UI Components** | Button, IconSvg, OfflineBanner, ScreenWrapper, Text, toast |
| 🚀 **CI/CD Workflows** | GitHub Actions templates, versioning, signing guides |
| 📜 **Development Scripts** | Doctor, clean, i18n extraction, icon generation, and more |

### 🔌 **Plugin System** (Add What You Need)

Add infrastructure capabilities with **one command**—no configuration needed:

#### 🌐 Network Adapters
```bash
rns plugin add network.rest network.graphql network.websocket network.firebase
```
- **REST** — Axios/fetch-based REST API adapter
- **GraphQL** — Apollo/urql/AWS AppSync adapter
- **WebSocket** — Real-time event-driven APIs (chat, trading, presence)
- **Firebase** — Firestore, RTDB, Storage, Messaging adapter
- **Mock** — Development/testing adapter
- CORE provides the **Network Interface**; plugins provide concrete adapters
- Operation-based interface (query, mutate, subscribe, upload)
- Offline queue integration
- Switch adapters without changing business code

#### 🔐 Authentication & Authorization
```bash
rns plugin add auth.cognito auth.auth0 auth.firebase auth.custom
```

**Authentication Methods:**
- **Email/Password** — Traditional email-based authentication
- **OAuth** — Google, Apple, Facebook, GitHub, LinkedIn
- **Phone SMS** — Firebase, Twilio, Auth0, AWS SNS, MessageBird
- **Provider Integrations:**
  - **AWS Cognito** — Full Cognito integration with user pools
  - **Auth0** — Universal authentication platform
  - **Firebase Auth** — Firebase authentication service
  - **Custom Backend** — Your own authentication server

**Authorization Models:**
- **RBAC** (Role-Based Access Control) — Default
- **Scopes** — Permission-based access
- **ABAC** (Attribute-Based Access Control)
- **Policy Location:** Local or Backend
- **Forbidden Handling:** Hide, Disable, or Redirect

#### 🏗️ Backend Integrations

**Firebase Cloud:**
```bash
rns plugin add network.firebase
```
- **Firestore** — NoSQL document database
- **Realtime Database** — Real-time synchronized database
- **Storage** — File uploads and downloads
- **Messaging** — Push notifications (FCM)
- **Remote Config** — Dynamic configuration
- **Analytics** — User behavior tracking
- **Auth** — Authentication service

**AWS Amplify & Services:**
```bash
rns plugin add network.graphql network.rest auth.cognito
```
- **AWS AppSync** — Managed GraphQL API with real-time subscriptions
- **API Gateway** — RESTful API management
- **Cognito** — User authentication and authorization
- **DynamoDB** — NoSQL database integration
- **SNS** — Push notifications via SMS
- **Amplify CLI** — Backend provisioning (optional)

**Full AWS Stack Example:**
```bash
# AppSync + Cognito + DynamoDB
rns init MyApp --aws provision --backend appsync

# API Gateway + Lambda + DynamoDB
rns init MyApp --aws provision --backend apigw
```

#### 🧭 Navigation
```bash
rns plugin add nav.core nav.flows nav.typed-routes
```
- Navigation container + root wiring
- Auth/App/Onboarding flows
- Typed route params

#### 💾 Storage
```bash
rns plugin add storage.mmkv storage.sqlite storage.secure
```
- Persistent key-value storage
- SQLite backend
- Secure storage for sensitive data

#### 📊 Data & Caching
```bash
rns plugin add data.react-query data.query-persist
```
- React Query integration
- Query cache persistence (MMKV/SQLite)
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

#### 🗄️ State Management
```bash
rns plugin add state.zustand state.redux state.mobx
```
- Zustand (default, with MMKV persistence)
- Redux Toolkit
- MobX

#### 🔔 Push Notifications
```bash
rns plugin add notify.fcm notify.onesignal
```
- **FCM** (Firebase Cloud Messaging) — Default, cross-platform push notifications
- **OneSignal** — Unified push notification service
- Deep linking support
- Universal links (iOS) and App links (Android)

#### 🚀 CI/CD & DevOps
```bash
# Configured during init, not a plugin
# Bare: Gradle + Xcode workflows, fastlane
# Expo: EAS workflows, expo-updates
```
- GitHub Actions templates
- Environment split (dev/stage/prod)
- Versioning (standard-version)
- Signing guides

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
│   ├── app/               # App shell, navigation, bootstrap
│   │   ├── components/    # UI components (Button, IconSvg, etc.)
│   │   ├── navigation/    # Navigation setup
│   │   ├── state/         # State management (Zustand stores)
│   │   └── services/      # Business services
│   ├── features/          # Your features
│   ├── core/              # Core config, theme, i18n, session
│   └── infra/             # Network adapters, storage, offline, query
├── assets/                 # 🎨 Your assets
│   ├── fonts/
│   ├── images/
│   └── svgs/
├── packages/               # 🔧 CLI-managed (isolated, maintainable, customizable)
│   └── @rns/
│       ├── core/          # Contracts + defaults
│       │   ├── contracts/ # Logging, Error, Storage, Network Interface, Offline
│       │   ├── config/    # Constants, Feature Flags, Env
│       │   └── native/    # Device info, Haptics, Permissions
│       ├── runtime/       # Composition layer
│       └── plugin-*/      # Installed plugins
├── .github/                # 🚀 CI/CD workflows (GitHub Actions)
│   └── workflows/
└── .rns/                  # 📋 CLI state/logs (internal)
```

**Key Principles:**
- **Your `src/` stays clean** — CLI code lives in `packages/@rns/*` and never pollutes your business logic
- **Isolated but maintainable** — CLI-managed code is in local workspace packages (not remote), so you can edit, customize, and extend it as needed
- **Focus on business logic** — No time wasted on setup, integration, or infrastructure configuration
- **Agnostic & normalized** — All contracts are backend-agnostic and protocol-agnostic. Switch adapters, swap implementations, extend functionality—all without touching your business code
- **Complete boilerplate** — Not just minimal setup: full app structure with navigation, state, components, bootstrap, and CI/CD

---

## 🏗️ What Can You Build?

CliMobile generates apps that are **backend-agnostic**, **protocol-agnostic**, and **normalized** across all layers. You can build any type of application:

### 📱 **Online Applications**

**E-commerce App**
```bash
rns init EcommerceApp
rns plugin add network.rest nav.core data.react-query auth.cognito storage.mmkv ui.theme state.zustand
```
- REST API integration
- Product catalog with React Query caching
- AWS Cognito authentication & session management
- Shopping cart persistence
- Theme system
- State management with Zustand + MMKV

**Social Media App**
```bash
rns init SocialApp
rns plugin add network.graphql network.websocket nav.core data.react-query auth.auth0 offline.netinfo notify.fcm
```
- GraphQL API (AWS AppSync or custom) with real-time subscriptions
- WebSocket for live updates
- Real-time feed updates
- Auth0 authentication
- Offline detection
- Push notifications

**SaaS Dashboard**
```bash
rns init DashboardApp
rns plugin add network.rest nav.core data.react-query auth.firebase analytics.firebase obs.sentry state.redux
```
- REST API integration
- Firebase authentication
- Analytics tracking
- Error monitoring with Sentry
- Redux for complex state

**Firebase-Powered App**
```bash
rns init FirebaseApp
rns plugin add network.firebase auth.firebase notify.fcm analytics.firebase
```
- Firestore for data storage
- Realtime Database for live updates
- Firebase Storage for files
- Firebase Auth for authentication
- FCM for push notifications
- Firebase Analytics

**AWS Amplify App**
```bash
rns init AmplifyApp
rns plugin add network.graphql auth.cognito
# Configure AWS AppSync + Cognito + DynamoDB
```
- AWS AppSync GraphQL API
- AWS Cognito authentication
- DynamoDB integration
- Real-time subscriptions
- Serverless backend

### 📴 **Offline-First Applications**

**Field Service App**
```bash
rns init FieldServiceApp
rns plugin add network.rest offline.netinfo offline.outbox offline.sync storage.mmkv nav.core state.zustand
```
- Works without internet connection
- Queues mutations when offline
- Auto-syncs when connection restored
- Persistent local storage
- Cache engine for snapshot caching

**Delivery App**
```bash
rns init DeliveryApp
rns plugin add network.rest offline.netinfo offline.outbox offline.sync storage.sqlite nav.core notify.fcm state.zustand
```
- Offline order management
- Location tracking (works offline)
- Push notifications
- SQLite for complex data
- Cache engine for fast offline access

**Note-Taking App**
```bash
rns init NotesApp
rns plugin add network.local storage.mmkv offline.outbox offline.sync nav.core state.zustand
```
- Fully offline-capable
- Local-first architecture
- Sync when online (optional)
- Fast local storage
- Cache engine for instant access

### 🔄 **Hybrid Applications** (Online + Offline)

**Task Management App**
```bash
rns init TaskApp
rns plugin add network.rest offline.netinfo offline.outbox offline.sync data.react-query storage.mmkv nav.core state.zustand notify.fcm
```
- Online: Real-time sync with server
- Offline: Full functionality, queues changes
- Auto-sync when connection restored
- Optimistic UI updates
- Cache engine for stale-while-revalidate
- Push notifications for updates

### 🌐 **Protocol-Agnostic Examples**

**Switch from REST to GraphQL:**
```bash
# Start with REST
rns plugin add network.rest

# Later, switch to GraphQL (same interface!)
rns plugin add network.graphql
# Your business code doesn't change - Network interface is the same
```

**Switch from Cognito to Auth0:**
```bash
# Start with Cognito
rns plugin add auth.cognito

# Later, switch to Auth0 (same contract!)
rns plugin add auth.auth0
# Your business code uses normalized auth contract - no changes needed
```

**Switch from REST to Firebase:**
```bash
# Start with REST
rns plugin add network.rest

# Later, switch to Firebase (same interface!)
rns plugin add network.firebase
# Your business code uses the same Network interface
```

**Switch State Management:**
```bash
# Start with Zustand (default)
# Already included in CORE

# Later, switch to Redux
rns plugin add state.redux
# Your components use normalized state interface - minimal changes
```

**All applications share:**
- ✅ **Normalized contracts** — Same interfaces regardless of backend/protocol
- ✅ **Agnostic design** — Switch adapters without changing business code
- ✅ **Extensible** — Add plugins, swap implementations, extend functionality
- ✅ **Maintainable** — CLI code is isolated but editable in `packages/@rns/*`
- ✅ **Complete boilerplate** — Full app structure, not just minimal setup

---

## 📖 Commands Reference

### Init
```bash
rns init <AppName>          # Create new Expo Framework or Bare React Native app
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
- ✅ **Complete app structure** — Navigation, state, components, bootstrap routing
- ✅ **Working aliases** — `@/` and `@rns/*` imports work out of the box
- ✅ **Pipelines ready** — SVG, fonts, env variables configured
- ✅ **State management** — Zustand with MMKV persistence ready
- ✅ **Cache engine** — Snapshot cache for offline-first patterns
- ✅ **CI/CD workflows** — GitHub Actions templates included
- ✅ **Clean separation** — Your `src/` folder stays untouched
- ✅ **Isolated infrastructure** — CLI code in `packages/@rns/*` (maintainable & customizable)

### ✅ Zero-Manual Setup (Plugins)

When you run `rns plugin add`:
- ✅ **Dependencies installed** — All runtime + dev deps automatically
- ✅ **Configuration applied** — Expo Framework/Bare React Native variants handled
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
     ├── app/                    ├── core/          (contracts)
     │   ├── components/         ├── runtime/      (composition)
     │   ├── navigation/         └── plugin-*/     (plugins)
     │   ├── state/
     │   └── services/
     ├── features/
     └── infra/
```

- **CLI-managed code** → `packages/@rns/*` (isolated, editable, maintainable, customizable)
- **Your code** → `src/**` (clean, yours, focus on business logic)
- **No pollution** → CLI never touches your business code
- **Full control** → Edit, extend, or customize CLI packages as needed (they're local, not remote)

### Agnostic & Normalized Design

**Backend-Agnostic:**
- Network interface works with REST, GraphQL, WebSocket, Firebase, AWS AppSync, or any backend
- Switch adapters without changing business code
- Same contracts regardless of protocol

**Storage-Agnostic:**
- Storage contracts work with MMKV, SQLite, Secure Storage, or in-memory
- Swap implementations via `setKeyValueStorage()` or `setCacheEngine()`
- Your code uses the same interface

**Auth-Agnostic:**
- Normalized auth contracts work with Cognito, Auth0, Firebase, or custom backends
- Switch providers without changing business logic
- Same session/token management interface
- Multiple authorization models (RBAC, Scopes, ABAC)

**State-Agnostic:**
- State management works with Zustand, Redux, MobX, or custom
- Store factory pattern for consistent state access
- MMKV persistence available for all state engines

**All contracts are normalized** — Same interfaces, different implementations. Your business code stays clean and protocol-agnostic.

### Network Adapters (Not "Transport")

The CORE provides a **Network Interface** (contract) for data communication. Plugins provide **Network Adapters** that implement this interface:

- `network.rest` — REST API adapter
- `network.graphql` — GraphQL adapter (Apollo, urql, AWS AppSync)
- `network.websocket` — WebSocket adapter
- `network.firebase` — Firebase adapter (Firestore, RTDB, Storage)
- `network.mock` — Development/testing adapter

All adapters implement the same interface: `query()`, `mutate()`, `subscribe()`, `upload()`

### Cache Engine

Lightweight snapshot cache for offline-first patterns:

```typescript
// Set snapshot (from network.query())
cacheEngine.setSnapshot('user.profile', userData);

// Get snapshot (offline fallback)
const cached = cacheEngine.getSnapshot<UserProfile>('user.profile');

// Clear cache (on logout)
cacheEngine.clear();
```

Supports:
- Stale-while-revalidate patterns
- Offline fallback
- Domain-level prefetching
- High-level services using network.query()

### Bootstrap Routing

Automatic routing based on app state:

```typescript
// ROOT_ONBOARDING → First launch
// ROOT_AUTH → No token
// ROOT_APP → Authenticated
```

Handled automatically by CORE, no manual wiring needed.

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
- **Plugin replacement** — Plugins swap implementations via setters (`setNetworkAdapter`, `setKeyValueStorage`, `setCacheEngine`, etc.)
- **Agnostic by design** — Contracts don't depend on specific backends or protocols

---

## 📋 Capabilities Matrix

### CORE (Always Installed)

| Capability | Targets | Setup |
|-----------|---------|-------|
| 📦 Workspace Packages | Expo Framework + Bare React Native | ✅ FULL_AUTO |
| 🔌 Runtime Composition | Expo Framework + Bare React Native | ✅ FULL_AUTO |
| 📝 Contracts (Logging, Error, Storage, Network Interface, Offline) | Expo Framework + Bare React Native | ✅ FULL_AUTO |
| 🎨 DX Baseline (Aliases, SVG, Fonts, Env) | Expo Framework + Bare React Native | ✅ FULL_AUTO |
| 🛠️ Native Utilities | Expo Framework + Bare React Native | ✅ FULL_AUTO |
| ⚙️ Config System (Constants, Feature Flags) | Expo Framework + Bare React Native | ✅ FULL_AUTO |
| 🧭 Navigation Infrastructure | Expo Framework + Bare React Native | ✅ FULL_AUTO |
| 🗄️ State Management (Zustand + MMKV) | Expo Framework + Bare React Native | ✅ FULL_AUTO |
| 💾 Cache Engine | Expo Framework + Bare React Native | ✅ FULL_AUTO |
| 🎨 UI Components | Expo Framework + Bare React Native | ✅ FULL_AUTO |
| 🚀 CI/CD Workflows | Expo Framework + Bare React Native | ✅ FULL_AUTO |
| 📜 Development Scripts | Expo Framework + Bare React Native | ✅ FULL_AUTO |

**Note:** 
- **Targets:** Expo Framework (Expo) or Bare React Native (React Native without Expo)
- **Network Interface:** Contract defined in CORE. Plugins provide adapters (REST/GraphQL/WebSocket/Firebase) that implement this interface.

### Plugins (Optional - Full Catalog)

| Category | Plugins | Setup |
|----------|---------|-------|
| 🌐 **Network Adapters** | `network.rest`, `network.graphql`, `network.websocket`, `network.firebase`, `network.mock` | ✅ FULL_AUTO |
| 🔐 **Auth** | `auth.cognito`, `auth.auth0`, `auth.firebase`, `auth.custom` | ✅ FULL_AUTO |
| 🧭 **Navigation** | `nav.core`, `nav.flows`, `nav.typed-routes` | ✅ FULL_AUTO |
| 💾 **Storage** | `storage.mmkv`, `storage.sqlite`, `storage.secure`, `storage.files` | ✅ FULL_AUTO |
| 📊 **Data** | `data.react-query`, `data.query-persist`, `data.pagination` | ✅ FULL_AUTO |
| 🗄️ **State Management** | `state.zustand`, `state.redux`, `state.mobx` | ✅ FULL_AUTO |
| 🌍 **i18n** | `i18n.core` | ✅ FULL_AUTO |
| 🎨 **UI** | `ui.theme`, `ui.reanimated`, `ui.splash.bootsplash`, `ui.lottie` | ✅ FULL_AUTO |
| 📱 **Offline** | `offline.netinfo`, `offline.outbox`, `offline.sync` | ✅ FULL_AUTO |
| 🔔 **Notifications** | `notify.fcm`, `notify.onesignal` | ✅ FULL_AUTO |
| 💳 **Payments** | `pay.stripe` | ✅ FULL_AUTO |
| 📈 **Analytics** | `analytics.firebase` | ✅ FULL_AUTO |
| 🐛 **Observability** | `obs.sentry` | ✅ FULL_AUTO |

---

## 🎓 How It Works

### 1️⃣ `rns init`
Creates a new Expo Framework or Bare React Native app and attaches the **CORE Base Pack**:
- Sets up workspace (pnpm/yarn/npm workspaces)
- Generates `packages/@rns/*` (runtime + contracts)
- Produces complete app structure (navigation, state, components, bootstrap)
- Includes CI/CD workflows (GitHub Actions templates)
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
