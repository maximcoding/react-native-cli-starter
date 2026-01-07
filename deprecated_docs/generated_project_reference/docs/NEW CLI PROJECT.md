Below is a **complete “handoff README / spec”** you can paste into another chat/agent. It describes **what this tool is**, **what is core out-of-the-box**, what is **optional (plugins/modules)**, **project structure**, **how generation works**, **how to add new plugins/modules**, and **how to maintain/deploy** it.

---

# React Native Starter CLI — Specification & Maintenance Guide

## 1) What this is

A **React Native starter generator + extender** that helps a user build **any mobile app** by:

1. **Initializing** a production-grade React Native project skeleton (Bare RN or Expo if supported).
2. Providing a **stable CORE** that never changes conceptually:

    * Navigation infrastructure (always present)
    * Single transport layer (always present)
    * Config / constants / env (always present)
    * Utilities / types / tooling (always present)
3. Allowing **optional plugins** to be added after init (or selected during init), such as:

    * i18n, Theme, Query caching, Offline sync, BootSplash, Analytics, Push, Payments, OTA, AI/ML, etc.
4. Allowing **business modules** to be generated later (Auth, User, Marketplace, Orders, Cars, etc.) without breaking core.

**Key principle:** app entry points (AppShell, RootNavigator) must be **generated** from a manifest so they are always consistent with the user’s chosen stack.

---

## 2) Terminology (must be consistent)

### 2.1 Core (out-of-the-box, non-negotiable)

Core is always included when project is initialized.

* **Navigation infrastructure** (React Navigation base)
* **Transport façade** (single entry point for data access)
* **Config & env** (constants/globals/limits + env support)
* **Project structure** (folders, path aliases, TypeScript defaults)
* **Minimal types + utils**

### 2.2 Plugins (optional infrastructure capabilities)

Plugins are *cross-cutting infrastructure* that can be enabled/disabled:

* i18n
* theme system
* react-query + persistence
* offline queue + sync engine
* storage engine (MMKV / SQLite)
* transport adapters (REST / GraphQL / Firebase / WS / gRPC…)
* bootsplash
* analytics/crash
* push notifications & deep links
* auth provider integrations (Cognito/Auth0/Firebase/Custom)
* payments
* OTA
* AI/ML integrations

### 2.3 Modules (business features)

Modules are product/business logic:

* auth
* user/profile
* marketplace/cars/orders
* chat
* subscriptions
* admin panel flows

Modules register routes/screens, keys, tags, and init hooks through a registry.

---

## 3) High-level user workflow

### 3.1 Initialize a new project

User runs:

* `npm run init` (or `rns init` once published)

Wizard collects:

* Bare vs Expo
* TS vs JS
* Package manager (npm/pnpm/yarn)
* Platforms (android/ios)
* “Base plugin selection” (optional):

    * i18n? theme? query? offline? bootsplash?
    * transport adapter default (rest/mock/graphql/firebase/ws)
    * state engine preference (zustand/redux/mobx)
    * storage engine (mmkv/sqlite)
    * devops defaults (lint, husky, scripts)
      Then CLI scaffolds project + writes configs + installs deps.

### 3.2 Add plugins after init

User runs:

* `rns plugin add` → shows interactive list
* `rns plugin list` → list available plugins and installed ones
* `rns plugin doctor` → check dependencies/config consistency
* `rns generate` → regenerate generated files (AppShell, root navigator)

### 3.3 Add modules after init

User runs:

* `rns module add marketplace`
* `rns module add auth`
* `rns module list`

---

## 4) Non-negotiable Core (always included)

This is the **minimum system** that makes the starter powerful and flexible.

### 4.1 Navigation infrastructure (core)

* React Navigation is core.
* `RootNavigator` must be driven by a registry (enabled screens).
* Root flow uses bootstrap route logic (ROOT_AUTH/ROOT_APP/ROOT_ONBOARDING).
* Screens are not hardcoded; they come from registry (modules decide).

### 4.2 Transport façade (core)

There is exactly one access point:

`src/infra/transport/transport.ts`

* Holds active adapter
* Can swap adapters at runtime
* Handles offline mode
* Queues mutations/uploads when offline
* Blocks queries/subscriptions when offline

Adapters implement a shared interface:

`src/infra/transport/transport.types.ts`

Operations are centralized:
`src/infra/transport/operations.ts`

### 4.3 Config + env (core)

* `src/core/config/constants.ts`
* flags/limits/globals live there
* `.env` supported (react-native-config or expo config)
* config values used in transport selection, feature toggles, etc.

### 4.4 Project structure (core)

Must exist even before plugins:

* `src/app` (navigation, bootstrap, UI wrappers)
* `src/core` (config, theme, i18n, session)
* `src/infra` (transport, storage, offline, network, query)
* `src/features` (business modules)
* `assets` (fonts/images/splash/svgs)
* `scripts` (icon gen, checks, tools)

### 4.5 Out-of-box dev tooling (core)

* eslint + prettier baseline
* path aliases (`@/`)
* `babel.config.js` with module-resolver
* `tsconfig.json` baseline
* SVG transformer setup (metro + declarations)
* standard scripts for android/ios/doctor/clean

---

## 5) Generated / dynamic entry points (critical)

### Rule: never hand-edit “dynamic” composition files

The CLI must generate them based on a manifest.

**Stable files (human-maintained):**

* `App.tsx` (tiny wrapper)
* `src/app/app-shell/AppShell.tsx` (re-export generated)
* `src/app/navigation/root/root-navigator.tsx` (re-export generated)

**Generated files (overwrite allowed):**

* `src/app/app-shell/AppShell.generated.tsx`
* `src/app/navigation/root/root-navigator.generated.tsx`
* optionally: `src/features/registry.generated.ts` (if desired)

### Why

So app composition always matches:

* installed deps
* enabled plugins
* enabled modules
* selected adapters (rest/graphql/firebase/ws)
* offline/query/theme/i18n presence

### Manifest (single source of truth)

A single file inside the app:

`src/app/stack/stack.manifest.ts`
Contains:

* chosen platform/project type
* enabled plugins
* enabled modules
* transport adapter selection
* state/storage engine selection

Generation reads manifest and emits generated files.

---

## 6) Plugins catalog (what we support)

Plugins are grouped by “capability”.

### 6.1 UX / App shell plugins

* **theme**: ThemeProvider, tokens, typography, spacing
* **i18n**: i18next, locales, `useT()`, parser config, types generator
* **bootsplash**: bootsplash generator + native patching; must auto-handle sharp issues
* **ui-kit** (optional): NativeWind/Tamagui/Gluestack/Tailwind-like

### 6.2 Data & network plugins

* **query**: TanStack Query + tag invalidation
* **query-persist**: Persist query cache (MMKV/SQLite)
* **offline**: offline queue + sync engine + netinfo bridge
* **transport-adapters**:

    * REST (axios/fetch)
    * GraphQL (Apollo/urql)
    * Firebase (firestore/auth/messaging)
    * WebSockets (native ws / socket.io)
    * gRPC (future)
* **error-normalizer**: normalize API errors into standard shape
* **retry/backoff**: network retry policies

### 6.3 Storage plugins

* **kv-storage**: MMKV (dynamic require) fallback to Map
* **sqlite-storage**: persistent offline + relational data
* **cache-engine**: snapshot cache (Map now, persistent later)

### 6.4 State management plugins

* Zustand (default)
* Redux Toolkit
* MobX

### 6.5 Security/Auth plugins

Auth *must not be limited* to one method. Plugins can be:

* Auth foundation (token storage, refresh handling)
* Email/Password
* OAuth (Google/Apple/etc.)
* Phone SMS (Firebase/Twilio/Auth0/SNS)
* Cognito/Auth0/Firebase/Custom backend

Authorization models:

* RBAC / Scopes / ABAC
  Policy location:
* local / backend

### 6.6 Notifications & Links

* Push: FCM / OneSignal
* Deep links: universal links, app links
* Attribution: Branch/AppsFlyer (optional)

### 6.7 Observability

* Sentry / Firebase Crashlytics / Datadog
* Analytics: Segment/Mixpanel/Firebase
* Logging layer (console → structured logger)

### 6.8 Release & DevOps (core-driven, not a plugin)

Depending on Bare vs Expo:

* Bare: Gradle + Xcode workflows, fastlane optional
* Expo: EAS workflows, expo-updates
  CI/CD:
* GitHub Actions templates
* env split (dev/stage/prod)
* versioning (standard-version)
* signing guides

**Important:** release/devops should be **out-of-box configurable during init**, not a “plugin pack”.

### 6.9 Payments

* Stripe / RevenueCat / Adapty

### 6.10 AI/ML

* LLM providers (OpenAI etc.) with tasks
* ML: TFLite / TF.js / server inference

---

## 7) What init must do (non-negotiable defaults)

When user runs init, we always provide:

### 7.1 Always installed / created

* folder structure
* tsconfig/babel/metro/svg declarations
* navigation base + root navigator registry pattern
* transport façade + operations registry
* config/constants/env scaffolding
* basic state engine (default: Zustand)
* scripts baseline (doctor/clean/adb etc.)

### 7.2 Init may ask and then include

* i18n plugin
* theme plugin
* query/offline plugin
* bootsplash plugin
* adapter choice (rest/mock/graphql/firebase/ws)
* storage engine (mmkv/sqlite)
* ui kit choice (nativewind/tamagui/gluestack)

### 7.3 After init

User extends via:

* `rns plugin add ...`
* `rns module add ...`
* `rns generate`

---

## 8) How plugin installation works (must be robust)

### 8.1 Detection & overwrite safety

Before applying a plugin:

* detect if target files already exist
* ask:

    * “skip”
    * “overwrite”
    * “merge where safe” (only for JSON configs)
* if overwrite chosen, backup to `.rns-backup/<timestamp>/...`

### 8.2 Dependency safety

* only generate imports if dependencies exist
* install deps automatically if user confirms (or auto for required deps)
* for pnpm sharp issue (bootsplash):

    * run `pnpm approve-builds` OR set `pnpm.onlyBuiltDependencies=["sharp"]`
    * then reinstall or rebuild sharp
    * do not blame missing logo.png (logo is unrelated to sharp native binary)
    * bootsplash generator uses sharp; must ensure sharp builds.

### 8.3 Regeneration step

After any plugin change:

* update manifest
* run generator to rebuild AppShell + RootNavigator

---

## 9) Project structure (target RN app)

A clean target app structure:

```
assets/
  fonts/
  images/
  splash/
  svgs/
scripts/
src/
  app/
    app-shell/
      AppShell.tsx
      AppShell.generated.tsx
    bootstrap/
    navigation/
      root/
        root-navigator.tsx
        root-navigator.generated.tsx
      helpers/
      routes/
    components/
    state/
  core/
    config/
    theme/
    i18n/
    session/
  infra/
    transport/
      adapters/
      operations.ts
      transport.ts
      transport.types.ts
    offline/
      offline-queue.ts
      sync-engine.ts
    network/
      netinfo.ts
    storage/
      mmkv.ts
      cache-engine.ts
    query/
      client/
      tags/
      helpers/
  features/
    registry.ts (or registry.generated.ts)
    auth/
    user/
    ...
types/
```

---

## 10) CLI repository structure (generator tool)

The CLI itself should be separate repo/package eventually, but can start inside monorepo.

```
cli/
  bin/
    rns.js
  src/
    cli.ts
    commands/
      init.ts
      plugin.ts
      pluginAdd.ts
      pluginList.ts
      pluginRemove.ts
      module.ts
      generate.ts
      doctor.ts
    plugins/
      theme/
        apply.ts
        template/
      i18n/
      navigation/
      query/
      offline/
      bootsplash/
      ...
    modules/
      auth/
      marketplace/
      user/
    templates/
      app/
        AppShell.generated.tsx.hbs
        root-navigator.generated.tsx.hbs
      shared/
    lib/
      manifest.ts
      fs.ts
      pm.ts
      detect.ts
      merge.ts
      logging.ts
      project.ts
```

---

## 11) Commands (final UX expected)

### 11.1 Init

* `rns init` (or `npm run init` for local dev)

### 11.2 Plugins

* `rns plugin list` → list available + installed + status
* `rns plugin add` → interactive choose plugin(s)
* `rns plugin add i18n` → direct
* `rns plugin remove` → interactive
* `rns plugin doctor` → check config/deps for enabled plugins

### 11.3 Modules (business)

* `rns module list`
* `rns module add`
* `rns module remove` (optional)

### 11.4 Generate

* `rns generate` → regenerates AppShell/RootNavigator from manifest

---

## 12) Two example stacks (for README)

### 12.1 Offline language learning app (no network)

Core:

* navigation
* transport (offline mode forced on or adapter is local-only)
* config/constants
  Plugins:
* storage: MMKV or SQLite
* offline queue optional (if no network, queue may not be needed)
* query optional (local query wrapper)
* i18n optional (content language switching)
* theme optional

Transport adapter:

* `localAdapter` (reads from SQLite/MMKV/local JSON)

### 12.2 Marketplace app (online + cache + notifications)

Core:

* navigation
* transport façade + REST/GraphQL adapter
  Plugins:
* query + persist
* offline queue + sync engine
* netinfo bridge
* push notifications (FCM)
* auth provider plugin (Cognito/Auth0/Firebase/custom)
* analytics/crash (Sentry)
* bootsplash
* deep links
* payments (optional)

Transport adapter:

* REST (axios) or GraphQL (Apollo)

---

## 13) Maintenance rules (must follow)

### 13.1 Generated files are sacred

Only generator writes:

* `*.generated.tsx`
* (optional) registry generated lists

Humans edit:

* templates
* plugin apply logic
* module code
* manifest editing via CLI only

### 13.2 Backwards compatibility

Public interfaces must not break:

* `Transport` interface
* `KeyValueStorage` interface
* Offline queue + sync engine API
* Registry contract for root screens

### 13.3 Plugin quality bar

Every plugin must include:

* `id`, `name`, `description`
* `detectInstalled(projectRoot)`
* `apply(projectRoot, options)`
* `remove(projectRoot)` (best-effort)
* `deps` list
* overwrite detection + backup

### 13.4 Safety + idempotency

Running `rns plugin add X` twice should:

* detect already installed
* ask user what to do
* not corrupt project

### 13.5 No hard limits

Do not force user into only REST or only one auth type. Provide selection + extensibility.

---

## 14) Deployment / publishing plan (tooling)

### Stage 1: Local dev CLI inside repo

* `npm run rns -- plugin add i18n`
* uses ts-node

### Stage 2: Extract to standalone package

* compile TypeScript to `dist/`
* `bin/rns.js` points to `dist/cli.js`
* publish to npm
* support `npx rns init`

### Stage 3: Templates as package assets

* templates shipped inside npm tarball
* use `files` field in package.json to include templates

---

## 15) Known pain points & how we handle

### 15.1 Sharp / BootSplash

Issue: pnpm blocks build scripts by default.
Solution:

* auto-edit package.json:

    * `pnpm.onlyBuiltDependencies=["sharp"]`
* then run install step that rebuilds sharp:

    * `pnpm install --ignore-scripts=false` OR `pnpm rebuild sharp`
* if still fails: show exact next command

### 15.2 “user can’t paste chunks”

Docs/scripts must avoid heredoc traps.

* prefer “create file with node script” or “copy file content directly”
* never rely on multi-line shell heredocs in README instructions

### 15.3 Drift between App.tsx and stack

Solved by generator architecture (manifest → generated AppShell).

---

## 16) What we already have (in code terms)

Existing infra patterns already established:

* `infra/transport` facade + adapters
* `infra/offline` queue + sync-engine
* `infra/network/netinfo` bridge (dynamic require safe)
* `infra/storage/mmkv` dynamic require safe fallback
* `infra/storage/cache-engine` snapshot cache
* navigation registry pattern for root screens
* i18n parser/types scripts in app package.json

These are building blocks for the generator + plugins.

---

# Final note for the next AI/agent

**Main objective:** make the system stable and scalable by enforcing:

1. **Manifest-driven generation**
2. **Core vs Plugins vs Modules separation**
3. **Idempotent plugin application**
4. **No hard limitations** on auth/transports/state/storage
5. **Out-of-box core** includes navigation + transport + config + project structure
6. App entrypoints and root navigator are always **generated**, never hand-edited

If anything conflicts with these principles, refactor toward them.

---
