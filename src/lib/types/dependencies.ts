/**
 * FILE: src/lib/types/dependencies.ts
 * PURPOSE: Dependency installation types (section 14)
 * OWNERSHIP: CLI
 * 
 * Canonical Docs: docs/cli-interface-and-types.md §2.14 (to be added)
 */

import type { PackageManager } from './common';

/**
 * Dependency scope for installation
 */
export type DependencyScope = 
  | 'workspace'          // Root package.json (workspace-level)
  | 'host'               // Host app package.json
  | `package:${string}`; // Specific workspace package (e.g., 'package:@rns/core')

/**
 * Dependency specification
 */
export interface DependencySpec {
  /** Package name */
  name: string;
  /** Version spec (e.g., "^1.0.0", "latest", "workspace:*") */
  version: string;
}

/**
 * Dependency installation options
 */
export interface DependencyInstallOptions {
  /** Scope for installation */
  scope?: DependencyScope;
  /** Working directory (default: project root) */
  cwd?: string;
  /** Verbose output */
  verbose?: boolean;
  /** Dry run (don't actually install) */
  dryRun?: boolean;
}

/**
 * Dependency installation result
 */
export interface DependencyInstallResult {
  success: boolean;
  scope: DependencyScope;
  dependencies: DependencySpec[];
  action: 'installed' | 'skipped' | 'error';
  error?: string;
  stdout?: string;
  stderr?: string;
}

/**
 * Package manager detection result
 */
export interface PackageManagerDetectionResult {
  /** Detected package manager */
  packageManager: PackageManager;
  /** How it was detected */
  source: 'manifest' | 'lockfile' | 'default';
  /** Lockfiles found */
  lockfiles: string[];
  /** Conflicts detected */
  conflicts?: string[];
}
