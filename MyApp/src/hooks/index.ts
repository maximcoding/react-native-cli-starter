/**
 * FILE: src/hooks/index.ts
 * PURPOSE: Hooks exports (User Zone).
 * OWNERSHIP: USER
 * 
 * Central export point for all hooks.
 * These are convenience re-exports from System Zone (@rns/core/).
 * 
 * Import hooks from '@/hooks' for convenience, or directly from '@rns/core/*' for System Zone access.
 * 
 * To customize: edit individual hook files (useT.ts, useTheme.ts) to replace re-exports with custom implementations.
 */
export { useT } from './useT';
export { useTheme } from './useTheme';
