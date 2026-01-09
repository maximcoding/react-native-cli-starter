/**
 * FILE: src/lib/backup.ts
 * PURPOSE: Backup system for file modifications (section 8)
 * OWNERSHIP: CLI
 */

import { join, dirname, relative } from 'path';
import { copyFileSync } from 'fs';
import { CLI_BACKUPS_DIR } from './constants';
import { pathExists, ensureDir } from './fs';

/**
 * Creates a timestamped backup directory for an operation
 * Format: .rns/backups/<timestamp>-<operationId>/
 */
export function createBackupDirectory(projectRoot: string, operationId: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
  const backupDir = join(projectRoot, CLI_BACKUPS_DIR, `${timestamp}-${operationId}`);
  ensureDir(backupDir);
  return backupDir;
}

/**
 * Backs up a file before modification
 * Creates backup at: .rns/backups/<timestamp>-<operationId>/<relativePath>
 * 
 * @param projectRoot - Project root directory
 * @param filePath - Absolute path to file to backup
 * @param backupDir - Backup directory (from createBackupDirectory)
 * @returns Backup path if successful, null if file doesn't exist
 */
export function backupFile(projectRoot: string, filePath: string, backupDir: string): string | null {
  if (!pathExists(filePath)) {
    return null;
  }

  // Calculate relative path from project root
  const relativePath = relative(projectRoot, filePath);
  const backupPath = join(backupDir, relativePath);

  // Ensure backup directory structure exists
  ensureDir(dirname(backupPath));

  // Copy file to backup location
  try {
    copyFileSync(filePath, backupPath);
    return backupPath;
  } catch (error) {
    throw new Error(`Failed to backup file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Backs up multiple files before modification
 * 
 * @param projectRoot - Project root directory
 * @param filePaths - Array of absolute paths to files to backup
 * @param backupDir - Backup directory (from createBackupDirectory)
 * @returns Map of file paths to backup paths (only for files that existed)
 */
export function backupFiles(
  projectRoot: string,
  filePaths: string[],
  backupDir: string
): Map<string, string> {
  const backups = new Map<string, string>();

  for (const filePath of filePaths) {
    const backupPath = backupFile(projectRoot, filePath, backupDir);
    if (backupPath) {
      backups.set(filePath, backupPath);
    }
  }

  return backups;
}

/**
 * Restores a file from backup
 * 
 * @param backupPath - Path to backup file
 * @param targetPath - Path to restore to
 */
export function restoreFromBackup(backupPath: string, targetPath: string): void {
  if (!pathExists(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }

  ensureDir(dirname(targetPath));
  copyFileSync(backupPath, targetPath);
}

/**
 * Gets all backup directories, sorted by timestamp (newest first)
 */
export function listBackupDirectories(projectRoot: string): string[] {
  const backupsRoot = join(projectRoot, CLI_BACKUPS_DIR);
  
  if (!pathExists(backupsRoot)) {
    return [];
  }

  const { readdirSync, statSync } = require('fs');
  const entries = readdirSync(backupsRoot, { withFileTypes: true })
    .filter((entry: any) => entry.isDirectory())
    .map((entry: any) => join(backupsRoot, entry.name))
    .sort((a: string, b: string) => {
      // Sort by timestamp (newest first)
      return b.localeCompare(a);
    });

  return entries;
}

