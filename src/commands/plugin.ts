/**
 * FILE: src/commands/plugin.ts
 * PURPOSE: Thin entrypoint for plugin commands - delegates to lib/plugin.
 * OWNERSHIP: CLI
 */

import { ParsedArgs } from '../lib/args';
import { RuntimeContext } from '../lib/runtime';
import {
  listPlugins,
  addPlugins,
  removePlugins,
  getPluginStatus,
  runPluginDoctor,
  type ListPluginsOptions,
  type PluginCommandOptions,
} from '../lib/plugin';
import { CliError, ExitCode } from '../lib/errors';

/**
 * Handles plugin commands
 */
export async function handlePlugin(args: ParsedArgs, context: RuntimeContext): Promise<void> {
  // Extract subcommand from positional args
  // args._[0] = 'plugin', args._[1] = subcommand, args._[2+] = plugin IDs
  const subcommand = args._[1];
  
  if (!subcommand) {
    context.logger.error('Plugin command requires a subcommand: list, add, remove, status, doctor');
    context.logger.info('');
    context.logger.info('Usage:');
    context.logger.info('  rns plugin list [--json]');
    context.logger.info('  rns plugin add [plugin-ids...] [--dry-run] [--yes]');
    context.logger.info('  rns plugin remove [plugin-ids...] [--dry-run] [--yes]');
    context.logger.info('  rns plugin status [--json]');
    context.logger.info('  rns plugin doctor [--fix]');
    throw new CliError('Missing subcommand', ExitCode.VALIDATION_STATE_FAILURE);
  }

  const pluginIds = args._.slice(2); // Everything after 'plugin' and subcommand
  const options: PluginCommandOptions = {
    yes: args.yes || false,
    dryRun: args.dryRun || false,
    verbose: args.verbose || false,
  };

  try {
    switch (subcommand) {
      case 'list': {
        const listOptions: ListPluginsOptions = {
          json: args.json === true,
          category: args.category as string | undefined,
          target: args.target as string | undefined,
        };
        await listPlugins(listOptions, context);
        break;
      }

      case 'add': {
        const results = await addPlugins(pluginIds, options, context);
        
        // Summary
        const successful = results.filter(r => r.success && !r.skipped).length;
        const skipped = results.filter(r => r.skipped).length;
        const failed = results.filter(r => !r.success && !r.skipped).length;
        
        if (options.dryRun) {
          context.logger.info(`\nDry-run complete: ${results.length} plugin(s) would be installed`);
        } else {
          context.logger.info(`\nSummary: ${successful} installed, ${skipped} skipped, ${failed} failed`);
        }
        
        if (failed > 0) {
          throw new CliError(
            `Failed to install ${failed} plugin(s)`,
            ExitCode.GENERIC_FAILURE
          );
        }
        break;
      }

      case 'remove': {
        const results = await removePlugins(pluginIds, options, context);
        
        // Summary
        const successful = results.filter(r => r.success && !r.skipped).length;
        const skipped = results.filter(r => r.skipped).length;
        const failed = results.filter(r => !r.success && !r.skipped).length;
        
        if (options.dryRun) {
          context.logger.info(`\nDry-run complete: ${results.length} plugin(s) would be removed`);
        } else {
          context.logger.info(`\nSummary: ${successful} removed, ${skipped} skipped, ${failed} failed`);
        }
        
        if (failed > 0) {
          throw new CliError(
            `Failed to remove ${failed} plugin(s)`,
            ExitCode.GENERIC_FAILURE
          );
        }
        break;
      }

      case 'status': {
        const status = await getPluginStatus(context);
        
        if (args.json === true) {
          console.log(JSON.stringify(status, null, 2));
        } else {
          context.logger.info('Plugin Status:');
          context.logger.info('');
          
          if (status.installed.length > 0) {
            context.logger.info(`Installed (${status.installed.length}):`);
            for (const plugin of status.installed) {
              const available = plugin.available ? '✓' : '✗';
              context.logger.info(`  ${available} ${plugin.id} v${plugin.version} (installed ${plugin.installedAt})`);
              if (!plugin.available) {
                context.logger.info(`    Warning: Plugin not found in registry`);
              }
            }
            context.logger.info('');
          }
          
          if (status.available.length > 0) {
            const notInstalled = status.available.filter(p => !p.installed);
            if (notInstalled.length > 0) {
              context.logger.info(`Available (${notInstalled.length} not installed):`);
              for (const plugin of notInstalled) {
                context.logger.info(`  - ${plugin.id} v${plugin.version} - ${plugin.name}`);
                if (plugin.description) {
                  context.logger.info(`    ${plugin.description}`);
                }
              }
              context.logger.info('');
            }
          }
          
          if (status.orphaned.length > 0) {
            context.logger.error(`Orphaned (${status.orphaned.length}):`);
            for (const plugin of status.orphaned) {
              context.logger.error(`  ✗ ${plugin.id} v${plugin.version} (not in registry)`);
            }
          }
        }
        break;
      }

      case 'doctor': {
        await runPluginDoctor(context, args.fix === true);
        break;
      }

      default:
        throw new CliError(
          `Unknown plugin subcommand: "${subcommand}". Valid commands: list, add, remove, status, doctor`,
          ExitCode.VALIDATION_STATE_FAILURE
        );
    }
  } catch (error) {
    if (error instanceof CliError) {
      throw error;
    }
    throw new CliError(
      `Plugin command failed: ${error instanceof Error ? error.message : String(error)}`,
      ExitCode.GENERIC_FAILURE
    );
  }
}

