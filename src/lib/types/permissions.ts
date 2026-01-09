/**
 * FILE: src/lib/types/permissions.ts
 * PURPOSE: Permissions model types (section 16)
 * OWNERSHIP: CLI
 * 
 * Canonical Docs: docs/cli-interface-and-types.md §2.5, docs/plugins-permissions.md
 */

/**
 * App platform where permission is used
 */
export type AppPlatform = 'expo' | 'bare' | 'both';

/**
 * Plugin/provider ecosystem
 */
export type PluginKind = 'expo-module' | 'rn-library' | 'rn-core';

/**
 * Permission type
 */
export type PermissionType = 
  | 'runtimePermission'  // Requested at runtime (Android/iOS)
  | 'manifestPermission' // Android manifest <uses-permission>
  | 'infoPlistKey'       // iOS Info.plist usage description key
  | 'configKey';         // Platform config key (e.g., UIBackgroundModes)

/**
 * Operating system
 */
export type PermissionOS = 'android' | 'ios';

/**
 * Permission object structure (matches docs/plugins-permissions.md)
 */
export interface PermissionObject {
  /** Plugin/provider ID */
  pluginId: string;
  /** Plugin/provider name */
  pluginName: string;
  /** Operating system */
  os: PermissionOS;
  /** Permission type */
  permissionType: PermissionType;
  /** Permission constant */
  permission: string;
  /** Functions that request this permission */
  requestedBy: string[];
  /** Platform-specific permission value */
  value: string;
  /** Optional notes */
  notes?: string[];
  /** Required Info.plist keys (iOS only) */
  requiredInfoPlistKeys?: string[];
  /** Provider constant (optional) */
  providerConstant?: string;
}

/**
 * Permission catalog entry (row from docs/plugins-permissions.md)
 */
export interface PermissionCatalogEntry {
  /** Row ID (stable, don't renumber) */
  id: number;
  /** Full permission constant */
  fullPermissionConstant: string;
  /** App platform */
  appPlatform: AppPlatform;
  /** Plugin kind */
  pluginKind: PluginKind;
  /** Permission object */
  permissionObject: PermissionObject;
}

/**
 * Permission ID (canonical identifier for plugins to declare)
 * Format: e.g., "camera", "location.whenInUse", "contacts.read"
 */
export type PermissionId = string;

/**
 * Permission requirement (declared by plugin)
 */
export interface PermissionRequirement {
  /** Permission ID */
  permissionId: PermissionId;
  /** Whether permission is mandatory or optional */
  mandatory: boolean;
  /** Optional notes */
  notes?: string[];
}

/**
 * Resolved permission mapping
 */
export interface ResolvedPermission {
  /** Permission ID */
  permissionId: PermissionId;
  /** Catalog entries matching this permission ID */
  catalogEntries: PermissionCatalogEntry[];
  /** iOS Info.plist keys */
  iosKeys: string[];
  /** Android manifest permissions */
  androidPermissions: string[];
  /** Android manifest features */
  androidFeatures: string[];
  /** iOS config keys (e.g., UIBackgroundModes) */
  iosConfigKeys: string[];
}

/**
 * Aggregated permissions summary
 */
export interface AggregatedPermissions {
  /** All permission IDs */
  permissionIds: PermissionId[];
  /** Mandatory permission IDs */
  mandatory: PermissionId[];
  /** Optional permission IDs */
  optional: PermissionId[];
  /** Resolved permissions by ID */
  resolved: Map<PermissionId, ResolvedPermission>;
  /** Per-plugin traceability */
  byPlugin: Map<string, {
    pluginId: string;
    permissions: PermissionRequirement[];
  }>;
}
