/**
 * FILE: src/lib/types/patch-ops.ts
 * PURPOSE: Patch operations types for native/config files (section 12)
 * OWNERSHIP: CLI
 * 
 * Canonical Docs: docs/cli-interface-and-types.md §2.7
 */

/**
 * Base patch operation interface
 * All patch operations must be anchored, idempotent, and traceable
 */
export interface BasePatchOp {
  /** Plugin/module ID that owns this patch (for traceability) */
  capabilityId: string;
  /** Operation ID for idempotency checks */
  operationId: string;
  /** File to patch (relative to project root) */
  file: string;
}

/**
 * Expo config patch operation
 * Patches app.json or app.config.* files
 */
export interface ExpoConfigPatchOp extends BasePatchOp {
  type: 'expo-config';
  /** JSON path to set/merge (e.g., "expo.plugins", "expo.ios.bundleIdentifier") */
  path: string;
  /** Value to set or merge */
  value: unknown;
  /** Merge mode: 'set' replaces, 'merge' deep-merges objects, 'append' adds to arrays */
  mode?: 'set' | 'merge' | 'append';
}

/**
 * iOS plist patch operation
 * Patches Info.plist or other .plist files
 */
export interface PlistPatchOp extends BasePatchOp {
  type: 'plist';
  /** Key path in plist (e.g., "NSPhotoLibraryUsageDescription", "UIBackgroundModes") */
  key: string;
  /** Value to set */
  value: string | number | boolean | string[];
  /** Merge mode for arrays: 'append' adds if not exists, 'set' replaces */
  mode?: 'set' | 'append';
}

/**
 * iOS entitlements patch operation
 * Patches .entitlements files
 */
export interface EntitlementsPatchOp extends BasePatchOp {
  type: 'entitlements';
  /** Entitlement key (e.g., "aps-environment", "com.apple.developer.associated-domains") */
  key: string;
  /** Value to set */
  value: string | string[] | boolean;
  /** Merge mode for arrays: 'append' adds if not exists, 'set' replaces */
  mode?: 'set' | 'append';
}

/**
 * Android manifest patch operation
 * Patches AndroidManifest.xml
 */
export interface AndroidManifestPatchOp extends BasePatchOp {
  type: 'android-manifest';
  /** Operation type */
  manifestOp: 'permission' | 'feature' | 'activity' | 'service' | 'receiver' | 'meta-data';
  /** Permission/feature name or component attributes */
  name: string;
  /** Optional attributes for the element */
  attributes?: Record<string, string>;
  /** Action: 'add' adds if missing, 'remove' removes if exists */
  action: 'add' | 'remove';
}

/**
 * Gradle patch operation
 * Patches build.gradle files using anchored text insertion
 */
export interface GradlePatchOp extends BasePatchOp {
  type: 'gradle';
  /** Anchor text to find (must be unique in file) */
  anchor: string;
  /** Content to insert */
  content: string;
  /** Insert mode: 'before' inserts before anchor, 'after' inserts after anchor */
  mode: 'before' | 'after';
  /** Optional: ensure content exists (idempotent check) */
  ensureUnique?: boolean;
}

/**
 * Podfile patch operation
 * Patches Podfile using anchored text insertion
 */
export interface PodfilePatchOp extends BasePatchOp {
  type: 'podfile';
  /** Anchor text to find (must be unique in file) */
  anchor: string;
  /** Content to insert */
  content: string;
  /** Insert mode: 'before' inserts before anchor, 'after' inserts after anchor */
  mode: 'before' | 'after';
  /** Optional: ensure content exists (idempotent check) */
  ensureUnique?: boolean;
}

/**
 * Generic text anchor patch operation
 * For any text file that needs anchored edits
 */
export interface TextAnchorPatchOp extends BasePatchOp {
  type: 'text-anchor';
  /** Anchor text to find (must be unique in file) */
  anchor: string;
  /** Content to insert */
  content: string;
  /** Insert mode: 'before' inserts before anchor, 'after' inserts after anchor */
  mode: 'before' | 'after';
  /** Optional: ensure content exists (idempotent check) */
  ensureUnique?: boolean;
}

/**
 * Union type for all patch operations
 */
export type PatchOp =
  | ExpoConfigPatchOp
  | PlistPatchOp
  | EntitlementsPatchOp
  | AndroidManifestPatchOp
  | GradlePatchOp
  | PodfilePatchOp
  | TextAnchorPatchOp;

/**
 * Patch operation result
 */
export interface PatchOpResult {
  success: boolean;
  file: string;
  capabilityId: string;
  operationId: string;
  patchType: PatchOp['type'];
  action: 'applied' | 'skipped' | 'error';
  error?: string;
  backupPath?: string;
}
