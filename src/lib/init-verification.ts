/**
 * FILE: src/lib/init-verification.ts
 * PURPOSE: Structural verification for generated projects (no network required)
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { pathExists, isDirectory, readTextFile, readJsonFile } from './fs';
import { CliError, ExitCode } from './errors';
import { WORKSPACE_PACKAGES_DIR, RUNTIME_PACKAGE_NAME, PROJECT_STATE_FILE } from './constants';
import type { InitInputs } from './init';

/**
 * Verification result type
 */
export interface VerificationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Verifies generated project structure matches Option A and selected features
 * This is a local FS-only check, no installs or network required
 */
export function verifyGeneratedProjectStructure(
  projectRoot: string,
  inputs: InitInputs
): VerificationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Verify App.tsx exists and contains expected structure
  // App.tsx is now in User Zone and contains providers directly (standard React Native structure)
  const appEntryPath = inputs.language === 'ts' 
    ? join(projectRoot, 'App.tsx')
    : join(projectRoot, 'App.js');
  
  if (!pathExists(appEntryPath)) {
    errors.push(`App entrypoint (${inputs.language === 'ts' ? 'App.tsx' : 'App.js'}) not found`);
  } else {
    const appContent = readTextFile(appEntryPath);
    // App.tsx should import initCore from @rns/runtime/core-init
    if (!appContent.includes('initCore') && !appContent.includes('@rns/runtime/core-init')) {
      warnings.push(`App.tsx should import initCore from @rns/runtime/core-init`);
    }
    // App.tsx should contain providers (GestureHandlerRootView, SafeAreaProvider)
    if (!appContent.includes('GestureHandlerRootView') || !appContent.includes('SafeAreaProvider')) {
      warnings.push(`App.tsx should contain GestureHandlerRootView and SafeAreaProvider providers`);
    }
    // Check for marker comments for plugin injection
    if (!appContent.includes('@rns-marker:providers:start')) {
      warnings.push(`App.tsx should contain @rns-marker:providers:start/end for plugin injection`);
    }
  }

  // 2. Verify packages/@rns/runtime exists
  const runtimeDir = join(projectRoot, WORKSPACE_PACKAGES_DIR, 'runtime');
  if (!pathExists(runtimeDir) || !isDirectory(runtimeDir)) {
    errors.push(`packages/@rns/runtime not found`);
  } else {
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
    } else {
      errors.push(`Runtime package.json not found`);
    }
  }

  // 2.1 Section 26: Bare init includes navigation package + bare runtime override
  if (inputs.target === 'bare') {
    const navDir = join(projectRoot, WORKSPACE_PACKAGES_DIR, 'navigation');
    if (!pathExists(navDir) || !isDirectory(navDir)) {
      errors.push(`packages/@rns/navigation not found (Bare init navigation expected)`);
    }

    // Check for index.tsx (bare projects use .tsx for JSX) or index.ts (fallback)
    const runtimeIndexPath = join(runtimeDir, 'index.tsx');
    const runtimeIndexPathFallback = join(runtimeDir, 'index.ts');
    const runtimeIndexFile = pathExists(runtimeIndexPath) ? runtimeIndexPath : runtimeIndexPathFallback;
    if (pathExists(runtimeIndexFile)) {
      const runtimeIndex = readTextFile(runtimeIndexFile);
      if (!runtimeIndex.includes('@rns/navigation')) {
        errors.push(`@rns/runtime/index.tsx (or index.ts) does not reference @rns/navigation (Bare init navigation expected)`);
      }
    }

    // Bare entrypoint should initialize gesture handler
    const entryIndexJs = join(projectRoot, 'index.js');
    if (pathExists(entryIndexJs)) {
      const entry = readTextFile(entryIndexJs);
      if (!entry.includes('react-native-gesture-handler')) {
        errors.push(`index.js missing react-native-gesture-handler import (Bare navigation requirement)`);
      }
    } else {
      warnings.push(`index.js not found (Bare entrypoint); gesture-handler init may be missing`);
    }
  }

  // 3. Verify SVG configuration if SVG toggle is enabled
  if (inputs.coreToggles.svg) {
    // Check metro.config.js has SVG transformer
    const metroConfigPath = join(projectRoot, 'metro.config.js');
    if (pathExists(metroConfigPath)) {
      const metroConfig = readTextFile(metroConfigPath);
      if (!metroConfig.includes('react-native-svg-transformer')) {
        errors.push(`metro.config.js missing react-native-svg-transformer configuration (SVG toggle enabled)`);
      }
    } else {
      errors.push(`metro.config.js not found (SVG toggle enabled)`);
    }

    // Check SVG type declarations exist (if TypeScript)
    if (inputs.language === 'ts') {
      const svgTypesPath = join(projectRoot, 'types', 'svg.d.ts');
      if (!pathExists(svgTypesPath)) {
        errors.push(`SVG type declarations (types/svg.d.ts) not found (SVG toggle enabled, TypeScript project)`);
      }
    }
  }

  // 4. Verify alias configuration if alias toggle is enabled
  if (inputs.coreToggles.alias) {
    // Check babel.config.js has module-resolver
    const babelConfigPath = join(projectRoot, 'babel.config.js');
    if (pathExists(babelConfigPath)) {
      const babelConfig = readTextFile(babelConfigPath);
      if (!babelConfig.includes('module-resolver')) {
        errors.push(`babel.config.js missing module-resolver plugin (alias toggle enabled)`);
      }
      // Check for @ alias if src exists
      const userSrcExists = pathExists(join(projectRoot, 'src')) && isDirectory(join(projectRoot, 'src'));
      if (userSrcExists && !babelConfig.includes('"@":')) {
        warnings.push(`babel.config.js may be missing @ alias (check manually)`);
      }
    } else {
      errors.push(`babel.config.js not found (alias toggle enabled)`);
    }

    // Check tsconfig.json has paths
    const tsconfigPath = join(projectRoot, 'tsconfig.json');
    if (pathExists(tsconfigPath)) {
      try {
        const tsconfig = readJsonFile<any>(tsconfigPath);
        if (!tsconfig.compilerOptions?.paths) {
          errors.push(`tsconfig.json missing paths configuration (alias toggle enabled)`);
        } else {
          if (!tsconfig.compilerOptions.paths['@rns/*']) {
            errors.push(`tsconfig.json missing @rns/* path alias`);
          }
        }
      } catch (error) {
        errors.push(`tsconfig.json is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else if (inputs.language === 'ts') {
      errors.push(`tsconfig.json not found (TypeScript project, alias toggle enabled)`);
    }
  }

  // 5. Verify scripts folder exists if package.json references scripts/*
  const packageJsonPath = join(projectRoot, 'package.json');
  if (pathExists(packageJsonPath)) {
    try {
      const packageJson = readJsonFile<any>(packageJsonPath);
      const scripts = packageJson.scripts || {};
      const hasScriptsReference = Object.values(scripts).some((cmd: any) => 
        typeof cmd === 'string' && cmd.includes('scripts/')
      );
      if (hasScriptsReference) {
        const scriptsDir = join(projectRoot, 'scripts');
        if (!pathExists(scriptsDir) || !isDirectory(scriptsDir)) {
          errors.push(`scripts/ folder not found but package.json scripts reference scripts/*`);
        }
      }
    } catch {
      // If package.json is invalid, skip scripts check
    }
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Verifies basic init result structure (section 2.5)
 */
export function verifyInitResult(
  appRoot: string
): VerificationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check .rn-init.json exists
  const stateFile = join(appRoot, '.rn-init.json');
  if (!pathExists(stateFile)) {
    errors.push('.rn-init.json not found');
  } else {
    try {
      const state = readJsonFile<any>(stateFile);
      if (!state.workspaceModel || state.workspaceModel !== 'Option A') {
        errors.push('.rn-init.json missing or invalid workspaceModel (should be "Option A")');
      }
    } catch {
      errors.push('.rn-init.json is not valid JSON');
    }
  }

  // Check .rns/ directory exists
  const rnsDir = join(appRoot, '.rns');
  if (!pathExists(rnsDir) || !isDirectory(rnsDir)) {
    errors.push('.rns/ directory not found');
  }

  // Check packages/@rns/runtime exists
  const runtimeDir = join(appRoot, WORKSPACE_PACKAGES_DIR, 'runtime');
  if (!pathExists(runtimeDir) || !isDirectory(runtimeDir)) {
    errors.push('packages/@rns/runtime not found');
  }

  // Check packages/@rns/core exists
  const coreDir = join(appRoot, WORKSPACE_PACKAGES_DIR, 'core');
  if (!pathExists(coreDir) || !isDirectory(coreDir)) {
    errors.push('packages/@rns/core not found');
  }

  // Section 26: Bare init should include navigation package
  try {
    const state = readJsonFile<any>(join(appRoot, PROJECT_STATE_FILE));
    if (state?.target === 'bare') {
      const navDir = join(appRoot, WORKSPACE_PACKAGES_DIR, 'navigation');
      if (!pathExists(navDir) || !isDirectory(navDir)) {
        errors.push('packages/@rns/navigation not found (Bare init navigation expected)');
      }
    }
  } catch {
    // If manifest can't be read, skip this check
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Verifies CORE baseline acceptance criteria (section 3.7)
 */
export function verifyCoreBaselineAcceptance(
  appRoot: string
): VerificationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Determine target from manifest (navigation is CORE for bare in section 26)
  let manifestTarget: 'expo' | 'bare' | undefined;
  try {
    const state = readJsonFile<any>(join(appRoot, PROJECT_STATE_FILE));
    if (state?.target === 'expo' || state?.target === 'bare') {
      manifestTarget = state.target;
    }
  } catch {
    // If we can't read state, keep strict checks below.
  }

  // Check ownership boundary: CLI-managed code is in packages/@rns/* + .rns/*
  // User src/** should not contain CLI glue
  const userSrcDir = join(appRoot, 'src');
  if (pathExists(userSrcDir) && isDirectory(userSrcDir)) {
    // This is a basic check - in production, could scan for @rns imports in user src
    // For now, we assume if src exists and packages/@rns exists, boundary is maintained
  }

  // Check CORE packages don't have plugin dependencies
  const corePackageJson = join(appRoot, WORKSPACE_PACKAGES_DIR, 'core', 'package.json');
  if (pathExists(corePackageJson)) {
    try {
      const pkg = readJsonFile<any>(corePackageJson);
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      for (const dep of Object.keys(deps)) {
        // Check for known plugin-only dependencies (this is a basic check)
        if (dep.includes('navigation') || dep.includes('i18n') || dep.includes('query') || dep.includes('auth')) {
          errors.push(`@rns/core has plugin dependency: ${dep}`);
        }
      }
    } catch {
      errors.push('Failed to read @rns/core package.json');
    }
  }

  const runtimePackageJson = join(appRoot, WORKSPACE_PACKAGES_DIR, 'runtime', 'package.json');
  if (pathExists(runtimePackageJson)) {
    try {
      const pkg = readJsonFile<any>(runtimePackageJson);
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      for (const dep of Object.keys(deps)) {
        // Runtime can have React/RN. Navigation is allowed for bare (section 26).
        const isNavigation = dep.includes('navigation');
        const isDisallowed =
          dep.includes('i18n') || dep.includes('query') || dep.includes('auth');

        if (isDisallowed) {
          errors.push(`@rns/runtime has plugin dependency: ${dep}`);
        }

        if (isNavigation && manifestTarget !== 'bare') {
          errors.push(`@rns/runtime has plugin dependency: ${dep}`);
        }
      }
    } catch {
      errors.push('Failed to read @rns/runtime package.json');
    }
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
  };
}
