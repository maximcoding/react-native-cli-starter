/**
 * FILE: src/commands/init.ts
 * PURPOSE: Thin entrypoint for init command - delegates to lib/init.
 * OWNERSHIP: CLI
 */

import { ParsedArgs } from '../lib/args';
import { RuntimeContext } from '../lib/runtime';
import { runInit } from '../lib/init';

export async function handleInit(args: ParsedArgs, context: RuntimeContext): Promise<void> {
  // Thin entrypoint: parse args, call lib
  await runInit({
    projectName: args._[0],
    destination: args._[1],
    context,
  });
}

