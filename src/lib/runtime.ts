/**
 * FILE: src/lib/runtime.ts
 * PURPOSE: Runtime context for CLI commands (resolvedRoot + flags + logger + runId)
 * OWNERSHIP: CLI
 */

import { Logger } from './logger';

/**
 * Global flags that apply to all commands
 */
export interface GlobalFlags {
  cwd?: string;
  yes: boolean;
  verbose: boolean;
  dryRun: boolean;
}

/**
 * Runtime context passed to all commands
 */
export interface RuntimeContext {
  resolvedRoot: string;
  flags: GlobalFlags;
  logger: Logger;
  runId: string;
}

/**
 * Creates a runtime context for a command execution
 */
export function createRuntimeContext(
  resolvedRoot: string,
  flags: GlobalFlags,
  logger: Logger,
  runId: string
): RuntimeContext {
  return {
    resolvedRoot,
    flags,
    logger,
    runId,
  };
}

