/**
 * FILE: src/commands/index.ts
 * PURPOSE: Command exports (thin entrypoints only)
 * OWNERSHIP: CLI
 */

import { RuntimeContext } from '../lib/runtime';
import { ParsedArgs } from '../lib/args';

/**
 * Init command - creates a new React Native app with CORE baseline
 * This is a thin entrypoint; all logic lives in src/lib/init.ts
 */
export async function init(ctx: RuntimeContext, args: ParsedArgs): Promise<void> {
  // TODO: Implement in src/lib/init.ts
  ctx.logger.info('Init command (not yet implemented)');
}
