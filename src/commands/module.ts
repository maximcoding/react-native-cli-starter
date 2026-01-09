/**
 * FILE: src/commands/module.ts
 * PURPOSE: Thin entrypoint for module commands - delegates to lib/module.
 * OWNERSHIP: CLI
 */

import { ParsedArgs } from '../lib/args';
import { RuntimeContext } from '../lib/runtime';
import {
  listModules,
  addModules,
  getModuleStatus,
  runModuleDoctor,
  type ListModulesOptions,
  type ModuleCommandOptions,
} from '../lib/module';
import { CliError, ExitCode } from '../lib/errors';

/**
 * Handles module commands
 */
export async function handleModule(args: ParsedArgs, context: RuntimeContext): Promise<void> {
  // Extract subcommand from positional args
  // args._[0] = 'module', args._[1] = subcommand, args._[2+] = module IDs
  const subcommand = args._[1];
  
  if (!subcommand) {
    context.logger.error('Module command requires a subcommand: list, add, status, doctor');
    context.logger.info('');
    context.logger.info('Usage:');
    context.logger.info('  rns module list [--json] [--category <category>] [--target <target>]');
    context.logger.info('  rns module add [module-ids...] [--dry-run] [--yes] [--verbose]');
    context.logger.info('  rns module status [--json]');
    context.logger.info('  rns module doctor');
    throw new CliError('Missing subcommand', ExitCode.VALIDATION_STATE_FAILURE);
  }

  const moduleIds = args._.slice(2); // Everything after 'module' and subcommand
  const options: ModuleCommandOptions = {
    yes: args.yes || false,
    dryRun: args.dryRun || false,
    verbose: args.verbose || false,
  };

  try {
    switch (subcommand) {
      case 'list': {
        const listOptions: ListModulesOptions = {
          json: args.json === true,
          category: args.category as string | undefined,
          target: args.target as string | undefined,
        };
        await listModules(listOptions, context);
        break;
      }

      case 'add': {
        const results = await addModules(moduleIds, options, context);
        
        // Summary
        const successful = results.filter(r => r.success && !r.skipped).length;
        const skipped = results.filter(r => r.skipped).length;
        const failed = results.filter(r => !r.success && !r.skipped).length;
        
        if (options.dryRun) {
          context.logger.info(`\nDry-run complete: ${results.length} module(s) would be generated`);
        } else {
          context.logger.info(`\nSummary: ${successful} generated, ${skipped} skipped, ${failed} failed`);
        }
        
        if (failed > 0) {
          throw new CliError(
            `Failed to generate ${failed} module(s)`,
            ExitCode.GENERIC_FAILURE
          );
        }
        break;
      }

      case 'status': {
        const status = await getModuleStatus(context);
        
        if (args.json === true) {
          console.log(JSON.stringify(status, null, 2));
        } else {
          context.logger.info('Module Status:');
          context.logger.info('');
          
          if (status.installed.length > 0) {
            context.logger.info(`Installed (${status.installed.length}):`);
            for (const module of status.installed) {
              const available = module.available ? '✓' : '✗';
              context.logger.info(`  ${available} ${module.id} v${module.version} (installed ${module.installedAt})`);
              if (!module.available) {
                context.logger.info(`    Warning: Module not found in registry`);
              }
            }
            context.logger.info('');
          }
          
          if (status.available.length > 0) {
            const notInstalled = status.available.filter(m => !m.installed);
            if (notInstalled.length > 0) {
              context.logger.info(`Available (${notInstalled.length} not installed):`);
              for (const module of notInstalled) {
                context.logger.info(`  - ${module.id} v${module.version} - ${module.name}`);
                if (module.description) {
                  context.logger.info(`    ${module.description}`);
                }
              }
              context.logger.info('');
            }
          }
          
          if (status.orphaned.length > 0) {
            context.logger.error(`Orphaned (${status.orphaned.length}):`);
            for (const module of status.orphaned) {
              context.logger.error(`  ✗ ${module.id} v${module.version} (not in registry)`);
            }
          }
        }
        break;
      }

      case 'doctor': {
        await runModuleDoctor(context, args.fix === true);
        break;
      }

      default:
        throw new CliError(
          `Unknown module subcommand: "${subcommand}". Valid commands: list, add, status, doctor`,
          ExitCode.VALIDATION_STATE_FAILURE
        );
    }
  } catch (error) {
    if (error instanceof CliError) {
      throw error;
    }
    throw new CliError(
      `Module command failed: ${error instanceof Error ? error.message : String(error)}`,
      ExitCode.GENERIC_FAILURE
    );
  }
}
