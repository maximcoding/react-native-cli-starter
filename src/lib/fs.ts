/**
 * FILE: src/lib/fs.ts
 * PURPOSE: Filesystem utilities (single source for all FS operations)
 * OWNERSHIP: CLI
 */

import { existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { PROJECT_STATE_FILE } from './constants';

/**
 * Resolves the project root by looking for .rn-init.json marker
 * Falls back to the provided directory if marker not found
 */
export function resolveProjectRoot(startDir: string): string {
  let current = startDir;

  while (current !== dirname(current)) {
    if (existsSync(join(current, PROJECT_STATE_FILE))) {
      return current;
    }
    current = dirname(current);
  }

  return startDir;
}

/**
 * Checks if a path exists
 */
export function pathExists(path: string): boolean {
  return existsSync(path);
}

/**
 * Checks if a path is a directory
 */
export function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Checks if a path is a file
 */
export function isFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}
