/**
 * FILE: src/lib/module-registry.ts
 * PURPOSE: Module registry system (section 21)
 * OWNERSHIP: CLI
 * 
 * This registry loads and manages module descriptors from templates/modules/
 * It provides discovery, validation, and query capabilities for the module framework.
 */

import { join } from 'path';
import { readdirSync } from 'fs';
import { resolveCliRoot } from './pack-locations';
import { pathExists, isDirectory, readJsonFile } from './fs';
import { CliError, ExitCode } from './errors';
import type { ModuleDescriptor, ModuleId, ModuleCategory } from './types/module';
import type { RnsTarget, PlatformOS } from './types/common';

/**
 * Module descriptor file name
 */
export const MODULE_DESCRIPTOR_FILE = 'module.json';

/**
 * Module registry - manages module descriptors
 */
export class ModuleRegistry {
  private modules: Map<ModuleId, ModuleDescriptor> = new Map();
  private initialized: boolean = false;

  /**
   * Initializes the registry by discovering and loading all modules
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const cliRoot = resolveCliRoot();
    const modulesDir = join(cliRoot, 'templates', 'modules');

    // If modules directory doesn't exist, registry is empty
    if (!pathExists(modulesDir) || !isDirectory(modulesDir)) {
      this.initialized = true;
      return;
    }

    // Scan for module directories
    const entries = readdirSync(modulesDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const modulePath = join(modulesDir, entry.name);
      const descriptorPath = join(modulePath, MODULE_DESCRIPTOR_FILE);

      // Skip directories without module.json
      if (!pathExists(descriptorPath)) {
        continue;
      }

      try {
        const descriptor = await this.loadModuleDescriptor(descriptorPath, entry.name);
        
        // Validate module ID matches directory name
        if (descriptor.id !== entry.name) {
          throw new CliError(
            `Module descriptor id "${descriptor.id}" does not match directory name "${entry.name}"`,
            ExitCode.VALIDATION_STATE_FAILURE
          );
        }

        // Check for duplicate IDs
        if (this.modules.has(descriptor.id)) {
          throw new CliError(
            `Duplicate module ID "${descriptor.id}" found at ${modulePath}`,
            ExitCode.VALIDATION_STATE_FAILURE
          );
        }

        this.modules.set(descriptor.id, descriptor);
      } catch (error) {
        // Log error but continue loading other modules
        if (error instanceof CliError) {
          throw error;
        }
        throw new CliError(
          `Failed to load module descriptor from ${descriptorPath}: ${error instanceof Error ? error.message : String(error)}`,
          ExitCode.VALIDATION_STATE_FAILURE
        );
      }
    }

    this.initialized = true;
  }

  /**
   * Loads and validates a module descriptor from a file
   */
  private async loadModuleDescriptor(
    descriptorPath: string,
    expectedId: string
  ): Promise<ModuleDescriptor> {
    const raw = readJsonFile<any>(descriptorPath);
    return this.validateModuleDescriptor(raw, descriptorPath, expectedId);
  }

  /**
   * Validates module descriptor structure
   */
  private validateModuleDescriptor(
    raw: any,
    descriptorPath: string,
    expectedId: string
  ): ModuleDescriptor {
    const errors: string[] = [];

    // Required fields
    if (!raw.id || typeof raw.id !== 'string') {
      errors.push('Module descriptor must have a string "id" field');
    } else if (raw.id !== expectedId) {
      errors.push(`Module descriptor id "${raw.id}" does not match expected "${expectedId}"`);
    }

    if (!raw.name || typeof raw.name !== 'string') {
      errors.push('Module descriptor must have a string "name" field');
    }

    if (!raw.version || typeof raw.version !== 'string') {
      errors.push('Module descriptor must have a string "version" field');
    }

    if (!raw.category || typeof raw.category !== 'string') {
      errors.push('Module descriptor must have a string "category" field');
    } else {
      const validCategories: ModuleCategory[] = [
        'auth', 'user', 'commerce', 'social', 'content', 'chat', 'admin', 'other'
      ];
      if (!validCategories.includes(raw.category)) {
        errors.push(`Invalid category "${raw.category}". Must be one of: ${validCategories.join(', ')}`);
      }
    }

    if (!raw.support || typeof raw.support !== 'object') {
      errors.push('Module descriptor must have a "support" object field');
    } else {
      if (!raw.support.targets || !Array.isArray(raw.support.targets)) {
        errors.push('Module "support" must have a "targets" array');
      } else {
        const validTargets = ['expo', 'bare'];
        const invalidTargets = raw.support.targets.filter((t: string) => !validTargets.includes(t));
        if (invalidTargets.length > 0) {
          errors.push(`Invalid support.targets: ${invalidTargets.join(', ')}. Must be "expo" or "bare"`);
        }
      }

      if (raw.support.platforms !== undefined) {
        if (!Array.isArray(raw.support.platforms)) {
          errors.push('Module "support.platforms" must be an array if present');
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
    if (raw.requires !== undefined && typeof raw.requires !== 'object') {
      errors.push('Module "requires" must be an object if present');
    } else if (raw.requires && typeof raw.requires === 'object') {
      if (raw.requires.plugins !== undefined && !Array.isArray(raw.requires.plugins)) {
        errors.push('Module "requires.plugins" must be an array if present');
      }
      if (raw.requires.capabilities !== undefined && !Array.isArray(raw.requires.capabilities)) {
        errors.push('Module "requires.capabilities" must be an array if present');
      }
    }

    if (raw.options !== undefined && !Array.isArray(raw.options)) {
      errors.push('Module "options" must be an array if present');
    } else if (raw.options && Array.isArray(raw.options)) {
      raw.options.forEach((opt: any, index: number) => {
        if (!opt.key || typeof opt.key !== 'string') {
          errors.push(`Module "options[${index}]" must have a "key" field (string)`);
        }
        if (!opt.label || typeof opt.label !== 'string') {
          errors.push(`Module "options[${index}]" must have a "label" field (string)`);
        }
        if (!opt.type || typeof opt.type !== 'string') {
          errors.push(`Module "options[${index}]" must have a "type" field (string)`);
        } else {
          const validTypes = ['string', 'boolean', 'select', 'multi-select'];
          if (!validTypes.includes(opt.type)) {
            errors.push(`Module "options[${index}].type" must be one of: ${validTypes.join(', ')}`);
          }
        }
      });
    }

    if (raw.dependencies !== undefined && typeof raw.dependencies !== 'object') {
      errors.push('Module "dependencies" must be an object if present');
    } else if (raw.dependencies && typeof raw.dependencies === 'object') {
      if (raw.dependencies.runtime !== undefined && !Array.isArray(raw.dependencies.runtime)) {
        errors.push('Module "dependencies.runtime" must be an array if present');
      }
      if (raw.dependencies.dev !== undefined && !Array.isArray(raw.dependencies.dev)) {
        errors.push('Module "dependencies.dev" must be an array if present');
      }
    }

    if (raw.runtimeContributions !== undefined && !Array.isArray(raw.runtimeContributions)) {
      errors.push('Module "runtimeContributions" must be an array if present');
    }

    if (raw.permissions !== undefined && !Array.isArray(raw.permissions)) {
      errors.push('Module "permissions" must be an array if present');
    }

    if (raw.generates !== undefined && typeof raw.generates !== 'object') {
      errors.push('Module "generates" must be an object if present');
    }

    if (errors.length > 0) {
      throw new CliError(
        `Invalid module descriptor at ${descriptorPath}:\n${errors.map(e => `  - ${e}`).join('\n')}`,
        ExitCode.VALIDATION_STATE_FAILURE
      );
    }

    return raw as ModuleDescriptor;
  }

  /**
   * Gets a module descriptor by ID
   */
  getModule(moduleId: ModuleId): ModuleDescriptor | undefined {
    this.ensureInitialized();
    return this.modules.get(moduleId);
  }

  /**
   * Gets a module descriptor by ID (throws if not found)
   */
  getModuleOrThrow(moduleId: ModuleId): ModuleDescriptor {
    const module = this.getModule(moduleId);
    if (!module) {
      // Provide helpful suggestions if module not found
      const availableModules = this.getModuleIds();
      let suggestion = '';
      if (availableModules.length > 0) {
        // Find similar module IDs (simple prefix match)
        const similar = availableModules.filter(id => 
          id.includes(moduleId.split('.')[0]) || moduleId.includes(id.split('.')[0])
        );
        if (similar.length > 0) {
          suggestion = `\n\nDid you mean one of these?\n  - ${similar.slice(0, 5).join('\n  - ')}`;
        } else {
          suggestion = `\n\nAvailable modules: ${availableModules.slice(0, 10).join(', ')}${availableModules.length > 10 ? ` (and ${availableModules.length - 10} more)` : ''}`;
        }
      } else {
        suggestion = '\n\nNo modules are currently available in the registry.';
      }
      
      throw new CliError(
        `Module "${moduleId}" not found in registry.${suggestion}\n\n` +
        `Make sure the module exists in templates/modules/${moduleId}/ with a valid module.json descriptor.`,
        ExitCode.VALIDATION_STATE_FAILURE
      );
    }
    return module;
  }

  /**
   * Lists all registered modules
   */
  listModules(): ModuleDescriptor[] {
    this.ensureInitialized();
    return Array.from(this.modules.values());
  }

  /**
   * Lists modules by category
   */
  listModulesByCategory(category: ModuleCategory): ModuleDescriptor[] {
    this.ensureInitialized();
    return this.listModules().filter(m => m.category === category);
  }

  /**
   * Lists modules that support a given target
   */
  listModulesByTarget(target: RnsTarget): ModuleDescriptor[] {
    this.ensureInitialized();
    return this.listModules().filter(m => m.support.targets.includes(target));
  }

  /**
   * Checks if a module exists
   */
  hasModule(moduleId: ModuleId): boolean {
    this.ensureInitialized();
    return this.modules.has(moduleId);
  }

  /**
   * Gets all module IDs
   */
  getModuleIds(): ModuleId[] {
    this.ensureInitialized();
    return Array.from(this.modules.keys());
  }

  /**
   * Ensures registry is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new CliError(
        'Module registry not initialized. Call initialize() first.',
        ExitCode.GENERIC_FAILURE
      );
    }
  }
}

/**
 * Global module registry instance
 */
let globalRegistry: ModuleRegistry | null = null;

/**
 * Gets or creates the global module registry instance
 */
export function getModuleRegistry(): ModuleRegistry {
  if (!globalRegistry) {
    globalRegistry = new ModuleRegistry();
  }
  return globalRegistry;
}

/**
 * Initializes the global module registry
 */
export async function initializeModuleRegistry(): Promise<void> {
  const registry = getModuleRegistry();
  await registry.initialize();
}
