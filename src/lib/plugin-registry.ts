/**
 * FILE: src/lib/plugin-registry.ts
 * PURPOSE: Plugin registry system (section 19)
 * OWNERSHIP: CLI
 * 
 * This registry loads and manages plugin descriptors from templates/plugins/
 * It provides discovery, validation, and query capabilities for the plugin framework.
 */

import { join } from 'path';
import { readdirSync } from 'fs';
import { resolveCliRoot } from './pack-locations';
import { pathExists, isDirectory, readJsonFile } from './fs';
import { CliError, ExitCode } from './errors';
import type { PluginDescriptor, PluginId, PluginCategory } from './types/plugin';
import type { RnsTarget, PlatformOS } from './types/common';

/**
 * Plugin descriptor file name
 */
export const PLUGIN_DESCRIPTOR_FILE = 'plugin.json';

/**
 * Plugin registry - manages plugin descriptors
 */
export class PluginRegistry {
  private plugins: Map<PluginId, PluginDescriptor> = new Map();
  private initialized: boolean = false;

  /**
   * Initializes the registry by discovering and loading all plugins
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const cliRoot = resolveCliRoot();
    const pluginsDir = join(cliRoot, 'templates', 'plugins');

    // If plugins directory doesn't exist, registry is empty
    if (!pathExists(pluginsDir) || !isDirectory(pluginsDir)) {
      this.initialized = true;
      return;
    }

    // Scan for plugin directories
    const entries = readdirSync(pluginsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const pluginPath = join(pluginsDir, entry.name);
      const descriptorPath = join(pluginPath, PLUGIN_DESCRIPTOR_FILE);

      // Skip directories without plugin.json
      if (!pathExists(descriptorPath)) {
        continue;
      }

      try {
        const descriptor = await this.loadPluginDescriptor(descriptorPath, entry.name);
        
        // Validate plugin ID matches directory name (allowing dots in ID, dashes in directory)
        // Directory names use dashes (filesystem-safe), plugin IDs use dots (canonical)
        const normalizedId = descriptor.id.replace(/\./g, '-');
        const normalizedDirName = entry.name;
        if (normalizedId !== normalizedDirName) {
          throw new CliError(
            `Plugin descriptor id "${descriptor.id}" (normalized: "${normalizedId}") does not match directory name "${entry.name}"`,
            ExitCode.VALIDATION_STATE_FAILURE
          );
        }

        // Check for duplicate IDs
        if (this.plugins.has(descriptor.id)) {
          throw new CliError(
            `Duplicate plugin ID "${descriptor.id}" found at ${pluginPath}`,
            ExitCode.VALIDATION_STATE_FAILURE
          );
        }

        this.plugins.set(descriptor.id, descriptor);
      } catch (error) {
        // Log error but continue loading other plugins
        if (error instanceof CliError) {
          throw error;
        }
        throw new CliError(
          `Failed to load plugin descriptor from ${descriptorPath}: ${error instanceof Error ? error.message : String(error)}`,
          ExitCode.VALIDATION_STATE_FAILURE
        );
      }
    }

    this.initialized = true;
  }

  /**
   * Loads and validates a plugin descriptor from a file
   */
  private async loadPluginDescriptor(
    descriptorPath: string,
    expectedId: string
  ): Promise<PluginDescriptor> {
    const raw = readJsonFile<any>(descriptorPath);
    // Convert directory name (dashes) to expected plugin ID format (dots) for validation
    // Directory: state-zustand -> Expected ID: state.zustand
    const expectedPluginId = expectedId.replace(/-/g, '.');
    return this.validatePluginDescriptor(raw, descriptorPath, expectedPluginId);
  }

  /**
   * Validates plugin descriptor structure
   */
  private validatePluginDescriptor(
    raw: any,
    descriptorPath: string,
    expectedId: string
  ): PluginDescriptor {
    const errors: string[] = [];

    // Required fields
    if (!raw.id || typeof raw.id !== 'string') {
      errors.push('Plugin descriptor must have a string "id" field');
    } else if (raw.id !== expectedId) {
      errors.push(`Plugin descriptor id "${raw.id}" does not match expected "${expectedId}"`);
    }

    if (!raw.name || typeof raw.name !== 'string') {
      errors.push('Plugin descriptor must have a string "name" field');
    }

    if (!raw.version || typeof raw.version !== 'string') {
      errors.push('Plugin descriptor must have a string "version" field');
    }

    if (!raw.category || typeof raw.category !== 'string') {
      errors.push('Plugin descriptor must have a string "category" field');
    } else {
      const validCategories: PluginCategory[] = [
        'auth', 'storage', 'network', 'ui', 'navigation', 'analytics',
        'notifications', 'camera', 'location', 'media', 'hardware', 'data', 'state', 'other'
      ];
      if (!validCategories.includes(raw.category)) {
        errors.push(`Invalid category "${raw.category}". Must be one of: ${validCategories.join(', ')}`);
      }
    }

    if (!raw.support || typeof raw.support !== 'object') {
      errors.push('Plugin descriptor must have a "support" object field');
    } else {
      if (!raw.support.targets || !Array.isArray(raw.support.targets)) {
        errors.push('Plugin "support" must have a "targets" array');
      } else {
        const validTargets = ['expo', 'bare'];
        const invalidTargets = raw.support.targets.filter((t: string) => !validTargets.includes(t));
        if (invalidTargets.length > 0) {
          errors.push(`Invalid support.targets: ${invalidTargets.join(', ')}. Must be "expo" or "bare"`);
        }
      }

      if (raw.support.platforms !== undefined) {
        if (!Array.isArray(raw.support.platforms)) {
          errors.push('Plugin "support.platforms" must be an array if present');
        } else {
          const validPlatforms: PlatformOS[] = ['ios', 'android', 'web'];
          const invalidPlatforms = raw.support.platforms.filter((p: string) => !validPlatforms.includes(p as PlatformOS));
          if (invalidPlatforms.length > 0) {
            errors.push(`Invalid support.platforms: ${invalidPlatforms.join(', ')}. Must be "ios", "android", or "web"`);
          }
        }
      }
    }

    // Optional fields validation
    if (raw.slots !== undefined && !Array.isArray(raw.slots)) {
      errors.push('Plugin "slots" must be an array if present');
    }

    if (raw.requires !== undefined && !Array.isArray(raw.requires)) {
      errors.push('Plugin "requires" must be an array if present');
    }

    if (raw.conflictsWith !== undefined && !Array.isArray(raw.conflictsWith)) {
      errors.push('Plugin "conflictsWith" must be an array if present');
    }

    if (raw.dependencies !== undefined && typeof raw.dependencies !== 'object') {
      errors.push('Plugin "dependencies" must be an object if present');
    }

    if (raw.runtimeContributions !== undefined && !Array.isArray(raw.runtimeContributions)) {
      errors.push('Plugin "runtimeContributions" must be an array if present');
    } else if (raw.runtimeContributions && Array.isArray(raw.runtimeContributions)) {
      // Validate runtime contributions structure
      raw.runtimeContributions.forEach((contribution: any, index: number) => {
        if (!contribution.type || typeof contribution.type !== 'string') {
          errors.push(`Plugin "runtimeContributions[${index}]" must have a "type" field`);
        }
        const validTypes = ['import', 'provider', 'init-step', 'registration', 'root'];
        if (contribution.type && !validTypes.includes(contribution.type)) {
          errors.push(`Plugin "runtimeContributions[${index}].type" must be one of: ${validTypes.join(', ')}`);
        }
      });
    }

    if (raw.patches !== undefined && !Array.isArray(raw.patches)) {
      errors.push('Plugin "patches" must be an array if present');
    } else if (raw.patches && Array.isArray(raw.patches)) {
      // Validate patches structure
      raw.patches.forEach((patch: any, index: number) => {
        if (!patch.type || typeof patch.type !== 'string') {
          errors.push(`Plugin "patches[${index}]" must have a "type" field`);
        }
        if (!patch.file || typeof patch.file !== 'string') {
          errors.push(`Plugin "patches[${index}]" must have a "file" field (relative to project root)`);
        }
        if (!patch.operationId || typeof patch.operationId !== 'string') {
          errors.push(`Plugin "patches[${index}]" must have an "operationId" field for idempotency`);
        }
      });
    }

    if (raw.permissions !== undefined && !Array.isArray(raw.permissions)) {
      errors.push('Plugin "permissions" must be an array if present');
    } else if (raw.permissions && Array.isArray(raw.permissions)) {
      // Validate permissions structure
      raw.permissions.forEach((perm: any, index: number) => {
        if (!perm.permissionId || typeof perm.permissionId !== 'string') {
          errors.push(`Plugin "permissions[${index}]" must have a "permissionId" field`);
        }
        if (perm.mandatory !== undefined && typeof perm.mandatory !== 'boolean') {
          errors.push(`Plugin "permissions[${index}].mandatory" must be a boolean if present`);
        }
      });
    }

    // Validate dependencies structure
    if (raw.dependencies !== undefined && typeof raw.dependencies === 'object') {
      if (raw.dependencies.runtime !== undefined && !Array.isArray(raw.dependencies.runtime)) {
        errors.push('Plugin "dependencies.runtime" must be an array if present');
      } else if (raw.dependencies.runtime && Array.isArray(raw.dependencies.runtime)) {
        raw.dependencies.runtime.forEach((dep: any, index: number) => {
          if (!dep.name || typeof dep.name !== 'string') {
            errors.push(`Plugin "dependencies.runtime[${index}]" must have a "name" field`);
          }
          if (!dep.version || typeof dep.version !== 'string') {
            errors.push(`Plugin "dependencies.runtime[${index}]" must have a "version" field`);
          }
        });
      }
      
      if (raw.dependencies.dev !== undefined && !Array.isArray(raw.dependencies.dev)) {
        errors.push('Plugin "dependencies.dev" must be an array if present');
      } else if (raw.dependencies.dev && Array.isArray(raw.dependencies.dev)) {
        raw.dependencies.dev.forEach((dep: any, index: number) => {
          if (!dep.name || typeof dep.name !== 'string') {
            errors.push(`Plugin "dependencies.dev[${index}]" must have a "name" field`);
          }
          if (!dep.version || typeof dep.version !== 'string') {
            errors.push(`Plugin "dependencies.dev[${index}]" must have a "version" field`);
          }
        });
      }
    }

    // Validate slots structure
    if (raw.slots !== undefined && Array.isArray(raw.slots)) {
      raw.slots.forEach((slot: any, index: number) => {
        if (!slot.slot || typeof slot.slot !== 'string') {
          errors.push(`Plugin "slots[${index}]" must have a "slot" field (string)`);
        }
        if (!slot.mode || !['single', 'multi'].includes(slot.mode)) {
          errors.push(`Plugin "slots[${index}].mode" must be "single" or "multi"`);
        }
      });
    }

    // Validate requires and conflictsWith are arrays of strings
    if (raw.requires !== undefined && Array.isArray(raw.requires)) {
      raw.requires.forEach((req: any, index: number) => {
        if (typeof req !== 'string') {
          errors.push(`Plugin "requires[${index}]" must be a string (plugin ID)`);
        }
      });
    }

    if (raw.conflictsWith !== undefined && Array.isArray(raw.conflictsWith)) {
      raw.conflictsWith.forEach((conflict: any, index: number) => {
        if (typeof conflict !== 'string') {
          errors.push(`Plugin "conflictsWith[${index}]" must be a string (plugin ID)`);
        }
      });
    }

    if (errors.length > 0) {
      throw new CliError(
        `Invalid plugin descriptor at ${descriptorPath}:\n${errors.map(e => `  - ${e}`).join('\n')}`,
        ExitCode.VALIDATION_STATE_FAILURE
      );
    }

    return raw as PluginDescriptor;
  }

  /**
   * Gets a plugin descriptor by ID
   */
  getPlugin(pluginId: PluginId): PluginDescriptor | undefined {
    this.ensureInitialized();
    return this.plugins.get(pluginId);
  }

  /**
   * Gets a plugin descriptor by ID (throws if not found)
   */
  getPluginOrThrow(pluginId: PluginId): PluginDescriptor {
    const plugin = this.getPlugin(pluginId);
    if (!plugin) {
      // Provide helpful suggestions if plugin not found
      const availablePlugins = this.getPluginIds();
      let suggestion = '';
      if (availablePlugins.length > 0) {
        // Find similar plugin IDs (simple prefix match)
        const similar = availablePlugins.filter(id => 
          id.includes(pluginId.split('.')[0]) || pluginId.includes(id.split('.')[0])
        );
        if (similar.length > 0) {
          suggestion = `\n\nDid you mean one of these?\n  - ${similar.slice(0, 5).join('\n  - ')}`;
        } else {
          suggestion = `\n\nAvailable plugins: ${availablePlugins.slice(0, 10).join(', ')}${availablePlugins.length > 10 ? ` (and ${availablePlugins.length - 10} more)` : ''}`;
        }
      } else {
        suggestion = '\n\nNo plugins are currently available in the registry.';
      }
      
      throw new CliError(
        `Plugin "${pluginId}" not found in registry.${suggestion}\n\n` +
        `Make sure the plugin exists in templates/plugins/${pluginId}/ with a valid plugin.json descriptor.`,
        ExitCode.VALIDATION_STATE_FAILURE
      );
    }
    return plugin;
  }

  /**
   * Lists all registered plugins
   */
  listPlugins(): PluginDescriptor[] {
    this.ensureInitialized();
    return Array.from(this.plugins.values());
  }

  /**
   * Lists plugins by category
   */
  listPluginsByCategory(category: PluginCategory): PluginDescriptor[] {
    this.ensureInitialized();
    return this.listPlugins().filter(p => p.category === category);
  }

  /**
   * Lists plugins that support a given target
   */
  listPluginsByTarget(target: RnsTarget): PluginDescriptor[] {
    this.ensureInitialized();
    return this.listPlugins().filter(p => p.support.targets.includes(target));
  }

  /**
   * Checks if a plugin exists
   */
  hasPlugin(pluginId: PluginId): boolean {
    this.ensureInitialized();
    return this.plugins.has(pluginId);
  }

  /**
   * Gets all plugin IDs
   */
  getPluginIds(): PluginId[] {
    this.ensureInitialized();
    return Array.from(this.plugins.keys());
  }

  /**
   * Ensures registry is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new CliError(
        'Plugin registry not initialized. Call initialize() first.',
        ExitCode.GENERIC_FAILURE
      );
    }
  }
}

/**
 * Global plugin registry instance
 */
let globalRegistry: PluginRegistry | null = null;

/**
 * Gets or creates the global plugin registry instance
 */
export function getPluginRegistry(): PluginRegistry {
  if (!globalRegistry) {
    globalRegistry = new PluginRegistry();
  }
  return globalRegistry;
}

/**
 * Initializes the global plugin registry
 */
export async function initializePluginRegistry(): Promise<void> {
  const registry = getPluginRegistry();
  await registry.initialize();
}
