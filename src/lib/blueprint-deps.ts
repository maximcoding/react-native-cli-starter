/**
 * FILE: src/lib/blueprint-deps.ts
 * PURPOSE: Extract dependencies from blueprint package.json based on CORE toggles
 * OWNERSHIP: CLI
 */

import { join, dirname } from 'path';
import { readJsonFile, pathExists } from './fs';
import { existsSync } from 'fs';

/**
 * Blueprint package.json location (relative to CLI root)
 */
const BLUEPRINT_PACKAGE_JSON = 'docs/ReactNativeCLITemplate/package.json';

/**
 * Dependency groups by toggle
 */
export interface ToggleDependencies {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

/**
 * Resolves CLI root directory (where CLI package.json lives)
 */
function resolveCliRoot(): string {
  // Navigate from __dirname to find package.json
  let current = __dirname;
  
  // When running from dist/, go up to find package.json
  // When running from source, go up from src/lib/ to find package.json
  while (current !== dirname(current)) {
    if (existsSync(join(current, 'package.json'))) {
      return current;
    }
    current = dirname(current);
  }
  
  // Fallback to process.cwd() if we can't find it
  return process.cwd();
}

/**
 * Default dependency versions (used when blueprint is not available)
 */
const DEFAULT_DEPENDENCIES: Record<string, string> = {
  'react-native-svg': '^15.0.0',
  'react-native-svg-transformer': '^1.5.0',
  'react-native-config': '^1.5.0',
};

const DEFAULT_DEV_DEPENDENCIES: Record<string, string> = {
  'babel-plugin-module-resolver': '^5.0.0',
};

/**
 * Reads blueprint package.json and extracts dependencies for enabled toggles
 * Falls back to default versions if blueprint is not available
 */
export function extractBlueprintDependencies(
  toggles: {
    alias: boolean;
    svg: boolean;
    fonts: boolean;
    env: boolean;
  },
  target: 'expo' | 'bare'
): ToggleDependencies {
  const cliRoot = resolveCliRoot();
  const blueprintPath = join(cliRoot, BLUEPRINT_PACKAGE_JSON);
  
  // Try to read blueprint, but don't fail if it doesn't exist
  let blueprint: any = null;
  if (pathExists(blueprintPath)) {
    try {
      blueprint = readJsonFile<any>(blueprintPath);
    } catch {
      // If blueprint exists but can't be read, continue with defaults
      blueprint = null;
    }
  }
  
  const deps: ToggleDependencies = {
    dependencies: {},
    devDependencies: {},
  };
  
  // Helper to get dependency version (from blueprint or default)
  const getDepVersion = (name: string, isDev: boolean = false): string | undefined => {
    if (blueprint) {
      const source = isDev ? blueprint.devDependencies : blueprint.dependencies;
      if (source?.[name]) {
        return source[name];
      }
    }
    const defaults = isDev ? DEFAULT_DEV_DEPENDENCIES : DEFAULT_DEPENDENCIES;
    return defaults[name];
  };
  
  // SVG toggle dependencies
  if (toggles.svg) {
    // react-native-svg is required for SVG support
    const svgVersion = getDepVersion('react-native-svg');
    if (svgVersion) {
      deps.dependencies['react-native-svg'] = svgVersion;
    }
    // react-native-svg-transformer is required for Metro to transform SVG files
    const transformerVersion = getDepVersion('react-native-svg-transformer');
    if (transformerVersion) {
      deps.dependencies['react-native-svg-transformer'] = transformerVersion;
    }
  }
  
  // Alias toggle dependencies
  if (toggles.alias) {
    // babel-plugin-module-resolver is required for path aliases
    const resolverVersion = getDepVersion('babel-plugin-module-resolver', true);
    if (resolverVersion) {
      deps.devDependencies['babel-plugin-module-resolver'] = resolverVersion;
    }
  }
  
  // Env toggle dependencies
  if (toggles.env) {
    if (target === 'expo') {
      // Expo uses expo-constants for env (built-in, but check if blueprint has it)
      // For Expo, env vars are typically handled via app.json/app.config.js
      // No additional dependency needed for basic env support
    } else {
      // Bare RN uses react-native-config
      const configVersion = getDepVersion('react-native-config');
      if (configVersion) {
        deps.dependencies['react-native-config'] = configVersion;
      }
    }
  }
  
  // Fonts toggle dependencies
  // Fonts in React Native are typically handled via assets/fonts directory
  // and react-native.config.js (for Bare) or expo-font (for Expo, if needed)
  // Blueprint shows fonts in assets/fonts, no special deps required for basic font support
  // If Expo needs expo-font, we can add it here, but blueprint doesn't show it as a dependency
  
  return deps;
}

