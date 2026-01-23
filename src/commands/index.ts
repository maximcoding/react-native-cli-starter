/**
 * FILE: src/commands/index.ts
 * PURPOSE: Command exports (thin entrypoints only)
 * OWNERSHIP: CLI
 */

import { RuntimeContext } from '../lib/runtime';
import { ParsedArgs } from '../lib/args';
import { runInit } from '../lib/init';
import { handlePlugin } from './plugin';
import { handleModule } from './module';
import { handleComponent } from './component';

/**
 * Init command - creates a new React Native app with CORE baseline
 * This is a thin entrypoint; all logic lives in src/lib/init.ts
 */
export async function init(ctx: RuntimeContext, args: ParsedArgs): Promise<void> {
  // args._[0] is the command 'init', so skip it
  // Extract flags: --target, --lang, --pm, --platforms, --rn-version, --locales
  const target = args.target as 'expo' | 'bare' | undefined;
  const language = args.lang as 'ts' | 'js' | undefined;
  const packageManager = args.pm as 'npm' | 'pnpm' | 'yarn' | undefined;
  const platforms = args.platforms ? String(args.platforms).split(',').map(p => p.trim()) : undefined;
  const reactNativeVersion = args['rn-version'] as string | undefined;
  const locales = args.locales ? String(args.locales).split(',').map(l => l.trim()).filter(l => l.length > 0) : undefined;

  await runInit({
    projectName: args._[1],
    destination: args._[2],
    target,
    language,
    packageManager,
    platforms,
    reactNativeVersion,
    locales,
    context: ctx,
  });
}

/**
 * Plugin command - manages plugins (list, add, remove, status, doctor)
 * This is a thin entrypoint; all logic lives in src/lib/plugin.ts
 */
export { handlePlugin as plugin };

/**
 * Module command - manages modules (list, add, status, doctor)
 * This is a thin entrypoint; all logic lives in src/lib/module.ts
 */
export { handleModule as module };

/**
 * Component command - generates UI components
 * This is a thin entrypoint; all logic lives in src/lib/component.ts
 */
export { handleComponent as component };
