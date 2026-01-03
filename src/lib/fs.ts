/**
 * FILE: src/lib/fs.ts
 * PURPOSE: Filesystem utilities (single source for all FS operations)
 * OWNERSHIP: CLI
 */

import {
  existsSync,
  statSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  copyFileSync,
  renameSync,
  unlinkSync,
  rmdirSync,
} from 'fs';
import { join, dirname, basename, extname } from 'path';
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

/**
 * Gets file stats (throws if file doesn't exist)
 */
export function getStats(path: string) {
  return statSync(path);
}

/**
 * Ensures a directory exists, creating it and all parent directories if needed
 */
export function ensureDir(dirPath: string): void {
  if (existsSync(dirPath) && isDirectory(dirPath)) {
    return;
  }
  mkdirSync(dirPath, { recursive: true });
}

/**
 * Atomic write: writes to a temp file first, then renames to target
 * This ensures the target file is either fully written or unchanged
 */
export function atomicWrite(filePath: string, content: string): void {
  ensureDir(dirname(filePath));
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  try {
    writeFileSync(tempPath, content, 'utf-8');
    renameSync(tempPath, filePath);
  } catch (error) {
    // Clean up temp file on error
    if (existsSync(tempPath)) {
      try {
        unlinkSync(tempPath);
      } catch {
        // Ignore cleanup errors
      }
    }
    throw error;
  }
}

/**
 * Reads a text file safely
 */
export function readTextFile(filePath: string): string {
  return readFileSync(filePath, 'utf-8');
}

/**
 * Writes a text file (non-atomic, use atomicWrite for critical files)
 */
export function writeTextFile(filePath: string, content: string): void {
  ensureDir(dirname(filePath));
  writeFileSync(filePath, content, 'utf-8');
}

/**
 * Strips JSON comments (single-line // and multi-line comments) from a JSON string
 * This allows parsing JSON files that contain comments (like tsconfig.json)
 */
function stripJsonComments(jsonString: string): string {
  let result = '';
  let inString = false;
  let escapeNext = false;
  let inSingleComment = false;
  let inMultiComment = false;
  let i = 0;

  while (i < jsonString.length) {
    const char = jsonString[i];
    const nextChar = i + 1 < jsonString.length ? jsonString[i + 1] : '';

    if (escapeNext) {
      result += char;
      escapeNext = false;
      i++;
      continue;
    }

    if (char === '\\' && inString) {
      escapeNext = true;
      result += char;
      i++;
      continue;
    }

    if (char === '"' && !inSingleComment && !inMultiComment) {
      inString = !inString;
      result += char;
      i++;
      continue;
    }

    if (!inString) {
      if (char === '/' && nextChar === '/' && !inSingleComment && !inMultiComment) {
        inSingleComment = true;
        i += 2;
        continue;
      }

      if (char === '/' && nextChar === '*' && !inSingleComment && !inMultiComment) {
        inMultiComment = true;
        i += 2;
        continue;
      }

      if (char === '\n' && inSingleComment) {
        inSingleComment = false;
        result += char;
        i++;
        continue;
      }

      if (char === '*' && nextChar === '/' && inMultiComment) {
        inMultiComment = false;
        i += 2;
        continue;
      }

      if (inSingleComment || inMultiComment) {
        i++;
        continue;
      }
    }

    result += char;
    i++;
  }

  return result;
}

/**
 * Reads a JSON file safely (supports comments like tsconfig.json)
 */
export function readJsonFile<T = unknown>(filePath: string): T {
  const content = readTextFile(filePath);
  try {
    // Strip comments before parsing (tsconfig.json and other JSON files may contain comments)
    const cleanedContent = stripJsonComments(content);
    return JSON.parse(cleanedContent) as T;
  } catch (error) {
    throw new Error(`Failed to parse JSON file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Writes a JSON file with atomic write and proper formatting
 */
export function writeJsonFile(filePath: string, data: unknown, pretty: boolean = true): void {
  const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  atomicWrite(filePath, content);
}

/**
 * Copies a directory recursively with deterministic ordering
 * Files are processed in sorted order for reproducibility
 */
export function copyDir(srcDir: string, destDir: string): void {
  if (!existsSync(srcDir) || !isDirectory(srcDir)) {
    throw new Error(`Source directory does not exist: ${srcDir}`);
  }

  ensureDir(destDir);

  // Read directory entries and sort for deterministic ordering
  const entries = readdirSync(srcDir, { withFileTypes: true }).sort((a, b) => {
    // Directories first, then files, both sorted alphabetically
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  for (const entry of entries) {
    const srcPath = join(srcDir, entry.name);
    const destPath = join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      ensureDir(dirname(destPath));
      copyFileSync(srcPath, destPath);
    }
  }
}
