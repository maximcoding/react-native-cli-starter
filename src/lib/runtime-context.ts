/**
 * FILE: src/lib/runtime-context.ts
 * PURPOSE: Create runtime context with resolved root and flags for commands.
 * OWNERSHIP: CLI
 */

import { ParsedArgs } from './args';
import { resolveProjectRoot } from './fs';

export interface RuntimeContext {
  projectRoot: string;
  flags: {
    yes: boolean;
    verbose: boolean;
    dryRun: boolean;
  };
}

export function createRuntimeContext(args: ParsedArgs): RuntimeContext {
  const cwd = args.cwd || process.cwd();
  const projectRoot = resolveProjectRoot(cwd);
  
  return {
    projectRoot,
    flags: {
      yes: args.yes || false,
      verbose: args.verbose || false,
      dryRun: args.dryRun || false,
    },
  };
}

