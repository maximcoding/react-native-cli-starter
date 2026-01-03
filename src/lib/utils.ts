/**
 * FILE: src/lib/utils.ts
 * PURPOSE: General utility functions
 * OWNERSHIP: CLI
 */

/**
 * Generates a unique run ID for this CLI execution
 */
export function generateRunId(): string {
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

