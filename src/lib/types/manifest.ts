/**
 * FILE: src/lib/types/manifest.ts
 * PURPOSE: Project manifest types for .rns/rn-init.json (section 13)
 * OWNERSHIP: CLI
 * 
 * Canonical Docs: docs/cli-interface-and-types.md §2.2
 */

/**
 * Manifest schema version for migration support
 * Increment when making breaking changes to the manifest structure
 */
export type ManifestSchemaVersion = '1.0.0';

/**
 * Current manifest schema version
 */
export const CURRENT_MANIFEST_SCHEMA_VERSION: ManifestSchemaVersion = '1.0.0';

/**
 * Project identity information
 */
export interface RnsProjectIdentity {
  /** Project name (package.json name) */
  name: string;
  /** Display name (app.json displayName) */
  displayName?: string;
  /** iOS bundle identifier */
  bundleId?: string;
  /** Android package name */
  packageName?: string;
  /** Project version */
  version?: string;
  /** Build number */
  build?: string;
}

/**
 * Installed plugin/module record
 * Tracks what plugins/modules are installed and when
 */
export interface InstalledPluginRecord {
  /** Plugin/module ID */
  id: string;
  /** Installed version */
  version: string;
  /** Installation timestamp */
  installedAt: string;
  /** Installation options (plugin-specific) */
  options?: Record<string, unknown>;
  /** Files/directories owned by this plugin (for cleanup) */
  ownedFiles?: string[];
  ownedDirs?: string[];
  /** Last updated timestamp */
  updatedAt?: string;
}

/**
 * Project manifest structure
 * Single source of truth for what was generated and what is installed
 */
export interface RnsProjectManifest {
  /** Manifest schema version (for migrations) */
  schemaVersion: ManifestSchemaVersion;
  /** CLI version that generated this manifest */
  cliVersion: string;
  /** Workspace model (Option A) */
  workspaceModel: 'Option A';
  /** Project identity */
  identity: RnsProjectIdentity;
  /** Target platform (expo/bare) */
  target: 'expo' | 'bare';
  /** Language (ts/js) */
  language: 'ts' | 'js';
  /** Package manager (npm/pnpm/yarn) */
  packageManager: 'npm' | 'pnpm' | 'yarn';
  /** React Native version */
  reactNativeVersion?: string;
  /** CORE toggles (from init) */
  coreToggles?: Record<string, boolean>;
  /** Installed plugins */
  plugins: InstalledPluginRecord[];
  /** Installed modules */
  modules?: InstalledPluginRecord[];
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt?: string;
}

/**
 * Manifest validation result
 */
export interface ManifestValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
  migrated?: boolean;
}
