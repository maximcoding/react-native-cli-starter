<!--
FILE: docs/TODO.md
PURPOSE: Technical TODO (main topics only). Checkbox only on section title. English. Low indentation.
OWNERSHIP: CLI
-->

# TODO — CliMobile (RNS Starter CLI) — Technical Work Order

## [x] 1) CLI Foundation

Build a stable TypeScript CLI repository with runnable `rns` binary from `dist/`, local dev runner (`npm run cli`), single logging/error format, and repo structure where `src/commands/*` are thin entrypoints and logic lives in `src/lib/*`.

## [x] 2) INIT Pipeline (`npm run init` / `rns init`)

Implement full init flow that creates Expo Framework or Bare React Native app in "ready-to-run" state with zero manual edits. Collect inputs, create project, attach CORE base pack, install dependencies, apply configs/scripts, create/validate markers, write `.rns/rn-init.json`, run integrity checks. Acceptance: app boots immediately after init.

## [x] 3) CORE Base Pack (`templates/base`)

Lock and maintain single CORE base template pack always attached by init. CORE provides baseline architecture and infrastructure foundation (app shell, contracts, safe defaults) so project compiles and runs even with zero capability plugins installed.

## [x] 4) DX Baseline (out-of-the-box)

Guarantee zero-manual-setup developer experience: `@/` alias works for TypeScript and runtime, SVG imports work, fonts pipeline ready, env pipeline with `.env.example` and typed access pattern.

## [x] 5) Docs Contract Set (canonical, non-duplicated)

Lock canonical docs set: `README.md`, `docs/TODO.md`, `docs/WORKFLOW.md`, `docs/AGENT.md`, `docs/cli-interface-and-types.md`, `docs/plugins-permissions.md`. Rule: do not shrink or delete intent; move long lists to dedicated docs instead of removing them.

## [x] 6) Template Packs System (CORE / Plugin / Module packs)

Define template-pack system as core mechanism for "dynamic attachment" into generated app. Support CORE packs, plugin packs, and module packs with consistent structure, clear ownership rules, and target variants (Expo/Bare, TS/JS).

## [x] 7) Dynamic Template Attachment Engine

Build engine that deterministically selects and attaches correct template packs/variants based on init parameters. Must understand targets (expo/bare, ts/js), apply option-driven variants, merge safely, prevent collisions, guarantee repeatable output (same inputs → same output).

## [x] 8) Ownership, Backups, Idempotency

Enforce strict safety rules: CLI-owned vs user-owned files, marker-based regions, backups under `.rns/backups/<timestamp>/...`. All operations must be idempotent: rerunning init or reapplying plugins must never duplicate injections or break the app.

## [x] 9) Marker Contract (canonical integration points)

Lock canonical integration markers as only supported wiring method for plugins/modules. Markers must always exist in CORE, be validated before patching, produce clean actionable errors when missing or corrupted.

## [x] 10) Marker Patcher Engine v1

Implement single patcher that safely injects changes only inside markers (imports/providers/init/root). Must guarantee no duplicates, stable output, resilience to formatting/newlines, traceability by capability id. Always backup before writing.

## [x] 11) Runtime Wiring Engine (AST-only, symbol-based)

Implement runtime wiring via ts-morph only (no regex, no raw code-string injection). Symbol-based, composed in SYSTEM ZONE (`packages/@rns/**`) so developer business code (`src/**`) remains untouched. Deterministic ordering.

## [x] 12) Patch Operations System (native/config, idempotent)

Define and implement patch operations as declarative, idempotent units for Expo config, iOS plist/entitlements, Android manifest, anchored text edits (Gradle/Podfile). Rules: anchored, insert-once, backed up, traceable by plugin id.

## [x] 13) Project State System (`.rns/rn-init.json`)

Make `.rns/rn-init.json` single source of truth for what was generated and installed. Every CLI command must validate state before acting and refuse to run on non-initialized projects with actionable message.

## [x] 14) Dependency Layer (pm-aware)

Build unified dependency installation layer for npm/pnpm/yarn that guarantees deterministic installs. Must respect lockfile discipline, never mix package managers, provide clear error output. Plugins/modules must use this layer, not run PM commands directly.

## [x] 15) Modulator Engine v1 (plan/apply/remove)

Build generic installation engine that plans changes (dry-run) deterministically, applies changes in stable phases, can remove plugins safely (NO-OP if absent; never touches USER ZONE). Must report: deps, runtime wiring ops, patch ops, permissions summary, conflicts, manifest updates.

## [x] 16) Permissions Model v1 (IDs + mapping + providers)

Make permissions data-driven: plugins declare PermissionIds (not raw platform strings), permissions resolve through `docs/plugins-permissions.md` dataset, installers apply platform changes via patch ops. Manifest stores aggregated permissions plus per-plugin traceability.

## [x] 17) Environment Doctor (`rns doctor --env`)

Implement machine preflight that checks required tooling for chosen target (Node, PM, git, Expo toolchain, Android/iOS toolchains). Must fail early with actionable fixes and block destructive commands when critical items are missing.

## [x] 18) Project Doctor (`rns doctor`, `rns doctor --fix`)

Implement project-level validation: manifest present + valid schema version, ownership zones intact, no duplicate injections, installed plugins consistent with workspace + deps. `--fix` may only apply safe fixes in SYSTEM ZONE (never touches `src/**`).

## [x] 19) Plugin Framework (registry, apply, doctor)

Build real plugin system where every shipped plugin is fully automated capability (FULL_AUTO). Framework must support stable plugin IDs, registry/catalog, standardized apply pipeline (deps + packs + wiring + state update), doctor validation model.

## [x] 20) Plugin Commands (list, add, remove, status, doctor)

Implement plugin command surface: list catalog, add by IDs (or interactive), remove, status, doctor. Commands must be state-driven, use template attachment engine and marker patcher, respect ownership/backup/idempotency policy.

## [x] 21) Module Framework (business scaffolds)

Design and implement business module framework that generates feature code (screens/flows/domain/state) and integrates through stable registration model. Modules consume CORE contracts and installed capability plugins.

## [x] 22) Module Commands (list, add, status, doctor)

Implement module list/add/status/doctor commands. Adding a module must automatically attach and register (no manual "edit registry"), update state, be diagnosable via doctor.

## [x] 23) Verification, Smoke, CI Gates

Add unit/spec tests for all major engines (attachment, marker patcher, runtime wiring, patch ops, state system, dependency layer, modulator, permissions, doctors). Add integration smoke tests (init, plugin add/remove, module add). Add CI gate (typecheck + lint + unit/spec + smoke). Add spec acceptance assertions mapping tests to sections 1-22.

## [x] 24) CI/CD Workflow Generation (CORE)

Implement CI/CD workflow generation as CORE capability. Generate GitHub Actions workflow templates for Expo and Bare targets (build, test, lint, release pipelines with dev/stage/prod splits). Workflows must be idempotent, placed in `.github/workflows/`. Templates in `templates/base/.github/workflows/` with target-specific variants.

## [x] 25) Component Generation Command

Implement component generation capability (`rns component add <component-name>`). Generate UI components that adapt to installed UI framework plugin if available, or generic components. Components generated in USER ZONE (`src/components/` or `src/app/components/`).

## [x] 26) Bare Init: React Navigation Presets (CORE)

Enhance `rns init` for Bare RN to include React Navigation by default with preset selection (stack-only, tabs-only, stack+tabs, stack+tabs+modals, drawer). Must stay within System Zone, install deps via dependency layer, apply config via Patch Operations.

## [x] 27) Navigation Registry for User Screens (CORE)

Implement registry-based system allowing users to register screens from User Zone (`src/**`) without modifying System Zone. Users create screens in `src/screens/**` and register in `src/app/navigation/registry.ts`. System Zone reads from registry, falls back to placeholders if missing.

## [x] 28) I18n Integration (CORE)

Integrate i18next-based internationalization as optional CORE feature. During init, I18n presented as multi-option selection (selected by default). Users select locales (at least 1 required, default: English). I18n files generated in System Zone (`packages/@rns/core/i18n/`) and initialized automatically when selected.

## [x] 29) Multi-Option Selection During Init

**Note:** Completed as part of section 30. Enhance `rns init` for both Expo and Bare targets to provide multi-option selection for project features. All options available for both targets except Expo-specific features which are only available for Expo.

## [x] 30) Expanded Init Options: Expo-Specific, Bare-Specific, and Common Options

Expand `rns init` to include comprehensive option selection: Expo-specific (11 options), Bare-specific (5 options), and common options (10 options). All options are target-aware (Expo-only hidden for Bare, Bare-only hidden for Expo). All selections stored in manifest.

## [x] 31) State Management as Init Options (Phase 1: Dependencies Only)

Convert state management plugin category to init options. Phase 1: Install dependencies only (`state.zustand`, `state.xstate`, `state.mobx`). Phase 2: Infrastructure and code generation (future).

## [x] 32) Data Fetching / Cache as Init Options (Phase 1: Dependencies Only)

Convert data fetching plugin category to init options. Phase 1: Install dependencies only (`data.react-query`, `data.apollo`, `data.swr`). Phase 2: Infrastructure and code generation (future).

## [x] 33) Network Transport as Init Options (Phase 1: Dependencies Only)

Convert network transport plugin category to init options. Phase 1: Install dependencies only (`transport.axios`, `transport.websocket`, `transport.firebase`). Phase 2: Infrastructure and code generation (future).

## [x] 34) Auth as Init Options (Phase 1: Dependencies Only)

Convert auth plugin category to init options. Phase 1: Install dependencies only (`auth.firebase`, `auth.cognito`, `auth.auth0`, `auth.custom-jwt`). Phase 2: Infrastructure and code generation (future).

## [x] 35) AWS Services as Init Options (Phase 1: Dependencies Only)

Convert AWS Services plugin category to init options. Phase 1: Install dependencies only (`aws.amplify`, `aws.appsync`, `aws.dynamodb`, `aws.s3`). Phase 2: Infrastructure and code generation (future).

## [x] 36) Storage as Init Options (Phase 1: Dependencies Only)

Convert storage plugin category to init options. Phase 1: Install dependencies only (`storage.mmkv`, `storage.sqlite`, `storage.secure`, `storage.filesystem`). Phase 2: Infrastructure and code generation (future).

## [x] 37) Firebase Products as Init Options (Phase 1: Dependencies Only)

Convert Firebase Products plugin category to init options. **Phase 1**: Install dependencies only. **Phase 2**: Infrastructure and code generation (future).

Users can select Firebase services during `rns init`:
- `firebase.firestore` (Cloud Firestore)
- `firebase.realtime-database` (Realtime Database)
- `firebase.storage` (Cloud Storage)
- `firebase.remote-config` (Remote Config)

Implementation rules (Phase 1):
- Add to `InitInputs.selectedOptions` interface: `firebase?: { firestore?: boolean; realtimeDatabase?: boolean; storage?: boolean; remoteConfig?: boolean }`
- Add to `collectInitInputs()` prompt logic (multi-select, all work for Expo and Bare)
- Install dependencies in `installCoreDependencies()` when selected:
  - `@react-native-firebase/firestore@latest` (if firestore selected)
  - `@react-native-firebase/database@latest` (if realtimeDatabase selected)
  - `@react-native-firebase/storage@latest` (if storage selected)
  - `@react-native-firebase/remote-config@latest` (if remoteConfig selected)
- Store selections in manifest (automatic via existing logic)
- Ensure idempotency (use `installedPackages` Set to avoid duplicates)

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Run `rns init`, select Firebase products, verify dependencies installed in `package.json`

## [x] 38) Offline-first as Init Options (Phase 1: Dependencies Only)

Convert offline-first plugin category to init options. **Phase 1**: Install dependencies only. **Phase 2**: Infrastructure and code generation (future).

Users can select offline capabilities during `rns init`:
- `offline.netinfo` (Network info detection)
- `offline.outbox` (Offline queue/outbox pattern)
- `offline.sync` (Sync manager)

**Note:** The outbox pattern typically requires custom implementation. Phase 2 will add infrastructure for queue management and sync logic.

Implementation rules (Phase 1):
- Add to `InitInputs.selectedOptions` interface: `offline?: { netinfo?: boolean; outbox?: boolean; sync?: boolean }`
- Add to `collectInitInputs()` prompt logic (multi-select, all work for Expo and Bare)
- Install dependencies in `installCoreDependencies()` when selected:
  - `@react-native-community/netinfo@latest` (if netinfo selected)
  - `redux-persist@latest` (if outbox selected - for state persistence, custom outbox logic in Phase 2)
  - `@react-native-async-storage/async-storage@latest` (if sync selected, for persistence layer)
- Store selections in manifest (automatic via existing logic)
- Ensure idempotency (use `installedPackages` Set to avoid duplicates)

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Run `rns init`, select offline capabilities, verify dependencies installed in `package.json`

## [x] 39) Notifications as Init Options (Phase 1: Dependencies Only)

Convert notifications plugin category to init options. **Phase 1**: Install dependencies only. **Phase 2**: Infrastructure and code generation (future).

Users can select notification providers during `rns init`:
- `notify.expo` (Expo Notifications - Expo target only)
- `notify.fcm` (Firebase Cloud Messaging - push notifications)
- `notify.onesignal` (OneSignal - push notification service)

**Note:** `notify.expo` is only available for Expo target. FCM and OneSignal work for both targets.

Implementation rules (Phase 1):
- Add to `InitInputs.selectedOptions` interface: `notifications?: { expo?: boolean; fcm?: boolean; onesignal?: boolean }`
- Add to `collectInitInputs()` prompt logic with target-aware filtering:
  - Expo target: Show all three options
  - Bare target: Show only `fcm` and `onesignal` (hide `expo`)
- Install dependencies in `installCoreDependencies()` when selected:
  - `expo-notifications@latest` (if expo selected, Expo target only)
  - `@react-native-firebase/messaging@latest` (if fcm selected)
  - `react-native-onesignal@latest` (if onesignal selected)
- Store selections in manifest (automatic via existing logic)
- Ensure idempotency (use `installedPackages` Set to avoid duplicates)

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Run `rns init`, select notification providers, verify dependencies installed in `package.json`

## [x] 40) Maps / Location as Init Options (Phase 1: Dependencies Only)

Convert maps/location plugin category to init options. **Phase 1**: Install dependencies only. **Phase 2**: Infrastructure and code generation (future).

Users can select map/location services during `rns init`:
- `geo.location` (Geolocation - get device location)
- `maps.mapbox` (Mapbox - map rendering and services)
- `maps.google` (Google Maps - map rendering and services)

Implementation rules (Phase 1):
- Add to `InitInputs.selectedOptions` interface: `maps?: { location?: boolean; mapbox?: boolean; google?: boolean }`
- Add to `collectInitInputs()` prompt logic (multi-select, all work for Expo and Bare)
- Install dependencies in `installCoreDependencies()` when selected:
  - `expo-location@latest` (if location selected, Expo target)
  - `@react-native-community/geolocation@latest` (if location selected, Bare target)
  - `@rnmapbox/maps@latest` (if mapbox selected)
  - `react-native-maps@latest` (if google selected)
- Store selections in manifest (automatic via existing logic)
- Ensure idempotency (use `installedPackages` Set to avoid duplicates)

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Run `rns init`, select map/location services, verify dependencies installed in `package.json`

## [x] 41) Camera / Media as Init Options (Phase 1: Dependencies Only)

Convert camera/media plugin category to init options. **Phase 1**: Install dependencies only. **Phase 2**: Infrastructure and code generation (future).

Users can select media capabilities during `rns init`:
- `media.camera` (Camera access - basic camera functionality)
- `media.vision-camera` (Vision Camera - advanced camera with frame processing, Bare target only)
- `media.picker` (Image/Media picker - select images/videos from device)

**Note:** `vision-camera` is Bare-only (requires native modules). For Expo, use `media.camera` instead.

Implementation rules (Phase 1):
- Add to `InitInputs.selectedOptions` interface: `media?: { camera?: boolean; visionCamera?: boolean; picker?: boolean }`
- Add to `collectInitInputs()` prompt logic with target-aware filtering:
  - Expo target: Show `camera` and `picker` options (hide `visionCamera`)
  - Bare target: Show all three options
- Install dependencies in `installCoreDependencies()` when selected:
  - `expo-camera@latest` (if camera selected, Expo target)
  - `react-native-vision-camera@latest` (if visionCamera selected, Bare target only)
  - `expo-image-picker@latest` (if picker selected, Expo target)
  - `react-native-image-picker@latest` (if picker selected, Bare target)
- Store selections in manifest (automatic via existing logic)
- Ensure idempotency (use `installedPackages` Set to avoid duplicates)

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Run `rns init`, select media capabilities, verify dependencies installed in `package.json`

## [x] 42) Payments as Init Options (Phase 1: Dependencies Only)

Convert payments plugin category to init options. **Phase 1**: Install dependencies only. **Phase 2**: Infrastructure and code generation (future).

Users can select payment providers during `rns init`:
- `pay.stripe` (Stripe)

Implementation rules (Phase 1):
- Add to `InitInputs.selectedOptions` interface: `payments?: { stripe?: boolean }`
- Add to `collectInitInputs()` prompt logic (works for Expo and Bare)
- Install dependencies in `installCoreDependencies()` when selected:
  - `@stripe/stripe-react-native@latest`
- Store selections in manifest (automatic via existing logic)
- Ensure idempotency (use `installedPackages` Set to avoid duplicates)

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Run `rns init`, select Stripe, verify dependencies installed in `package.json`

## [x] 43) Subscriptions / IAP as Init Options (Phase 1: Dependencies Only)

Convert subscriptions/IAP plugin category to init options. **Phase 1**: Install dependencies only. **Phase 2**: Infrastructure and code generation (future).

Users can select IAP providers during `rns init` (single-select - only one provider can be selected):
- `iap.revenuecat` (RevenueCat - subscription management platform)
- `iap.adapty` (Adapty - subscription management platform)
- `iap.app-store` (App Store IAP - native iOS in-app purchases)
- `iap.play-billing` (Google Play Billing - native Android in-app purchases)

**Note:** This is a single-slot category. The prompt must enforce single selection (only one IAP provider can be selected).

Implementation rules (Phase 1):
- Add to `InitInputs.selectedOptions` interface: `iap?: { revenuecat?: boolean; adapty?: boolean; appStore?: boolean; playBilling?: boolean }`
- Add to `collectInitInputs()` prompt logic (single-select - enforce only one selection in prompt UI)
- Install dependencies in `installCoreDependencies()` when selected:
  - `react-native-purchases@latest` (if revenuecat selected)
  - `adapty-react-native@latest` (if adapty selected)
  - `react-native-iap@latest` (if appStore or playBilling selected)
- Store selections in manifest (automatic via existing logic)
- Ensure idempotency (use `installedPackages` Set to avoid duplicates)

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Run `rns init`, select IAP provider, verify dependencies installed in `package.json`

## [x] 44) Analytics / Observability as Init Options (Phase 1: Dependencies Only)

Convert analytics/observability plugin category to init options. **Phase 1**: Install dependencies only. **Phase 2**: Infrastructure and code generation (future).

Users can select analytics/observability services during `rns init`:
- `analytics.firebase` (Firebase Analytics)
- `analytics.amplitude` (Amplitude)
- `obs.sentry` (Sentry)
- `obs.bugsnag` (Bugsnag)

Implementation rules (Phase 1):
- Add to `InitInputs.selectedOptions` interface: `analytics?: { firebase?: boolean; amplitude?: boolean; sentry?: boolean; bugsnag?: boolean }`
- Add to `collectInitInputs()` prompt logic (multi-select, all work for Expo and Bare)
- Install dependencies in `installCoreDependencies()` when selected:
  - `@react-native-firebase/analytics@latest` (if firebase selected)
  - `@amplitude/analytics-react-native@latest` (if amplitude selected)
  - `@sentry/react-native@latest` (if sentry selected)
  - `@bugsnag/react-native@latest` (if bugsnag selected)
- Store selections in manifest (automatic via existing logic)
- Ensure idempotency (use `installedPackages` Set to avoid duplicates)

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Run `rns init`, select analytics/observability services, verify dependencies installed in `package.json`

## [x] 45) Search as Init Options (Phase 1: Dependencies Only)

Convert search plugin category to init options. **Phase 1**: Install dependencies only. **Phase 2**: Infrastructure and code generation (future).

Users can select search services during `rns init`:
- `search.algolia` (Algolia - cloud search service)
- `search.local-index` (Local search index - client-side full-text search)

Implementation rules (Phase 1):
- Add to `InitInputs.selectedOptions` interface: `search?: { algolia?: boolean; localIndex?: boolean }`
- Add to `collectInitInputs()` prompt logic (multi-select, all work for Expo and Bare)
- Install dependencies in `installCoreDependencies()` when selected:
  - `algoliasearch-react-native@latest` (if algolia selected)
  - `lunr@latest` (if localIndex selected - cross-platform full-text search library)
- Store selections in manifest (automatic via existing logic)
- Ensure idempotency (use `installedPackages` Set to avoid duplicates)

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Run `rns init`, select search services, verify dependencies installed in `package.json`

## [x] 46) OTA Updates as Init Options (Phase 1: Dependencies Only)

Convert OTA Updates plugin category to init options. **Phase 1**: Install dependencies only. **Phase 2**: Infrastructure and code generation (future).

Users can select OTA update provider during `rns init` (single option):
- `ota.expo-updates` (Expo Updates - works for both Expo and Bare targets)

**Note:** CodePush (`react-native-code-push`) is archived and has broken Android Gradle; OTA uses Expo Updates only.

Implementation rules (Phase 1):
- Add to `InitInputs.selectedOptions` interface: `ota?: { expoUpdates?: boolean; codePush?: boolean }` (codePush kept for manifest backward compatibility, not offered in UI)
- In `collectInitInputs()`: single OTA choice "Expo Updates"; set `expoUpdates: true` when selected
- Install in `installCoreDependencies()` when OTA selected: `expo-updates@latest` (both Expo and Bare)
- Store selections in manifest (automatic via existing logic)
- Ensure idempotency (use `installedPackages` Set to avoid duplicates)

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Run `rns init`, select OTA provider, verify dependencies installed in `package.json`

## [x] 47) Background Tasks as Init Options (Phase 1: Dependencies Only)

Convert background tasks plugin category to init options. **Phase 1**: Install dependencies only. **Phase 2**: Infrastructure and code generation (future).

Users can select background task capabilities during `rns init`:
- `background.tasks` (Background tasks - general background processing)
- `background.geofencing` (Geofencing - location-based triggers)
- `background.fetch` (Background fetch - periodic data sync)

**Note:** Background task implementation varies by platform. Phase 2 will add platform-specific setup and task handlers.

Implementation rules (Phase 1):
- Add to `InitInputs.selectedOptions` interface: `background?: { tasks?: boolean; geofencing?: boolean; fetch?: boolean }`
- Add to `collectInitInputs()` prompt logic (multi-select, all work for Expo and Bare)
- Install dependencies in `installCoreDependencies()` when selected:
  - `react-native-background-actions@latest` (if tasks selected)
  - `react-native-geolocation-service@latest` (if geofencing selected)
  - `react-native-background-fetch@latest` (if fetch selected)
- Store selections in manifest (automatic via existing logic)
- Ensure idempotency (use `installedPackages` Set to avoid duplicates)

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Run `rns init`, select background tasks, verify dependencies installed in `package.json`

## [x] 48) Privacy & Consent as Init Options (Phase 1: Dependencies Only)

Convert privacy & consent plugin category to init options. **Phase 1**: Install dependencies only. **Phase 2**: Infrastructure and code generation (future).

Users can select privacy/consent capabilities during `rns init`:
- `privacy.att` (App Tracking Transparency - iOS ATT framework)
- `privacy.consent` (Consent management - user consent dialogs and preferences)
- `privacy.gdpr` (GDPR compliance - data privacy utilities)

**Note:** Consent and GDPR features typically require custom implementation. Phase 2 will add hooks and utilities for consent management.

Implementation rules (Phase 1):
- Add to `InitInputs.selectedOptions` interface: `privacy?: { att?: boolean; consent?: boolean; gdpr?: boolean }`
- Add to `collectInitInputs()` prompt logic (multi-select, all work for Expo and Bare)
- Install dependencies in `installCoreDependencies()` when selected:
  - `react-native-tracking-transparency@latest` (if att selected, iOS only)
  - `@react-native-async-storage/async-storage@latest` (if consent or gdpr selected, for storing consent preferences)
- Store selections in manifest (automatic via existing logic)
- Ensure idempotency (use `installedPackages` Set to avoid duplicates)

**Note:** Consent and GDPR management typically require custom business logic. Phase 2 will add infrastructure hooks; developers will implement consent flows based on their requirements.

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Run `rns init`, select privacy/consent capabilities, verify dependencies installed in `package.json`

## [x] 49) Device / Hardware as Init Options (Phase 1: Dependencies Only)

Convert device/hardware plugin category to init options. **Phase 1**: Install dependencies only. **Phase 2**: Infrastructure and code generation (future).

Users can select device/hardware capabilities during `rns init`:
- `device.biometrics` (Biometric authentication - Face ID, Touch ID, fingerprint)
- `device.bluetooth` (Bluetooth - device communication)

Implementation rules (Phase 1):
- Add to `InitInputs.selectedOptions` interface: `device?: { biometrics?: boolean; bluetooth?: boolean }`
- Add to `collectInitInputs()` prompt logic (multi-select, all work for Expo and Bare)
- Install dependencies in `installCoreDependencies()` when selected:
  - `expo-local-authentication@latest` (if biometrics selected, Expo target)
  - `react-native-biometrics@latest` (if biometrics selected, Bare target)
  - `react-native-bluetooth-classic@latest` (if bluetooth selected, for classic Bluetooth)
  - `react-native-ble-plx@latest` (if bluetooth selected, for BLE - Bluetooth Low Energy)
- Store selections in manifest (automatic via existing logic)
- Ensure idempotency (use `installedPackages` Set to avoid duplicates)

**Note:** Bluetooth implementation may require both classic and BLE packages depending on use case. Phase 2 will clarify which package(s) to use based on specific requirements.

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Run `rns init`, select device/hardware capabilities, verify dependencies installed in `package.json`

## [x] 50) Testing as Init Options (Phase 1: Dependencies Only)

Convert testing plugin category to init options. **Phase 1**: Install dependencies only. **Phase 2**: Infrastructure and code generation (future).

Users can select testing frameworks during `rns init`:
- `test.detox` (Detox E2E testing)

Implementation rules (Phase 1):
- Add to `InitInputs.selectedOptions` interface: `testing?: { detox?: boolean }`
- Add to `collectInitInputs()` prompt logic (works for Expo and Bare)
- Install dependencies in `installCoreDependencies()` when selected (dev dependencies):
  - `detox@latest` (dev dependency)
- Store selections in manifest (automatic via existing logic)
- Ensure idempotency (use `installedPackages` Set to avoid duplicates)

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Run `rns init`, select testing framework, verify dependencies installed in `package.json`

---

# Phase 2: Infrastructure & Code Generation

## [x] 51) State Management as Init Options (Phase 2: Infrastructure & Code Generation)

**Prerequisites:** Section 31 (Phase 1) must be completed.

Generate infrastructure and example code for selected state management libraries. This includes hooks, stores, and integration into the app structure.

Implementation rules:
- For `state.zustand`:
  - Generate `src/state/zustand/stores/session.ts`, `settings.ts`, `ui.ts` (example stores)
  - Generate `src/state/zustand.ts` (re-export file)
  - Configure persistence using `react-native-mmkv` (if storage.mmkv is selected)
  - Add Zustand provider to System Zone if needed (or use marker-based injection)
- For `state.xstate`:
  - Generate `src/state/xstate/machines/` directory with example state machine
  - Generate `src/state/xstate.ts` (re-export file)
  - Add XState provider/hooks setup
- For `state.mobx`:
  - Generate `src/state/mobx/stores/` directory with example MobX store
  - Generate `src/state/mobx.ts` (re-export file)
  - Configure MobX provider setup
- All state management code must be in User Zone (`src/state/**`)
- Use marker-based injection for providers if needed
- Follow hybrid hooks pattern: core logic in System Zone, convenience re-exports in User Zone

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Generate project with state management options, verify stores/hooks are generated and functional

## [x] 52) Data Fetching / Cache as Init Options (Phase 2: Infrastructure & Code Generation)

**Prerequisites:** Section 32 (Phase 1) must be completed.

Generate infrastructure and example code for selected data fetching libraries. This includes query clients, hooks, and example usage patterns.

Implementation rules:
- For `data.reactQuery`:
  - Generate `src/data/react-query/client.ts` (QueryClient configuration)
  - Generate `src/data/react-query/hooks/` (example query hooks)
  - Generate `src/data/react-query.ts` (re-export file)
  - Add QueryClientProvider to App.tsx via marker-based injection
- For `data.apollo`:
  - Generate `src/data/apollo/client.ts` (Apollo Client configuration)
  - Generate `src/data/apollo/hooks/` (example GraphQL hooks/queries)
  - Generate `src/data/apollo.ts` (re-export file)
  - Add ApolloProvider to App.tsx via marker-based injection
- For `data.swr`:
  - Generate `src/data/swr/config.ts` (SWR configuration)
  - Generate `src/data/swr/hooks/` (example SWR hooks)
  - Generate `src/data/swr.ts` (re-export file)
  - Add SWRConfig provider to App.tsx via marker-based injection
- All data fetching code must be in User Zone (`src/data/**`)
- Use marker-based injection for providers
- Include example queries/hooks that demonstrate usage

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Generate project with data fetching options, verify clients/hooks are generated and functional

## [x] 53) Network Transport as Init Options (Phase 2: Infrastructure & Code Generation)

**Prerequisites:** Section 33 (Phase 1) must be completed.

Generate infrastructure and utilities for selected transport libraries. This includes client configurations, interceptors, and helper functions.

Implementation rules:
- For `transport.axios`:
  - Generate `src/transport/axios/client.ts` (Axios instance with base config)
  - Generate `src/transport/axios/interceptors.ts` (request/response interceptors)
  - Generate `src/transport/axios.ts` (re-export file)
- For `transport.websocket`:
  - Generate `src/transport/websocket/client.ts` (WebSocket client wrapper with reconnection)
  - Generate `src/transport/websocket/hooks/useWebSocket.ts` (React hook for WebSocket)
  - Generate `src/transport/websocket.ts` (re-export file)
- For `transport.firebase`:
  - Generate `src/transport/firebase/config.ts` (Firebase initialization)
  - Generate `src/transport/firebase/services/` (example Firebase service wrappers)
  - Generate `src/transport/firebase.ts` (re-export file)
- All transport code must be in User Zone (`src/transport/**`)
- Include error handling and retry logic where appropriate
- Provide TypeScript types for all utilities

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Generate project with transport options, verify clients are generated and functional

## [x] 54) Auth as Init Options (Phase 2: Infrastructure & Code Generation)

**Prerequisites:** Section 34 (Phase 1) must be completed.

Generate infrastructure and authentication flows for selected auth providers. This includes auth contexts, hooks, and example screens.

Implementation rules:
- For `auth.firebase`:
  - Generate `src/auth/firebase/context.tsx` (Firebase Auth context)
  - Generate `src/auth/firebase/hooks/useAuth.ts` (authentication hook)
  - Generate `src/auth/firebase/services/authService.ts` (auth service wrapper)
  - Generate `src/auth/firebase.ts` (re-export file)
  - Add Firebase Auth provider to App.tsx via marker-based injection
- For `auth.cognito`:
  - Generate `src/auth/cognito/context.tsx` (Cognito Auth context)
  - Generate `src/auth/cognito/hooks/useAuth.ts` (authentication hook)
  - Generate `src/auth/cognito/services/authService.ts` (Cognito service wrapper)
  - Generate `src/auth/cognito.ts` (re-export file)
  - Add Cognito Auth provider to App.tsx via marker-based injection
- For `auth.auth0`:
  - Generate `src/auth/auth0/context.tsx` (Auth0 context)
  - Generate `src/auth/auth0/hooks/useAuth.ts` (authentication hook)
  - Generate `src/auth/auth0/services/authService.ts` (Auth0 service wrapper)
  - Generate `src/auth/auth0.ts` (re-export file)
  - Add Auth0 provider to App.tsx via marker-based injection
- For `auth.customJwt`:
  - Generate `src/auth/jwt/context.tsx` (JWT Auth context)
  - Generate `src/auth/jwt/hooks/useAuth.ts` (authentication hook)
  - Generate `src/auth/jwt/services/tokenService.ts` (token storage/validation)
  - Generate `src/auth/jwt.ts` (re-export file)
  - Add JWT Auth provider to App.tsx via marker-based injection
- All auth code must be in User Zone (`src/auth/**`)
- Include example login/logout flows
- Provide secure token storage (use `react-native-keychain` if storage.secure is selected)

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Generate project with auth options, verify auth contexts/hooks are generated and functional

## [x] 55) AWS Services as Init Options (Phase 2: Infrastructure & Code Generation)

**Prerequisites:** Section 35 (Phase 1) must be completed.

Generate infrastructure and service wrappers for selected AWS services. This includes client configurations, hooks, and example usage patterns.

Implementation rules:
- For `aws.amplify`:
  - Generate `src/aws/amplify/config.ts` (Amplify configuration)
  - Generate `src/aws/amplify/services/` (example Amplify service wrappers)
  - Generate `src/aws/amplify.ts` (re-export file)
  - Initialize Amplify in System Zone runtime initialization
- For `aws.appsync`:
  - Generate `src/aws/appsync/client.ts` (AppSync GraphQL client)
  - Generate `src/aws/appsync/hooks/` (example GraphQL hooks)
  - Generate `src/aws/appsync.ts` (re-export file)
- For `aws.dynamodb`:
  - Generate `src/aws/dynamodb/client.ts` (DynamoDB client configuration)
  - Generate `src/aws/dynamodb/services/` (example DynamoDB service wrappers)
  - Generate `src/aws/dynamodb.ts` (re-export file)
- For `aws.s3`:
  - Generate `src/aws/s3/client.ts` (S3 client configuration)
  - Generate `src/aws/s3/services/uploadService.ts` (file upload utilities)
  - Generate `src/aws/s3.ts` (re-export file)
- All AWS code must be in User Zone (`src/aws/**`)
- Include error handling and retry logic
- Provide TypeScript types for all services

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Generate project with AWS options, verify services are generated and functional

## [x] 56) Storage as Init Options (Phase 2: Infrastructure & Code Generation)

**Prerequisites:** Section 36 (Phase 1) must be completed.

Generate infrastructure and storage utilities for selected storage libraries. This includes storage services, hooks, and integration with state management.

Implementation rules:
- For `storage.mmkv`:
  - Generate `src/storage/mmkv/storage.ts` (MMKV storage service, use exact implementation from `deprecated_docs/generated_project_reference/src/infra/storage/mmkv.ts`)
  - Generate `src/storage/mmkv/hooks/useStorage.ts` (React hook for MMKV)
  - Generate `src/storage/mmkv.ts` (re-export file)
  - Use exact version from deprecated docs reference
- For `storage.sqlite`:
  - Generate `src/storage/sqlite/database.ts` (SQLite database setup)
  - Generate `src/storage/sqlite/services/` (example database service wrappers)
  - Generate `src/storage/sqlite.ts` (re-export file)
- For `storage.secure`:
  - Generate `src/storage/secure/keychain.ts` (Keychain service wrapper)
  - Generate `src/storage/secure/hooks/useSecureStorage.ts` (React hook for secure storage)
  - Generate `src/storage/secure.ts` (re-export file)
- For `storage.filesystem`:
  - Generate `src/storage/filesystem/fileService.ts` (file system utilities)
  - Generate `src/storage/filesystem/hooks/useFileSystem.ts` (React hook for file operations)
  - Generate `src/storage/filesystem.ts` (re-export file)
- All storage code must be in User Zone (`src/storage/**`)
- Integrate with state management persistence (e.g., Zustand + MMKV)
- Provide TypeScript types for all storage interfaces

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Generate project with storage options, verify storage services are generated and functional

## [x] 57) Firebase Products as Init Options (Phase 2: Infrastructure & Code Generation)

**Prerequisites:** Section 37 (Phase 1) must be completed.

Generate infrastructure and service wrappers for selected Firebase products. This includes Firebase initialization, service configurations, and example usage patterns.

Implementation rules:
- For `firebase.firestore`:
  - Generate `src/firebase/firestore/services/` (Firestore service wrappers)
  - Generate `src/firebase/firestore/hooks/` (example Firestore hooks)
  - Generate `src/firebase/firestore.ts` (re-export file)
- For `firebase.realtime`:
  - Generate `src/firebase/realtime/services/` (Realtime Database service wrappers)
  - Generate `src/firebase/realtime/hooks/` (example Realtime Database hooks)
  - Generate `src/firebase/realtime.ts` (re-export file)
- For `firebase.storage`:
  - Generate `src/firebase/storage/services/uploadService.ts` (Firebase Storage upload utilities)
  - Generate `src/firebase/storage.ts` (re-export file)
- For `firebase.functions`:
  - Generate `src/firebase/functions/services/` (Cloud Functions service wrappers)
  - Generate `src/firebase/functions.ts` (re-export file)
- All Firebase code must be in User Zone (`src/firebase/**`)
- Initialize Firebase in System Zone runtime initialization (if not already done via transport.firebase)
- Include error handling and offline support where applicable
- Provide TypeScript types for all services

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Generate project with Firebase options, verify services are generated and functional

## [x] 58) Offline-first as Init Options (Phase 2: Infrastructure & Code Generation)

**Prerequisites:** Section 38 (Phase 1) must be completed.

Generate infrastructure for offline-first capabilities. This includes network detection, offline queues, and sync managers.

Implementation rules:
- For `offline.netinfo`:
  - Generate `src/offline/netinfo/hooks/useNetworkStatus.ts` (network status hook)
  - Generate `src/offline/netinfo/context.tsx` (NetworkInfo context provider)
  - Generate `src/offline/netinfo.ts` (re-export file)
  - Add NetworkInfo provider to App.tsx via marker-based injection
- For `offline.outbox`:
  - Generate `src/offline/outbox/queue.ts` (offline queue implementation)
  - Generate `src/offline/outbox/services/outboxService.ts` (outbox service)
  - Generate `src/offline/outbox.ts` (re-export file)
  - Integrate with selected storage solution for persistence
- For `offline.sync`:
  - Generate `src/offline/sync/syncManager.ts` (sync manager implementation)
  - Generate `src/offline/sync/hooks/useSync.ts` (sync hook)
  - Generate `src/offline/sync.ts` (re-export file)
  - Integrate with data fetching libraries (react-query, apollo, swr) for automatic sync
- All offline code must be in User Zone (`src/offline/**`)
- Provide TypeScript types for all offline utilities
- Include example usage patterns for offline-first flows

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Generate project with offline options, verify offline infrastructure is generated and functional

## [x] 59) Notifications as Init Options (Phase 2: Infrastructure & Code Generation)

**Prerequisites:** Section 39 (Phase 1) must be completed.

Generate infrastructure and notification handlers for selected notification providers. This includes notification services, hooks, and permission handling.

Implementation rules:
- For `notify.expo`:
  - Generate `src/notifications/expo/service.ts` (Expo Notifications service)
  - Generate `src/notifications/expo/hooks/useNotifications.ts` (notifications hook)
  - Generate `src/notifications/expo/handlers/` (notification handlers)
  - Generate `src/notifications/expo.ts` (re-export file)
  - Register notification handlers in System Zone runtime initialization
- For `notify.fcm`:
  - Generate `src/notifications/fcm/service.ts` (FCM service)
  - Generate `src/notifications/fcm/hooks/useNotifications.ts` (notifications hook)
  - Generate `src/notifications/fcm/handlers/` (FCM message handlers)
  - Generate `src/notifications/fcm.ts` (re-export file)
  - Register FCM handlers in System Zone runtime initialization
- For `notify.onesignal`:
  - Generate `src/notifications/onesignal/service.ts` (OneSignal service)
  - Generate `src/notifications/onesignal/hooks/useNotifications.ts` (notifications hook)
  - Generate `src/notifications/onesignal.ts` (re-export file)
  - Initialize OneSignal in System Zone runtime initialization
- All notification code must be in User Zone (`src/notifications/**`)
- Include permission request utilities
- Provide TypeScript types for all notification services
- Handle foreground/background notification scenarios

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Generate project with notification options, verify notification services are generated and functional

## [x] 60) Maps / Location as Init Options (Phase 2: Infrastructure & Code Generation)

**Prerequisites:** Section 40 (Phase 1) must be completed.

Generate infrastructure and map components for selected map/location services. This includes location services, map components, and hooks.

Implementation rules:
- For `geo.location`:
  - Generate `src/geo/location/service.ts` (geolocation service)
  - Generate `src/geo/location/hooks/useLocation.ts` (location hook)
  - Generate `src/geo/location.ts` (re-export file)
  - Include permission handling for location access
- For `maps.mapbox`:
  - Generate `src/maps/mapbox/components/MapView.tsx` (Mapbox map component)
  - Generate `src/maps/mapbox/services/` (Mapbox service utilities)
  - Generate `src/maps/mapbox.ts` (re-export file)
- For `maps.google`:
  - Generate `src/maps/google/components/MapView.tsx` (Google Maps component)
  - Generate `src/maps/google/services/` (Google Maps service utilities)
  - Generate `src/maps/google.ts` (re-export file)
- All maps/location code must be in User Zone (`src/geo/**`, `src/maps/**`)
- Include example screens demonstrating map usage
- Provide TypeScript types for all map/location utilities
- Handle platform-specific configurations (iOS/Android)

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Generate project with maps/location options, verify map components and services are generated and functional

## [x] 61) Camera / Media as Init Options (Phase 2: Infrastructure & Code Generation)

**Prerequisites:** Section 41 (Phase 1) must be completed.

Generate infrastructure and media components for selected camera/media capabilities. This includes camera components, media pickers, and hooks.

Implementation rules:
- For `media.camera`:
  - Generate `src/media/camera/components/CameraView.tsx` (camera component)
  - Generate `src/media/camera/hooks/useCamera.ts` (camera hook)
  - Generate `src/media/camera.ts` (re-export file)
  - Include permission handling for camera access
- For `media.visionCamera`:
  - Generate `src/media/vision-camera/components/CameraView.tsx` (Vision Camera component)
  - Generate `src/media/vision-camera/hooks/useFrameProcessor.ts` (frame processor hook)
  - Generate `src/media/vision-camera.ts` (re-export file)
  - Include example frame processors
- For `media.picker`:
  - Generate `src/media/picker/service.ts` (media picker service)
  - Generate `src/media/picker/hooks/useMediaPicker.ts` (media picker hook)
  - Generate `src/media/picker.ts` (re-export file)
- All media code must be in User Zone (`src/media/**`)
- Include example screens demonstrating camera/media usage
- Provide TypeScript types for all media utilities
- Handle platform-specific configurations (iOS/Android)

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Generate project with camera/media options, verify camera components and services are generated and functional

## [x] 62) Payments as Init Options (Phase 2: Infrastructure & Code Generation)

**Prerequisites:** Section 42 (Phase 1) must be completed.

Generate infrastructure and payment service wrappers for selected payment providers. This includes payment services, hooks, and example payment flows.

Implementation rules:
- For `pay.stripe`:
  - Generate `src/payments/stripe/service.ts` (Stripe service)
  - Generate `src/payments/stripe/hooks/useStripe.ts` (Stripe hook)
  - Generate `src/payments/stripe/components/` (Stripe payment components if applicable)
  - Generate `src/payments/stripe.ts` (re-export file)
- For `pay.apple`:
  - Generate `src/payments/apple/service.ts` (Apple Pay service)
  - Generate `src/payments/apple/hooks/useApplePay.ts` (Apple Pay hook)
  - Generate `src/payments/apple.ts` (re-export file)
- For `pay.google`:
  - Generate `src/payments/google/service.ts` (Google Pay service)
  - Generate `src/payments/google/hooks/useGooglePay.ts` (Google Pay hook)
  - Generate `src/payments/google.ts` (re-export file)
- All payment code must be in User Zone (`src/payments/**`)
- Include example payment flow screens
- Provide TypeScript types for all payment services
- Handle platform-specific payment methods (iOS/Android)
- Include error handling and payment status management

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Generate project with payment options, verify payment services are generated and functional

## [x] 63) Subscriptions / IAP as Init Options (Phase 2: Infrastructure & Code Generation)

**Prerequisites:** Section 43 (Phase 1) must be completed.

Generate infrastructure and IAP service wrappers for selected subscription/IAP providers. This includes IAP services, hooks, and subscription management.

Implementation rules:
- For `iap.revenuecat`:
  - Generate `src/iap/revenuecat/service.ts` (RevenueCat service)
  - Generate `src/iap/revenuecat/hooks/useIAP.ts` (IAP hook)
  - Generate `src/iap/revenuecat/services/subscriptionService.ts` (subscription management)
  - Generate `src/iap/revenuecat.ts` (re-export file)
- For `iap.apple`:
  - Generate `src/iap/apple/service.ts` (Apple IAP service)
  - Generate `src/iap/apple/hooks/useIAP.ts` (IAP hook)
  - Generate `src/iap/apple.ts` (re-export file)
- For `iap.google`:
  - Generate `src/iap/google/service.ts` (Google Play Billing service)
  - Generate `src/iap/google/hooks/useIAP.ts` (IAP hook)
  - Generate `src/iap/google.ts` (re-export file)
- All IAP code must be in User Zone (`src/iap/**`)
- Include subscription status management and restoration
- Provide TypeScript types for all IAP services
- Handle platform-specific IAP flows (iOS/Android)
- Include receipt validation and subscription verification

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Generate project with IAP options, verify IAP services are generated and functional

## [x] 64) Analytics / Observability as Init Options (Phase 2: Infrastructure & Code Generation)

**Prerequisites:** Section 44 (Phase 1) must be completed.

Generate infrastructure and analytics service wrappers for selected analytics providers. This includes analytics services, hooks, and event tracking utilities.

Implementation rules:
- For `analytics.firebase`:
  - Generate `src/analytics/firebase/service.ts` (Firebase Analytics service)
  - Generate `src/analytics/firebase/hooks/useAnalytics.ts` (analytics hook)
  - Generate `src/analytics/firebase.ts` (re-export file)
- For `analytics.mixpanel`:
  - Generate `src/analytics/mixpanel/service.ts` (Mixpanel service)
  - Generate `src/analytics/mixpanel/hooks/useAnalytics.ts` (analytics hook)
  - Generate `src/analytics/mixpanel.ts` (re-export file)
- For `analytics.amplitude`:
  - Generate `src/analytics/amplitude/service.ts` (Amplitude service)
  - Generate `src/analytics/amplitude/hooks/useAnalytics.ts` (analytics hook)
  - Generate `src/analytics/amplitude.ts` (re-export file)
- For `analytics.sentry`:
  - Generate `src/analytics/sentry/config.ts` (Sentry configuration)
  - Generate `src/analytics/sentry/service.ts` (Sentry error tracking service)
  - Generate `src/analytics/sentry.ts` (re-export file)
  - Initialize Sentry in System Zone runtime initialization
- All analytics code must be in User Zone (`src/analytics/**`)
- Provide unified analytics interface/abstraction if multiple providers are selected
- Include example event tracking patterns
- Provide TypeScript types for all analytics services

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Generate project with analytics options, verify analytics services are generated and functional

## [x] 65) Search as Init Options (Phase 2: Infrastructure & Code Generation)

**Prerequisites:** Section 45 (Phase 1) must be completed.

Generate infrastructure and search service wrappers for selected search providers. This includes search services, hooks, and search UI components.

Implementation rules:
- For `search.algolia`:
  - Generate `src/search/algolia/service.ts` (Algolia search service)
  - Generate `src/search/algolia/hooks/useSearch.ts` (search hook)
  - Generate `src/search/algolia/components/SearchBar.tsx` (search UI component)
  - Generate `src/search/algolia.ts` (re-export file)
- For `search.elastic`:
  - Generate `src/search/elastic/service.ts` (Elasticsearch service)
  - Generate `src/search/elastic/hooks/useSearch.ts` (search hook)
  - Generate `src/search/elastic.ts` (re-export file)
- For `search.local`:
  - Generate `src/search/local/service.ts` (local search service using Lunr)
  - Generate `src/search/local/hooks/useSearch.ts` (search hook)
  - Generate `src/search/local.ts` (re-export file)
- All search code must be in User Zone (`src/search/**`)
- Include example search screens/components
- Provide TypeScript types for all search services
- Handle search indexing and query patterns

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Generate project with search options, verify search services are generated and functional

## [x] 66) OTA Updates as Init Options (Phase 2: Infrastructure & Code Generation)

**Prerequisites:** Section 46 (Phase 1) must be completed.

Generate infrastructure and update management for selected OTA update providers. This includes update services, hooks, and update checking logic.

Implementation rules:
- For `ota.expoUpdates`:
  - Generate `src/ota/expo-updates/service.ts` (Expo Updates service)
  - Generate `src/ota/expo-updates/hooks/useOTA.ts` (OTA update hook)
  - Generate `src/ota/expo-updates.ts` (re-export file)
  - Configure Expo Updates in `app.json` or `app.config.js` (System Zone)
- OTA uses Expo Updates only (CodePush deprecated). Generate `src/ota/expo-updates/` when `ota.expoUpdates`; no CodePush code generation.
- All OTA code must be in User Zone (`src/ota/**`)
- Include update checking and installation logic
- Provide TypeScript types for all OTA services
- Handle update prompts and user consent

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Generate project with OTA options, verify OTA services are generated and functional

## [x] 67) Background Tasks as Init Options (Phase 2: Infrastructure & Code Generation)

**Prerequisites:** Section 47 (Phase 1) must be completed.

Generate infrastructure and task handlers for selected background task capabilities. This includes background task services, hooks, and platform-specific configurations.

Implementation rules:
- For `background.tasks`:
  - Generate `src/background/tasks/service.ts` (background task service)
  - Generate `src/background/tasks/hooks/useBackgroundTask.ts` (background task hook)
  - Generate `src/background/tasks/handlers/` (example task handlers)
  - Generate `src/background/tasks.ts` (re-export file)
  - Configure background task permissions via Patch Operations (System Zone)
- For `background.geofencing`:
  - Generate `src/background/geofencing/service.ts` (geofencing service)
  - Generate `src/background/geofencing/hooks/useGeofencing.ts` (geofencing hook)
  - Generate `src/background/geofencing.ts` (re-export file)
  - Configure location permissions via Patch Operations (System Zone)
- For `background.fetch`:
  - Generate `src/background/fetch/service.ts` (background fetch service)
  - Generate `src/background/fetch/hooks/useBackgroundFetch.ts` (background fetch hook)
  - Generate `src/background/fetch.ts` (re-export file)
  - Configure background fetch permissions via Patch Operations (System Zone)
- All background task code must be in User Zone (`src/background/**`)
- Include platform-specific implementations (iOS/Android)
- Provide TypeScript types for all background task services
- Handle task scheduling and lifecycle management

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Generate project with background task options, verify background task services are generated and functional

## [x] 68) Privacy & Consent as Init Options (Phase 2: Infrastructure & Code Generation)

**Prerequisites:** Section 48 (Phase 1) must be completed.

Generate infrastructure and consent management for selected privacy/consent capabilities. This includes consent services, hooks, and consent UI components.

Implementation rules:
- For `privacy.att`:
  - Generate `src/privacy/att/service.ts` (App Tracking Transparency service)
  - Generate `src/privacy/att/hooks/useATT.ts` (ATT permission hook)
  - Generate `src/privacy/att.ts` (re-export file)
  - Configure ATT permissions in `Info.plist` via Patch Operations (System Zone)
- For `privacy.consent`:
  - Generate `src/privacy/consent/service.ts` (consent management service)
  - Generate `src/privacy/consent/hooks/useConsent.ts` (consent hook)
  - Generate `src/privacy/consent/components/ConsentDialog.tsx` (consent UI component)
  - Generate `src/privacy/consent.ts` (re-export file)
  - Integrate with storage solution for consent preferences
- For `privacy.gdpr`:
  - Generate `src/privacy/gdpr/service.ts` (GDPR compliance service)
  - Generate `src/privacy/gdpr/hooks/useGDPR.ts` (GDPR hook)
  - Generate `src/privacy/gdpr/components/` (GDPR consent UI components)
  - Generate `src/privacy/gdpr.ts` (re-export file)
- All privacy code must be in User Zone (`src/privacy/**`)
- Include consent storage and retrieval
- Provide TypeScript types for all privacy services
- Handle consent revocation and data deletion requests

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Generate project with privacy options, verify privacy services are generated and functional

## [x] 69) Device / Hardware as Init Options (Phase 2: Infrastructure & Code Generation)

**Prerequisites:** Section 49 (Phase 1) must be completed.

Generate infrastructure and device service wrappers for selected device/hardware capabilities. This includes device services, hooks, and permission handling.

Implementation rules:
- For `device.biometrics`:
  - Generate `src/device/biometrics/service.ts` (biometric authentication service)
  - Generate `src/device/biometrics/hooks/useBiometrics.ts` (biometrics hook)
  - Generate `src/device/biometrics.ts` (re-export file)
  - Handle platform-specific biometric APIs (Face ID, Touch ID, fingerprint)
  - Configure biometric permissions via Patch Operations (System Zone)
- For `device.bluetooth`:
  - Generate `src/device/bluetooth/service.ts` (Bluetooth service)
  - Generate `src/device/bluetooth/hooks/useBluetooth.ts` (Bluetooth hook)
  - Generate `src/device/bluetooth/components/` (Bluetooth device scanning UI if applicable)
  - Generate `src/device/bluetooth.ts` (re-export file)
  - Handle both classic Bluetooth and BLE (Bluetooth Low Energy)
  - Configure Bluetooth permissions via Patch Operations (System Zone)
- All device code must be in User Zone (`src/device/**`)
- Include permission handling and device availability checks
- Provide TypeScript types for all device services
- Handle platform-specific implementations (iOS/Android)

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Generate project with device/hardware options, verify device services are generated and functional

## [x] 70) Testing as Init Options (Phase 2: Infrastructure & Code Generation)

**Prerequisites:** Section 50 (Phase 1) must be completed.

Generate test infrastructure and example tests for selected testing frameworks. This includes test configurations, example test files, and test utilities.

Implementation rules:
- For `testing.detox`:
  - Generate `e2e/` directory structure for Detox tests
  - Generate `e2e/config/` (Detox configuration files)
  - Generate `e2e/screens/` (example screen tests)
  - Generate `e2e/flows/` (example user flow tests)
  - Configure Detox in `package.json` scripts
  - Add Detox configuration files (`.detoxrc.js`, native configs) via Patch Operations (System Zone)
- All test code must be in User Zone (`e2e/**` or appropriate test directories)
- Include example test patterns and best practices
- Provide TypeScript types for test utilities
- Configure CI/CD integration for E2E tests

Verification:
- `npm run typecheck`
- `npm test`
- Manual test: Generate project with testing options, verify test infrastructure is generated and functional

## [x] 71) Refactor init.ts into Modular Structure

**Priority:** HIGH - File is 4,181 lines, causing maintainability and performance issues.

Refactor `src/lib/init.ts` into a modular directory structure to improve maintainability, readability, and IDE performance.

**Current Issues:**
- Single file with 4,181 lines
- Hard to navigate and maintain
- Risk of merge conflicts
- Poor IDE performance (freezing)
- Violates single responsibility principle

**Target Structure:**
```
src/lib/init/
├── index.ts                    # Main orchestration (runInit) - ~200 lines
├── types.ts                    # InitInputs, InitOptions interfaces
├── collect-inputs.ts           # collectInitInputs() - ~500 lines
├── install-dependencies.ts     # installCoreDependencies() - ~1000 lines
├── host-app.ts                 # createHostApp() - ~100 lines
├── navigation/
│   ├── index.ts                # Navigation setup orchestration
│   ├── preset.ts               # configureNavigationPreset()
│   ├── registry.ts             # generateNavigationRegistry()
│   ├── screens.ts              # generateExampleScreens()
│   └── files.ts                # attachNavigationPackageFiles()
├── i18n/
│   ├── index.ts                # I18n setup orchestration
│   ├── files.ts                # generateI18nFiles()
│   └── remove.ts               # removeI18nFilesIfNotSelected()
├── theme/
│   ├── index.ts                # Theme setup orchestration
│   ├── files.ts                # generateThemeFiles()
│   ├── hooks.ts                # generateHooks()
│   └── remove.ts               # removeThemeFilesIfNotSelected()
├── styling/
│   ├── index.ts                # Styling setup orchestration
│   ├── nativewind.ts           # NativeWind config
│   ├── unistyles.ts            # Unistyles config
│   ├── tamagui.ts              # Tamagui config
│   ├── restyle.ts              # Restyle config
│   ├── web.ts                  # React Native Web config
│   ├── styled-components.ts    # Styled Components config
│   ├── ui-kitten.ts            # UI Kitten config
│   └── paper.ts                # React Native Paper config
├── app-generation/
│   ├── app-tsx.ts              # generateAppTsxContent()
│   ├── app-js.ts               # generateAppJsContent()
│   └── expo-router.ts          # configureExpoRouter()
└── utils.ts                    # Helper functions (extractPackageName, etc.)
```

**Implementation Rules:**
- Extract modules incrementally (one at a time)
- Keep `init.ts` as main entry point initially, then migrate to `init/index.ts`
- Move functions to new modules maintaining exact behavior
- Update imports throughout codebase
- Ensure all tests still pass after each extraction
- Each file should be < 500 lines
- Maintain backward compatibility during transition

**Phases:**
1. **Phase 1:** Extract types and utilities (`types.ts`, `utils.ts`) - ✅ **COMPLETE**
2. **Phase 2:** Extract dependency installation (`install-dependencies.ts`) - ✅ **COMPLETE**
3. **Phase 3:** Extract navigation module (`navigation/`) - ✅ **COMPLETE**
4. **Phase 4:** Extract i18n module (`i18n/`) - ✅ **COMPLETE**
5. **Phase 5:** Extract theme module (`theme/`) - ✅ **COMPLETE**
6. **Phase 6:** Extract styling module (`styling/`) - ✅ **COMPLETE**
7. **Phase 7:** Extract app generation (`app-generation/`) - ✅ **COMPLETE**
8. **Phase 8:** Extract input collection (`collect-inputs.ts`) - ✅ **COMPLETE**
9. **Phase 9:** Extract host app creation (`host-app.ts`) - ✅ **COMPLETE**
10. **Phase 10:** Create main orchestration (`index.ts`) and deprecate old `init.ts` - ✅ **COMPLETE**

**Verification:**
- `npm run typecheck` passes
- `npm test` passes (all existing tests)
- Manual test: Run `rns init` and verify all functionality works identically
- No regressions in init pipeline
