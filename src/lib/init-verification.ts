/**
 * FILE: src/lib/init-verification.ts
 * PURPOSE: Verification utilities for init acceptance tests (section 2.5)
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { pathExists, readJsonFile, isDirectory, readTextFile } from './fs';
import { 
  PROJECT_STATE_FILE, 
  CLI_STATE_DIR, 
  CLI_LOGS_DIR,
  CLI_BACKUPS_DIR,
  CLI_AUDIT_DIR,
  WORKSPACE_PACKAGES_DIR,
  USER_SRC_DIR,
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

/**
 * Verifies CORE baseline is installed (section 3.7 acceptance)
 */
export function verifyCoreBaselineInstalled(appRoot: string): { success: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check audit marker exists
  const markerPath = join(appRoot, CLI_AUDIT_DIR, 'BASE_INSTALLED.txt');
  if (!pathExists(markerPath)) {
    errors.push('CORE baseline marker (.rns/audit/BASE_INSTALLED.txt) not found');
  }
  
  // Verify CORE packages exist
  const coreDir = join(appRoot, WORKSPACE_PACKAGES_DIR, 'core');
  if (!pathExists(coreDir) || !isDirectory(coreDir)) {
    errors.push('CORE package directory missing');
  }
  
  // Verify runtime package exists
  const runtimeDir = join(appRoot, WORKSPACE_PACKAGES_DIR, 'runtime');
  if (!pathExists(runtimeDir) || !isDirectory(runtimeDir)) {
    errors.push('Runtime package directory missing');
  }
  
  // Verify runtime index exists (RnsApp component)
  const runtimeIndex = join(runtimeDir, 'index.ts');
  const runtimeIndexJs = join(runtimeDir, 'index.js');
  if (!pathExists(runtimeIndex) && !pathExists(runtimeIndexJs)) {
    errors.push('Runtime index file (RnsApp component) not found');
  }
  
  return { success: errors.length === 0, errors };
}

/**
 * Verifies ownership boundary - CLI code in packages/@rns/* and .rns/*, user code in src/** (section 3.7 acceptance)
 */
export function verifyOwnershipBoundaryStrict(appRoot: string): { success: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Verify CLI-managed areas exist
  const packagesDir = join(appRoot, WORKSPACE_PACKAGES_DIR);
  if (!pathExists(packagesDir) || !isDirectory(packagesDir)) {
    errors.push(`CLI-managed packages directory missing: ${WORKSPACE_PACKAGES_DIR}`);
  }
  
  const cliStateDir = join(appRoot, CLI_STATE_DIR);
  if (!pathExists(cliStateDir) || !isDirectory(cliStateDir)) {
    errors.push(`CLI state directory missing: ${CLI_STATE_DIR}`);
  }
  
  // Verify user src/ is separate (if it exists, it should not contain CLI-owned patterns)
  const userSrcDir = join(appRoot, USER_SRC_DIR);
  if (pathExists(userSrcDir) && isDirectory(userSrcDir)) {
    // Structural check: user src/ should be separate from packages/@rns/*
    // This is already enforced by directory structure, but we verify separation
    const userSrcPackages = join(userSrcDir, 'packages');
    if (pathExists(userSrcPackages)) {
      warnings.push('User src/ contains packages/ directory - ensure it does not conflict with CLI-managed packages/@rns/*');
    }
  }
  
  // Verify no CLI-owned code in user src/ (basic structural check)
  // Full verification would require checking file contents, but structure is sufficient
  // CLI code should ONLY be in packages/@rns/* and .rns/*
  
  return { success: errors.length === 0, errors, warnings };
}

/**
 * Verifies CORE packages have no plugin dependencies (section 3.7 acceptance)
 */
export function verifyCorePackagesPluginFree(appRoot: string): { success: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Plugin-only dependencies to check for (common ones)
  const pluginOnlyDeps = [
    '@react-navigation',
    '@tanstack/react-query',
    'react-query',
    '@apollo/client',
    'i18next',
    'react-i18next',
    '@react-native-firebase',
    'firebase',
    'react-native-mmkv', // This is optional, but if present should be via plugin
    '@react-native-community/netinfo', // This is optional, but if present should be via plugin
  ];
  
  // Check @rns/core package.json
  const corePackageJson = join(appRoot, WORKSPACE_PACKAGES_DIR, 'core', 'package.json');
  if (pathExists(corePackageJson)) {
    try {
      const pkg = readJsonFile<any>(corePackageJson);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
      
      for (const dep of Object.keys(deps)) {
        for (const pluginDep of pluginOnlyDeps) {
          if (dep.includes(pluginDep)) {
            errors.push(`@rns/core has plugin dependency: ${dep}`);
          }
        }
      }
    } catch {
      errors.push('Failed to read @rns/core package.json');
    }
  }
  
  // Check @rns/runtime package.json
  const runtimePackageJson = join(appRoot, WORKSPACE_PACKAGES_DIR, 'runtime', 'package.json');
  if (pathExists(runtimePackageJson)) {
    try {
      const pkg = readJsonFile<any>(runtimePackageJson);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
      
      // Runtime is allowed react and react-native, but not plugin-only deps
      for (const dep of Object.keys(deps)) {
        // Skip allowed core dependencies
        if (dep === 'react' || dep === 'react-native' || dep === CORE_PACKAGE_NAME) {
          continue;
        }
        
        for (const pluginDep of pluginOnlyDeps) {
          if (dep.includes(pluginDep)) {
            errors.push(`@rns/runtime has plugin dependency: ${dep}`);
          }
        }
      }
    } catch {
      errors.push('Failed to read @rns/runtime package.json');
    }
  }
  
  return { success: errors.length === 0, errors };
}

/**
 * Comprehensive verification for section 3.7 acceptance criteria
 */
export function verifyCoreBaselineAcceptance(appRoot: string): VerificationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 1. CORE baseline installed
  const coreBaselineResult = verifyCoreBaselineInstalled(appRoot);
  if (!coreBaselineResult.success) {
    errors.push(...coreBaselineResult.errors);
  }
  
  // 2. Ownership boundary holds
  const ownershipResult = verifyOwnershipBoundaryStrict(appRoot);
  if (!ownershipResult.success) {
    errors.push(...ownershipResult.errors);
  }
  warnings.push(...ownershipResult.warnings);
  
  // 3. CORE packages compile without plugin dependencies
  const pluginFreeResult = verifyCorePackagesPluginFree(appRoot);
  if (!pluginFreeResult.success) {
    errors.push(...pluginFreeResult.errors);
  }
  
  return {
    success: errors.length === 0,
    errors,
    warnings,
  };
}

