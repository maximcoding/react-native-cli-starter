/**
 * FILE: src/lib/dx-verification.ts
 * PURPOSE: DX baseline acceptance verification (section 4.6)
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { pathExists, readJsonFile, isDirectory, readTextFile } from './fs';
import { USER_SRC_DIR, WORKSPACE_PACKAGES_DIR } from './constants';
import { VerificationResult } from './init-verification';

/**
 * Verifies DX baseline acceptance criteria (section 4.6)
 */
export function verifyDxBaselineAcceptance(
  appRoot: string,
  target: 'expo' | 'bare',
  language: 'ts' | 'js',
  aliasEnabled: boolean
): VerificationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Verify @rns/* imports are configured
  const aliasConfigResult = verifyAliasConfiguration(appRoot, target, language, aliasEnabled);
  if (!aliasConfigResult.success) {
    errors.push(...aliasConfigResult.errors);
  }
  warnings.push(...aliasConfigResult.warnings);

  // 2. Verify SVG pipeline is configured
  const svgConfigResult = verifySvgConfiguration(appRoot, language);
  if (!svgConfigResult.success) {
    errors.push(...svgConfigResult.errors);
  }

  // 3. Verify fonts pipeline is ready
  const fontsConfigResult = verifyFontsConfiguration(appRoot, target);
  if (!fontsConfigResult.success) {
    errors.push(...fontsConfigResult.errors);
  }

  // 4. Verify env pipeline is configured
  const envConfigResult = verifyEnvConfiguration(appRoot, target, language);
  if (!envConfigResult.success) {
    errors.push(...envConfigResult.errors);
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Verifies alias configuration (@rns/* and optional @/*)
 */
function verifyAliasConfiguration(
  appRoot: string,
  target: 'expo' | 'bare',
  language: 'ts' | 'js',
  aliasEnabled: boolean
): { success: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check TypeScript paths (if TS project)
  if (language === 'ts') {
    const tsconfigPath = join(appRoot, 'tsconfig.json');
    if (pathExists(tsconfigPath)) {
      try {
        const tsconfig = readJsonFile<any>(tsconfigPath);
        const paths = tsconfig.compilerOptions?.paths || {};
        
        // Verify @rns/* alias exists
        if (!paths['@rns/*']) {
          errors.push('TypeScript paths missing @rns/* alias');
        }
        
        // Verify @/* alias if enabled
        if (aliasEnabled) {
          const userSrcDir = join(appRoot, USER_SRC_DIR);
          if (pathExists(userSrcDir) && isDirectory(userSrcDir)) {
            if (!paths['@/*']) {
              errors.push('TypeScript paths missing @/* alias (alias toggle is ON and src/ exists)');
            }
          }
        }
      } catch {
        errors.push('Failed to read/parse tsconfig.json');
      }
    }
  }

  // Check Babel module-resolver configuration
  const babelConfigPath = join(appRoot, 'babel.config.js');
  if (pathExists(babelConfigPath)) {
    const babelConfig = readTextFile(babelConfigPath);
    
    // Check for module-resolver plugin
    if (!babelConfig.includes('module-resolver')) {
      errors.push('babel.config.js missing module-resolver plugin');
    } else {
      // Check for @rns alias
      if (!babelConfig.includes('@rns')) {
        errors.push('babel.config.js module-resolver missing @rns alias');
      }
      
      // Check for @ alias if enabled
      if (aliasEnabled) {
        const userSrcDir = join(appRoot, USER_SRC_DIR);
        if (pathExists(userSrcDir) && isDirectory(userSrcDir)) {
          if (!babelConfig.includes("'@'") && !babelConfig.includes('"@"')) {
            warnings.push('babel.config.js module-resolver may be missing @ alias (check manually)');
          }
        }
      }
    }
  } else {
    errors.push('babel.config.js not found');
  }

  return { success: errors.length === 0, errors, warnings };
}

/**
 * Verifies SVG pipeline configuration
 */
function verifySvgConfiguration(
  appRoot: string,
  language: 'ts' | 'js'
): { success: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check Metro config has SVG transformer
  const metroConfigPath = join(appRoot, 'metro.config.js');
  if (pathExists(metroConfigPath)) {
    const metroConfig = readTextFile(metroConfigPath);
    if (!metroConfig.includes('react-native-svg-transformer')) {
      errors.push('metro.config.js missing react-native-svg-transformer configuration');
    }
  } else {
    errors.push('metro.config.js not found');
  }

  // Check SVG type declarations (if TS project)
  if (language === 'ts') {
    const svgTypesPath = join(appRoot, 'types', 'svg.d.ts');
    if (!pathExists(svgTypesPath)) {
      errors.push('SVG type declarations (types/svg.d.ts) not found');
    }
  }

  // Check assets/svgs directory exists
  const assetsSvgsDir = join(appRoot, 'assets', 'svgs');
  if (!pathExists(assetsSvgsDir) || !isDirectory(assetsSvgsDir)) {
    errors.push('assets/svgs directory not found');
  }

  return { success: errors.length === 0, errors };
}

/**
 * Verifies fonts pipeline configuration
 */
function verifyFontsConfiguration(
  appRoot: string,
  target: 'expo' | 'bare'
): { success: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check assets/fonts directory exists
  const assetsFontsDir = join(appRoot, 'assets', 'fonts');
  if (!pathExists(assetsFontsDir) || !isDirectory(assetsFontsDir)) {
    errors.push('assets/fonts directory not found');
  }

  // Check react-native.config.js for Bare target
  if (target === 'bare') {
    const reactNativeConfigPath = join(appRoot, 'react-native.config.js');
    if (pathExists(reactNativeConfigPath)) {
      const config = readTextFile(reactNativeConfigPath);
      if (!config.includes('assets/fonts')) {
        errors.push('react-native.config.js missing assets/fonts configuration');
      }
    } else {
      errors.push('react-native.config.js not found (required for Bare target font linking)');
    }
  }

  return { success: errors.length === 0, errors };
}

/**
 * Verifies env pipeline configuration
 */
function verifyEnvConfiguration(
  appRoot: string,
  target: 'expo' | 'bare',
  language: 'ts' | 'js'
): { success: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check .env.example exists
  const envExamplePath = join(appRoot, '.env.example');
  if (!pathExists(envExamplePath)) {
    errors.push('.env.example file not found');
  }

  // Check env config in @rns/core
  const envConfigPath = join(appRoot, WORKSPACE_PACKAGES_DIR, 'core', 'config', `env.${language === 'ts' ? 'ts' : 'js'}`);
  if (!pathExists(envConfigPath)) {
    errors.push(`@rns/core/config/env.${language === 'ts' ? 'ts' : 'js'} not found`);
  }

  return { success: errors.length === 0, errors };
}


