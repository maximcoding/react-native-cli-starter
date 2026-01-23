/**
 * FILE: src/lib/plugin.ts
 * PURPOSE: Plugin command implementation (section 20)
 * OWNERSHIP: CLI
 * 
 * This module provides the implementation for plugin commands:
 * - list: List available plugins
 * - add: Install plugins
 * - remove: Remove plugins
 * - status: Show installed vs available
 * - doctor: Plugin-specific validation
 */

import { readManifest, validateProjectInitialized } from './manifest';
import { getPluginRegistry, initializePluginRegistry } from './plugin-registry';
import { createModulator } from './modulator';
import { promptMultiSelect, promptConfirm, setPromptLogger } from './prompts';
import { CliError, ExitCode } from './errors';
import type { RuntimeContext } from './runtime';
import type { ModulatorContext } from './types/modulator';
import type { PluginDescriptor, PluginId } from './types/plugin';
import type { InstalledPluginRecord } from './types/manifest';

/**
 * Options for list command
 */
export interface ListPluginsOptions {
  json?: boolean;
  category?: string;
  target?: string;
}

/**
 * Options for add/remove commands
 */
export interface PluginCommandOptions {
  yes?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
}

/**
 * Plugin installation result
 */
export interface PluginInstallResult {
  pluginId: string;
  success: boolean;
  skipped: boolean;
  error?: string;
  summary?: {
    packAttached?: string;
    dependenciesInstalled?: { runtime: number; dev: number };
    runtimeWiring?: number;
    patchesApplied?: number;
  };
}

/**
 * Plugin status information
 */
export interface PluginStatus {
  installed: Array<{
    id: string;
    name: string;
    version: string;
    installedAt: string;
    available: boolean;
    descriptor?: PluginDescriptor;
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
 * Creates a modulator context from runtime context
 */
function createModulatorContext(context: RuntimeContext): ModulatorContext {
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
    packageManager: manifest.packageManager,
    manifest,
    runtimeContext: context,
  };
}

/**
 * Lists all available plugins from the registry
 */
export async function listPlugins(
  options: ListPluginsOptions = {},
  context: RuntimeContext
): Promise<void> {
  setPromptLogger(context.logger);
  await initializePluginRegistry();
  const registry = getPluginRegistry();
  let plugins = registry.listPlugins();

  // Filter by category if specified
  if (options.category) {
    plugins = plugins.filter(p => p.category === options.category);
  }

  // Filter by target if specified
  if (options.target) {
    plugins = plugins.filter(p => p.support.targets.includes(options.target as any));
  }

  if (options.json) {
    // JSON output
    const output = plugins.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      version: p.version,
      category: p.category,
      tier: p.tier,
      supports: {
        targets: p.support.targets,
        platforms: p.support.platforms,
      },
    }));
    console.log(JSON.stringify(output, null, 2));
  } else {
    // Human-readable output
    context.logger.info('Available Plugins:');
    if (plugins.length === 0) {
      context.logger.info('  No plugins available.');
      return;
    }

    for (const plugin of plugins) {
      context.logger.info(`  ${plugin.id} (${plugin.name}) v${plugin.version}`);
      if (plugin.description) {
        context.logger.info(`    Description: ${plugin.description}`);
      }
      context.logger.info(`    Category: ${plugin.category}`);
      context.logger.info(`    Supports: ${plugin.support.targets.join(', ')}`);
      if (plugin.tier) {
        context.logger.info(`    Tier: ${plugin.tier}`);
      }
      context.logger.info('');
    }
  }
}

/**
 * Installs one or more plugins
 */
export async function addPlugins(
  pluginIds: string[],
  options: PluginCommandOptions,
  context: RuntimeContext
): Promise<PluginInstallResult[]> {
  setPromptLogger(context.logger);
  validateProjectInitialized(context.resolvedRoot);
  
  await initializePluginRegistry();
  const registry = getPluginRegistry();
  const modulator = createModulator();
  
  const results: PluginInstallResult[] = [];

  // If no plugin IDs provided, show interactive selection
  if (pluginIds.length === 0) {
    let modulatorContext = createModulatorContext(context);
    const availablePlugins = registry.listPluginsByTarget(modulatorContext.target);
    
    if (availablePlugins.length === 0) {
      throw new CliError(
        `No plugins available for target "${modulatorContext.target}"`,
        ExitCode.VALIDATION_STATE_FAILURE
      );
    }

    const choices = availablePlugins.map(p => ({
      label: `${p.id} - ${p.name}${p.description ? `: ${p.description}` : ''}`,
      value: p.id,
    }));

    const selected = await promptMultiSelect(
      'Select plugins to install:',
      choices
    );

    if (selected.length === 0) {
      context.logger.info('No plugins selected.');
      return results;
    }

    pluginIds = selected;
  }

  // Install each plugin
  for (const pluginId of pluginIds) {
    try {
      // Refresh modulator context to get latest manifest (after previous installations)
      const modulatorContext = createModulatorContext(context);
      
      // Check if already installed
      const installed = modulatorContext.manifest.plugins.find(p => p.id === pluginId);
      if (installed) {
        results.push({
          pluginId,
          success: false,
          skipped: true,
          error: `Plugin "${pluginId}" is already installed (v${installed.version})`,
        });
        continue;
      }

      // Plan installation
      const plan = await modulator.plan(modulatorContext, pluginId, 'install');
      
      // Show plan if dry-run
      if (options.dryRun) {
        context.logger.info(`\nDry-run plan for "${pluginId}":`);
        context.logger.info(`  Dependencies: ${plan.dependencies.runtime.length} runtime, ${plan.dependencies.dev.length} dev`);
        context.logger.info(`  Runtime wiring: ${plan.runtimeWiring.length} operations`);
        context.logger.info(`  Patches: ${plan.patches.length} operations`);
        context.logger.info(`  Permissions: ${plan.permissions.permissionIds.length} permissions`);
        results.push({
          pluginId,
          success: true,
          skipped: false,
          summary: {
            dependenciesInstalled: {
              runtime: plan.dependencies.runtime.length,
              dev: plan.dependencies.dev.length,
            },
            runtimeWiring: plan.runtimeWiring.length,
            patchesApplied: plan.patches.length,
          },
        });
        continue;
      }

      // Apply installation
      const result = await modulator.apply(modulatorContext, plan, false);
      
      if (result.success) {
        const descriptor = registry.getPlugin(pluginId);
        // Use resolvePackDestinationPath to get category-based path
        const { resolvePackDestinationPath } = await import('./pack-locations');
        const packPath = resolvePackDestinationPath('plugin', pluginId, context.resolvedRoot);
        const relativePackPath = packPath.replace(context.resolvedRoot + '/', '');
        
        results.push({
          pluginId,
          success: true,
          skipped: false,
          summary: {
            packAttached: relativePackPath,
            dependenciesInstalled: {
              runtime: plan.dependencies.runtime.length,
              dev: plan.dependencies.dev.length,
            },
            runtimeWiring: plan.runtimeWiring.length,
            patchesApplied: plan.patches.length,
          },
        });

        context.logger.info(`✓ ${pluginId} v${descriptor?.version || 'unknown'} installed successfully`);
        if (options.verbose) {
          context.logger.info(`  - Pack attached: ${packPath}`);
          context.logger.info(`  - Dependencies: ${plan.dependencies.runtime.length} runtime, ${plan.dependencies.dev.length} dev`);
          context.logger.info(`  - Runtime wiring: ${plan.runtimeWiring.length} contributions`);
          context.logger.info(`  - Patches applied: ${plan.patches.length}`);
        }
      } else {
        results.push({
          pluginId,
          success: false,
          skipped: false,
          error: result.errors.join('; '),
        });
        context.logger.error(`✗ ${pluginId} installation failed: ${result.errors.join('; ')}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({
        pluginId,
        success: false,
        skipped: false,
        error: errorMessage,
      });
      context.logger.error(`✗ ${pluginId} installation failed: ${errorMessage}`);
    }
  }

  return results;
}

/**
 * Removes one or more plugins
 */
export async function removePlugins(
  pluginIds: string[],
  options: PluginCommandOptions,
  context: RuntimeContext
): Promise<PluginInstallResult[]> {
  setPromptLogger(context.logger);
  validateProjectInitialized(context.resolvedRoot);
  
  await initializePluginRegistry();
  const modulator = createModulator();
  
  const results: PluginInstallResult[] = [];

  // If no plugin IDs provided, show interactive selection from installed plugins
  if (pluginIds.length === 0) {
    const modulatorContext = createModulatorContext(context);
    const installedPlugins = modulatorContext.manifest.plugins;
    
    if (installedPlugins.length === 0) {
      context.logger.info('No plugins installed.');
      return results;
    }

    const choices = installedPlugins.map(p => ({
      label: `${p.id} v${p.version} (installed ${p.installedAt})`,
      value: p.id,
    }));

    const selected = await promptMultiSelect(
      'Select plugins to remove:',
      choices
    );

    if (selected.length === 0) {
      context.logger.info('No plugins selected.');
      return results;
    }

    pluginIds = selected;
  }

  // Confirm removal unless --yes flag
  if (!options.yes && !options.dryRun) {
    const confirmed = await promptConfirm(
      `Remove ${pluginIds.length} plugin(s)? This will remove plugin code and dependencies.`,
      false
    );
    if (!confirmed) {
      context.logger.info('Removal cancelled.');
      return results;
    }
  }

  // Remove each plugin
  for (const pluginId of pluginIds) {
    try {
      // Refresh modulator context to get latest manifest (after previous removals)
      const modulatorContext = createModulatorContext(context);
      
      // Check if installed
      const installed = modulatorContext.manifest.plugins.find(p => p.id === pluginId);
      if (!installed) {
        results.push({
          pluginId,
          success: false,
          skipped: true,
          error: `Plugin "${pluginId}" is not installed`,
        });
        continue;
      }

      // Plan removal
      const plan = await modulator.plan(modulatorContext, pluginId, 'remove');
      
      // Show plan if dry-run
      if (options.dryRun) {
        context.logger.info(`\nDry-run plan for removing "${pluginId}":`);
        context.logger.info(`  Files to remove: ${plan.filesToRemove?.length || 0}`);
        results.push({
          pluginId,
          success: true,
          skipped: false,
        });
        continue;
      }

      // Apply removal
      const result = await modulator.remove(modulatorContext, pluginId, false);
      
      if (result.success) {
        results.push({
          pluginId,
          success: true,
          skipped: false,
        });
        context.logger.info(`✓ ${pluginId} removed successfully`);
        if (options.verbose) {
          // Use resolvePackDestinationPath to get category-based path
          const { resolvePackDestinationPath } = await import('./pack-locations');
          const packPath = resolvePackDestinationPath('plugin', pluginId, context.resolvedRoot);
          const relativePackPath = packPath.replace(context.resolvedRoot + '/', '');
          context.logger.info(`  - Pack removed: ${relativePackPath}`);
        }
      } else {
        results.push({
          pluginId,
          success: false,
          skipped: false,
          error: result.errors.join('; '),
        });
        context.logger.error(`✗ ${pluginId} removal failed: ${result.errors.join('; ')}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({
        pluginId,
        success: false,
        skipped: false,
        error: errorMessage,
      });
      context.logger.error(`✗ ${pluginId} removal failed: ${errorMessage}`);
    }
  }

  return results;
}

/**
 * Gets plugin status (installed vs available)
 */
export async function getPluginStatus(
  context: RuntimeContext
): Promise<PluginStatus> {
  setPromptLogger(context.logger);
  validateProjectInitialized(context.resolvedRoot);
  
  await initializePluginRegistry();
  const registry = getPluginRegistry();
  const manifest = readManifest(context.resolvedRoot);
  
  if (!manifest) {
    throw new CliError(
      'Project not initialized. Run "rns init" first.',
      ExitCode.NOT_INITIALIZED
    );
  }

  const installed = manifest.plugins || [];
  const available = registry.listPlugins();
  const availableIds = new Set(available.map(p => p.id));

  const status: PluginStatus = {
    installed: installed.map(p => {
      const descriptor = registry.getPlugin(p.id);
      return {
        id: p.id,
        name: descriptor?.name || p.id,
        version: p.version,
        installedAt: p.installedAt,
        available: availableIds.has(p.id),
        descriptor,
      };
    }),
    available: available.map(p => {
      const installedPlugin = installed.find(ip => ip.id === p.id);
      return {
        id: p.id,
        name: p.name,
        version: p.version,
        description: p.description,
        category: p.category,
        installed: !!installedPlugin,
      };
    }),
    orphaned: installed
      .filter(p => !availableIds.has(p.id))
      .map(p => ({
        id: p.id,
        version: p.version,
        installedAt: p.installedAt,
      })),
  };

  return status;
}

/**
 * Runs plugin-specific doctor validation
 */
export async function runPluginDoctor(
  context: RuntimeContext,
  fix: boolean = false
): Promise<void> {
  setPromptLogger(context.logger);
  validateProjectInitialized(context.resolvedRoot);
  
  await initializePluginRegistry();
  const registry = getPluginRegistry();
  const manifest = readManifest(context.resolvedRoot);
  
  if (!manifest) {
    throw new CliError(
      'Project not initialized. Run "rns init" first.',
      ExitCode.NOT_INITIALIZED
    );
  }

  const issues: string[] = [];
  const installed = manifest.plugins || [];

  context.logger.info('Plugin Doctor:');
  context.logger.info('');

  // Check installed plugins exist in registry
  for (const plugin of installed) {
    if (!registry.hasPlugin(plugin.id)) {
      issues.push(`Plugin "${plugin.id}" is installed but not found in registry`);
      context.logger.error(`✗ Plugin "${plugin.id}" is orphaned (not in registry)`);
    } else {
      context.logger.info(`✓ Plugin "${plugin.id}" is valid`);
    }
  }

  // Check plugin packages exist
  const { pathExists } = await import('./fs');
  const { join } = await import('path');
  
  const { resolvePackDestinationPath } = await import('./pack-locations');
  for (const plugin of installed) {
    const pluginPackagePath = resolvePackDestinationPath('plugin', plugin.id, context.resolvedRoot);
    const relativePackPath = pluginPackagePath.replace(context.resolvedRoot + '/', '');
    if (!pathExists(pluginPackagePath)) {
      issues.push(`Plugin package for "${plugin.id}" not found at ${pluginPackagePath}`);
      context.logger.error(`✗ Plugin package missing: ${relativePackPath}`);
    } else {
      context.logger.info(`✓ Plugin package exists: ${relativePackPath}`);
    }
  }

  if (issues.length === 0) {
    context.logger.info('');
    context.logger.info('✓ All installed plugins are valid');
    context.logger.info('✓ All plugin packages exist');
  } else {
    context.logger.info('');
    context.logger.error(`Found ${issues.length} issue(s):`);
    issues.forEach(issue => context.logger.error(`  - ${issue}`));
  }
}
