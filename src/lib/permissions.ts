/**
 * FILE: src/lib/permissions.ts
 * PURPOSE: Permissions model implementation (section 16)
 * OWNERSHIP: CLI
 * 
 * This module provides:
 * - Permission ID resolution from docs/plugins-permissions.md dataset
 * - iOS plist key mapping
 * - Android manifest permission/feature mapping
 * - Aggregated permissions with per-plugin traceability
 */

import { join } from 'path';
import { readTextFile } from './fs';
import type {
  PermissionId,
  PermissionRequirement,
  PermissionCatalogEntry,
  ResolvedPermission,
  AggregatedPermissions,
  PermissionObject,
  AppPlatform,
  PluginKind,
} from './types/permissions';
import type { RnsTarget } from './types/common';

/**
 * Loads and parses the permissions catalog from docs/plugins-permissions.md
 * 
 * @param cliRoot - CLI root directory (where docs/ is located)
 * @returns Array of permission catalog entries
 */
export function loadPermissionsCatalog(cliRoot: string): PermissionCatalogEntry[] {
  const catalogPath = join(cliRoot, 'docs', 'plugins-permissions.md');
  const content = readTextFile(catalogPath);
  
  const entries: PermissionCatalogEntry[] = [];
  
  // Parse markdown table
  // Table format: | id | full permission constant | AppPlatform | PluginKind | permission object itself |
  const tableRegex = /^\|\s*(\d+)\s*\|\s*`([^`]+)`\s*\|\s*(\w+)\s*\|\s*(\w+)\s*\|\s*`({[^`]+})`\s*\|/gm;
  
  let match;
  while ((match = tableRegex.exec(content)) !== null) {
    const [, idStr, fullConstant, appPlatform, pluginKind, permissionJson] = match;
    
    try {
      const permissionObject = JSON.parse(permissionJson) as PermissionObject;
      
      entries.push({
        id: parseInt(idStr, 10),
        fullPermissionConstant: fullConstant,
        appPlatform: appPlatform as AppPlatform,
        pluginKind: pluginKind as PluginKind,
        permissionObject,
      });
    } catch (error) {
      // Skip invalid entries
      console.warn(`Failed to parse permission entry ${idStr}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  return entries;
}

/**
 * Resolves permission IDs to catalog entries
 * 
 * @param permissionIds - Permission IDs to resolve
 * @param catalog - Permission catalog
 * @param target - Target platform (expo/bare)
 * @returns Map of permission ID to resolved permission
 */
export function resolvePermissions(
  permissionIds: PermissionId[],
  catalog: PermissionCatalogEntry[],
  target: RnsTarget
): Map<PermissionId, ResolvedPermission> {
  const resolved = new Map<PermissionId, ResolvedPermission>();
  
  for (const permissionId of permissionIds) {
    // Find catalog entries that match this permission ID
    // For now, we'll match by permission constant or value
    // TODO: Implement proper permission ID mapping when plugin descriptors are available
    const matchingEntries = catalog.filter(entry => {
      // Match by permission constant or value
      const matchesConstant = entry.fullPermissionConstant.includes(permissionId);
      const matchesValue = entry.permissionObject.value.includes(permissionId);
      
      // Filter by target platform
      const matchesPlatform = 
        entry.appPlatform === 'both' ||
        entry.appPlatform === target;
      
      return (matchesConstant || matchesValue) && matchesPlatform;
    });
    
    if (matchingEntries.length > 0) {
      // Extract iOS keys, Android permissions, etc.
      const iosKeys: string[] = [];
      const androidPermissions: string[] = [];
      const androidFeatures: string[] = [];
      const iosConfigKeys: string[] = [];
      
      for (const entry of matchingEntries) {
        const { permissionObject } = entry;
        
        if (permissionObject.os === 'ios') {
          if (permissionObject.permissionType === 'infoPlistKey') {
            iosKeys.push(permissionObject.value || permissionObject.permission);
          } else if (permissionObject.permissionType === 'configKey') {
            iosConfigKeys.push(permissionObject.value || permissionObject.permission);
          }
          
          // Add required Info.plist keys
          if (permissionObject.requiredInfoPlistKeys) {
            iosKeys.push(...permissionObject.requiredInfoPlistKeys);
          }
        } else if (permissionObject.os === 'android') {
          if (permissionObject.permissionType === 'manifestPermission') {
            androidPermissions.push(permissionObject.value);
          } else if (permissionObject.permissionType === 'runtimePermission') {
            // Runtime permissions also need manifest entries
            androidPermissions.push(permissionObject.value);
          }
        }
      }
      
      resolved.set(permissionId, {
        permissionId,
        catalogEntries: matchingEntries,
        iosKeys: [...new Set(iosKeys)], // Deduplicate
        androidPermissions: [...new Set(androidPermissions)], // Deduplicate
        androidFeatures: [...new Set(androidFeatures)], // Deduplicate
        iosConfigKeys: [...new Set(iosConfigKeys)], // Deduplicate
      });
    }
  }
  
  return resolved;
}

/**
 * Aggregates permissions from multiple plugins
 * 
 * @param pluginPermissions - Map of plugin ID to permission requirements
 * @param catalog - Permission catalog
 * @param target - Target platform
 * @returns Aggregated permissions summary
 */
export function aggregatePermissions(
  pluginPermissions: Map<string, PermissionRequirement[]>,
  catalog: PermissionCatalogEntry[],
  target: RnsTarget
): AggregatedPermissions {
  const allPermissionIds = new Set<PermissionId>();
  const mandatory = new Set<PermissionId>();
  const optional = new Set<PermissionId>();
  const resolved = new Map<PermissionId, ResolvedPermission>();
  const byPlugin = new Map<string, { pluginId: string; permissions: PermissionRequirement[] }>();
  
  // Collect all permission IDs
  for (const [pluginId, requirements] of pluginPermissions.entries()) {
    byPlugin.set(pluginId, { pluginId, permissions: requirements });
    
    for (const req of requirements) {
      allPermissionIds.add(req.permissionId);
      if (req.mandatory) {
        mandatory.add(req.permissionId);
      } else {
        optional.add(req.permissionId);
      }
    }
  }
  
  // Resolve all permissions
  const resolvedMap = resolvePermissions(Array.from(allPermissionIds), catalog, target);
  for (const [permissionId, resolvedPerm] of resolvedMap.entries()) {
    resolved.set(permissionId, resolvedPerm);
  }
  
  return {
    permissionIds: Array.from(allPermissionIds),
    mandatory: Array.from(mandatory),
    optional: Array.from(optional),
    resolved,
    byPlugin,
  };
}

/**
 * Gets iOS Info.plist keys for a set of permission IDs
 * 
 * @param permissionIds - Permission IDs
 * @param catalog - Permission catalog
 * @param target - Target platform
 * @returns Array of Info.plist keys
 */
export function getIosPlistKeys(
  permissionIds: PermissionId[],
  catalog: PermissionCatalogEntry[],
  target: RnsTarget
): string[] {
  const resolved = resolvePermissions(permissionIds, catalog, target);
  const keys = new Set<string>();
  
  for (const perm of resolved.values()) {
    for (const key of perm.iosKeys) {
      keys.add(key);
    }
  }
  
  return Array.from(keys);
}

/**
 * Gets Android manifest permissions for a set of permission IDs
 * 
 * @param permissionIds - Permission IDs
 * @param catalog - Permission catalog
 * @param target - Target platform
 * @returns Array of Android permissions
 */
export function getAndroidPermissions(
  permissionIds: PermissionId[],
  catalog: PermissionCatalogEntry[],
  target: RnsTarget
): string[] {
  const resolved = resolvePermissions(permissionIds, catalog, target);
  const permissions = new Set<string>();
  
  for (const perm of resolved.values()) {
    for (const permStr of perm.androidPermissions) {
      permissions.add(permStr);
    }
  }
  
  return Array.from(permissions);
}

/**
 * Gets Android manifest features for a set of permission IDs
 * 
 * @param permissionIds - Permission IDs
 * @param catalog - Permission catalog
 * @param target - Target platform
 * @returns Array of Android features
 */
export function getAndroidFeatures(
  permissionIds: PermissionId[],
  catalog: PermissionCatalogEntry[],
  target: RnsTarget
): string[] {
  const resolved = resolvePermissions(permissionIds, catalog, target);
  const features = new Set<string>();
  
  for (const perm of resolved.values()) {
    for (const feature of perm.androidFeatures) {
      features.add(feature);
    }
  }
  
  return Array.from(features);
}
