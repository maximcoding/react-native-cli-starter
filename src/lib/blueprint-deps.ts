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
 * Reads blueprint package.json and extracts dependencies for enabled toggles
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
  
  if (!pathExists(blueprintPath)) {
    throw new Error(
      `Blueprint package.json not found at ${blueprintPath}\n` +
      `This file is required to determine CORE toggle dependencies.`
    );
  }
  
  const blueprint = readJsonFile<any>(blueprintPath);
  const deps: ToggleDependencies = {
    dependencies: {},
    devDependencies: {},
  };
  
  // SVG toggle dependencies
  if (toggles.svg) {
    // react-native-svg is required for SVG support
    if (blueprint.dependencies?.['react-native-svg']) {
      deps.dependencies['react-native-svg'] = blueprint.dependencies['react-native-svg'];
    }
    // react-native-svg-transformer is required for Metro to transform SVG files
    if (blueprint.dependencies?.['react-native-svg-transformer']) {
      deps.dependencies['react-native-svg-transformer'] = blueprint.dependencies['react-native-svg-transformer'];
    }
  }
  
  // Alias toggle dependencies
  if (toggles.alias) {
    // babel-plugin-module-resolver is required for path aliases
    if (blueprint.devDependencies?.['babel-plugin-module-resolver']) {
      deps.devDependencies['babel-plugin-module-resolver'] = blueprint.devDependencies['babel-plugin-module-resolver'];
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
      if (blueprint.dependencies?.['react-native-config']) {
        deps.dependencies['react-native-config'] = blueprint.dependencies['react-native-config'];
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
