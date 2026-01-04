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

/**
 * Resolves a local workspace dependency spec based on package manager.
 * 
 * npm does NOT support "workspace:" protocol, so we use "file:" instead.
 * pnpm and yarn support "workspace:" protocol.
 * 
 * @param pm Package manager ('npm' | 'pnpm' | 'yarn')
 * @param options Dependency options
 * @param options.packageName Package name (e.g., '@rns/core')
 * @param options.relativePath Relative path from consuming package to dependency (e.g., '../core')
 * @param options.version Optional version for npm (defaults to '0.1.0' for version matching approach)
 * @returns Dependency spec string (e.g., 'workspace:*', 'file:../core', or '0.1.0')
 */
export function resolveLocalDepSpec(
  pm: 'npm' | 'pnpm' | 'yarn',
  options: {
    packageName: string;
    relativePath: string;
    version?: string;
  }
): string {
  if (pm === 'npm') {
    // npm doesn't support workspace: protocol
    // Use file: protocol for explicit local linking
    return `file:${options.relativePath}`;
  } else {
    // pnpm and yarn support workspace: protocol
    return 'workspace:*';
  }
}

