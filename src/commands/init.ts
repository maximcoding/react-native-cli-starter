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
  // Extract flags: --target, --lang, --pm, --platforms, --rn-version
  const target = args.target as 'expo' | 'bare' | undefined;
  const language = args.lang as 'ts' | 'js' | undefined;
  const packageManager = args.pm as 'npm' | 'pnpm' | 'yarn' | undefined;
  const platforms = args.platforms ? String(args.platforms).split(',').map(p => p.trim()) : undefined;
  const reactNativeVersion = args['rn-version'] as string | undefined;

  await runInit({
    projectName: args._[0],
    destination: args._[1],
    target,
    language,
    packageManager,
    platforms,
    reactNativeVersion,
    context,
  });
}

