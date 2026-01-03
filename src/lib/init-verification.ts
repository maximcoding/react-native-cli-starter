/**
 * FILE: src/lib/init-verification.ts
 * PURPOSE: Verification utilities for init acceptance tests (section 2.5)
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { pathExists, readJsonFile, isDirectory } from './fs';
import { 
  PROJECT_STATE_FILE, 
  CLI_STATE_DIR, 
  CLI_LOGS_DIR,
  CLI_BACKUPS_DIR,
  WORKSPACE_PACKAGES_DIR,
  RUNTIME_PACKAGE_NAME,
  CORE_PACKAGE_NAME,
} from './constants';
import { CliError, ExitCode } from './errors';

export interface VerificationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Verifies that .rn-init.json exists and is valid
 */
export function verifyProjectStateFile(appRoot: string): { success: boolean; error?: string } {
  const stateFilePath = join(appRoot, PROJECT_STATE_FILE);
  
  if (!pathExists(stateFilePath)) {
    return { success: false, error: `.rn-init.json not found at ${stateFilePath}` };
  }
  
  try {
    const state = readJsonFile<any>(stateFilePath);
    
    // Verify required fields
    if (!state.cliVersion) {
      return { success: false, error: `.rn-init.json missing cliVersion field` };
    }
    
    if (state.workspaceModel !== 'Option A') {
      return { success: false, error: `.rn-init.json workspaceModel should be "Option A"` };
    }
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: `.rn-init.json is not valid JSON: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Verifies CLI-managed folders structure
 */
export function verifyCliFolders(appRoot: string): { success: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const requiredDirs = [
    CLI_STATE_DIR,
    CLI_LOGS_DIR,
    CLI_BACKUPS_DIR,
  ];
  
  for (const dir of requiredDirs) {
    const dirPath = join(appRoot, dir);
    if (!pathExists(dirPath) || !isDirectory(dirPath)) {
      errors.push(`Required directory missing: ${dir}`);
    }
  }
  
  return { success: errors.length === 0, errors };
}

/**
 * Verifies workspace packages structure
 */
export function verifyWorkspacePackages(appRoot: string): { success: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const packagesDir = join(appRoot, WORKSPACE_PACKAGES_DIR);
  if (!pathExists(packagesDir) || !isDirectory(packagesDir)) {
    errors.push(`Workspace packages directory missing: ${WORKSPACE_PACKAGES_DIR}`);
    return { success: false, errors };
  }
  
  const runtimeDir = join(packagesDir, 'runtime');
  if (!pathExists(runtimeDir) || !isDirectory(runtimeDir)) {
    errors.push(`Runtime package directory missing: ${WORKSPACE_PACKAGES_DIR}/runtime`);
  }
  
  const coreDir = join(packagesDir, 'core');
  if (!pathExists(coreDir) || !isDirectory(coreDir)) {
    errors.push(`Core package directory missing: ${WORKSPACE_PACKAGES_DIR}/core`);
  }
  
  // Verify package.json exists for runtime
  const runtimePackageJson = join(runtimeDir, 'package.json');
  if (pathExists(runtimePackageJson)) {
    try {
      const pkg = readJsonFile<any>(runtimePackageJson);
      if (pkg.name !== RUNTIME_PACKAGE_NAME) {
        errors.push(`Runtime package.json name should be ${RUNTIME_PACKAGE_NAME}, got ${pkg.name}`);
      }
    } catch {
      errors.push(`Runtime package.json is not valid JSON`);
    }
  }
  
  // Verify package.json exists for core
  const corePackageJson = join(coreDir, 'package.json');
  if (pathExists(corePackageJson)) {
    try {
      const pkg = readJsonFile<any>(corePackageJson);
      if (pkg.name !== CORE_PACKAGE_NAME) {
        errors.push(`Core package.json name should be ${CORE_PACKAGE_NAME}, got ${pkg.name}`);
      }
    } catch {
      errors.push(`Core package.json is not valid JSON`);
    }
  }
  
  return { success: errors.length === 0, errors };
}

/**
 * Verifies ownership boundary - CLI code should NOT be in user src/**
 */
export function verifyOwnershipBoundary(appRoot: string): { success: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check that user src/ doesn't contain CLI-owned patterns
  // This is a basic check - full verification would require checking file contents
  const userSrcDir = join(appRoot, 'src');
  
  if (pathExists(userSrcDir) && isDirectory(userSrcDir)) {
    // Basic check: if user src/ exists, it should be empty or contain user code only
    // We can't fully verify this without checking contents, but structure-wise,
    // CLI code should be in packages/@rns/*, not in src/
    // This is more of a structural verification
    
    // Future: could check for specific CLI patterns in src/ that shouldn't be there
    // For now, just verify that packages/@rns/* exists and src/ is separate
  } else {
    warnings.push('User src/ directory does not exist (may be created later)');
  }
  
  // Verify CLI-managed areas exist and are separate
  const packagesDir = join(appRoot, WORKSPACE_PACKAGES_DIR);
  if (!pathExists(packagesDir)) {
    errors.push('CLI-managed packages directory missing');
  }
  
  const cliStateDir = join(appRoot, CLI_STATE_DIR);
  if (!pathExists(cliStateDir)) {
    errors.push('CLI state directory missing');
  }
  
  return { success: errors.length === 0, errors, warnings };
}

/**
 * Comprehensive verification of init result
 */
export function verifyInitResult(appRoot: string): VerificationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 1. Verify .rn-init.json
  const stateResult = verifyProjectStateFile(appRoot);
  if (!stateResult.success) {
    errors.push(stateResult.error!);
  }
  
  // 2. Verify CLI folders
  const foldersResult = verifyCliFolders(appRoot);
  if (!foldersResult.success) {
    errors.push(...foldersResult.errors);
  }
  
  // 3. Verify workspace packages
  const packagesResult = verifyWorkspacePackages(appRoot);
  if (!packagesResult.success) {
    errors.push(...packagesResult.errors);
  }
  
  // 4. Verify ownership boundary
  const ownershipResult = verifyOwnershipBoundary(appRoot);
  if (!ownershipResult.success) {
    errors.push(...ownershipResult.errors);
  }
  warnings.push(...ownershipResult.warnings);
  
  return {
    success: errors.length === 0,
    errors,
    warnings,
  };
}

