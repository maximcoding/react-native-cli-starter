/**
 * FILE: src/commands/index.ts
 * PURPOSE: Command exports (thin entrypoints only)
 * OWNERSHIP: CLI
 */

import { RuntimeContext } from '../lib/runtime';
import { ParsedArgs } from '../lib/args';
import { runInit } from '../lib/init';
import { handlePlugin } from './plugin';

/**
 * Init command - creates a new React Native app with CORE baseline
 * This is a thin entrypoint; all logic lives in src/lib/init.ts
 */
export async function init(ctx: RuntimeContext, args: ParsedArgs): Promise<void> {
  // args._[0] is the command 'init', so skip it
  await runInit({
    projectName: args._[1],
    destination: args._[2],
    context: ctx,
  });
}

/**
 * Plugin command - manages plugins (list, add, remove, status, doctor)
 * This is a thin entrypoint; all logic lives in src/lib/plugin.ts
 */
export { handlePlugin as plugin };
