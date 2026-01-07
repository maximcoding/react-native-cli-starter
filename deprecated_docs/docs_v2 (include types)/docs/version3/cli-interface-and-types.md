<!--
FILE: docs/cli-interface-and-types.md
PURPOSE: Canonical schema + contract index for CliMobile (RNS).
         This doc defines the **names and meanings** of types/interfaces used across the CLI and generated apps.
OWNERSHIP: CLI
-->

# CLI Interfaces & Types (v3)

This document is the **single reference** for the platform’s contract names.

**Rule:** Do not redefine the same schema in multiple docs.  
If a type is referenced by multiple docs, it must have one home here (and a TS source file).

---

## 1) Source of truth (TypeScript)

The authoritative definitions live in code:

### 1.1 CLI contracts (Node side)

- `src/lib/types/common.ts` — shared enums/aliases (target, pm, platform, expo runtime)
- `src/lib/types/plugin.ts` — `PluginDescriptor`, support rules, dependencies, conflicts, patches
- `src/lib/types/manifest.ts` — `RnsProjectManifest`, installed plugin record, schema version
- `src/lib/types/permissions.ts` — permission requirements + provider catalog types
- `src/lib/types/runtime.ts` — runtime injection types (`RuntimeContribution`, `SymbolRef`)
- `src/lib/types/patch-ops.ts` — declarative patch ops (iOS/Android/Expo/text)
- `src/lib/types/modulator.ts` — modulator plan/apply contracts + phase interfaces
- `src/lib/types/doctor.ts` — doctor report types
- `src/lib/types/commands.ts` — command ids + exit codes
- `src/lib/types/planning.ts` — ownership/change/audit enums

### 1.2 Runtime/app contracts (Generated app side)

These live in `packages/@rns/core` and are intentionally stable:

- `packages/@rns/core/src/contracts/*` — capability interfaces (Auth, Storage, HttpClient, etc.)
- `packages/@rns/core/src/contracts/rns-plugin.ts` — optional runtime lifecycle (`RnsPlugin`)
- `packages/@rns/core/src/index.ts` — export surface

---

## 2) Core CLI schema (names + intent)

### 2.1 Project state (manifest)

- **`RnsProjectManifest`** — single source of truth: identity + target + installed plugins + schema version.
- **`RnsProjectIdentity`** — name/displayName/bundleId/packageName/version/build.
- **`InstalledPluginRecord`** — installed plugin instance: id, version, options, owned files/dirs, timestamps.
- **`ManifestSchemaVersion`** — schema version for `.rns/rn-init.json` (for migrations).

### 2.2 Plugin catalog (what a plugin is)

- **`PluginDescriptor`** — blueprint of a plugin: deps + support + conflicts + permissions + patch ops + runtime contributions.
- **`PluginId`** — stable plugin key like `"auth.firebase"`.

Useful taxonomy (for UI, presets, discoverability):
- **`PluginCategory`** — `"auth" | "storage" | "network" | "ui" | ..."` (defined in `plugin.ts`)
- **`PluginTier`** — `"core" | "recommended" | "advanced"` (optional; UX only)

### 2.3 Compatibility + conflicts (slots)

- **`RnsTarget`** — `'expo' | 'bare'`
- **`ExpoRuntime`** — `'expo-go' | 'dev-client' | 'standalone'`
- **`PluginSupport`** — what targets/platforms/runtime the plugin supports.
- **`ConflictRule`** — slot-based conflict rule: `{ slot, mode: 'single'|'multi' }`
- **`ConflictCheckResult`** — allowed or blocked + conflicts with reasons.

### 2.4 Permissions

- **`PermissionRequirement`** — one permission unit (camera/location/etc) with iOS/Android mapping + notes.
- **`PlatformPermissionSpec`** — iOS plist keys / Android manifest entries + rationale.
- **`PermissionsSummary`** — aggregated permissions required by currently installed plugins.

Permission provider UX tooling:
- **`PermissionPlugin`** — describes a permission SDK/provider (expo-camera, react-native-permissions, etc.)

Full catalog lives in: `docs/plugins-permissions.md`

### 2.5 Runtime contributions (wiring, symbol-based)

- **`RuntimeContribution`** — what a plugin adds: providers/wrappers/init steps/registrations.
- **`SymbolRef`** — `{ symbol, source }` used for ts-morph injection (no raw code strings).

### 2.6 Patch operations (native/config, idempotent)

- **`PatchOp`** — base union type for patch operations.
- **`PlistPatchOp`**, **`AndroidManifestPatchOp`**, **`GradlePatchOp`**, **`TextAnchorPatchOp`**, **`ExpoConfigPatchOp`** — concrete op types.

Rule: patchers must be anchored, idempotent, and backed up under `.rns/backups/...`.

### 2.7 Modulator engine contracts (installer pipeline)

- **`ModulatorContext`** — project env + target + package manager + manifest + flags.
- **`ModulatorPlan`** — dry-run plan: ordered actions + patches + runtime contributions + conflicts.
- **`ModulatorResult`** — apply/remove result: phase results + warnings/errors + state update.
- **`IModulator`** — main API: `plan/apply/remove`.

Phase interfaces:
- **`IPackageScaffolder`**
- **`IWorkspaceLinker`**
- **`IRuntimeInjector`**
- **`INativePatcher`**
- **`IVerifier`**

### 2.8 Doctor tooling

- **`DoctorCheckId`**
- **`DoctorFinding`**
- **`DoctorReport`**

### 2.9 Commands & exit codes

- **`CliCommandId`**
- **`CommandExitCode`**

---

## 3) Runtime kernel contracts (`@rns/core`)

`@rns/core` is the **immutable contract layer** that makes plugins swappable.
If a plugin provides “Auth”, it implements **`AuthInterface`** — so the app UI does not care if the provider is Firebase or Supabase.

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
- Docs should reference the TS type name and file path — do not duplicate the full definition elsewhere.

---

## 5) Stability rules

- `@rns/core` contracts are **additive-only** (no breaking changes without a major version).
- Manifest schema versioning must support migrations.
- Patch ops must be backwards compatible where possible (anchors + provenance).
