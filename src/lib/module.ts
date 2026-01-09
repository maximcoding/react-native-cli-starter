/**
 * FILE: src/lib/module.ts
 * PURPOSE: Module command implementation (section 22)
 * OWNERSHIP: CLI
 * 
 * This module provides the implementation for module commands:
 * - list: List available modules
 * - add: Generate modules
 * - status: Show installed vs available
 * - doctor: Module-specific validation
 */

import { readManifest, validateProjectInitialized } from './manifest';
import { getModuleRegistry, initializeModuleRegistry } from './module-registry';
import { generateModule } from './module-generator';
import { promptMultiSelect, promptText, setPromptLogger } from './prompts';
import { CliError, ExitCode } from './errors';
import type { RuntimeContext } from './runtime';
import type { ModuleDescriptor, ModuleId, ModuleGenerationContext } from './types/module';
import type { InstalledPluginRecord } from './types/manifest';

/**
 * Options for list command
 */
export interface ListModulesOptions {
  json?: boolean;
  category?: string;
  target?: string;
}

/**
 * Options for add command
 */
export interface ModuleCommandOptions {
  yes?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
}

/**
 * Module command result
 */
export interface ModuleCommandResult {
  moduleId: string;
  success: boolean;
  skipped: boolean;
  error?: string;
  summary?: {
    filesGenerated?: number;
    directoriesGenerated?: number;
    registrations?: number;
  };
}

/**
 * Module status information
 */
export interface ModuleStatus {
  installed: Array<{
    id: string;
    name: string;
    version: string;
    installedAt: string;
    available: boolean;
    descriptor?: ModuleDescriptor;
  }>;
  available: Array<{
    id: string;
    name: string;
    version: string;
    description?: string;
    category: string;
    installed: boolean;
  }>;
  orphaned: Array<{
    id: string;
    version: string;
    installedAt: string;
  }>;
}

/**
 * Creates a module generation context from runtime context
 */
function createModuleGenerationContext(
  context: RuntimeContext,
  moduleId: ModuleId,
  options: Record<string, unknown> = {}
): ModuleGenerationContext {
  const manifest = readManifest(context.resolvedRoot);
  if (!manifest) {
    throw new CliError(
      'Project not initialized. Run "rns init" first.',
      ExitCode.NOT_INITIALIZED
    );
  }

  return {
    projectRoot: context.resolvedRoot,
    target: manifest.target,
    language: manifest.language,
    options,
    installedPlugins: manifest.plugins || [],
    moduleId,
  };
}

/**
 * Lists all available modules from the registry
 */
export async function listModules(
  options: ListModulesOptions = {},
  context: RuntimeContext
): Promise<void> {
  setPromptLogger(context.logger);
  await initializeModuleRegistry();
  const registry = getModuleRegistry();
  let modules = registry.listModules();

  // Filter by category if specified
  if (options.category) {
    modules = modules.filter(m => m.category === options.category);
  }

  // Filter by target if specified
  if (options.target) {
    modules = modules.filter(m => m.support.targets.includes(options.target as any));
  }

  if (options.json) {
    // JSON output
    const output = modules.map(m => ({
      id: m.id,
      name: m.name,
      description: m.description,
      version: m.version,
      category: m.category,
      supports: {
        targets: m.support.targets,
        platforms: m.support.platforms,
      },
      generates: m.generates,
    }));
    console.log(JSON.stringify(output, null, 2));
  } else {
    // Human-readable output
    context.logger.info('Available Modules:');
    if (modules.length === 0) {
      context.logger.info('  No modules available.');
      return;
    }

    for (const module of modules) {
      context.logger.info(`  ${module.id} (${module.name}) v${module.version}`);
      if (module.description) {
        context.logger.info(`    Description: ${module.description}`);
      }
      context.logger.info(`    Category: ${module.category}`);
      context.logger.info(`    Supports: ${module.support.targets.join(', ')}`);
      if (module.generates) {
        const generates = [];
        if (module.generates.screens) generates.push(`${module.generates.screens.length} screen(s)`);
        if (module.generates.flows) generates.push(`${module.generates.flows.length} flow(s)`);
        if (module.generates.domain) generates.push(`${module.generates.domain.length} domain model(s)`);
        if (generates.length > 0) {
          context.logger.info(`    Generates: ${generates.join(', ')}`);
        }
      }
      context.logger.info('');
    }
  }
}

/**
 * Generates one or more modules
 */
export async function addModules(
  moduleIds: string[],
  options: ModuleCommandOptions,
  context: RuntimeContext
): Promise<ModuleCommandResult[]> {
  setPromptLogger(context.logger);
  validateProjectInitialized(context.resolvedRoot);
  
  await initializeModuleRegistry();
  const registry = getModuleRegistry();
  
  const results: ModuleCommandResult[] = [];

  // If no module IDs provided, show interactive selection
  if (moduleIds.length === 0) {
    const manifest = readManifest(context.resolvedRoot);
    if (!manifest) {
      throw new CliError(
        'Project not initialized. Run "rns init" first.',
        ExitCode.NOT_INITIALIZED
      );
    }

    const availableModules = registry.listModulesByTarget(manifest.target);
    
    if (availableModules.length === 0) {
      throw new CliError(
        `No modules available for target "${manifest.target}"`,
        ExitCode.VALIDATION_STATE_FAILURE
      );
    }

    const choices = availableModules.map(m => ({
      label: `${m.id} - ${m.name}${m.description ? `: ${m.description}` : ''}`,
      value: m.id,
    }));

    const selected = await promptMultiSelect(
      'Select modules to generate:',
      choices
    );

    if (selected.length === 0) {
      context.logger.info('No modules selected.');
      return results;
    }

    moduleIds = selected;
  }

  // Generate each module
  for (const moduleId of moduleIds) {
    try {
      // Get module descriptor
      const descriptor = registry.getModuleOrThrow(moduleId);
      
      // Check if already installed
      const manifest = readManifest(context.resolvedRoot);
      if (manifest && manifest.modules) {
        const installed = manifest.modules.find(m => m.id === moduleId);
        if (installed) {
          results.push({
            moduleId,
            success: false,
            skipped: true,
            error: `Module "${moduleId}" is already installed (v${installed.version})`,
          });
          continue;
        }
      }

      // Collect generation options if module has them
      let generationOptions: Record<string, unknown> = {};
      if (descriptor.options && descriptor.options.length > 0 && !options.yes) {
        context.logger.info(`\nCollecting options for "${moduleId}":`);
        for (const opt of descriptor.options) {
          if (opt.type === 'boolean') {
            const value = await promptText(
              `${opt.label}${opt.required ? ' (required)' : ''}: [y/n]`,
              String(opt.defaultValue || false)
            );
            generationOptions[opt.key] = value.toLowerCase() === 'y' || value === 'true';
          } else if (opt.type === 'select') {
            const choices = (opt.choices || []).map(c => c.label);
            const value = await promptText(
              `${opt.label}${opt.required ? ' (required)' : ''}: ${choices.join(' | ')}`,
              String(opt.defaultValue || '')
            );
            generationOptions[opt.key] = value;
          } else if (opt.type === 'string') {
            const value = await promptText(
              `${opt.label}${opt.required ? ' (required)' : ''}:`,
              String(opt.defaultValue || '')
            );
            generationOptions[opt.key] = value;
          } else {
            // Use default value
            generationOptions[opt.key] = opt.defaultValue;
          }
        }
      } else if (descriptor.options) {
        // Use default values if --yes flag
        for (const opt of descriptor.options) {
          generationOptions[opt.key] = opt.defaultValue;
        }
      }

      // Create generation context
      const genContext = createModuleGenerationContext(context, moduleId, generationOptions);
      
      // Generate module
      const generationResult = await generateModule(genContext, descriptor, options.dryRun || false);
      
      if (generationResult.success) {
        results.push({
          moduleId,
          success: true,
          skipped: false,
          summary: {
            filesGenerated: generationResult.generated?.files.length || 0,
            directoriesGenerated: generationResult.generated?.directories.length || 0,
            registrations: generationResult.registrations?.length || 0,
          },
        });

        context.logger.info(`✓ ${moduleId} v${descriptor.version} generated successfully`);
        if (options.verbose) {
          if (generationResult.generated) {
            context.logger.info(`  - Files generated: ${generationResult.generated.files.length}`);
            context.logger.info(`  - Directories generated: ${generationResult.generated.directories.length}`);
          }
          if (generationResult.registrations) {
            context.logger.info(`  - Registrations: ${generationResult.registrations.length}`);
          }
        }
      } else {
        const errorMessage = generationResult.errors?.join('; ') || 'Unknown error';
        results.push({
          moduleId,
          success: false,
          skipped: false,
          error: errorMessage,
        });
        context.logger.error(`✗ ${moduleId} generation failed: ${errorMessage}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({
        moduleId,
        success: false,
        skipped: false,
        error: errorMessage,
      });
      context.logger.error(`✗ ${moduleId} generation failed: ${errorMessage}`);
    }
  }

  return results;
}

/**
 * Gets module status (installed vs available)
 */
export async function getModuleStatus(
  context: RuntimeContext
): Promise<ModuleStatus> {
  setPromptLogger(context.logger);
  validateProjectInitialized(context.resolvedRoot);
  
  await initializeModuleRegistry();
  const registry = getModuleRegistry();
  const manifest = readManifest(context.resolvedRoot);
  
  if (!manifest) {
    throw new CliError(
      'Project not initialized. Run "rns init" first.',
      ExitCode.NOT_INITIALIZED
    );
  }

  const installed = manifest.modules || [];
  const available = registry.listModules();
  const availableIds = new Set(available.map(m => m.id));

  const status: ModuleStatus = {
    installed: installed.map(m => {
      const descriptor = registry.getModule(m.id);
      return {
        id: m.id,
        name: descriptor?.name || m.id,
        version: m.version,
        installedAt: m.installedAt,
        available: availableIds.has(m.id),
        descriptor,
      };
    }),
    available: available.map(m => {
      const installedModule = installed.find(im => im.id === m.id);
      return {
        id: m.id,
        name: m.name,
        version: m.version,
        description: m.description,
        category: m.category,
        installed: !!installedModule,
      };
    }),
    orphaned: installed
      .filter(m => !availableIds.has(m.id))
      .map(m => ({
        id: m.id,
        version: m.version,
        installedAt: m.installedAt,
      })),
  };

  return status;
}

/**
 * Runs module-specific doctor validation
 */
export async function runModuleDoctor(
  context: RuntimeContext,
  fix: boolean = false
): Promise<void> {
  setPromptLogger(context.logger);
  validateProjectInitialized(context.resolvedRoot);
  
  await initializeModuleRegistry();
  const registry = getModuleRegistry();
  const manifest = readManifest(context.resolvedRoot);
  
  if (!manifest) {
    throw new CliError(
      'Project not initialized. Run "rns init" first.',
      ExitCode.NOT_INITIALIZED
    );
  }

  const issues: string[] = [];
  const installed = manifest.modules || [];

  context.logger.info('Module Doctor:');
  context.logger.info('');

  // Check installed modules exist in registry
  for (const module of installed) {
    if (!registry.hasModule(module.id)) {
      issues.push(`Module "${module.id}" is installed but not found in registry`);
      context.logger.error(`✗ Module "${module.id}" is orphaned (not in registry)`);
    } else {
      context.logger.info(`✓ Module "${module.id}" is valid`);
    }
  }

  // Check module directories exist
  const { pathExists } = await import('./fs');
  const { join } = await import('path');
  
  for (const module of installed) {
    const moduleDir = join(context.resolvedRoot, 'src', 'modules', module.id);
    if (!pathExists(moduleDir)) {
      issues.push(`Module directory for "${module.id}" not found at ${moduleDir}`);
      context.logger.error(`✗ Module directory missing: src/modules/${module.id}`);
    } else {
      context.logger.info(`✓ Module directory exists: src/modules/${module.id}`);
    }
  }

  if (issues.length === 0) {
    context.logger.info('');
    context.logger.info('✓ All installed modules are valid');
    context.logger.info('✓ All module directories exist');
  } else {
    context.logger.info('');
    context.logger.error(`Found ${issues.length} issue(s):`);
    issues.forEach(issue => context.logger.error(`  - ${issue}`));
  }
}
