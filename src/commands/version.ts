/**
 * FILE: src/commands/version.ts
 * PURPOSE: Thin entrypoint for version command - delegates to lib/version.
 * OWNERSHIP: CLI
 */

import { ParsedArgs } from '../lib/args';
import { RuntimeContext } from '../lib/runtime';
import { getCliVersion } from '../lib/version';

export async function handleVersion(args: ParsedArgs, context: RuntimeContext): Promise<void> {
  // Thin entrypoint: just call lib
  const version = getCliVersion();
  console.log(version);
}

