/**
 * FILE: src/lib/manifest.ts
 * PURPOSE: Project manifest management (read/write/validate/migrate) for .rns/rn-init.json (section 13)
 * OWNERSHIP: CLI
 * 
 * This module provides functions to manage the project manifest which is the single source of truth
 * for what was generated and what is installed. Every CLI command must validate state before acting.
 */

import { join } from 'path';
import { readJsonFile, writeJsonFile, pathExists } from './fs';
import { PROJECT_STATE_FILE } from './constants';
import { CliError, ExitCode } from './errors';
import { getCliVersion } from './version';
import {
  CURRENT_MANIFEST_SCHEMA_VERSION,
  type RnsProjectManifest,
  type ManifestSchemaVersion,
  type ManifestValidationResult,
  type InstalledPluginRecord,
  type RnsProjectIdentity,
} from './types/manifest';
import type { InitInputs } from './init';

/**
 * Reads the project manifest from .rns/rn-init.json
 * 
 * @param projectRoot - Project root directory
 * @returns Project manifest or null if not found
 */
export function readManifest(projectRoot: string): RnsProjectManifest | null {
  const manifestPath = join(projectRoot, PROJECT_STATE_FILE);
  
  if (!pathExists(manifestPath)) {
    return null;
  }

  try {
    const manifest = readJsonFile<Partial<RnsProjectManifest>>(manifestPath);
    
    // Validate and migrate if needed
    const validation = validateManifest(manifest);
    
    if (!validation.valid) {
      throw new CliError(
        `Invalid project manifest: ${validation.errors?.join(', ')}`,
        ExitCode.INVALID_STATE
      );
    }

    // Migrate if needed
    if (validation.migrated && manifest.schemaVersion !== CURRENT_MANIFEST_SCHEMA_VERSION) {
      const migrated = migrateManifest(manifest, manifest.schemaVersion || '1.0.0');
      if (migrated) {
        writeManifest(projectRoot, migrated);
        return migrated;
      }
    }

    return manifest as RnsProjectManifest;
  } catch (error) {
    if (error instanceof CliError) {
      throw error;
    }
    throw new CliError(
      `Failed to read project manifest from ${PROJECT_STATE_FILE}: ${error instanceof Error ? error.message : String(error)}`,
      ExitCode.INVALID_STATE
    );
  }
}

/**
 * Writes the project manifest to .rns/rn-init.json
 * 
 * @param projectRoot - Project root directory
 * @param manifest - Project manifest to write
 */
export function writeManifest(projectRoot: string, manifest: RnsProjectManifest): void {
  const manifestPath = join(projectRoot, PROJECT_STATE_FILE);
  
  // Update timestamps
  manifest.updatedAt = new Date().toISOString();
  
  // Ensure schema version is current
  manifest.schemaVersion = CURRENT_MANIFEST_SCHEMA_VERSION;
  
  // Validate before writing
  const validation = validateManifest(manifest);
  if (!validation.valid) {
    throw new CliError(
      `Cannot write invalid manifest: ${validation.errors?.join(', ')}`,
      ExitCode.INVALID_STATE
    );
  }

  writeJsonFile(manifestPath, manifest);
}

/**
 * Creates a new manifest from init inputs
 * 
 * @param projectRoot - Project root directory
 * @param inputs - Init inputs
 * @returns Created manifest
 */
export function createManifest(
  projectRoot: string,
  inputs: InitInputs
): RnsProjectManifest {
  const identity: RnsProjectIdentity = {
    name: inputs.projectName,
    displayName: inputs.projectName,
  };

  const manifest: RnsProjectManifest = {
    schemaVersion: CURRENT_MANIFEST_SCHEMA_VERSION,
    cliVersion: getCliVersion(),
    workspaceModel: 'Option A',
    identity,
    target: inputs.target,
    language: inputs.language,
    packageManager: inputs.packageManager,
    reactNativeVersion: inputs.reactNativeVersion,
    coreToggles: inputs.coreToggles,
    plugins: [],
    modules: [],
    createdAt: new Date().toISOString(),
  };

  writeManifest(projectRoot, manifest);
  return manifest;
}

/**
 * Validates a manifest structure
 * 
 * @param manifest - Manifest to validate (may be partial)
 * @returns Validation result
 */
export function validateManifest(
  manifest: Partial<RnsProjectManifest>
): ManifestValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check schema version
  if (!manifest.schemaVersion) {
    errors.push('Missing schemaVersion');
  } else if (manifest.schemaVersion !== CURRENT_MANIFEST_SCHEMA_VERSION) {
    // Schema version mismatch - will trigger migration
    warnings.push(`Schema version ${manifest.schemaVersion} is not current (${CURRENT_MANIFEST_SCHEMA_VERSION})`);
  }

  // Check required fields
  if (!manifest.workspaceModel || manifest.workspaceModel !== 'Option A') {
    errors.push('Missing or invalid workspaceModel (must be "Option A")');
  }

  if (!manifest.identity || !manifest.identity.name) {
    errors.push('Missing identity.name');
  }

  if (!manifest.target || !['expo', 'bare'].includes(manifest.target)) {
    errors.push('Missing or invalid target (must be "expo" or "bare")');
  }

  if (!manifest.language || !['ts', 'js'].includes(manifest.language)) {
    errors.push('Missing or invalid language (must be "ts" or "js")');
  }

  if (!manifest.packageManager || !['npm', 'pnpm', 'yarn'].includes(manifest.packageManager)) {
    errors.push('Missing or invalid packageManager (must be "npm", "pnpm", or "yarn")');
  }

  // Validate plugins array
  if (!Array.isArray(manifest.plugins)) {
    errors.push('Missing or invalid plugins array');
  } else {
    for (const plugin of manifest.plugins) {
      if (!plugin.id || typeof plugin.id !== 'string') {
        errors.push('Plugin missing id');
      }
      if (!plugin.version || typeof plugin.version !== 'string') {
        errors.push(`Plugin ${plugin.id || 'unknown'} missing version`);
      }
      if (!plugin.installedAt || typeof plugin.installedAt !== 'string') {
        errors.push(`Plugin ${plugin.id || 'unknown'} missing installedAt`);
      }
    }
  }

  // Validate modules array (if present)
  if (manifest.modules !== undefined && !Array.isArray(manifest.modules)) {
    errors.push('Invalid modules array');
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
    migrated: false, // Migration handled separately
  };
}

/**
 * Migrates a manifest from an older schema version to the current version
 * 
 * @param manifest - Manifest to migrate
 * @param fromVersion - Source schema version
 * @returns Migrated manifest or null if migration not needed/possible
 */
export function migrateManifest(
  manifest: Partial<RnsProjectManifest>,
  fromVersion: ManifestSchemaVersion
): RnsProjectManifest | null {
  if (fromVersion === CURRENT_MANIFEST_SCHEMA_VERSION) {
    return null; // Already current
  }

  // For now, we only support 1.0.0
  // Future migrations will be added here
  if (fromVersion === '1.0.0') {
    // Already current schema
    return manifest as RnsProjectManifest;
  }

  // Unknown version - return null to indicate migration not possible
  return null;
}

/**
 * Validates that a project is initialized
 * 
 * @param projectRoot - Project root directory
 * @returns True if initialized, throws error if not
 */
export function validateProjectInitialized(projectRoot: string): RnsProjectManifest {
  const manifest = readManifest(projectRoot);
  
  if (!manifest) {
    throw new CliError(
      `Project is not initialized. Missing ${PROJECT_STATE_FILE}.\n` +
      `Run 'rns init' to initialize the project.`,
      ExitCode.NOT_INITIALIZED
    );
  }

  return manifest;
}

/**
 * Adds a plugin to the manifest
 * 
 * @param projectRoot - Project root directory
 * @param plugin - Plugin record to add
 */
export function addPluginToManifest(
  projectRoot: string,
  plugin: InstalledPluginRecord
): void {
  const manifest = validateProjectInitialized(projectRoot);
  
  // Check if plugin already exists
  const existingIndex = manifest.plugins.findIndex(p => p.id === plugin.id);
  
  if (existingIndex >= 0) {
    // Update existing plugin
    manifest.plugins[existingIndex] = {
      ...manifest.plugins[existingIndex],
      ...plugin,
      updatedAt: new Date().toISOString(),
    };
  } else {
    // Add new plugin
    manifest.plugins.push(plugin);
  }
  
  // Update aggregated permissions
  updateAggregatedPermissions(projectRoot);
}

/**
 * Removes a plugin from the manifest
 * 
 * @param projectRoot - Project root directory
 * @param pluginId - Plugin ID to remove
 */
export function removePluginFromManifest(
  projectRoot: string,
  pluginId: string
): void {
  const manifest = validateProjectInitialized(projectRoot);
  
  manifest.plugins = manifest.plugins.filter(p => p.id !== pluginId);
  
  // Update aggregated permissions
  updateAggregatedPermissions(projectRoot);
}

/**
 * Gets a plugin from the manifest
 * 
 * @param projectRoot - Project root directory
 * @param pluginId - Plugin ID to get
 * @returns Plugin record or null if not found
 */
export function getPluginFromManifest(
  projectRoot: string,
  pluginId: string
): InstalledPluginRecord | null {
  const manifest = validateProjectInitialized(projectRoot);
  
  return manifest.plugins.find(p => p.id === pluginId) || null;
}

/**
 * Updates aggregated permissions in manifest
 * Recalculates permissions from all installed plugins
 * 
 * @param projectRoot - Project root directory
 */
export function updateAggregatedPermissions(projectRoot: string): void {
  const manifest = validateProjectInitialized(projectRoot);
  
  // Collect all permissions from installed plugins
  const allPermissionIds = new Set<string>();
  const mandatory = new Set<string>();
  const optional = new Set<string>();
  const byPlugin: Record<string, { pluginId: string; permissions: Array<{ permissionId: string; mandatory: boolean }> }> = {};
  
  for (const plugin of manifest.plugins) {
    if (plugin.permissions && plugin.permissions.length > 0) {
      byPlugin[plugin.id] = {
        pluginId: plugin.id,
        permissions: plugin.permissions.map(p => ({
          permissionId: p.permissionId,
          mandatory: p.mandatory,
        })),
      };
      
      for (const perm of plugin.permissions) {
        allPermissionIds.add(perm.permissionId);
        if (perm.mandatory) {
          mandatory.add(perm.permissionId);
        } else {
          optional.add(perm.permissionId);
        }
      }
    }
  }
  
  // Update manifest
  manifest.permissions = {
    permissionIds: Array.from(allPermissionIds),
    mandatory: Array.from(mandatory),
    optional: Array.from(optional),
    byPlugin,
  };
  
  writeManifest(projectRoot, manifest);
}

/**
 * Adds a module to the manifest
 * 
 * @param projectRoot - Project root directory
 * @param module - Module record to add
 */
export function addModuleToManifest(
  projectRoot: string,
  module: InstalledPluginRecord
): void {
  const manifest = validateProjectInitialized(projectRoot);
  
  if (!manifest.modules) {
    manifest.modules = [];
  }
  
  // Check if module already exists
  const existingIndex = manifest.modules.findIndex(m => m.id === module.id);
  
  if (existingIndex >= 0) {
    // Update existing module
    manifest.modules[existingIndex] = {
      ...manifest.modules[existingIndex],
      ...module,
      updatedAt: new Date().toISOString(),
    };
  } else {
    // Add new module
    manifest.modules.push(module);
  }
  
  writeManifest(projectRoot, manifest);
}
