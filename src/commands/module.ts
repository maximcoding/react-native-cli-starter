/**
 * FILE: src/commands/module.ts
 * PURPOSE: Thin entrypoint for module commands - delegates to lib/module.
 * OWNERSHIP: CLI
 */

import { ParsedArgs } from '../lib/args';
import { RuntimeContext } from '../lib/runtime';
// import { runModuleCommand } from '../lib/module';

export async function handleModule(args: ParsedArgs, context: RuntimeContext): Promise<void> {
  // Thin entrypoint: parse args, call lib
  // Implementation will be added in task 15
  const subcommand = args.subcommand;
  
  if (!subcommand) {
    console.error('Module command requires a subcommand: list, add, status, doctor');
    process.exit(1);
  }
  
  // await runModuleCommand(subcommand, args.positional, context);
  console.log(`Module command "${subcommand}" not yet implemented`);
}

