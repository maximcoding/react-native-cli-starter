/**
 * FILE: src/lib/attachment-engine.ts
 * PURPOSE: Attach engine to apply template packs into apps safely and deterministically (Option A Workspace Packages).
 * OWNERSHIP: CLI
 */

import { join, relative, dirname } from 'path';
import { pathExists, isDirectory, isFile, copyDir, ensureDir, readTextFile, writeTextFile, readJsonFile } from './fs';
import { CliError, ExitCode } from './errors';
import type { PackManifest } from './pack-manifest';
import { resolvePackDestinationPath, type PackType } from './pack-locations';

/**
 * Attachment mode
 */
export type AttachmentMode = 'CORE' | 'PLUGIN' | 'MODULE';

/**
 * Attachment options
 */
export interface AttachmentOptions {
  projectRoot: string;
  packManifest: PackManifest;
  resolvedPackPath: string;
  target: 'expo' | 'bare';
  language: 'ts' | 'js';
  mode: AttachmentMode;
  options?: Record<string, unknown>;
  dryRun?: boolean;
}

/**
 * Attachment report
 */
export interface AttachmentReport {
  created: string[];
  updated: string[];
  skipped: string[];
  conflicts: string[];
  resolvedDestinations: Record<string, string>;
  ownedFilesCandidate: string[];
}

/**
 * Files to ignore when copying pack content
 */
const IGNORE_PATTERNS = [
  'pack.json', // Manifest file should not be copied
  '.git',
  '.DS_Store',
  'node_modules',
  'dist',
  '*.log',
];

/**
 * Main attach function (section 6.1)
 * 
 * This is the single entry point for attaching packs into generated apps.
 * It handles destination resolution, ownership checks, and file copying.
 */
export function attachPack(opts: AttachmentOptions): AttachmentReport {
  const {
    projectRoot,
    packManifest,
    resolvedPackPath,
    target,
    language,
    mode,
    options,
    dryRun = false,
  } = opts;

  // Validate pack path exists
  if (!pathExists(resolvedPackPath) || !isDirectory(resolvedPackPath)) {
    throw new CliError(
      `Pack path does not exist or is not a directory: ${resolvedPackPath}`,
      ExitCode.VALIDATION_STATE_FAILURE
    );
  }

  // Resolve destination root (section 6.2)
  // For base pack, destination is project root (it contains packages/@rns/* structure)
  // For other packs, use standard destination resolver
  let destinationRoot: string;
  if (packManifest.id === 'base' && packManifest.type === 'core') {
    // Base pack attaches to project root (contains packages/@rns/* structure)
    destinationRoot = projectRoot;
  } else {
    destinationRoot = resolveDestinationRoot(
      projectRoot,
      packManifest,
      packManifest.type,
      packManifest.id
    );
  }

  // Initialize report
  const report: AttachmentReport = {
    created: [],
    updated: [],
    skipped: [],
    conflicts: [],
    resolvedDestinations: {},
    ownedFilesCandidate: [],
  };

  // Copy pack content (section 6.4)
  copyPackContent(
    resolvedPackPath,
    destinationRoot,
    packManifest,
    report,
    dryRun
  );

  return report;
}

/**
 * Resolves destination root deterministically from manifest delivery (section 6.2)
 */
function resolveDestinationRoot(
  projectRoot: string,
  manifest: PackManifest,
  packType: PackType,
  packId: string
): string {
  // Use the standard destination resolver from pack-locations
  return resolvePackDestinationPath(packType, packId, projectRoot);
}

/**
 * Copies pack content deterministically (section 6.4)
 * 
 * Files are processed in sorted order for reproducibility.
 * Ownership rules are enforced (section 6.3, 6.5).
 */
function copyPackContent(
  sourcePath: string,
  destPath: string,
  manifest: PackManifest,
  report: AttachmentReport,
  dryRun: boolean
): void {
  // Get all files to copy (excluding ignore patterns)
  const filesToCopy = collectFilesToCopy(sourcePath, sourcePath);

  for (const sourceFile of filesToCopy) {
    const relativePath = relative(sourcePath, sourceFile);
    const destFile = join(destPath, relativePath);

    // Check if file should be ignored
    if (shouldIgnoreFile(relativePath)) {
      report.skipped.push(relativePath);
      continue;
    }

    // Determine ownership and handle accordingly (section 6.3, 6.5)
    const ownership = determineOwnership(destFile, manifest);

    if (ownership === 'user-owned') {
      // User-owned file exists - conflict (section 6.5)
      if (pathExists(destFile)) {
        report.conflicts.push(relativePath);
        continue;
      }
      // User-owned file doesn't exist - skip (don't create user-owned files)
      report.skipped.push(relativePath);
      continue;
    }

    // CLI-managed file
    if (pathExists(destFile)) {
      // File exists and is CLI-managed - update allowed (section 6.5)
      if (!dryRun) {
        ensureDir(dirname(destFile));
        const content = readTextFile(sourceFile);
        writeTextFile(destFile, content);
      }
      report.updated.push(relativePath);
    } else {
      // File doesn't exist - create (section 6.5)
      if (!dryRun) {
        ensureDir(dirname(destFile));
        const content = readTextFile(sourceFile);
        writeTextFile(destFile, content);
      }
      report.created.push(relativePath);
    }

    // Record in owned files candidate
    report.ownedFilesCandidate.push(relativePath);
    report.resolvedDestinations[relativePath] = destFile;
  }
}

/**
 * Collects all files to copy from source directory
 * Returns files in sorted order for deterministic processing
 */
function collectFilesToCopy(sourceDir: string, baseDir: string): string[] {
  const files: string[] = [];
  const { readdirSync } = require('fs');

  function traverse(dir: string): void {
    const entries = readdirSync(dir, { withFileTypes: true }).sort((a: any, b: any) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = relative(baseDir, fullPath);

      // Skip ignore patterns
      if (shouldIgnoreFile(relativePath)) {
        continue;
      }

      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  traverse(sourceDir);
  return files;
}

/**
 * Checks if a file should be ignored based on ignore patterns
 */
function shouldIgnoreFile(relativePath: string): boolean {
  for (const pattern of IGNORE_PATTERNS) {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      if (regex.test(relativePath)) {
        return true;
      }
    } else if (relativePath.includes(pattern)) {
      return true;
    }
  }
  return false;
}

/**
 * Determines ownership of a destination file (section 6.3)
 * 
 * Rules:
 * - All files under packages/@rns/* are CLI-managed by default (section 6.5)
 * - User-owned files are those not in CLI-managed areas
 * - For workspace packs, all files are CLI-managed
 * - For user-code packs, files are user-owned
 */
function determineOwnership(destFile: string, manifest: PackManifest): 'cli-managed' | 'user-owned' {
  // Workspace packs: all files are CLI-managed (section 6.5)
  if (manifest.delivery === 'workspace') {
    return 'cli-managed';
  }

  // User-code packs: files are user-owned (developer can edit)
  if (manifest.delivery === 'user-code') {
    return 'user-owned';
  }

  // Default: CLI-managed for safety
  return 'cli-managed';
}

