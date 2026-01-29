<!--
FILE: docs/README.md
PURPOSE: High-level, human-readable overview + quick start for CliMobile (RNS).
         Explains the product model (Base App + Plugins) and links to /docs for the canonical contracts and workflow.
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

- "paste this provider into App.tsx" (now handled automatically via marker-based injection)
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
# Using the built CLI (after npm run build)
rns init MyApp --target expo --lang ts --pm pnpm

# Using npm scripts (local development)
npm run cli -- init MyApp --target expo --lang ts --pm npm
# OR (using the init script directly)
npm run init -- MyApp --target expo --lang ts --pm npm

# To skip ALL prompts (use defaults for features, locales, plugins, dependencies):
npm run init -- MyApp --target expo --lang ts --pm npm --yes

# To specify locales for i18n (English is always included):
npm run init -- MyApp --target expo --lang ts --pm npm --locales en,ru,de --yes

cd MyApp
pnpm start
```

Bare RN:

```bash
# Using the built CLI (after npm run build)
rns init MyApp --target bare --lang ts --pm pnpm --platforms ios,android

# Using npm scripts (local development)
npm run cli -- init MyApp --target bare --lang ts --pm pnpm --platforms ios,android
# OR
npm run init -- MyApp --target bare --lang ts --pm pnpm --platforms ios,android

# To skip ALL prompts (use defaults):
npm run init -- MyApp --target bare --lang ts --pm pnpm --platforms ios,android --yes

# To specify locales for i18n (English is always included):
npm run init -- MyApp --target bare --lang ts --pm pnpm --platforms ios,android --locales en,ru,de --yes

cd MyApp
pnpm ios
pnpm android
```

---

## 📊 Init Options: Expo vs Bare

During `rns init`, you'll be prompted to select features. The available options depend on your target:

```
rns init
│
├── 🎯 Target: EXPO
│   │
│   ├── 📱 Expo-specific options
│   │   ├── ✅ Expo Router (optional) — **Implemented**
│   │   │   └── Includes: expo-router, expo-linking, expo-constants
│   │   │   └── Stack by default, optional Tab/Drawer
│   │   ├── ✅ Expo Linking (optional) — **Implemented**
│   │   │   └── URL handling and deep linking
│   │   ├── ✅ Expo Status Bar (optional) — **Implemented**
│   │   │   └── Status bar customization
│   │   ├── ✅ Expo System UI (optional) — **Implemented**
│   │   │   └── System UI customization
│   │   ├── ✅ Expo Web Browser (optional) — **Implemented**
│   │   │   └── Open links in browser
│   │   ├── ✅ Expo Dev Client (optional) — **Implemented**
│   │   │   └── Custom development client for native modules
│   │   ├── ✅ @expo/vector-icons (optional) — **Implemented**
│   │   │   └── Vector icon library (Ionicons, MaterialIcons, etc.)
│   │   ├── ✅ Expo Image (optional) — **Implemented**
│   │   │   └── Optimized image component with caching
│   │   ├── ✅ Expo Linear Gradient (optional) — **Implemented**
│   │   │   └── Linear gradient component
│   │   ├── ✅ Expo Haptics (optional) — **Implemented**
│   │   │   └── Haptic feedback (vibrations)
│   │   └── ✅ Expo Device (optional) — **Implemented**
│   │       └── Device information utilities
│   │
│   └── 🔄 Common options (available for both targets)
│       ├── ✅ Internationalization (i18next) — **Selected by default**
│       ├── ✅ Theming (light/dark support) — Optional
│       ├── ✅ React Navigation — Optional
│       │   └── Presets: stack-only, tabs-only, stack-tabs, stack-tabs-modals, drawer
│       │   └── Auto-includes: react-native-screens
│       ├── ✅ Styling Library — Optional
│       │   └── Choose: NativeWind, Unistyles, Tamagui, Restyle, or StyleSheet (default)
│       ├── ✅ React Native Screens — Optional — **Implemented**
│       │   └── Native screen management (currently auto-included with React Navigation)
│       ├── ✅ React Native Paper (Material Design) — Optional — **Implemented**
│       │   └── Material Design component library
│       ├── ✅ React Native Elements — Optional — **Implemented**
│       │   └── Component library (React Native Elements)
│       ├── ✅ UI Kitten — Optional — **Implemented**
│       │   └── Component library with Eva Design
│       ├── ✅ Styled Components — Optional — **Implemented**
│       │   └── CSS-in-JS styling library
│       └── ✅ React Native Web — Optional — **Implemented**
│           └── Web support for React Native apps
│
└── 🎯 Target: BARE
    │
    ├── 🔧 Bare-specific options
    │   ├── ✅ React Native Keychain (optional) — **Implemented**
    │   │   └── Secure keychain/keystore storage
    │   ├── ✅ React Native FS (optional) — **Implemented**
    │   │   └── Native file system access
    │   ├── ✅ React Native Permissions (optional) — **Implemented**
    │   │   └── Unified permissions API for native modules
    │   ├── ✅ React Native Fast Image (optional) — **Implemented**
    │   │   └── Optimized image loading with native caching
    │   └── ✅ Native Modules Support (optional) — **Implemented**
    │       └── Provider SDKs and native configuration support
    │
    └── 🔄 Common options (available for both targets)
        ├── ✅ Internationalization (i18next) — **Selected by default**
        ├── ✅ Theming (light/dark support) — Optional
        ├── ✅ React Navigation — **Selected by default**
        │   └── Presets: stack-only, tabs-only, stack-tabs, stack-tabs-modals, drawer
        │   └── Auto-includes: react-native-screens
        ├── ✅ Styling Library — Optional
        │   └── Choose: NativeWind, Unistyles, Tamagui, Restyle, or StyleSheet (default)
        ├── 🔜 React Native Screens — Optional — **Future option**
        │   └── Native screen management (currently auto-included with React Navigation)
        ├── 🔜 React Native Paper (Material Design) — Optional — **Future option**
        │   └── Material Design component library
        ├── 🔜 React Native Elements / UI Kitten — Optional — **Future option**
        │   └── Component libraries (React Native Elements or UI Kitten)
        ├── 🔜 Styled Components — Optional — **Future option**
        │   └── CSS-in-JS styling library
        └── 🔜 React Native Web — Optional — **Future option**
            └── Web support for React Native apps
```

**Legend:**
- ✅ = Currently implemented and available

**Bare-specific features available via plugins** (not init options):
- 📦 **Image Picker** → `rns plugin add media.picker` or `media.vision-camera`
- 📦 **Error Tracking** → `rns plugin add obs.sentry`
- 📦 **Secure Storage** → `rns plugin add storage.secure`
- 📦 **File System** → `rns plugin add storage.filesystem`

**Expo-specific features available via plugins** (not init options):
- 📦 **Camera** → `rns plugin add media.camera` or `media.vision-camera`
- 📦 **Location** → `rns plugin add geo.location`
- 📦 **Notifications** → `rns plugin add notify.expo`
- 📦 **Authentication** → `rns plugin add auth.firebase` or `auth.supabase`
- 📦 **Secure Storage** → `rns plugin add storage.secure`
- 📦 **File System** → `rns plugin add storage.filesystem`
- 📦 **Error Tracking** → `rns plugin add obs.sentry`

**Not available during init** (add via plugin system after project generation):
- ❌ **Authentication** → Use: `rns plugin add auth.firebase` or `auth.supabase`
- ❌ **Analytics** → Use: `rns plugin add analytics.firebase` or `analytics.amplitude`
- ❌ **Firebase** → Use: `rns plugin add firebase.*`
- ❌ **Supabase** → Use: `rns plugin add supabase.*`

**Note:** Safe Area Context is automatically included as a base dependency and doesn't require selection. EAS CLI is a build tool and should be installed separately: `npm install -g eas-cli`.

---

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
- **App.tsx structure**: Standard React Native pattern with providers directly visible (user-editable, CLI generates initial structure)
- **Workspace packages layout** under `packages/@rns/**`
- **Runtime utilities** under `packages/@rns/runtime/**` (initCore, deprecated RnsApp)
- **Kernel contracts + safe defaults** under `packages/@rns/core/**`
- **DX baseline**: aliases (`@/`), SVG, fonts, env pipeline (no manual setup)
- **Project manifest** `.rns/rn-init.json` (single source of truth)
- **Doctor tooling**: environment + project validation gates

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
├── index.js                    # Bare only: Metro entry; imports App, registers via AppRegistry
├── App.tsx                     # USER: app entrypoint (user-editable, CLI generates initial structure)
│                                #      Contains providers directly (standard React Native pattern)
│                                #      Plugin injection via @rns-marker:providers:start/end
├── app/                        # USER: Expo Router layout (if Expo Router selected)
│   └── _layout.tsx             #      Root layout with providers (user-editable, CLI generates initial)
├── src/                        # USER: your business code (CLI must not edit)
├── packages/                   # SYSTEM: CLI-managed workspace packages
│   └── @rns/
│       ├── core/               # kernel contracts + safe defaults
│       ├── runtime/            # runtime utilities (initCore, deprecated RnsApp); entry index.tsx
│       └── plugin-*/           # installed plugins as local packages
└── ...                         # Expo/Bare native scaffolding (target-specific)
```

**Bare entry point:** Bare projects use `index.js` as the Metro entry (imports `App`, registers via `AppRegistry`). `package.json` must include `"main": "index.js"`. Expo projects use `index.ts`/`index.js` per template (e.g. `expo-router/entry` or `registerRootComponent`).

**Key principle:** plugins integrate via marker-based injection in `App.tsx`/`app/_layout.tsx` (User Zone, CLI generates initial structure) and `packages/@rns/runtime/core-init.ts` (System Zone). `App.tsx` is user-editable but CLI generates initial structure with providers and injection markers. Plugins do not patch `src/**` directly.

### App.tsx Structure

`App.tsx` follows standard React Native patterns with all providers directly visible:

**Bare RN with React Navigation:**
```tsx
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initCore } from '@rns/runtime/core-init';
// @rns-marker:imports:start
// Plugin imports will be injected here
// @rns-marker:imports:end
import { ThemeProvider } from '@rns/core/theme'; // If theming selected
import { RnsNavigationRoot } from '@rns/navigation'; // If React Navigation selected

export default function App() {
  useEffect(() => {
    initCore();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* @rns-marker:providers:start */}
        {/* Plugin providers will wrap children here */}
        {/* @rns-marker:providers:end */}
        <ThemeProvider>
          <RnsNavigationRoot />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

**Expo with Expo Router:**
- `App.tsx` is minimal (Expo Router uses `app/_layout.tsx`)
- `app/_layout.tsx` contains providers and Expo Router Stack

**Ownership:**
- `App.tsx` is in **User Zone** (user-editable)
- CLI generates initial structure with providers and marker-based injection points
- Plugins inject providers at `@rns-marker:providers:start/end` markers
- Users can customize providers, add custom logic, or modify the structure

---

## 🪝 Hooks Architecture (Hybrid Approach)

CliMobile uses a **hybrid hooks architecture** that combines discoverability with stability:

### Structure

```
packages/@rns/core/          (System Zone - CLI-managed, source of truth)
  ├── i18n/
  │   └── useT.ts           ← Source implementation (stable, updatable)
  └── theme/
      └── useTheme.ts       ← Source implementation (stable, updatable)

src/hooks/                   (User Zone - convenience re-exports, user-editable)
  ├── useT.ts               ← Re-exports from @rns/core/i18n
  ├── useTheme.ts           ← Re-exports from @rns/core/theme
  └── index.ts              ← Central export point
```

### Benefits

1. **Discoverable**: Hooks are visible in `src/hooks/` where developers expect them
2. **Stable**: Source of truth in System Zone (CLI-managed, updatable via CLI/plugins)
3. **Customizable**: Users can override User Zone re-exports with custom implementations
4. **Consistent**: Both import paths work (`@rns/core/i18n` and `@/hooks/useT`)

### Usage

**Both import paths work:**

```typescript
// Convenience import (recommended for discoverability)
import { useT } from '@/hooks/useT';
import { useTheme } from '@/hooks/useTheme';

// Direct import (System Zone)
import { useT } from '@rns/core/i18n';
import { useTheme } from '@rns/core/theme';

// Central export
import { useT, useTheme } from '@/hooks';
```

### Customization

To customize a hook, replace the re-export in `src/hooks/` with your own implementation:

```typescript
// src/hooks/useTheme.ts
import { useContext } from 'react';
import { ThemeContext } from '@rns/core/theme';

// Your custom implementation
export function useTheme() {
  const ctx = useContext(ThemeContext);
  // Add your custom logic here
  return {
    ...ctx,
    // Your custom properties/methods
  };
}
```

**Note:** Custom implementations override the System Zone hook for your project. The System Zone hook remains unchanged and can still be accessed directly via `@rns/core/theme`.

### Available Hooks

- **`useT()`** - Translation hook (if i18n selected)
  - Returns translation function `t` from react-i18next
  - Usage: `const t = useT(); <Text>{t('home.title')}</Text>`

- **`useTheme()`** - Theme context hook (if theming selected)
  - Returns `{ theme, mode, setTheme }`
  - Usage: `const { theme, mode, setTheme } = useTheme();`

---

## 🔌 Plugin Architecture (Hybrid Approach)

CliMobile uses a **hybrid plugin architecture** that combines discoverability with stability, organized by category:

### Structure

```
packages/@rns/               (System Zone - CLI-managed, source of truth)
  ├── state/                 ← Category-based packages
  │   └── zustand/           ← Plugin implementation (supports multiple plugins per category)
  │       └── index.ts       ← Source implementation (stable, updatable)
  ├── auth/
  │   └── firebase/
  │       └── index.ts       ← Source implementation (stable, updatable)
  └── storage/
      └── mmkv/
          └── index.ts       ← Source implementation (stable, updatable)

src/                          (User Zone - convenience re-exports with examples, user-editable)
  ├── state/                 ← State plugins (created when state plugins installed)
  │   └── zustand.ts        ← Re-exports + example stores (session, settings, UI)
  ├── auth/                  ← Auth plugins (created when auth plugins installed)
  │   └── firebase.ts       ← Re-exports from @rns/auth
  └── storage/               ← Storage plugins (created when storage plugins installed)
      └── mmkv.ts            ← Re-exports from @rns/storage
```

### Benefits

1. **Discoverable**: Plugins are visible in `src/{category}/` where developers expect them, organized by domain
2. **Stable**: Source of truth in System Zone (CLI-managed, updatable via CLI/plugins)
3. **Customizable**: Users can override User Zone re-exports with custom implementations
4. **Consistent**: Both import paths work (`@rns/plugin-*` and `@/{category}/*`)
5. **Clean organization**: Category directories only created when plugins are installed (no empty directories)

### Usage

**Both import paths work:**

```typescript
// Convenience import (recommended for discoverability)
import { createPersistedStore, useSessionStore, useSettingsStore } from '@/state/zustand';
import { FirebaseAuthProvider } from '@/auth/firebase';
import { MMKVStorage } from '@/storage/mmkv';

// Direct import (System Zone - category-based packages)
import { createPersistedStore } from '@rns/state';
import { FirebaseAuthProvider } from '@rns/auth';
import { MMKVStorage } from '@rns/storage';
```

### Category Organization

Plugins are organized by category based on their ID prefix:

- **`state.*`** → `src/state/` (e.g., `state.zustand` → `src/state/zustand.ts`)
- **`auth.*`** → `src/auth/` (e.g., `auth.firebase` → `src/auth/firebase.ts`)
- **`storage.*`** → `src/storage/` (e.g., `storage.mmkv` → `src/storage/mmkv.ts`)
- **`nav.*`** → `src/nav/` (e.g., `nav.react-navigation` → `src/nav/react-navigation.ts`)
- **Plugins without prefix** → `src/plugins/` (fallback)

### State Stores Directory

When state plugins are installed, `src/state/stores/` is automatically created for you to create your Zustand stores:

```typescript
// src/state/stores/session.store.ts
import { createPersistedStore, createStorageAdapter } from '@/state/zustand';
import { kvStorage } from '@rns/core/contracts/storage';

interface SessionState {
  token: string | null;
  setToken: (token: string) => void;
}

export const useSessionStore = createPersistedStore<SessionState>(
  (set) => ({
    token: null,
    setToken: (token) => set({ token }),
  }),
  {
    name: 'session-store',
    version: 1,
    storage: createStorageAdapter(kvStorage),
  }
);
```

### Customization

To customize a plugin re-export, replace the re-export in `src/{category}/` with your own implementation:

```typescript
// src/state/zustand.ts
import { create } from 'zustand';
import { createStorageAdapter } from '@rns/state';
import { kvStorage } from '@rns/core/contracts/storage';

// Your custom wrapper
export function createPersistedStore<T>(...) {
  // Your custom implementation
}
```

**Note:** Custom implementations override the System Zone plugin for your project. The System Zone plugin remains unchanged and can still be accessed directly via `@rns/{category}` (e.g., `@rns/state`).

---

## 📋 Capabilities Matrix

### CORE (Always Installed)

| Capability | Targets | Notes |
|---|---|---|
| Workspace packages (`packages/@rns/**`) | Expo + Bare | Isolation and maintainability |
| Runtime utilities (`@rns/runtime`) | Expo + Bare | initCore() utility, deprecated RnsApp wrapper |
| Kernel contracts (`@rns/core`) | Expo + Bare | Stable, additive contracts + defaults |
| Ownership zones | Expo + Bare | CLI edits System Zone only |
| Manifest (`.rns/rn-init.json`) | Expo + Bare | Project passport + migrations |
| Doctor (`doctor --env`, `doctor`) | Expo + Bare | Safety gate for changes |
| DX baseline (alias/SVG/fonts/env) | Expo + Bare | Zero manual setup |
| CI/CD Workflows (GitHub Actions templates) | Expo + Bare | ✅ **Implemented** (section 24) |
| Theme System (dark/light) | Expo + Bare | Theme provider + tokens |
| Splash Screen | Expo + Bare | Boot splash screen |
| Feature Flags Registry | Expo + Bare | Local feature flags (extendable by plugins) |
| Code Quality Tools (Prettier, Husky, ESLint) | Expo + Bare | Formatting, git hooks, linting |
| Navigation Infrastructure | Expo + Bare | Bootstrap routing (Onboarding/Auth/App) |
| Cache Engine | Expo + Bare | Snapshot cache contract + in-memory default |
| UI Components | Expo + Bare | App.tsx structure with direct providers/navigation (MinimalUI deprecated) |
| Development Scripts | Expo + Bare | Clean, and other dev scripts (beyond doctor) |

### Plugins (Optional - Full Catalog)

> This is a **capability catalog**. Concrete shipped plugin IDs and their exact support rules live in the plugin catalog & docs.

| Category | Examples (IDs) | Slot mode |
|---|---|---|
| Navigation root | `nav.react-navigation`, `nav.expo-router` | **single** |
| UI framework | `ui.paper`, `ui.tamagui`, `ui.nativebase` | **single** |
| Animations | `animation.reanimated`, `animation.lottie` | multi |
| State | **`state.zustand`**, `state.xstate`, `state.mobx` | multi |
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
- ✅ **Completed**: CLI foundation, init pipeline, DX baseline, docs contract, template packs, attachment engine, marker patcher, runtime wiring, patch operations, state system, dependency layer, modulator engine, permissions model, environment doctor, project doctor, plugin framework, plugin commands, module framework, module commands, verification & smoke tests, CI/CD workflows, component generation, navigation presets, navigation registry, i18n integration, expanded init options
- 📋 **Roadmap**: See `docs/TODO.md` for detailed work order (sections 1-30 completed, remaining sections pending)

---

## 📚 Documentation

All canonical documentation lives under `docs/`:

- **`docs/README.md`** (this file) — high-level product model + quick start
- **`docs/TODO.md`** — single work-order (execute top-to-bottom)
- **`docs/WORKFLOW.md`** — repo execution rules (run/verify/commit/no regressions)
- **`docs/AGENT.md`** — AI agent rules (scope control + acceptance checks)
- **`docs/cli-interface-and-types.md`** — canonical contracts/types (**no duplicated schema elsewhere**)
- **`docs/plugins-permissions.md`** — permission IDs dataset + platform mapping
- **`docs/navigation.md`** — navigation registry system documentation (React Navigation)

<details>
<summary><b>📋 Canonical Docs Contract</b> (for maintainers)</summary>

The following documents form the **canonical, non-duplicated** documentation set. This contract ensures work can be delegated safely without schema duplication or intent loss.

**Core Canonical Docs:**
1. **`README.md`** (this file) — high-level product model + quick start
2. **`docs/TODO.md`** — single work-order (execute top-to-bottom)
3. **`docs/WORKFLOW.md`** — repo execution rules (run/verify/commit/no regressions)
4. **`docs/AGENT.md`** — AI agent rules (scope control + acceptance checks)
5. **`docs/cli-interface-and-types.md`** — canonical type names/shapes index (**no duplicated schema elsewhere**)
6. **`docs/plugins-permissions.md`** — permission IDs dataset + platform mapping

**Additional Reference Docs:**
- **`docs/navigation.md`** — navigation registry system documentation (React Navigation)
- **`docs/ALIGNMENT.md`** — architectural decisions and alignment tasks
- **`docs/SPEC_ACCEPTANCE.md`** — test mapping to TODO sections

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
npm run cli -- init MyApp --target expo --lang ts --pm npm
# OR (using the init script directly)
npm run init -- MyApp --target expo --lang ts --pm npm
```

Workflow rules (mandatory):
- Work strictly top‑to‑bottom from the first unchecked section in `docs/TODO.md`
- Unit of work = one TODO section = one commit
- No drive‑by refactors, no scope creep, no regressions

See: `docs/WORKFLOW.md`.

---

## 📄 License

ISC
