/**
 * FILE: src/lib/dependencies.ts
 * PURPOSE: Unified dependency installation layer (pm-aware) (section 14)
 * OWNERSHIP: CLI
 * 
 * This layer is the only place allowed to install/remove dependencies.
 * It guarantees deterministic installs, respects lockfile discipline,
 * never mixes package managers, and provides clear error output.
 */

import { join } from 'path';
import { pathExists, readTextFile } from './fs';
import { PROJECT_STATE_FILE } from './constants';
import { CliError, ExitCode } from './errors';
import { execPackageManager } from './exec';
import { readManifest } from './manifest';
import type { PackageManager } from './types/common';
import type {
  DependencySpec,
  DependencyScope,
  DependencyInstallOptions,
  DependencyInstallResult,
  PackageManagerDetectionResult,
} from './types/dependencies';

/**
 * Lockfile patterns for each package manager
 */
const LOCKFILE_PATTERNS: Record<PackageManager, string[]> = {
  npm: ['package-lock.json'],
  pnpm: ['pnpm-lock.yaml', 'pnpm-workspace.yaml'],
  yarn: ['yarn.lock', '.yarnrc.yml'],
};

/**
 * Detects package manager from manifest or lockfiles
 * 
 * @param projectRoot - Project root directory
 * @returns Package manager detection result
 */
export function detectPackageManager(projectRoot: string): PackageManagerDetectionResult {
  const lockfiles: string[] = [];
  const conflicts: string[] = [];
  let detectedPM: PackageManager | null = null;

  // Check manifest first (most authoritative)
  try {
    const manifest = readManifest(projectRoot);
    if (manifest) {
      return {
        packageManager: manifest.packageManager,
        source: 'manifest',
        lockfiles: [],
      };
    }
  } catch {
    // Manifest not found or invalid, continue with lockfile detection
  }

  // Detect from lockfiles
  for (const [pm, patterns] of Object.entries(LOCKFILE_PATTERNS)) {
    for (const pattern of patterns) {
      const lockfilePath = join(projectRoot, pattern);
      if (pathExists(lockfilePath)) {
        lockfiles.push(pattern);
        if (detectedPM && detectedPM !== pm) {
          conflicts.push(`${detectedPM} (${LOCKFILE_PATTERNS[detectedPM as PackageManager].find(p => lockfiles.includes(p))}) vs ${pm} (${pattern})`);
        }
        if (!detectedPM) {
          detectedPM = pm as PackageManager;
        }
      }
    }
  }

  // Check for conflicts
  if (conflicts.length > 0) {
    throw new CliError(
      `Conflicting package manager lockfiles detected:\n${conflicts.map(c => `  - ${c}`).join('\n')}\n` +
      `Remove conflicting lockfiles or specify --package-manager flag.`,
      ExitCode.VALIDATION_STATE_FAILURE
    );
  }

  // Default to npm if nothing detected
  if (!detectedPM) {
    detectedPM = 'npm';
  }

  return {
    packageManager: detectedPM,
    source: lockfiles.length > 0 ? 'lockfile' : 'default',
    lockfiles,
    conflicts: conflicts.length > 0 ? conflicts : undefined,
  };
}

/**
 * Resolves package manager from manifest or detection
 * 
 * @param projectRoot - Project root directory
 * @param overridePM - Optional override package manager (validated against manifest)
 * @returns Package manager to use
 */
export function resolvePackageManager(
  projectRoot: string,
  overridePM?: PackageManager
): PackageManager {
  // Try manifest first
  try {
    const manifest = readManifest(projectRoot);
    if (manifest) {
      if (overridePM && overridePM !== manifest.packageManager) {
        throw new CliError(
          `Package manager mismatch: manifest specifies "${manifest.packageManager}" but "${overridePM}" was requested.\n` +
          `Use --force to override (not recommended).`,
          ExitCode.VALIDATION_STATE_FAILURE
        );
      }
      return manifest.packageManager;
    }
  } catch {
    // Manifest not found, continue with detection
  }

  // Use override if provided
  if (overridePM) {
    return overridePM;
  }

  // Detect from lockfiles
  const detection = detectPackageManager(projectRoot);
  return detection.packageManager;
}

/**
 * Validates lockfile discipline (no mixing package managers)
 * 
 * @param projectRoot - Project root directory
 * @param packageManager - Package manager being used
 */
export function validateLockfileDiscipline(
  projectRoot: string,
  packageManager: PackageManager
): void {
  const conflicts: string[] = [];

  // Check for lockfiles from other package managers
  for (const [pm, patterns] of Object.entries(LOCKFILE_PATTERNS)) {
    if (pm === packageManager) {
      continue; // Skip current PM
    }

    for (const pattern of patterns) {
      const lockfilePath = join(projectRoot, pattern);
      if (pathExists(lockfilePath)) {
        conflicts.push(pattern);
      }
    }
  }

  if (conflicts.length > 0) {
    throw new CliError(
      `Lockfile discipline violation: found lockfiles from other package managers:\n${conflicts.map(c => `  - ${c}`).join('\n')}\n` +
      `Remove conflicting lockfiles or use the correct package manager.`,
      ExitCode.VALIDATION_STATE_FAILURE
    );
  }
}

/**
 * Installs runtime dependencies
 * 
 * @param projectRoot - Project root directory
 * @param dependencies - Dependencies to install
 * @param options - Installation options
 * @returns Installation result
 */
export function addRuntimeDependencies(
  projectRoot: string,
  dependencies: DependencySpec[],
  options: DependencyInstallOptions = {}
): DependencyInstallResult {
  if (dependencies.length === 0) {
    return {
      success: true,
      scope: options.scope || 'workspace',
      dependencies: [],
      action: 'skipped',
    };
  }

  const packageManager = resolvePackageManager(projectRoot);
  validateLockfileDiscipline(projectRoot, packageManager);

  const scope = options.scope || 'workspace';
  const cwd = resolveScopePath(projectRoot, scope, options.cwd);

  if (options.dryRun) {
    return {
      success: true,
      scope,
      dependencies,
      action: 'installed',
    };
  }

  try {
    // Build install command
    const depsSpecs = dependencies.map(dep => `${dep.name}@${dep.version}`);
    const installArgs = packageManager === 'yarn'
      ? ['add', ...depsSpecs]
      : packageManager === 'pnpm'
      ? ['add', ...depsSpecs]
      : ['install', ...depsSpecs];

    const result = execPackageManager(packageManager, installArgs, {
      cwd,
      stdio: options.verbose ? 'inherit' : 'pipe',
    });

    return {
      success: true,
      scope,
      dependencies,
      action: 'installed',
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } catch (error) {
    return {
      success: false,
      scope,
      dependencies,
      action: 'error',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Installs dev dependencies
 * 
 * @param projectRoot - Project root directory
 * @param dependencies - Dev dependencies to install
 * @param options - Installation options
 * @returns Installation result
 */
export function addDevDependencies(
  projectRoot: string,
  dependencies: DependencySpec[],
  options: DependencyInstallOptions = {}
): DependencyInstallResult {
  if (dependencies.length === 0) {
    return {
      success: true,
      scope: options.scope || 'workspace',
      dependencies: [],
      action: 'skipped',
    };
  }

  const packageManager = resolvePackageManager(projectRoot);
  validateLockfileDiscipline(projectRoot, packageManager);

  const scope = options.scope || 'workspace';
  const cwd = resolveScopePath(projectRoot, scope, options.cwd);

  if (options.dryRun) {
    return {
      success: true,
      scope,
      dependencies,
      action: 'installed',
    };
  }

  try {
    // Build install command
    const depsSpecs = dependencies.map(dep => `${dep.name}@${dep.version}`);
    const installArgs = packageManager === 'yarn'
      ? ['add', '--dev', ...depsSpecs]
      : packageManager === 'pnpm'
      ? ['add', '--save-dev', ...depsSpecs]
      : ['install', '--save-dev', ...depsSpecs];

    const result = execPackageManager(packageManager, installArgs, {
      cwd,
      stdio: options.verbose ? 'inherit' : 'pipe',
    });

    return {
      success: true,
      scope,
      dependencies,
      action: 'installed',
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } catch (error) {
    return {
      success: false,
      scope,
      dependencies,
      action: 'error',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Runs package installation (install from lockfile)
 * 
 * @param projectRoot - Project root directory
 * @param options - Installation options
 * @returns Installation result
 */
export function installDependencies(
  projectRoot: string,
  options: DependencyInstallOptions = {}
): DependencyInstallResult {
  const packageManager = resolvePackageManager(projectRoot);
  validateLockfileDiscipline(projectRoot, packageManager);

  const scope = options.scope || 'workspace';
  const cwd = resolveScopePath(projectRoot, scope, options.cwd);

  if (options.dryRun) {
    return {
      success: true,
      scope,
      dependencies: [],
      action: 'installed',
    };
  }

  try {
    const result = execPackageManager(packageManager, ['install'], {
      cwd,
      stdio: options.verbose ? 'inherit' : 'pipe',
    });

    return {
      success: true,
      scope,
      dependencies: [],
      action: 'installed',
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } catch (error) {
    return {
      success: false,
      scope,
      dependencies: [],
      action: 'error',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Resolves the path for a dependency scope
 * 
 * @param projectRoot - Project root directory
 * @param scope - Dependency scope
 * @param overrideCwd - Optional override working directory
 * @returns Resolved path
 */
function resolveScopePath(
  projectRoot: string,
  scope: DependencyScope,
  overrideCwd?: string
): string {
  if (overrideCwd) {
    return overrideCwd;
  }

  if (scope === 'workspace') {
    return projectRoot;
  }

  if (scope === 'host') {
    // Host app is at project root for Option A
    return projectRoot;
  }

  if (scope.startsWith('package:')) {
    const packageName = scope.replace('package:', '');
    // Resolve workspace package path
    // For @rns/core -> packages/@rns/core
    const packagePath = packageName.replace('@rns/', 'packages/@rns/');
    return join(projectRoot, packagePath);
  }

  return projectRoot;
}
