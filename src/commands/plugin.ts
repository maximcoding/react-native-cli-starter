/**
 * FILE: src/commands/plugin.ts
 * PURPOSE: Thin entrypoint for plugin commands - delegates to lib/plugin.
 * OWNERSHIP: CLI
 */

import { ParsedArgs } from '../lib/args';
import { RuntimeContext } from '../lib/runtime';
// import { runPluginCommand } from '../lib/plugin';

export async function handlePlugin(args: ParsedArgs, context: RuntimeContext): Promise<void> {
  // Thin entrypoint: parse args, call lib
  // Implementation will be added in task 13
  const subcommand = args.subcommand;
  
  if (!subcommand) {
    console.error('Plugin command requires a subcommand: list, add, status, doctor');
    process.exit(1);
  }
  
  // await runPluginCommand(subcommand, args.positional, context);
  console.log(`Plugin command "${subcommand}" not yet implemented`);
}

