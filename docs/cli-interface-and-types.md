<!--
FILE: docs/cli-interface-and-types.md
PURPOSE: Canonical schema + contract index for CliMobile (RNS).
         This doc defines the **names and meanings** of types/interfaces used across the CLI and generated apps.
OWNERSHIP: CLI
-->

# CLI Interfaces & Types (v3)

This document is the **single reference** for the platform's contract names and required shapes.

**Canonical Docs Contract:** This doc is part of the canonical, non-duplicated docs set (see `README.md` → Documentation).

**Rule:** Do not redefine the same schema in multiple docs.  
If a type is referenced by multiple docs, it must have one home here **and** one TS source file.

**Source-of-truth rule:** the authoritative definitions live in TypeScript.  
If code and this doc diverge, treat it as a bug and bring them back in sync.

**No duplication policy:** When adding new types or schemas:
- Define them here first (or reference the TS file location)
- Reference this doc from other docs; do not copy type definitions
- If a doc needs a type, link to this doc's section instead of redefining it

---

## 0) Core vocabulary

- **Base App**: the generated Expo/Bare project that boots immediately after `rns init`.
- **Plugin**: an installable capability that evolves an existing Base App.
- **System Zone**: `packages/@rns/**` + `.rns/**` (CLI-managed)
- **User Zone**: `src/**` (developer-owned; CLI must not rewrite)
- **Modulator**: the installation engine (plan/apply/remove).
- **Patch Operation**: an idempotent, declarative change to config/native files.
- **Runtime Contribution**: a declarative instruction for runtime wiring (providers/wrappers/init/bindings).

---

## 1) Source of truth (TypeScript)

The authoritative definitions live in code.

### 1.1 CLI contracts (Node side)

- `src/lib/types/common.ts` — shared enums/aliases (target, pm, platform, expo runtime)
- `src/lib/types/plugin.ts` — `PluginDescriptor`, support rules, dependencies, conflicts, patches
- `src/lib/types/manifest.ts` — `RnsProjectManifest`, installed plugin record, schema version
- `src/lib/types/permissions.ts` — permission requirements + provider catalog types
- `src/lib/types/runtime.ts` — runtime injection types (`RuntimeContribution`, `SymbolRef`)
- `src/lib/types/patch-ops.ts` — declarative patch ops (iOS/Android/Expo/text)
- `src/lib/types/dependencies.ts` — dependency installation types (`DependencySpec`, `DependencyScope`)
- `src/lib/types/modulator.ts` — modulator plan/apply contracts + phase interfaces
- `src/lib/types/doctor.ts` — doctor report types
- `src/lib/types/commands.ts` — command ids + exit codes
- `src/lib/types/planning.ts` — ownership/change/audit enums

**Template Pack System (implementation):**
- `src/lib/pack-locations.ts` — pack type definitions, location constants, path resolution
- `src/lib/pack-manifest.ts` — pack manifest structure and validation
- `src/lib/pack-discovery.ts` — pack discovery and resolution
- `src/lib/pack-variants.ts` — variant resolution logic

### 1.2 Runtime/app contracts (Generated app side)

These live in `packages/@rns/core` and are intentionally stable:

- `packages/@rns/core/src/contracts/*` — capability interfaces (Auth, Storage, HttpClient, etc.)
- `packages/@rns/core/src/contracts/rns-plugin.ts` — optional runtime lifecycle (`RnsPlugin`)
- `packages/@rns/core/src/index.ts` — export surface

---

## 2) Core CLI schema (names + intent)

This section is the “high-level design” index: what objects exist, which enums exist, and what each one means.

### 2.1 Targets and environments (enums/unions)

- **`RnsTarget`** — `'expo' | 'bare'`
- **`PlatformOS`** — `'ios' | 'android' | 'web'`
- **`PackageManager`** — `'pnpm' | 'npm' | 'yarn'`
- **`ExpoRuntime`** — `'expo-go' | 'dev-client' | 'standalone'`

### 2.2 Project state (manifest)

The project manifest (`.rns/rn-init.json`) is the single source of truth for what was generated and what is installed. Every CLI command (except `init`) must validate state before acting.

**Core Types:**
- **`RnsProjectManifest`** — single source of truth: identity + target + installed plugins + schema version
- **`RnsProjectIdentity`** — name/displayName/bundleId/packageName/version/build
- **`InstalledPluginRecord`** — installed plugin/module instance: id, version, options, owned files/dirs, timestamps
- **`ManifestSchemaVersion`** — schema version for `.rns/rn-init.json` (for migrations)
- **`ManifestValidationResult`** — validation result with errors/warnings/migration flag

**Manifest Structure:**
- `schemaVersion` — current schema version (for migrations)
- `cliVersion` — CLI version that generated this manifest
- `workspaceModel` — workspace model (Option A)
- `identity` — project identity information
- `target` — target platform (expo/bare)
- `language` — language (ts/js)
- `packageManager` — package manager (npm/pnpm/yarn)
- `reactNativeVersion` — React Native version
- `coreToggles` — CORE feature toggles from init
- `plugins` — installed plugins array
- `modules` — installed modules array
- `createdAt` — creation timestamp
- `updatedAt` — last update timestamp

**Behavior:**
- Validation: all manifests are validated on read (schema version, required fields)
- Migration: manifests with older schema versions are automatically migrated
- State check: `validateProjectInitialized()` must be called by all commands (except `init`)
- Updates: plugins/modules are added/removed via manifest functions

**Source of truth (TypeScript):**
- `src/lib/types/manifest.ts` — `RnsProjectManifest`, `RnsProjectIdentity`, `InstalledPluginRecord`, `ManifestSchemaVersion`
- `src/lib/manifest.ts` — manifest management (`readManifest`, `writeManifest`, `validateManifest`, `migrateManifest`, `validateProjectInitialized`)

**Rule:** Every CLI command (except `init`) must call `validateProjectInitialized()` before acting and refuse to run on non-initialized projects with an actionable message.

### 2.3 Plugin catalog (what a plugin is)

- **`PluginDescriptor`** — blueprint of a plugin: deps + support + conflicts + permissions + patch ops + runtime contributions.
- **`PluginId`** — stable plugin key like `"auth.firebase"`.

Useful taxonomy (for UI, presets, discoverability):
- **`PluginCategory`** — `"auth" | "storage" | "network" | "ui" | ..."`
- **`PluginTier`** — `"core" | "recommended" | "advanced"` (optional; UX only)

### 2.4 Compatibility + conflicts (slots)

- **`PluginSupport`** — what targets/platforms/runtime the plugin supports.
- **`SlotId`** — stable string id (e.g. `navigation.root`, `ui.framework`, `network.transport`)
- **`SlotMode`** — `'single' | 'multi'`
- **`SlotRule`** — `{ slot: SlotId; mode: SlotMode }`
- **`ConflictCheckResult`** — allowed or blocked + conflicts with reasons.

### 2.5 Permissions (IDs + mapping)

- **`PermissionId`** — canonical permission identifier (e.g. `camera`, `location.whenInUse`)
- **`PermissionRequirement`** — one permission unit with iOS/Android mapping + notes.
- **`PlatformPermissionSpec`** — iOS plist keys / Android manifest entries + rationale.
- **`PermissionsSummary`** — aggregated permissions required by currently installed plugins.

Permission provider UX tooling:
- **`PermissionPlugin`** — describes a permission SDK/provider (expo-camera, react-native-permissions, etc.)

Full catalog lives in: `docs/plugins-permissions.md`

### 2.6 Runtime contributions (wiring, symbol-based)

Runtime wiring enables plugins/modules to inject code into the app runtime via AST manipulation only. All wiring happens in SYSTEM ZONE (`packages/@rns/**`) and uses ts-morph for symbol-based injection (no regex, no raw code strings).

**Core Types:**
- **`SymbolRef`** — `{ symbol: string, source: string }` — symbol name and module source for AST-based injection
- **`RuntimeContribution`** — union type representing what a plugin/module adds:
  - `ImportContribution` — import statements (ordered)
  - `ProviderContribution` — provider wrapper components (ordered)
  - `InitStepContribution` — initialization function calls (ordered)
  - `RegistrationContribution` — registration calls (ordered)
  - `RootContribution` — root component replacement

**Wiring Operations:**
- **`RuntimeWiringOp`** — combines a contribution with its target marker location and capability ID
- **`RuntimeWiringResult`** — result of a wiring operation (success/skipped/error)

**Behavior:**
- Deterministic ordering: contributions are sorted by `order` (lower = earlier), then by capability ID
- Idempotency: duplicate injections are skipped based on injection markers
- SYSTEM ZONE only: validates files are in `packages/@rns/**` before wiring
- Backup: all file modifications are backed up under `.rns/backups/...`
- AST-based: uses ts-morph for all injections (imports, providers, init steps, registrations)

**Source of truth (TypeScript):**
- `src/lib/types/runtime.ts` — `RuntimeContribution`, `SymbolRef`, `RuntimeWiringOp`, `RuntimeWiringResult`
- `src/lib/runtime-wiring.ts` — AST-based wiring engine (`wireRuntimeContribution`, `wireRuntimeContributions`, `validateWiringOps`)

**Rule:** Runtime wiring must be symbol-based and AST-driven (ts-morph). No regex injection.

### 2.7 Patch operations (native/config, idempotent)

Patch operations enable plugins/modules to modify native configuration files and build scripts in a declarative, idempotent way. All patches are anchored, traceable, and backed up.

**Core Types:**
- **`PatchOp`** — union type for all patch operations
- **`ExpoConfigPatchOp`** — patches app.json/app.config.* (JSON path-based)
- **`PlistPatchOp`** — patches iOS Info.plist files (key-value pairs)
- **`EntitlementsPatchOp`** — patches iOS .entitlements files
- **`AndroidManifestPatchOp`** — patches AndroidManifest.xml (permissions/features/components)
- **`GradlePatchOp`** — patches build.gradle files (anchored text insertion)
- **`PodfilePatchOp`** — patches Podfile (anchored text insertion)
- **`TextAnchorPatchOp`** — generic anchored text patches

**Patch Results:**
- **`PatchOpResult`** — result of a patch operation (applied/skipped/error)

**Behavior:**
- Anchored: all patches use anchors (JSON paths, XML keys, text anchors) for precise targeting
- Idempotent: duplicate patches are skipped based on operationId markers
- Backup: all file modifications are backed up under `.rns/backups/...`
- Traceable: each patch includes capabilityId and operationId for tracking

**Source of truth (TypeScript):**
- `src/lib/types/patch-ops.ts` — `PatchOp`, `PatchOpResult`, and all patch operation types
- `src/lib/patch-ops.ts` — patch operations engine (`applyPatchOp`, `applyPatchOps`)

**Rule:** Patchers must be anchored, idempotent, and backed up under `.rns/backups/...`.

### 2.8 Dependency Layer (pm-aware)

The dependency layer is the only place allowed to install/remove dependencies. It guarantees deterministic installs, respects lockfile discipline, never mixes package managers, and provides clear error output.

**Core Types:**
- **`DependencySpec`** — `{ name, version }` — dependency specification
- **`DependencyScope`** — `'workspace' | 'host' | 'package:<name>'` — installation scope
- **`DependencyInstallOptions`** — installation options (scope, cwd, verbose, dryRun)
- **`DependencyInstallResult`** — installation result (success, action, error)
- **`PackageManagerDetectionResult`** — PM detection result with source and conflicts

**Behavior:**
- Lockfile discipline: never mixes package managers, validates no conflicting lockfiles
- PM detection: uses manifest first, falls back to lockfile detection, defaults to npm
- Deterministic installs: respects lockfiles, ensures consistent installs
- Clear errors: provides actionable error messages on failures
- Scope support: workspace (root), host (app), package (workspace package)

**Functions:**
- `detectPackageManager()` — detects PM from manifest or lockfiles
- `resolvePackageManager()` — resolves PM with override support
- `validateLockfileDiscipline()` — ensures no PM mixing
- `addRuntimeDependencies()` — installs runtime deps
- `addDevDependencies()` — installs dev deps
- `installDependencies()` — installs from lockfile

**Source of truth (TypeScript):**
- `src/lib/types/dependencies.ts` — `DependencySpec`, `DependencyScope`, `DependencyInstallOptions`, etc.
- `src/lib/types/common.ts` — `PackageManager` type
- `src/lib/dependencies.ts` — dependency layer (`addRuntimeDependencies`, `addDevDependencies`, `installDependencies`, etc.)

**Rule:** Plugins/modules must not run package-manager commands directly; they must go through the dependency layer for consistent behavior.

### 2.9 Template Pack System (CORE / Plugin / Module packs)

The template-pack system is the core mechanism for "dynamic attachment" into generated apps. It enables capabilities to scale without rewriting CORE.

- **`PackType`** — `'core' | 'plugin' | 'module'`
- **`PackDelivery`** — `'workspace' | 'user-code'`
- **`PackManifest`** — pack descriptor: id, type, delivery, supportedTargets, supportedLanguages, variantResolutionHints, defaultDestinationMapping
- **`DiscoveredPack`** — discovered pack with manifest and source path
- **`PackResolution`** — resolved pack with variant path, delivery, and destination
- **`VariantResolutionInputs`** — target, language, packType, normalizedOptionsKey

**Pack Type Rules:**
- **CORE packs** (`type: 'core'`): Always attached during init. Single pack at `templates/base/`. Delivery: `workspace`. Destination: `packages/@rns/<packId>`
- **Plugin packs** (`type: 'plugin'`): Installed via `rns plugin add`. Located at `templates/plugins/<pluginId>/`. Delivery: `workspace`. Destination: `packages/@rns/plugin-<pluginId>`
- **Module packs** (`type: 'module'`): Business feature scaffolds. Located at `templates/modules/<moduleId>/`. Delivery: `user-code`. Destination: `src/modules/<moduleId>`

**Variant Resolution:**
Packs support target/language variants via `variants/` directory structure:
- `variants/<target>/<language>/` (e.g., `variants/expo/ts/`)
- `variants/<target>-<language>/` (e.g., `variants/expo-ts/`)
- `variants/<target>/` or `variants/<language>/` (fallbacks)
- Root pack directory (if no variants exist)

**Ownership Rules:**
- CORE/Plugin packs → **System Zone** (CLI-managed, workspace packages)
- Module packs → **User Zone** (developer-owned business code)
- No duplication: variants are selected deterministically, same inputs → same output

**Source of truth (TypeScript):**
- `src/lib/pack-locations.ts` — pack type definitions, location constants, path resolution
- `src/lib/pack-manifest.ts` — manifest structure and validation
- `src/lib/pack-discovery.ts` — pack discovery and resolution
- `src/lib/pack-variants.ts` — variant resolution logic

### 2.9 Dynamic Template Attachment Engine

The attachment engine deterministically selects and attaches template packs/variants into the target app based on init parameters and capability options. It guarantees repeatable output (same inputs → same output).

- **`AttachmentMode`** — `'CORE' | 'PLUGIN' | 'MODULE'`
- **`AttachmentOptions`** — projectRoot, packManifest, resolvedPackPath, target, language, mode, options, dryRun
- **`AttachmentReport`** — created, updated, skipped, conflicts, resolvedDestinations, ownedFilesCandidate

**Engine Behavior:**
- **Deterministic variant selection**: Based on target (expo/bare), language (ts/js), and normalized options key
- **Option-driven variants**: Supports option-specific variant paths (e.g., `variants/<target>/<language>/<optionsKey>/`)
- **Safe merging with stable priorities**: Root pack files copied first, then variant files overlay (variant files override root files)
- **Collision prevention**: Detects conflicts with existing user-owned files, skips CLI-managed file updates in dry-run
- **Repeatable output**: Files processed in sorted order, deterministic destination resolution

**Attachment Process:**
1. Resolve variant path using `resolvePackVariant()` (target + language + options)
2. Resolve destination root based on pack type and delivery mode
3. Copy root pack files (if variant exists, exclude variants directory)
4. Overlay variant files (variant files override root files)
5. Report created/updated/skipped/conflicts

**Source of truth (TypeScript):**
- `src/lib/attachment-engine.ts` — main attachment engine implementation

### 2.10 Ownership, Backups, Idempotency (safety rules)

Strict safety rules ensure CLI operations are safe, reversible, and repeatable. Mandatory for supporting many plugins at scale.

- **Ownership Zones**: Clear boundaries between CLI-managed (System Zone) and user-owned (User Zone) files
- **Backup System**: All file modifications create timestamped backups under `.rns/backups/<timestamp>-<operationId>/`
- **Idempotency**: Re-running operations must never duplicate injections or break the app

**Ownership Zones:**
- **System Zone (CLI-managed)**: `packages/@rns/**`, `.rns/**` — CLI can modify these files
- **User Zone (user-owned)**: `src/**`, `assets/**` — CLI must not modify these files (except through markers)

**Backup Rules:**
- Any operation that edits files must create `.rns/backups/<timestamp>-<operationId>/` directory
- Files are backed up before modification (not after)
- Backup format: preserves directory structure relative to project root
- Restore: files can be restored from backup if needed

**Idempotency Rules:**
- Re-running `rns init` (when applicable) → NO-OP or clean reconcile
- Re-running `rns plugin add <id>` → NO-OP (no duplicate deps, imports, registrations, patches)
- Injection markers: `// @rns-inject:<operationId>:<timestamp>` track applied operations
- Same inputs → same output (deterministic)

**Source of truth (TypeScript):**
- `src/lib/backup.ts` — backup system (createBackupDirectory, backupFile, restoreFromBackup)
- `src/lib/idempotency.ts` — idempotency checks (hasInjectionMarker, isIdempotent, validateIdempotent)
- `src/lib/attachment-engine.ts` — uses backup and idempotency systems

### 2.11 Marker Contract (canonical integration points)

Canonical integration markers are the only supported wiring method for plugins/modules into the app shell. Markers prevent plugins from rewriting app code and keep the system maintainable.

- **`MarkerType`** — `'imports' | 'providers' | 'init-steps' | 'root' | 'registrations'`
- **`MarkerDefinition`** — marker type, file path, description, required flag
- **`CANONICAL_MARKERS`** — array of all canonical marker definitions

**Marker Format:**
- Start marker: `// @rns-marker:<type>:start`
- End marker: `// @rns-marker:<type>:end`
- Content between markers is the injection region

**Canonical Markers (must exist in CORE):**
1. **`imports`** — `packages/@rns/runtime/index.ts` — Import statements region
2. **`providers`** — `packages/@rns/runtime/index.ts` — Provider wrappers region
3. **`init-steps`** — `packages/@rns/runtime/core-init.ts` — Initialization steps region
4. **`root`** — `packages/@rns/runtime/index.ts` — Root component region (replace MinimalUI)
5. **`registrations`** — `packages/@rns/runtime/core-init.ts` — Registration calls region (optional)

**Marker Validation Rules:**
- Markers must always exist in CORE (validated before patching)
- Markers must be well-formed (start before end, both present)
- Missing or corrupted markers produce clean, actionable errors
- Error messages specify: which marker, which file, how to restore

**Source of truth (TypeScript):**
- `src/lib/markers.ts` — marker contract, validation, and utilities (findMarker, validateMarker, validateAllMarkers)

### 2.12 Marker Patcher Engine v1

The marker patcher engine safely injects code only inside canonical markers. It guarantees no duplicates, stable output, resilience to formatting/newlines, and traceability by capability id (plugin/module). All plugins/modules must use this patcher (no ad-hoc regex hacks).

- **`MarkerPatch`** — patch operation: markerType, file, content, capabilityId, insertMode
- **`MarkerPatchResult`** — patch result: success, action (injected/skipped/error), backupPath
- **`patchMarker()`** — patches a single marker region
- **`patchMarkers()`** — patches multiple markers in a single operation
- **`validatePatches()`** — validates all required markers exist before patching

**Patcher Behavior:**
- **Safe injection**: Only injects inside validated marker regions
- **No duplicates**: Checks for injection markers before patching (idempotent)
- **Stable output**: Deterministic insertion order (append/prepend/replace modes)
- **Format-resilient**: Line-based insertion, not regex-based
- **Traceability**: Each injection includes capability ID in marker comment
- **Backup**: Always creates backup before modification

**Insert Modes:**
- **`append`** (default): Insert before end marker
- **`prepend`**: Insert after start marker
- **`replace`**: Replace all content between markers

**Source of truth (TypeScript):**
- `src/lib/marker-patcher.ts` — marker patcher engine implementation

### 2.13 Modulator engine contracts (installer pipeline)

The modulator engine is the generic installation engine that plans, applies, and removes plugins/modules. It executes changes in stable phases and ensures safety through dry-run planning, backups, and validation.

**Core Types:**
- **`ModulatorContext`** — project env + target + package manager + manifest + flags
- **`ModulatorPlan`** — dry-run plan: ordered actions + patches + runtime contributions + conflicts
- **`ModulatorResult`** — apply/remove result: phase results + warnings/errors + state update
- **`PhaseResult`** — result of a single phase execution
- **`DependencyPlan`** — dependency installation plan (runtime/dev, scope)
- **`PermissionsSummary`** — permissions summary (IDs, iOS keys, Android perms)
- **`ConflictResult`** — conflict detection result (slot/dependency/permission/file)

**Modulator Interface:**
- **`IModulator`** — main API: `plan()`, `apply()`, `remove()`

**Execution Phases:**
1. **Doctor gate** — validates project initialized and environment sane
2. **Scaffold** — attaches plugin pack (System Zone only)
3. **Link** — installs dependencies via dependency layer
4. **Wire** — applies runtime wiring via AST (ts-morph)
5. **Patch** — applies native/config patches (idempotent, backed up)
6. **Manifest** — updates project manifest
7. **Verify** — checks for duplicates, validates markers

**Behavior:**
- Deterministic planning: same inputs → same plan
- Stable phases: phases execute in order, each phase can be validated independently
- Safe removal: NO-OP if plugin not installed, never touches USER ZONE
- Comprehensive reporting: deps, runtime wiring, patches, permissions, conflicts, manifest updates

**Source of truth (TypeScript):**
- `src/lib/types/modulator.ts` — `ModulatorContext`, `ModulatorPlan`, `ModulatorResult`, `IModulator`, etc.
- `src/lib/modulator.ts` — modulator engine implementation (`ModulatorEngine`, `createModulator`)

**Rule:** All plugin/module installations must go through the modulator engine for consistent behavior and safety.

Phase interfaces (v1 targets):
- **`IPackageScaffolder`**
- **`IWorkspaceLinker`**
- **`IRuntimeInjector`**
- **`INativePatcher`**
- **`IVerifier`**

### 2.14 Doctor tooling

- **`DoctorCheckId`**
- **`DoctorFinding`**
- **`DoctorReport`**

### 2.15 Commands & exit codes

- **`CliCommandId`**
- **`CommandExitCode`**

---

## 3) Runtime kernel contracts (`@rns/core`)

`@rns/core` is the **immutable contract layer** that makes plugins swappable.
If a plugin provides “Auth”, it implements **`AuthInterface`** — so app UI does not care if the provider is Firebase or Supabase.

### 3.1 Location

All capability interfaces live here:

`packages/@rns/core/src/contracts/`

### 3.2 Optional base lifecycle (recommended)

Some adapters benefit from init/health-check hooks:

```ts
export interface RnsPlugin {
  readonly id: string;
  init(): Promise<void>;
  healthCheck?(): Promise<boolean>;
}
```

### 3.3 Capability interface catalog (high level)

Foundation:
- `LoggerInterface`, `ConfigInterface`, `PermissionInterface`, `ConnectivityInterface`

Identity & Security:
- `AuthInterface`, `BiometricInterface`, `SecureStorageInterface`

Data & Networking:
- `StorageInterface`, `DatabaseInterface`, `HttpClientInterface`, `RealtimeInterface`, `CacheInterface`

UI & Navigation:
- `NavigationInterface`, `ThemeInterface`, `FeedbackInterface`, `TranslationInterface`

Hardware & Device:
- `CameraInterface`, `LocationInterface`, `MediaPickerInterface`, `FileSystemInterface`, `HapticInterface`

External Services:
- `AnalyticsInterface`, `PaymentInterface`, `NotificationInterface`, `DeepLinkInterface`, `ShareInterface`

> Exact TS definitions are in `packages/@rns/core/src/contracts/*`.

### 3.4 Example: a plugin adapter implements a contract

Auth adapter (plugin package):

```ts
import { AuthInterface } from '@rns/core';

export class FirebaseAuthAdapter implements AuthInterface {
  // implement the required contract methods here
}
```

Runtime wiring (system-owned):

```ts
// packages/@rns/runtime/src/composition.ts
// Registry.register('Auth', new FirebaseAuthAdapter());
```

App code (user-owned) stays generic:

```ts
// src/screens/Login.tsx
// const auth = useAuth(); // AuthInterface
// await auth.login(...)
```

**Rule:** Only runtime composition knows the concrete provider.

---

## 4) Where to add new types (avoid duplication)

- If it is CLI-only (planning, descriptors, patch ops): add to `src/lib/types/**`.
- If it is app/runtime-facing (capability contracts): add to `packages/@rns/core/src/contracts/**`.
- Docs should reference the TS type name and file path — do not duplicate full definitions elsewhere.

---

## 5) Stability rules

- `@rns/core` contracts are **additive-only** (no breaking changes without a major version).
- Manifest schema versioning must support migrations.
- Patch ops must be backwards compatible where possible (anchors + provenance).
