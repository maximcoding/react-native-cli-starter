/**
 * FILE: src/commands/component.ts
 * PURPOSE: Thin entrypoint for component commands - delegates to lib/component.
 * OWNERSHIP: CLI
 */

import { ParsedArgs } from '../lib/args';
import { RuntimeContext } from '../lib/runtime';
import {
  addComponents,
  type ComponentCommandOptions,
} from '../lib/component';
import { CliError, ExitCode } from '../lib/errors';

/**
 * Handles component commands
 */
export async function handleComponent(args: ParsedArgs, context: RuntimeContext): Promise<void> {
  // Extract subcommand from positional args
  // args._[0] = 'component', args._[1] = subcommand, args._[2+] = component names
  const subcommand = args._[1];
  
  if (!subcommand) {
    context.logger.error('Component command requires a subcommand: add');
    context.logger.info('');
    context.logger.info('Usage:');
    context.logger.info('  rns component add <component-name> [component-name...] [--dry-run] [--yes] [--verbose]');
    throw new CliError('Missing subcommand', ExitCode.VALIDATION_STATE_FAILURE);
  }

  const componentNames = args._.slice(2); // Everything after 'component' and subcommand
  
  if (componentNames.length === 0) {
    context.logger.error('Component command requires at least one component name');
    context.logger.info('');
    context.logger.info('Usage:');
    context.logger.info('  rns component add <component-name> [component-name...] [--dry-run] [--yes] [--verbose]');
    throw new CliError('Missing component name', ExitCode.VALIDATION_STATE_FAILURE);
  }

  const options: ComponentCommandOptions = {
    yes: args.yes || false,
    dryRun: args.dryRun || false,
    verbose: args.verbose || false,
  };

  try {
    switch (subcommand) {
      case 'add': {
        const results = await addComponents(componentNames, options, context);
        
        // Summary
        const successful = results.filter(r => r.success && !r.skipped).length;
        const skipped = results.filter(r => r.skipped).length;
        const failed = results.filter(r => !r.success && !r.skipped).length;
        
        if (options.dryRun) {
          context.logger.info(`\nDry-run complete: ${results.length} component(s) would be generated`);
        } else {
          context.logger.info(`\nSummary: ${successful} generated, ${skipped} skipped, ${failed} failed`);
        }
        
        if (failed > 0) {
          throw new CliError(
            `Failed to generate ${failed} component(s)`,
            ExitCode.GENERIC_FAILURE
          );
        }
        break;
      }

      default:
        context.logger.error(`Unknown subcommand: ${subcommand}`);
        context.logger.info('');
        context.logger.info('Usage:');
        context.logger.info('  rns component add <component-name> [component-name...] [--dry-run] [--yes] [--verbose]');
        throw new CliError(`Unknown subcommand: ${subcommand}`, ExitCode.VALIDATION_STATE_FAILURE);
    }
  } catch (error) {
    if (error instanceof CliError) {
      throw error; // Re-throw CliError as-is
    }
    throw new CliError(
      error instanceof Error ? error.message : String(error),
      ExitCode.GENERIC_FAILURE
    );
  }
}
