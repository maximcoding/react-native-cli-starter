/**
 * FILE: src/lib/init.ts
 * PURPOSE: Deprecated - use src/lib/init/index.ts instead
 * OWNERSHIP: CLI
 * 
 * @deprecated This file is kept for backward compatibility.
 * All functionality has been moved to src/lib/init/index.ts and modular subdirectories.
 * This file will be removed in a future version.
 */

// Re-export everything from the new modular structure
export { runInit } from './init/index';
export type { InitOptions, InitInputs } from './init/types';
export { collectInitInputs, resolveDestination, preflightCheck } from './init/collect-inputs';
