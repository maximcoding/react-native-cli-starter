<!--
FILE: README.md
PURPOSE: High-level README (skeleton) for CliMobile (RNS) — topics only (bold links). Details will be added under each topic later.
OWNERSHIP: CLI
-->

<div align="center">

# 🚀 CliMobile (RNS)

**Universal React Native “Lego Platform” CLI**  
Generate a clean **Base App** (Expo or Bare RN) and then install **Capabilities (Plugins)** safely — *zero manual setup, permission-aware, conflict-aware, idempotent.*

</div>

---

## **Table of Contents (Main Topics)**

- **[1. What is CliMobile](#1-what-is-climobile)**
- **[2. The Problem It Solves](#2-the-problem-it-solves)**
- **[3. Core Philosophy (Non-Negotiables)](#3-core-philosophy-nonnegotiables)**
- **[4. Quick Start](#4-quick-start)**
- **[5. CLI Commands](#5-cli-commands)**
- **[6. How It Works (Base + Plugins)](#6-how-it-works-base--plugins)**
- **[7. Project Structure (Ownership Zones)](#7-project-structure-ownership-zones)**
- **[8. Runtime Wiring Model (Providers / Wrappers)](#8-runtime-wiring-model-providers--wrappers)**
- **[9. Plugins (Capabilities Catalog)](#9-plugins-capabilities-catalog)**
- **[10. Permissions Model](#10-permissions-model)**
- **[11. Expo vs Bare Support Rules](#11-expo-vs-bare-support-rules)**
- **[12. Conflicts & Compatibility (Slots)](#12-conflicts--compatibility-slots)**
- **[13. Project Manifest (.rns/rn-init.json)](#13-project-manifest-rnsrn-initjson)**
- **[14. Doctor & Validation](#14-doctor--validation)**
- **[15. Stress Tests (App Archetypes)](#15-stress-tests-app-archetypes)**
- **[16. Create a New Plugin (Developer Guide)](#16-create-a-new-plugin-developer-guide)**
- **[17. Repo Development (Build / Run / Contribute)](#17-repo-development-build--run--contribute)**
- **[18. Working With an AI Agent](#18-working-with-an-ai-agent)**
- **[19. Versioned Docs (version1 vs version2)](#19-versioned-docs-version1-vs-version2)**
- **[20. Roadmap / TODO](#20-roadmap--todo)**

---

## 1) What is CliMobile

CliMobile (RNS) is a **platform CLI** that builds React Native apps using a **Base + Lego Bricks** model:

- **Base App (Base Plate):** generates a clean, runnable project using **Expo** or **Bare React Native**.
- **Plugins (Lego Bricks):** add capabilities like **auth, caching, storage, offline sync, maps, payments, i18n, analytics**.
- **Engine (Modulator):** installs plugins **fully automatically** by running a safe pipeline:
  1) **Scaffold** (copy a plugin package into `packages/@rns/*`)
  2) **Link** (wire workspace + install deps correctly per package manager)
  3) **Wire Runtime** (AST-based injection into CLI-owned runtime composition)
  4) **Patch Native/Config** (idempotent patch ops: Android/iOS/Expo config)
  5) **Update Manifest** (single source of truth for installed plugins + permissions)

### What makes it different from “starters” or “boilerplates”?

**CliMobile is not a fixed template.**  
It is a **capability injection system**:

- You start from a minimal, production-ready **CORE base**.
- You extend the project over time using **installable capabilities**.
- The CLI is responsible for **all glue code**, **all config**, and **all native wiring**.

### The main promise (non-negotiable)

After running:

- `rns init ...` → the app **boots immediately** (no manual edits).
- `rns plugin add ...` → the capability is installed **end-to-end** (deps + wiring + config + permissions), and reinstalling is **safe** (idempotent).

### Where code lives (the separation that keeps it scalable)

CliMobile enforces a strict boundary:

- **Developer Space (yours):** `src/**`  
  Your business logic, screens, domain code — CLI must not rewrite it.

- **System Space (CLI-managed but editable):** `packages/@rns/**`  
  Runtime composition, contracts, plugin packages, and infrastructure.

This separation is what allows **hundreds of plugins** without turning projects into unmaintainable spaghetti.

### 1.X What kinds of apps can CliMobile generate?

CliMobile generates a **base Expo or Bare React Native app** (“Base Plate”), then evolves it by installing **capability plugins** (“Lego Bricks”) like: auth, navigation, networking, cache, offline sync, payments, maps, camera, push, analytics, etc.

Below are **common app categories** the CLI should support, with **real products** as references and a **typical capability stack** (high-level, mix & match).

> Rule: you can combine stacks (REST + GraphQL + WebSockets), but you must block true conflicts (two navigation roots, two UI frameworks, etc.).

- **Ride-sharing / Mobility marketplace** — Uber, Lyft, Bolt  
  Typical stack: auth + maps/location + realtime + payments + push + analytics + storage/offline
- **Car sharing / Car rental marketplace** — Turo, Getaround, Zipcar  
  Typical stack: auth + identity/KYC + camera + maps/location + payments + realtime + push + offline + support/chat
- **Vacation rentals / Hospitality marketplace** — Airbnb, Booking.com, Vrbo  
  Typical stack: auth + search/filter + maps + bookings + payments + messaging + reviews + analytics
- **Real estate marketplace** — Zillow, Redfin, Realtor.com  
  Typical stack: auth(optional) + maps + search/filter + saved searches + alerts/push + analytics + media/gallery
- **E-commerce / Marketplace** — Amazon, eBay, Etsy, Shopify  
  Typical stack: auth + catalog + cart + payments + analytics + push + storage + caching + reviews
- **Food delivery** — DoorDash, Uber Eats, Deliveroo, Wolt  
  Typical stack: auth + payments + maps/location + realtime tracking + push + offline fallback + support/chat
- **Grocery delivery** — Instacart, Shipt, Ocado  
  Typical stack: auth + catalog + substitutions + payments + push + offline lists + analytics
- **Classifieds / Local marketplace** — Facebook Marketplace, Craigslist, OLX  
  Typical stack: auth + media upload + chat/realtime + search + moderation/reporting hooks + push
- **On-demand services** — TaskRabbit, Fiverr, Upwork  
  Typical stack: auth + profiles + messaging + scheduling + payments + reviews + notifications + analytics
- **Fintech / Digital wallet** — Revolut, Wise, PayPal, Cash App  
  Typical stack: auth (MFA/biometrics) + secure storage + compliance/consent + payments + push + observability (crash/logs)
- **Payments / Checkout apps** — Stripe (Checkout integrations), Square  
  Typical stack: payments SDK + deep links + secure storage + analytics + receipt/export + offline mode (optional)
- **Social network / Community** — Instagram, TikTok, Reddit  
  Typical stack: auth + feed + media + realtime + push + analytics + moderation hooks + caching
- **Chat / Messaging** — WhatsApp, Telegram, Discord  
  Typical stack: auth + realtime (ws/socket) + storage/db + encryption hooks + push + offline queues
- **Dating** — Tinder, Bumble, Hinge  
  Typical stack: auth + profiles + location + matching + realtime chat + push + privacy + verification (camera)
- **Media streaming** — Netflix, Spotify, YouTube  
  Typical stack: auth + media player + downloads/offline + subscriptions/payments + analytics + casting (optional)
- **News / Content feed** — Google News, Medium, Substack reader apps  
  Typical stack: feeds + caching + offline reading + search + bookmarks + push + analytics
- **Fitness / Health tracking** — Strava, MyFitnessPal, Fitbit  
  Typical stack: auth + sensors/location + background tasks + analytics + storage + push + charts/ui
- **Education / Language learning (offline-first)** — Duolingo, Anki, Quizlet  
  Typical stack: offline db + import/export + backup + sync(optional) + media/audio + i18n + caching
- **Notes / Knowledge base** — Notion, Evernote, Obsidian (mobile)  
  Typical stack: offline-first storage + sync + editor + files/media + search + export/backup + encryption(optional)
- **Project management / Team tools** — Trello, Asana, Jira mobile  
  Typical stack: auth + REST/GraphQL + offline queue + push + realtime updates + analytics
- **Travel planning** — TripIt, Expedia, Skyscanner  
  Typical stack: auth(optional) + search + booking + maps + notifications + offline itineraries + analytics
- **Navigation / Maps-heavy** — Google Maps-like apps, Waze-style apps  
  Typical stack: maps/location + background location + realtime traffic/events + offline maps(optional) + voice/audio(optional)
- **Events / Ticketing** — Eventbrite, Ticketmaster  
  Typical stack: auth + listings + payments + QR scanner (camera) + wallet passes(optional) + push + analytics
- **Logistics / Delivery tracking** — Amazon Logistics-style tracking, AfterShip  
  Typical stack: auth + realtime tracking + push + offline scans + maps + background tasks + observability
- **B2B SaaS companion apps** — Salesforce mobile, HubSpot mobile  
  Typical stack: auth (SSO) + REST/GraphQL + offline cache + feature flags + analytics + crash reporting
- **Offline field tools (forms, inspections, sync later)** — ServiceMax-style, Fulcrum-style apps  
  Typical stack: offline-only db + form builder + camera + location + background sync + export/backup
- **IoT / Smart home control** — Google Home, Philips Hue  
  Typical stack: auth + local network + bluetooth/wifi(optional) + realtime + device discovery + permissions + onboarding flows


```md
## 2) Core Philosophy (Non-Negotiables)

These rules are **hard constraints**. If any rule is violated, the CLI becomes unmaintainable at scale.

### 2.1 Base First, Then LEGO
- The CLI always starts by generating a **Base Plate**:
  - **Expo** (managed) OR **Bare React Native**
  - Immediately runnable after init
- Everything else is added later as **LEGO Bricks** (plugins) that are compatible with that base.

### 2.2 Workspace Packages Model (Isolation)
- All CLI-managed code lives in: `packages/@rns/*`
  - `@rns/core` (contracts/types)
  - `@rns/runtime` (composition + wiring)
  - `@rns/plugin-*` (capabilities)
- Developer-owned app code lives in: `src/**`
- **Rule:** CLI must not inject “glue code” into developer `src/**`.

### 2.3 Zero Manual Setup (FULL_AUTO)
- If a plugin is “shipped”, installing it must be **fully automated**:
  - dependencies installed
  - configuration applied
  - runtime wiring done
  - native patches applied (if needed)
  - manifest updated
- The CLI must never say: “go edit file X manually”.

### 2.4 Safe + Idempotent Operations (Re-run Proof)
- Every command must be **repeatable**:
  - re-running `plugin add` must not duplicate imports/providers/patches
  - state must remain consistent
- Any file modifications must be:
  - **backed up** before change (policy-based)
  - **traceable** (what changed + why)

### 2.5 Data-Driven Catalog (Engine is Dumb)
- The engine only knows **how** to apply operations.
- The catalog defines **what** to apply:
  - plugin metadata
  - target support (expo/bare)
  - conflicts (“slots”)
  - permissions requirements
  - native patch operations
- No “special casing” logic per plugin inside the engine.

### 2.6 Mix & Match is Allowed (Except Real Conflicts)
- **Allowed (multi-stack):** REST + GraphQL + WebSockets together.
- **Blocked (single-slot conflicts):**
  - two navigation roots (React Navigation vs Expo Router)
  - two UI systems (Tamagui vs NativeBase)
- Conflicts are controlled by **slot rules** (group + single/multi).

### 2.7 Target Awareness (Expo vs Bare)
- Every plugin declares what it supports:
  - Expo / Bare / both
  - Expo Go vs Dev Client vs Standalone constraints (when relevant)
- The CLI must refuse incompatible installs early with clear errors.

### 2.8 Symbol-Based Runtime Wiring (No Code Strings)
- Runtime integration is performed via **AST edits** (ts-morph) using **symbol references**:
  - “import symbol X from package Y”
  - “register capability token Z”
  - “add provider wrapper W”
- **Rule:** never inject raw code strings or regex-based edits for runtime wiring.

### 2.9 Native Changes are Declarative Patch Ops
- No “append strings into Podfile/Gradle/Manifest” hacks.
- Native changes must be expressed as **patch operations**:
  - add/replace plist keys
  - add manifest permissions/features
  - anchored text patches (idempotent “once” strategy)
- This is required for safe re-runs and removals.

### 2.10 Single Source of Truth: Project Manifest
- `.rns/rn-init.json` (or `.rns/.rn-init.json` depending on final choice) is mandatory.
- It records:
  - what base was generated
  - what plugins are installed
  - what permissions were injected
  - what operations were applied (audit-friendly)
- Commands must refuse to run if the project is not initialized.

### 2.11 “Stress-Test Ready” by Design
The manifest + plugin model must support many app archetypes without redesign:
- Turo/Airbnb class apps (hardware + payments + maps)
- Social/dating apps (realtime + media + push + moderation hooks)
- Offline education apps (local DB + import/export + backup + sync optional)
- Real estate / marketplaces (search + filters + maps + caching)
```

````md
## 3) Quick Start

### 3.1 Requirements
- **Node.js**: >= 18 (LTS recommended)
- **Package manager**: `npm` / `pnpm` / `yarn` (chosen at init; do not mix later)
- **macOS** required to build iOS locally (Xcode)
- Android builds require Android Studio + SDK

### 3.2 Install CLI
```bash
npm i -g climobile
# (or) pnpm add -g climobile
# (or) yarn global add climobile
````

Verify:

```bash
rns --help
rns version
```

### 3.3 Create a new app (Base Plate)

Create **Expo** base:

```bash
rns init MyApp --target expo --lang ts --pm pnpm
```

Create **Bare React Native** base:

```bash
rns init MyApp --target bare --lang ts --pm pnpm
```

After init:

```bash
cd MyApp
rns doctor
```

Run the app:

```bash
# Expo
pnpm start

# Bare RN
pnpm ios
pnpm android
```

### 3.4 Install capabilities (LEGO Bricks)

Install plugins by ID:

```bash
rns plugin add data.react-query storage.mmkv state.zustand
```

Install multiple capability stacks:

```bash
# Example: REST + WebSockets + Firebase Auth (allowed)
rns plugin add transport.axios realtime.socketio auth.firebase
```

Re-run safely (idempotency check):

```bash
rns plugin add transport.axios
rns plugin add transport.axios   # should be NO-OP (no duplicates)
```

### 3.5 View state / what’s installed

```bash
rns plugin status
rns plugin list
```

### 3.6 Troubleshooting (fast)

```bash
rns doctor                  # validates manifest, patches, wiring, deps
rns plugin doctor            # plugin-specific checks
rns logs                     # last CLI run logs (if implemented)
```

> Notes:
>
> * If a plugin requires native code and you are on Expo Managed, the CLI must either:
>
>   * enforce **Dev Client / prebuild**, or
>   * refuse install with a clear “Bare-only” reason (based on plugin support rules).

```
::contentReference[oaicite:0]{index=0}
```
You’re right — **Quick Start must include a “preflight / environment doctor” step BEFORE `init`**. Here’s the corrected **section 3** (copy-paste replacement), with that rule baked in:

````md
## 3) Quick Start

### 3.1 Requirements
- **Node.js**: >= 18 (LTS recommended)
- **Package manager**: `npm` / `pnpm` / `yarn` (chosen at init; do not mix later)
- **macOS** required for iOS builds (Xcode)
- Android builds require Android Studio + SDK

---

### 3.2 Install CLI
```bash
npm i -g climobile
# (or) pnpm add -g climobile
# (or) yarn global add climobile
````

Verify:

```bash
rns --help
rns version
```

---

### 3.3 Preflight (MANDATORY before init)

Before generating any project, the CLI must validate your environment.

```bash
rns doctor --env
```

What `doctor --env` checks (example):

* Node + npm/pnpm/yarn versions
* Git available
* For **Expo target**:

  * `expo` tooling availability (and/or `npx expo --version`)
  * (optional) EAS CLI if you use dev client / builds
* For **Bare RN target**:

  * Android: `JAVA_HOME`, Android SDK, `adb`, Gradle tooling
  * iOS (macOS): Xcode, CocoaPods, `xcodebuild`
* Prints **actionable fixes** and refuses to proceed if critical items are missing.

✅ Only after `rns doctor --env` is green, continue.

---

### 3.4 Create a new app (Base Plate)

Create **Expo** base:

```bash
rns init MyApp --target expo --lang ts --pm pnpm
```

Create **Bare React Native** base:

```bash
rns init MyApp --target bare --lang ts --pm pnpm
```

After init:

```bash
cd MyApp
rns doctor
```

Run the app:

```bash
# Expo
pnpm start

# Bare RN
pnpm ios
pnpm android
```

---

### 3.5 Install capabilities (LEGO Bricks)

Install plugins by ID:

```bash
rns plugin add data.react-query storage.mmkv state.zustand
```

Install multiple capability stacks:

```bash
# Example: REST + WebSockets + Firebase Auth (allowed)
rns plugin add transport.axios realtime.socketio auth.firebase
```

Re-run safely (idempotency check):

```bash
rns plugin add transport.axios
rns plugin add transport.axios   # should be NO-OP (no duplicates)
```

---

### 3.6 View state / what’s installed

```bash
rns plugin status
rns plugin list
```

---

### 3.7 Troubleshooting (fast)

```bash
rns doctor                  # validates manifest, patches, wiring, deps
rns plugin doctor            # plugin-specific checks
rns logs                     # last CLI run logs (if implemented)
```

> Notes:
>
> * If a plugin requires native code and you are on Expo Managed, the CLI must either:
>
>   * enforce **Dev Client / prebuild**, or
>   * refuse install with a clear “Bare-only” reason (based on plugin support rules).

```

If you want, next we can fill **Section 2 (Core Philosophy)** and include the rule: **no command that changes the workspace runs unless environment doctor passes**.
::contentReference[oaicite:0]{index=0}
```


## 3) Using the CLI (Quick Start + Commands)

### 3.1 One-time setup (CLI + environment)

* `npm i -g climobile` *(or your chosen install method)*
* `rns --help`
* `rns doctor --env` *(checks Node, package manager, Android SDK, Xcode, CocoaPods, Java, Watchman, Ruby, Expo/EAS if needed)*

### 3.2 Create a new app (Base Plate)

**Expo base**

* `rns init MyApp --target expo --lang ts --pm pnpm`
* `cd MyApp`
* `pnpm start`

**Bare RN base**

* `rns init MyApp --target bare --lang ts --pm pnpm --platforms ios,android`
* `cd MyApp`
* `pnpm start`
* `pnpm ios` / `pnpm android` *(or whatever scripts your base provides)*

### 3.3 Add capabilities (LEGO plugins)

* `rns plugin list`
* `rns plugin add data.react-query storage.mmkv transport.axios`
* `rns plugin status`
* `rns plugin doctor` *(validate plugin wiring + native patches + permissions)*

### 3.4 Validate / repair

* `rns doctor` *(project-level checks: manifest, ownership zones, runtime registry, duplicates, missing markers/anchors, etc.)*
* `rns doctor --fix` *(optional: only safe auto-fixes; never touches user-owned code)*

---

## 4) CLI Commands Reference

### 4.1 Global

* `rns --help`
* `rns --version`

### 4.2 Doctor (environment + project)

* `rns doctor --env` → verifies machine prerequisites before init/build
* `rns doctor` → verifies current project consistency
* `rns doctor --fix` → applies safe fixes (idempotent)

### 4.3 Init (generate base project)

* `rns init <Name>`
* Common flags:

  * `--target expo|bare`
  * `--lang ts|js`
  * `--pm npm|yarn|pnpm`
  * `--platforms ios,android`
  * `--no-install` *(optional)*
  * `--dry-run` *(optional)*

### 4.4 Plugins (capabilities)

* `rns plugin list`
* `rns plugin add <id...>`
* `rns plugin remove <id...>`
* `rns plugin status`
* `rns plugin doctor` *(plugin-specific validation)*

### 4.5 Manifest / state

* `rns manifest show`
* `rns manifest validate`
* `rns manifest migrate` *(when schemaVersion changes)*

### 4.6 (Optional) Modules (business scaffolds)

* `rns module list`
* `rns module add <id...>`
* `rns module status`
* `rns module doctor`

### 4.7 Debug / operations

* `rns plan plugin add <id>` *(dry-run plan output)*
* `rns logs` *(show last run logs)*
* `rns clean` *(safe cleanup: caches, temp, build artifacts)*


## 5) How It Works (Base + Plugins)

CliMobile works in **two stages**:

1. **Generate a Base Plate** (Expo or Bare React Native) that is immediately runnable.
2. **Snap LEGO Bricks (Plugins)** onto that base using a deterministic, safe installation engine.

---

### 5.1 The Base Plate (what `rns init` creates)

`rns init` generates a clean project that already contains:

* **System Space (CLI-managed)**: `packages/@rns/*` + `.rns/*`
* **User Space (developer-owned)**: `src/*` (business code stays clean)

The base plate includes:

* a **runtime composition layer** (`@rns/runtime`) that will host plugin wiring
* **contracts + defaults** (`@rns/core`) so the app runs even with zero plugins
* **DX baseline**: aliases, env pipeline, fonts, svg, scripts
* a **manifest file** (single source of truth): `.rns/rn-init.json`

> Key rule: **the CLI never injects infrastructure code into `src/**`**. Plugins integrate through `@rns/runtime`, not by editing your features.

---

### 5.2 What a Plugin is (a LEGO Brick)

A plugin is a **capability package** that lives in **System Space** (workspace package):

* location: `packages/@rns/plugin-<something>`
* described by a **Plugin Descriptor** (id, support rules, conflicts, runtime contributions, native patch ops, permissions)
* installed through the **Modulator Engine**
* recorded in the **manifest** so installs are repeatable, debuggable, and safe

Plugins can be:

* infrastructure (auth, network, storage, analytics)
* platform/hardware (camera, location, notifications)
* dev tooling (lint, testing, CI)

---

### 5.3 Modulator Engine: the plugin install pipeline

When you run `rns plugin add <id>`, the CLI executes a **strict pipeline**:

1. **Preflight / Doctor Gate (before doing anything destructive)**

   * confirm project is initialized (manifest exists)
   * confirm environment is sane (Node, package manager, platform tools)
   * confirm workspace layout is valid
   * fail early with actionable errors

2. **Plan (dry-run capable)**

   * compute what will change (files created, deps added, runtime wiring, native patches)
   * compute **compatibility** (Expo vs Bare support)
   * compute **conflicts** (slot rules: single vs multi)
   * compute required **permissions** (iOS Info.plist keys, Android manifest perms)

3. **Scaffold (create plugin package)**

   * copy plugin template pack into `packages/@rns/plugin-*`
   * rewrite package metadata if needed
   * create owned files only in System Space
   * idempotent: if already present, it should skip or reconcile safely

4. **Link (workspace + dependencies)**

   * ensure root workspaces include the plugin package
   * install dependencies via the **single dependency layer** (pm-aware)
   * do not allow mixed package managers
   * avoid `workspace:*` pitfalls when using npm (rewrite policy)

5. **Wire (runtime injection via AST)**

   * update `packages/@rns/runtime/*` composition using **ts-morph**
   * add imports + registrations by **symbol references**, not raw code strings
   * idempotent: never duplicate providers/wrappers/registrations

6. **Patch (native + config)**

   * apply **declarative patch operations** (not raw string appends)
   * iOS: Info.plist keys, entitlements, Podfile anchors (when applicable)
   * Android: Manifest permissions/features, Gradle anchors (when applicable)
   * Expo: app.json/app.config updates (when applicable)
   * always backup before modifying files (policy-controlled)

7. **Update Manifest**

   * record installed plugin, version, config, injected permissions, owned files
   * manifest becomes the source of truth for status/doctor/remove

8. **Verify**

   * run lightweight verification checks (expected files exist, markers intact, injections present)
   * optionally run “doctor” checks
   * print precise next steps

---

### 5.4 Idempotency & Safety Guarantees

CliMobile must guarantee:

* **Re-run safe**: installing the same plugin twice = **no duplicates**
* **No user code mutation**: `src/**` is not patched by the CLI
* **Backups** exist for any modified file
* **Deterministic output**: same inputs → same structure
* **Refuse impossible states**: incompatible target, broken manifest, conflict slots

---

### 5.5 Combine stacks, block only real conflicts

Supported:

* REST + GraphQL + WebSockets together
* Zustand + React Query together
* multiple storage adapters if they occupy different “slots”

Blocked:

* two navigation roots (React Navigation vs Expo Router)
* two UI frameworks in the same “UI framework slot”
* anything explicitly marked as `single` slot conflict

---

### 5.6 Remove / Upgrade (same rules)

`rns plugin remove <id>` and future `rns plugin upgrade <id>` follow the same philosophy:

* only touch System Space
* remove runtime wiring safely (AST eject)
* revert native patches only when safe (or keep additive patches if shared)
* update manifest and verify state

## 6) Project Structure (Ownership Zones)

CliMobile enforces **hard ownership boundaries** so the CLI can scale to hundreds of plugins without breaking your app.

### 6.1 Ownership Zones (non-negotiable)

* **USER ZONE (`src/**`)**
  Your business code. **CLI must never modify** files here.

* **SYSTEM ZONE (`packages/@rns/**` + `.rns/**`)**
  CLI-managed infrastructure: runtime wiring, contracts, plugins, state, backups.
  **CLI is allowed to create/modify** files here.

> The only “bridge” between zones is a minimal entry that renders `@rns/runtime`.
> Everything else is wired inside SYSTEM ZONE.

---

### 6.2 Folder layout (generated project)

```txt
MyApp/
├── package.json              # Root monorepo config (workspaces, scripts)
├── tsconfig.json             # Root TS config (paths for @/ and @rns/*)
├── .rns/                     # CLI state, logs, backups (SYSTEM ZONE)
│   ├── rn-init.json           # Project Manifest (source of truth)
│   ├── logs/                  # CLI execution logs
│   └── backups/               # File backups before patches
│
├── src/                      # 👤 USER ZONE (Your code)
│   ├── app/                  # App shell, navigation usage, UI composition usage
│   ├── features/             # Business features (screens, domains)
│   ├── infra/                # Your app-level glue (optional, but still user-owned)
│   └── ...                   # CLI NEVER patches here
│
├── packages/                 # 🤖 SYSTEM ZONE (CLI-managed)
│   └── @rns/
│       ├── core/             # Contracts + defaults (interfaces, base adapters)
│       ├── runtime/          # Wiring center: DI container + provider/wrapper pipeline
│       ├── plugin-*/         # Installed plugins as local workspace packages
│       └── module-*/         # (future) business modules scaffolded as packages if needed
│
└── apps/ or native folders   # (depending on Expo/Bare) platform projects
```

---

### 6.3 What the CLI is allowed to change

✅ **Allowed (SYSTEM ZONE only):**

* `packages/@rns/runtime/**` (runtime wiring via ts-morph)
* `packages/@rns/plugin-*/**` (scaffold/link/upgrade/remove)
* `.rns/**` (manifest, logs, backups, doctor reports)
* platform config files **only through patch ops** (Expo config, Android/iOS files)

❌ **Not allowed:**

* modifying `src/**` (no “paste this provider” into your app code)
* directly editing feature files/screens
* regex-based injection into arbitrary files

---

### 6.4 Why this structure matters

* **Scale:** hundreds of plugins without turning `src/` into spaghetti.
* **Safety:** re-running commands won’t corrupt your business code.
* **Upgradeability:** runtime wiring can evolve inside `@rns/runtime` without touching features.
* **Debuggability:** `.rns/rn-init.json` + logs explain exactly what’s installed and why.

---

### 6.5 One line rule for contributors

> If a change is needed to integrate a capability, it must happen in **SYSTEM ZONE**, and the USER ZONE must stay untouched.


## 7) Runtime Wiring Model (Providers / Wrappers)

**Goal:** Every plugin can “attach” runtime behavior (providers/wrappers/init) **without touching `src/**`**.

### Where wiring happens

* **Only in:** `packages/@rns/runtime/**` (SYSTEM ZONE)
* **Never in:** `src/**` (USER ZONE)

### The runtime pipeline (simple mental model)

1. **Collect contributions** from installed plugins (from the manifest).
2. Build a **single ordered chain**:

   * **Init steps** (one-time boot tasks)
   * **Providers** (context providers like QueryClientProvider)
   * **Wrappers** (UI/root wrappers like GestureHandlerRootView)
3. Render app:

   * `App.tsx` (user) renders `<RnsRuntime />`
   * `RnsRuntime` composes the chain and renders your `src/app/*` root

### What a plugin can contribute (types)

* **Init**: run `initX()` at startup (idempotent)
* **Provider**: add a provider component around the app
* **Wrapper**: add a root wrapper component around the app
* **Registry binding**: register an implementation for a capability token (DI)

### Ordering rules (minimal)

* Providers/wrappers have an `order` number (lower runs earlier / outer wrapper).
* Conflicts are prevented only when they occupy the same **single-slot group** (e.g. `navigation.root`, `ui.framework`).

### Key rule

✅ Multiple providers are normal (React Query + Zustand + i18n).
❌ Two “roots” are not (React Navigation root + Expo Router root).


## 8) Plugins (Capabilities Catalog)

**What is a Plugin?**
A plugin is a **self-contained capability** (a “LEGO brick”) that the CLI can install **fully automatically** into the **SYSTEM ZONE** (`packages/@rns/*`), then wire through `@rns/runtime` using **symbol-based injection** + **native patch ops** (when needed).
**User code (`src/**`) stays untouched.**

### Plugin groups (capability areas)

* **UI system (pick one)**

  * Design systems / component libraries
  * Examples: `ui.tamagui`, `ui.nativebase`, `ui.paper`, `ui.none`

* **Navigation root (pick one main)**

  * App routing foundation
  * Examples: `nav.react-navigation`, `nav.expo-router`

* **State management**

  * Global state + optional persistence
  * Examples: `state.zustand`, `state.redux-toolkit`, `state.xstate`

* **Data fetching + caching**

  * Query cache / revalidation / persistence
  * Examples: `data.react-query`, `data.apollo`, `data.swr`

* **Network transports (stackable)**

  * You may combine several (REST + GraphQL + WS)
  * Examples: `transport.axios`, `transport.graphql.apollo`, `realtime.socketio`

* **Auth providers (stackable)**

  * You may combine provider + custom JWT, etc.
  * Examples: `auth.firebase`, `auth.cognito`, `auth.auth0`, `auth.custom-jwt`

* **Storage engines (stackable)**

  * KV + secure + DB can coexist
  * Examples: `storage.mmkv`, `storage.secure`, `storage.sqlite`

* **Offline-first**

  * Connectivity + outbox queue + sync policies
  * Examples: `offline.netinfo`, `offline.outbox`, `offline.sync`

* **Device & hardware**

  * Camera, location, biometrics, sensors
  * Examples: `media.vision-camera`, `geo.location`, `device.biometrics`, `device.bluetooth`

* **Payments**

  * Checkout + native setup
  * Examples: `pay.stripe`

* **Notifications**

  * Expo notifications / FCM / OneSignal
  * Examples: `notify.expo`, `notify.fcm`, `notify.onesignal`

* **Analytics & monitoring**

  * Event tracking + crash reporting
  * Examples: `analytics.firebase`, `analytics.amplitude`, `obs.sentry`, `obs.bugsnag`

* **Internationalization**

  * Locale detection + loaders
  * Examples: `i18n.i18next`, `i18n.lingui`

* **Assets & DX**

  * SVG / fonts / icons / env / lint / tests
  * Examples: `assets.svg`, `assets.fonts`, `env.unified`, `dev.eslint`, `test.detox`

### What every plugin “may include”

* **NPM deps** (runtime + dev)
* **Runtime contributions** (init/provider/wrapper/registry binding)
* **Permissions needed** (camera/location/etc.)
* **Native patch ops** (Expo config plugins, Info.plist, Android manifest, Gradle/Podfile anchors)
* **Conflict rules** (only block real conflicts)

### “Mix & Match” rule (core principle)

✅ Allowed together: `transport.axios` + `transport.graphql.apollo` + `realtime.socketio` + `data.react-query`
❌ Blocked: `nav.react-navigation` + `nav.expo-router` (two navigation roots)
❌ Blocked: `ui.tamagui` + `ui.nativebase` (two UI frameworks)

### Installation guarantees

When user runs `rns plugin add <id>`:

* the CLI installs it **end-to-end**
* updates the **manifest**
* wires runtime via `@rns/runtime`
* applies permissions/native patches when needed
* re-running is safe (**idempotent**)

## 8) Plugins (Capabilities Catalog)

Below is the **full, complete high-level catalog** of plugin categories your CLI should support (no conflicts logic here — just the “what exists” list). Each category can have 1+ concrete plugins (IDs) later.

### Foundations (almost every app)

* **UI System** (design system / components / theming)
* **Navigation Root** (main router: stacks/tabs/router)
* **State Management** (global app state)
* **Data Fetching + Cache** (query cache, retries, persistence)
* **Networking / Transports** (REST, GraphQL, WebSocket, SSE, gRPC)
* **Authentication** (providers + session management)
* **Storage** (KV, secure, database, files)
* **Offline-first** (connectivity, outbox queue, sync engine)
* **Forms + Validation** (forms library + schema validation)

### Device & OS (hardware + platform features)

* **Permissions Provider** (Expo permissions modules / RN Permissions layer)
* **Camera & Media Capture** (camera, microphone, barcode, recording)
* **Media Library / Gallery** (photos/videos read/write)
* **Location & Maps** (GPS perms, maps provider, geocoding/routing)
* **Sensors** (motion, pedometer, bluetooth, NFC, etc.)
* **Biometrics** (FaceID/TouchID, device auth)
* **Contacts / Calendar** (system data access)
* **File System** (read/write documents, downloads, caches)
* **Share / Import / Export** (share sheet, file import/export, backup/restore)
* **Deep Linking** (universal links/app links + URL routes)

### Product capabilities (common real apps)

* **Search** (local search + remote providers)
* **Realtime Features** (presence, typing, chat primitives on top of WS)
* **Payments** (Stripe, etc.)
* **Subscriptions / In-App Purchases** (StoreKit / Play Billing)
* **Notifications** (push + local notifications)
* **Background Tasks & Scheduling** (periodic sync, background fetch, geofencing)
* **Media Upload Pipeline** (compression, resizing, resumable uploads)
* **Feature Flags / Remote Config** (rollouts, kill switches, A/B flags)
* **OTA Updates** (Expo Updates / other update mechanisms)

### Observability, security, compliance

* **Logging** (structured logs, redaction/PII guard)
* **Crash Reporting & Monitoring** (Sentry/Bugsnag, tracing)
* **Analytics** (events, attribution hooks)
* **Privacy & Consent** (ATT, consent gating for analytics/ads)
* **Security & Encryption** (crypto helpers, secure key usage, optional root/jailbreak checks)

### DX & delivery (developer experience)

* **Env / Config System** (unified `.env` strategy + typed access)
* **Assets Pipeline** (SVG, fonts, icons, splash)
* **Testing** (unit/integration/e2e)
* **CI/CD** (GitHub Actions, EAS/Fastlane templates)
* **Code Quality** (eslint/prettier/husky/lint-staged)
* **Internationalization** (i18n + locale detection)

### Optional “business scaffolds” (if you decide later)

* **Modules / Feature Generators** (chat module, marketplace module, flashcards module, etc.)
* **Backend Scaffold Packages** (NestJS/Fastify/etc. — only if CLI grows into full-stack)

That’s the full list you should keep in README as “Catalog”. After this, you map each category to concrete plugin IDs and their permissions.


## 9) Permissions Model

Permissions are **data-driven** and **attached to plugins**, not hardcoded in the engine.

### 9.1 Three permission layers

1. **OS permissions (what the phone asks the user for)**

* iOS: `Info.plist` usage keys (ex: `NSCameraUsageDescription`)
* Android: `AndroidManifest.xml` permissions (ex: `android.permission.CAMERA`)
* Some also need extra platform flags (ex: background modes, foreground services, features)

2. **Permission “providers” (how JS requests/checks permission)**

* **Expo modules** (ex: `expo-camera`, `expo-location`)
* **Bare RN** providers (ex: `react-native-permissions`, `PermissionsAndroid`)
* These are also “catalog items” so the CLI can show docs + APIs + ExpoGo/dev-client notes

3. **Plugin requirements (what a capability needs)**

* Each plugin declares:

  * required permission IDs (mandatory)
  * optional permission IDs (nice-to-have / advanced features)

### 9.2 Where the truth lives (files)

* `docs/version2/plugins-permissions.md`
  **Master permission catalog** (provider + iOS/Android mapping + APIs + notes)
* `docs/version2/cli-interface-and-types.md`
  Interfaces for: `PermissionRequirement`, `PlatformPermissionSpec`, `PermissionPlugin`, etc.

### 9.3 How the CLI uses it during `plugin add`

When installing a plugin:

1. Read plugin descriptor → `permissionsRequired[]` / `permissionsOptional[]`
2. Resolve each permission ID in the permission catalog (Expo/Bare aware)
3. Apply **idempotent patch ops**:

   * **Expo target:** write into `app.json/app.config.*` (or config plugins) where relevant
   * **Bare target:** patch `Info.plist`, `AndroidManifest.xml`, Gradle/Podfile if needed
4. Update manifest:

   * store “which permissions were injected” (so remove/doctor can reason later)

### 9.4 Output policy (UX)

* If a plugin needs permissions, CLI prints a short summary:

  * **Mandatory:** must be granted for feature to work
  * **Optional:** only required for advanced modes (ex: video audio, background tracking)
* If target doesn’t support it (Expo Go vs dev-client vs bare), CLI blocks or warns clearly.

### 9.5 Key guarantees

* **No duplicated permissions** on re-run (idempotent)
* **No manual edits required** for shipped plugins
* **Permissions are predictable** because they come from the catalog, not random docs


## 10) Expo vs Bare Support Rules

We ship plugins that can be installed **fully automatically**. Two base targets:

* **Expo (Managed)**
* **Bare React Native**

Every plugin must declare these compatibility flags:

* **Targets:** `expo | bare | both`
* **Expo runtime:** `expo-go | dev-client | standalone` (what it actually works with)
* **Platforms:** `ios | android | web` (optional)

**Install gate (what the CLI checks):**

* If project is **Expo + Expo Go** → allow only **Expo-Go-safe** plugins (no custom native code).
* If project is **Expo + Dev Client** → allow plugins that need native code **because dev build is possible**.
* If project is **Bare** → allow any plugin marked `bare` or `both`.

**Hard rule:** if plugin doesn’t match the current target/runtime → **stop** with a clear error (no partial installs).

---

## 11) Conflicts & Compatibility (Slots)

We block **only real conflicts**. Everything else can stack.

### Conflict model = “Slots”

Each plugin declares:

* **slot**: what “place” it occupies (examples: `navigation.root`, `ui.framework`)
* **mode**:

  * `single` → only one plugin in this slot
  * `multi` → many plugins allowed

**Examples:**

* `navigation.root` = `single`
  ✅ `nav.react-navigation` **or** `nav.expo-router`
  ❌ both together

* `ui.framework` = `single`
  ✅ `ui.tamagui` **or** `ui.nativebase` **or** `ui.paper`
  ❌ multiple UI frameworks

* `network.transport` = `multi`
  ✅ `transport.axios` + `transport.graphql.apollo` + `realtime.socketio`

### Compatibility checks (non-conflict)

Before install the CLI also checks:

* target/runtime match (Expo/Bare + ExpoGo/dev-client)
* platform support (iOS/Android/Web)
* required dependencies / required plugins

**Hard rule:** no auto “magic replace”. If a `single` slot is occupied → install is blocked until user removes/replaces the existing one.


You’re right — the manifest is not just “plugins list”. It’s the **project passport**: everything the CLI needs to **reproduce / validate / repair / evolve** the generated app without guessing.

## 12) Project Manifest (`.rns/rn-init.json`)

The manifest is the **single source of truth** for everything the CLI generated and everything the CLI installed later.
Every CLI command reads it, validates it, and updates it.

### Where it lives

* **In generated apps (runtime file):** `.rns/rn-init.json`
* **Schema (TypeScript source of truth):** `src/lib/types/manifest.types.ts`
* **Read/write/validate/migrate implementation:** `src/lib/state/manifest/*`
* **Docs (human explanation):**

  * `docs/version2/cli-interface-and-types.md`
  * `docs/version2/plugins-permissions.md`

---

### What the manifest must contain (high-level)

**A) CLI metadata**

* `schemaVersion` (for migrations)
* `cliVersion` (the CLI that created/updated it)
* `createdAt`, `lastModified`

**B) App identity**

* `name`, `displayName`
* `bundleId` (iOS) / `packageName` (Android)
* `version`, `buildNumber`

**C) Project foundation**

* `target`: `expo | bare`
* `language`: `ts | js`
* `packageManager`: `npm | pnpm | yarn`
* `frameworkVersion` (expo sdk / react-native version)
* optional: `expoRuntime`: `expo-go | dev-client | standalone` (only if you decide to track this)

**D) App description**

* `category` (marketplace / dating / offline-study / etc.)
* `summary` (1 line)
* optional: `scenarios` (your stress-test tags like `turo-like`, `airbnb-like`)

**E) Installed stack (plugins)**

* list/map of installed plugins (by stable `id`)
* per plugin:

  * version
  * installedAt
  * config/options used
  * what it injected (so removal/doctor can reason)

**F) Permissions (aggregated + traceable)**

* aggregated required permissions:

  * iOS Info.plist keys
  * Android manifest permissions/features
* traceability:

  * which plugin caused which permissions
  * mandatory vs optional

**G) Dependencies snapshot (optional but useful for doctor)**

* runtime deps list (or hash)
* dev deps list (or hash)
* helps detect “someone edited package.json manually”

**H) Ownership / safety bookkeeping (system zone only)**

* which files/dirs are CLI-owned (system zone)
* what each plugin created/modified in system zone
* backup/audit pointers (optional)

---

### Minimal interface shape (reference only, not the full file)

> **Full schema lives in:** `src/lib/types/manifest.types.ts`

```ts
// src/lib/types/manifest.types.ts

export interface RnsProjectManifest {
  schemaVersion: string;

  cli: {
    version: string;
    createdAt: string;      // ISO
    lastModified: string;   // ISO
  };

  identity: {
    name: string;
    displayName: string;
    bundleId?: string;
    packageName?: string;
    version: string;
    buildNumber: number;
  };

  project: {
    target: 'expo' | 'bare';
    language: 'typescript' | 'javascript';
    packageManager: 'npm' | 'yarn' | 'pnpm';
    framework: 'expo' | 'react-native';
    frameworkVersion?: string;
    expoRuntime?: 'expo-go' | 'dev-client' | 'standalone';
  };

  description: {
    category: AppCategory;
    summary: string;
    scenarios?: string[];
  };

  plugins: Record<string, InstalledPluginRecord>;

  permissions: {
    iosInfoPlistKeys: string[];
    androidManifestPermissions: string[];
    androidFeatures?: string[];
    byPlugin: Record<string, {
      mandatory: string[];
      optional: string[];
    }>;
  };

  // optional but recommended for doctor
  deps?: {
    runtime: Record<string, string>;
    dev: Record<string, string>;
  };

  // system-zone bookkeeping (never about src/**)
  system?: {
    ownedPaths: string[];
    pluginFiles: Record<string, { created: string[]; modified: string[] }>;
  };
}
```

---

### Rules (non-negotiable)

* The CLI **must refuse** to run plugin/module commands if `.rns/rn-init.json` is missing.
* The CLI **must migrate** manifest if `schemaVersion` is old.
* The CLI **must never** store or track developer business code (`src/**`) as CLI-owned.
* The manifest is what makes installs **repeatable** (idempotent) and makes `doctor` possible.



## 13) Repo Development (Build / Run / Contribute)

### Requirements

* Node.js **18+**
* One package manager per repo (don’t mix): **npm** or **pnpm** or **yarn**
* Git installed

### Install

```bash
# from repo root
npm install
```

### Run CLI locally (dev runner)

Use this for all development (it must behave like the built CLI):

```bash
npm run cli -- --help
npm run cli -- init MyApp
npm run cli -- plugin list
npm run cli -- plugin add data.react-query
npm run cli -- doctor
```

### Build CLI (dist)

```bash
npm run build
node dist/index.js --help
```

### Rules (how to contribute without breaking the system)

* **One source of truth:** `TODO.md` tracks all work (no separate task files).
* **No scope creep:** one TODO section at a time → implement → verify → mark `[x]` → commit.
* **No manual steps for users:** if a plugin needs native config, the CLI must patch it.
* **No regex for code wiring:** runtime wiring must use **ts-morph**.
* **Never touch user zone:** CLI must not modify `src/**` in generated apps.
* **Idempotent operations:** re-running init/plugin add must not duplicate anything.
* **Backups before edits:** when modifying existing files, write backups into `.rns/backups/**`.
* **PM-aware installs:** dependency installs must go through the dependency layer (not ad-hoc shell calls).
* **Docs versioning:** new docs go under `docs/version2/**`, old docs remain in `docs/version1/**`.

### What to verify before marking work done

* `npm run build` passes
* `npm run cli -- --help` works
* `npm run cli -- init <app>` produces a runnable app
* for any plugin work:

  * `plugin add` succeeds
  * re-run `plugin add` → **no-op** (no duplicates)
  * `doctor` passes
  * app boots

---

## 14) Create a New Plugin (Developer Guide)

A **plugin** is a **local workspace package** that the CLI can install into an existing generated app **safely + repeatably** (idempotent), without touching user business code.

### What a plugin contains

Each plugin has **two parts**:

1. **Plugin package (code)**

* Location: `packages/@rns/plugin-<something>/`
* Contains the implementation (adapters/services/ui wrappers) that will be wired into the runtime.

2. **Plugin descriptor (metadata)**

* Location: inside the plugin package (example: `plugin.json`)
* Tells the CLI:

  * where it is supported (expo/bare, ios/android/web)
  * what it conflicts with (slots)
  * what it contributes at runtime (providers/wrappers/init)
  * what native/config changes are required (permissions, patches)
  * what npm dependencies must be installed

---

### Where you create it

Create a new folder:

* `packages/@rns/plugin-<your-plugin-name>/`

Inside it you add:

* `package.json`
* `plugin.json` (descriptor)
* `src/**` (implementation)
* optional: `scripts/**` (generators), `assets/**` (if the plugin owns its own assets)

---

### What the descriptor must define (high level)

In `plugin.json`, define:

* **id**: stable id like `auth.firebase`, `data.react-query`, `camera.vision`
* **category**: one of your catalog categories (auth, network, storage, ui, navigation, etc.)
* **support**: which targets/platforms it works on (`expo`, `bare`, and OS list)
* **conflicts**: slot rules (only block true conflicts)

  * example slots: `navigation.root`, `ui.framework`
* **dependencies**: npm deps/devDeps needed
* **runtime contributions**: what to register/wrap in runtime (symbol-based injection)
* **permissions + native ops**: what permissions/patches must be applied (declarative ops, no raw string appends)

> The descriptor is *the contract* between plugin and engine. The engine stays generic; the descriptor carries the “knowledge”.

---

### How integration works in an existing app (important)

When you run:

```bash
rns plugin add <plugin-id>
```

the CLI integrates the new plugin into the current project like this:

1. **Read project state**

* loads `.rns/rn-init.json` (target expo/bare, installed plugins, package manager)

2. **Validate**

* blocks incompatible plugins (target/platform mismatch)
* checks conflicts using slots (only “same-root” conflicts)
* resolves required dependencies (other plugins) if declared

3. **Apply (idempotent pipeline)**

* **Scaffold:** place the plugin code into `packages/@rns/plugin-*/`
* **Install deps:** add npm deps via the dependency layer (pm-aware)
* **Runtime wire:** update `packages/@rns/runtime/**` using **ts-morph**

  * add imports + registrations + wrapper composition
  * never edit user `src/**`
* **Native/config patch:** apply declarative patch ops (Info.plist / AndroidManifest / Expo config)

  * safe to run twice (no duplicates)

4. **Update manifest**

* record plugin installed + options + what permissions/patches were injected
* enables `doctor` to validate correctness later

---

### How plugins compose with other plugins

**Allowed (stackable)**

* Many categories are **multi**: network can be REST + GraphQL + WS together.
* Multiple plugins can contribute wrappers/providers — runtime composes them in stable order.

**Blocked (only real conflicts)**

* only “single-slot roots”:

  * `navigation.root` → choose one (React Navigation OR Expo Router)
  * `ui.framework` → choose one (Tamagui OR NativeBase)

---

### Rules (so plugins don’t break the platform)

* **Do not modify user code** in `src/**`
* **All runtime wiring** happens in `packages/@rns/runtime/**`
* **All plugin code** lives in `packages/@rns/plugin-*/**`
* **All state** is tracked in `.rns/rn-init.json`
* **No regex patching** for JS/TS code edits — use AST (ts-morph)
* **No raw string appends** to native files — use patch ops with anchors + idempotency
* **Dependency installs** only through the dependency layer (never `npm install` directly inside plugin logic)

---

### Verify your plugin (developer workflow)

After creating or editing a plugin:

1. Validate descriptor + compatibility + conflicts:

```bash
rns plugin doctor <plugin-id>
```

2. Simulate install:

```bash
rns plugin add <plugin-id> --dry-run
```

3. Install for real and re-run to verify idempotency:

```bash
rns plugin add <plugin-id>
rns plugin add <plugin-id>   # must do nothing / no duplicates
```

4. Run project doctor:

```bash
rns doctor
```

That’s it — if these pass, the plugin is considered “ship-ready”.

## 15) Working With an AI Agent

Use an AI agent like a **junior maintainer**: it can move fast, but only if you give it **rules, files, and acceptance checks**.

### What the agent must read first (always)

1. `README.md` (this doc)
2. `docs/version2/TODO.md` (the only work plan)
3. `docs/version2/WORKFLOW.md` (how to execute work + commits)
4. `docs/version2/catalog/` (plugin + permissions datasets, if present)

---

### How to give tasks (the only format)

Give the agent **one task block** at a time:

* **Goal** (1–2 lines)
* **Scope** (files it may touch)
* **Do not touch** (explicit forbidden areas)
* **Acceptance** (commands that must pass)
* **Output** (what to update in TODO.md)

Example:

* Goal: implement `rns plugin add --dry-run`
* Scope: `src/lib/modulator/**`, `src/commands/plugin/**`, `docs/version2/TODO.md`
* Do not touch: generated-app templates, unrelated refactors
* Acceptance: `npm test`, `npm run build`, `npm run cli -- plugin add ... --dry-run`
* Output: mark the exact checklist items as done

---

### Rules the agent must follow (non-negotiable)

* **One change-set at a time**: finish + verify before starting the next.
* **No “drive-by refactors”**: only what the current task needs.
* **No manual-step docs**: CLI must do the setup; docs explain behavior, not “edit this file”.
* **No user-code edits**: never change generated app `src/**`.
* **AST-only for TS/JS edits**: ts-morph, no regex injection.
* **Native patches must be ops-based**: idempotent, anchored, with backups.
* **All installs go through the dependency layer** (npm/yarn/pnpm aware).
* **Idempotency is mandatory**: running the same command twice must not duplicate anything.

---

### How the agent should report progress

For each task, the agent must output:

* What it changed (file list)
* What it verified (commands + results)
* What TODO items were marked complete
* What remains / risks (if any)

---

### How to review the agent’s work (fast checklist)

* Did it update `docs/version2/TODO.md` correctly?
* Did it avoid touching user zone (`src/**` in generated apps)?
* Does `--dry-run` produce a clear plan?
* Does “run twice” stay clean (no duplicates)?
* Do errors show actionable messages (compatibility/conflict/missing doctor requirements)?

---

### Recommended stress workflow with an agent

Have the agent run these scenarios whenever it changes plugin logic:

* `rns init` (expo) + add 2–3 plugins + re-add same plugins
* `rns init` (bare) + add native plugin + re-add
* install two stackable plugins (REST + WS) → allowed
* install two conflicting plugins (two navigation roots) → blocked with clear error
* run `rns doctor` after every scenario

---

### One copy-paste “kickoff message” for any new agent

Read `README.md`, `docs/version2/TODO.md`, `docs/version2/WORKFLOW.md`.
Work only from `docs/version2/TODO.md` (no extra task files).
Make changes in small verified steps, keep installs/patching idempotent, use ts-morph for code injection, ops-based patching for native/config.
Never edit generated app user `src/**`; integrate only via `packages/@rns/runtime/**` and local plugin packages.


## 17) Roadmap / TODO

Single source of truth: **`docs/version2/TODO.md`**

* Contains **all work items** (no `docs/tasks/*` anymore).
* After each verified change, update the relevant checkboxes there.

### Current milestones (high-level)

* **M1 — Foundation (DONE)**
  Base CLI + `init` + CORE base pack + DX baseline (Tasks 01–04)

* **M2 — Modulator Engine (NEXT)**
  Plugin add pipeline that is **safe + idempotent**:

  * scaffold plugin package (workspace)
  * link + install deps (pm-aware)
  * runtime wiring (ts-morph, symbol refs)
  * native/config patch ops (idempotent + backups)
  * update manifest (`.rns/rn-init.json`)
  * dry-run planning + readable output

* **M3 — Catalogs (DATA-driven)**

  * plugin catalog (official IDs + targets + conflicts + wiring)
  * permissions catalog (provider rows + iOS/Android mappings)
  * compatibility rules (expo-go vs dev-client vs bare)

* **M4 — Doctor & Stress Tests**

  * environment doctor (SDK/tools)
  * project doctor (manifest consistency, plugin health)
  * scenario stress tests (app archetypes + conflict cases)

* **M5 — Plugin Dev Workflow**

  * “create plugin” guide
  * validation rules
  * plugin test harness (dry-run + apply + re-apply)

### Always-on quality bars

* **No manual setup required** for official plugins (FULL_AUTO).
* **No user-zone edits** (`src/**` in generated apps stays clean).
* **Idempotent** operations (re-run safe).
* **Only real conflicts blocked** (slot conflicts), stacking allowed.


