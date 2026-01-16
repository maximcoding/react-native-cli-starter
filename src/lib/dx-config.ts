/**
 * FILE: src/lib/dx-config.ts
 * PURPOSE: Generate DX configuration files (alias, svg, fonts, env)
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { pathExists, isDirectory, readJsonFile, writeJsonFile, writeTextFile, readTextFile, ensureDir } from './fs';
import type { InitInputs } from './init';
import { USER_SRC_DIR } from './constants';

/**
 * Configures import aliases (section 4.1)
 * - @rns/* for workspace packages (always enabled)
 * - @/* for user src/** (optional, default ON if src/ exists)
 * 
 * NOTE: Config files (babel.config.js, metro.config.js, tsconfig.json) are provided
 * by templates/base via attachment engine. This function ensures @rns/* is always
 * configured and does minimal post-processing if needed (e.g., adjusting aliases if src doesn't exist or aliases are disabled).
 */
export function configureImportAliases(
  appRoot: string,
  inputs: InitInputs
): void {
  const userSrcDir = join(appRoot, USER_SRC_DIR);
  const userSrcExists = pathExists(userSrcDir) && isDirectory(userSrcDir);
  const aliasEnabled = inputs.coreToggles.alias && userSrcExists;

  // Always ensure @rns/* is configured (required for workspace packages)
  // This is critical even if alias toggle is disabled
  // Also ensure @/* and @assets/* when alias toggle is enabled and src exists
  if (inputs.language === 'ts') {
    ensureAliasesInTsConfig(appRoot, userSrcExists, inputs.coreToggles.alias);
  }

  // Config files are provided by templates/base via attachment engine
  // Only do minimal post-processing if src doesn't exist or aliases are disabled
  if (!userSrcExists || !aliasEnabled) {
    // Adjust babel.config.js if src doesn't exist (remove @ and @assets aliases, change root)
    adjustBabelConfigForNoSrc(appRoot, userSrcExists, aliasEnabled);
    
    // Adjust tsconfig.json if TypeScript and src doesn't exist
    if (inputs.language === 'ts') {
      adjustTsConfigForNoSrc(appRoot, userSrcExists, aliasEnabled);
    }
  }
}

/**
 * Ensures all required aliases are present in tsconfig.json
 * - @rns/* is always present (required for workspace packages)
 * - @/* and @assets/* are present when alias toggle is enabled and src exists
 */
function ensureAliasesInTsConfig(
  appRoot: string,
  userSrcExists: boolean,
  aliasEnabled: boolean
): void {
  const tsconfigPath = join(appRoot, 'tsconfig.json');
  if (!pathExists(tsconfigPath)) {
    return; // Should exist from templates, but if not, skip
  }

  const tsconfig = readJsonFile<any>(tsconfigPath);
  
  // Ensure compilerOptions exists
  if (!tsconfig.compilerOptions) {
    tsconfig.compilerOptions = {};
  }
  
  // Ensure paths exists
  if (!tsconfig.compilerOptions.paths) {
    tsconfig.compilerOptions.paths = {};
  }
  
  // Determine baseUrl (should match template, but ensure it's correct)
  const baseUrl = tsconfig.compilerOptions.baseUrl || (userSrcExists ? './src' : '.');
  
  // Always ensure @rns/* is present (required for workspace packages)
  // Path is relative to baseUrl
  const rnsPath = baseUrl === './src' 
    ? ['../packages/@rns/*']
    : ['packages/@rns/*'];
  
  tsconfig.compilerOptions.paths['@rns/*'] = rnsPath;
  
  // Add @/* and @assets/* aliases if enabled and src exists
  if (aliasEnabled && userSrcExists) {
    // Ensure baseUrl is set correctly for src-based aliases
    if (tsconfig.compilerOptions.baseUrl !== './src') {
      tsconfig.compilerOptions.baseUrl = './src';
    }
    
    // @/* maps to src/* (relative to baseUrl which is ./src)
    tsconfig.compilerOptions.paths['@/*'] = ['*'];
    
    // @assets/* maps to assets/* (relative to baseUrl which is ./src)
    tsconfig.compilerOptions.paths['@assets/*'] = ['../assets/*'];
  }
  
  writeJsonFile(tsconfigPath, tsconfig);
}

/**
 * Minimal post-processing: Adjust babel.config.js if src doesn't exist or aliases disabled
 * Config file comes from templates/base, we only adjust it if needed
 */
function adjustBabelConfigForNoSrc(
  appRoot: string,
  userSrcExists: boolean,
  aliasEnabled: boolean
): void {
  const babelConfigPath = join(appRoot, 'babel.config.js');
  if (!pathExists(babelConfigPath)) {
    return; // Config should exist from templates, but if not, skip
  }

  // Read existing config from template
  const content = readTextFile(babelConfigPath);
  
  // If src doesn't exist or aliases disabled, adjust root and remove @/@assets aliases
  if (!userSrcExists || !aliasEnabled) {
    // Simple string replacement to adjust root and aliases
    // This is minimal post-processing - the full config comes from templates
    let adjusted = content
      .replace(/root:\s*\[['"]\.\/src['"]\]/g, "root: ['.']")
      .replace(/['"]@['"]:\s*['"]\.\/src['"],?\s*/g, '')
      .replace(/['"]@assets['"]:\s*['"]\.\/assets['"],?\s*/g, '')
      .replace(/,\s*}/g, '}') // Remove trailing comma if aliases were removed
      .replace(/alias:\s*{\s*}/g, 'alias: {\n          \'@rns\': \'./packages/@rns\',\n        }');
    
    writeTextFile(babelConfigPath, adjusted);
  }
}

/**
 * Minimal post-processing: Adjust tsconfig.json if src doesn't exist or aliases disabled
 * Config file comes from templates/base, we only adjust it if needed
 */
function adjustTsConfigForNoSrc(
  appRoot: string,
  userSrcExists: boolean,
  aliasEnabled: boolean
): void {
  const tsconfigPath = join(appRoot, 'tsconfig.json');
  if (!pathExists(tsconfigPath)) {
    return; // Config should exist from templates, but if not, skip
  }

  const tsconfig = readJsonFile<any>(tsconfigPath);
  
  if (!userSrcExists || !aliasEnabled) {
    // Adjust baseUrl and paths
    if (tsconfig.compilerOptions) {
      tsconfig.compilerOptions.baseUrl = '.';
      if (tsconfig.compilerOptions.paths) {
        // Keep @rns/* path (always required), remove @/* and @assets/*
        tsconfig.compilerOptions.paths = {
          '@rns/*': ['packages/@rns/*'],
        };
      } else {
        // Ensure paths exists with @rns/*
        tsconfig.compilerOptions.paths = {
          '@rns/*': ['packages/@rns/*'],
        };
      }
    } else {
      // Ensure compilerOptions exists
      tsconfig.compilerOptions = {
        baseUrl: '.',
        paths: {
          '@rns/*': ['packages/@rns/*'],
        },
      };
    }
    
    writeJsonFile(tsconfigPath, tsconfig);
  }
}

/**
 * Configures TypeScript path aliases
 */
function configureTypeScriptPaths(
  appRoot: string,
  aliasEnabled: boolean,
  userSrcExists: boolean,
  target: 'expo' | 'bare'
): void {
  const tsconfigPath = join(appRoot, 'tsconfig.json');
  
  if (!pathExists(tsconfigPath)) {
    // If no tsconfig.json exists, create a minimal one
    const baseTsConfig = {
      extends: target === 'expo' 
        ? 'expo/tsconfig.base'
        : '@react-native/typescript-config',
      compilerOptions: {
        allowJs: true,
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        jsx: 'react-native',
        skipLibCheck: true,
        strict: true,
        resolveJsonModule: true,
      },
      include: ['src/**/*', 'App.tsx', 'App.js'],
      exclude: ['node_modules'],
    };
    writeJsonFile(tsconfigPath, baseTsConfig);
  }

  // Read existing tsconfig.json
  const tsconfig = readJsonFile<any>(tsconfigPath);
  
  // Ensure compilerOptions exists
  if (!tsconfig.compilerOptions) {
    tsconfig.compilerOptions = {};
  }

  // Configure baseUrl and paths (match blueprint pattern)
  // If src exists, baseUrl points to src (blueprint pattern)
  // Otherwise, baseUrl points to root for workspace packages
  if (userSrcExists) {
    tsconfig.compilerOptions.baseUrl = './src';
  } else {
    tsconfig.compilerOptions.baseUrl = '.';
  }

  // Configure paths - always include @rns/* for workspace packages
  // Paths are relative to baseUrl
  tsconfig.compilerOptions.paths = {
    '@rns/*': userSrcExists ? ['../packages/@rns/*'] : ['packages/@rns/*'],
  };

  // Add @/* and @assets/* aliases if enabled and src exists (blueprint pattern)
  if (aliasEnabled && userSrcExists) {
    tsconfig.compilerOptions.paths['@/*'] = ['*']; // Relative to baseUrl (./src)
    tsconfig.compilerOptions.paths['@assets/*'] = ['../assets/*']; // Relative to baseUrl (./src)
  }

  // Update include/exclude to match blueprint pattern
  if (!tsconfig.include) {
    tsconfig.include = [];
  }
  
  // Add includes matching blueprint: ["src", "assets", "scripts", "src/types", "types"]
  if (userSrcExists && !tsconfig.include.includes('src')) {
    tsconfig.include.push('src');
  }
  if (!tsconfig.include.includes('assets')) {
    tsconfig.include.push('assets');
  }
  if (!tsconfig.include.includes('scripts')) {
    tsconfig.include.push('scripts');
  }
  if (userSrcExists && !tsconfig.include.includes('src/types')) {
    tsconfig.include.push('src/types');
  }
  if (!tsconfig.include.includes('types')) {
    tsconfig.include.push('types');
  }
  
  // Always include App entrypoint and workspace packages
  if (!tsconfig.include.includes('App.tsx') && !tsconfig.include.includes('App.js')) {
    tsconfig.include.push('App.tsx', 'App.js');
  }
  if (!tsconfig.include.includes('packages/@rns/**/*')) {
    tsconfig.include.push('packages/@rns/**/*');
  }

  if (!tsconfig.exclude) {
    tsconfig.exclude = [];
  }
  if (!tsconfig.exclude.includes('node_modules')) {
    tsconfig.exclude.push('node_modules');
  }
  if (!tsconfig.exclude.includes('Pods')) {
    tsconfig.exclude.push('Pods');
  }

  writeJsonFile(tsconfigPath, tsconfig);
}

/**
 * Configures Metro resolver for aliases
 */
function configureMetroResolver(
  appRoot: string,
  target: 'expo' | 'bare',
  aliasEnabled: boolean,
  userSrcExists: boolean
): void {
  const metroConfigPath = join(appRoot, 'metro.config.js');
  
  let metroConfigContent: string;
  
  if (target === 'expo') {
    // Expo Metro config
    if (pathExists(metroConfigPath)) {
      metroConfigContent = readTextFile(metroConfigPath);
    } else {
      metroConfigContent = `const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
`;
    }
    
    // Add resolver configuration
    // For Expo, we rely on Babel module-resolver for alias resolution
    // Metro config is mainly for asset extensions (SVG will be added in section 4.2)
    // We don't need to modify Metro config for aliases in Expo
  } else {
    // Bare React Native Metro config
    if (pathExists(metroConfigPath)) {
      metroConfigContent = readTextFile(metroConfigPath);
    } else {
      metroConfigContent = `const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

module.exports = (async () => {
  const defaultConfig = await getDefaultConfig(__dirname);
  return mergeConfig(defaultConfig, {
    // Configuration will be added here
  });
})();
`;
    }
    
    // For Bare, Metro resolver also uses Babel module-resolver
    // Metro config is mainly for asset extensions (SVG will be added in section 4.2)
  }
  
  writeTextFile(metroConfigPath, metroConfigContent);
}

/**
 * Configures Babel module-resolver for runtime alias resolution
 */
function configureBabelResolver(
  appRoot: string,
  target: 'expo' | 'bare',
  aliasEnabled: boolean,
  userSrcExists: boolean
): void {
  const babelConfigPath = join(appRoot, 'babel.config.js');
  
  // For existing babel.config.js, we'll append module-resolver if not present
  // Full parsing/merging is complex, so we use a simple approach:
  // If file exists, check if module-resolver is already there
  // If not, we'll need to add it (this may require manual review for complex configs)
  
  let babelConfig: any = {
    presets: target === 'expo' 
      ? ['babel-preset-expo']
      : ['module:@react-native/babel-preset'],
    plugins: [],
  };
  
  if (pathExists(babelConfigPath)) {
    // Check if module-resolver is already configured
    const existingContent = readTextFile(babelConfigPath);
    if (existingContent.includes('module-resolver')) {
      // Module resolver already exists - we'll need to update it
      // For now, we'll create a new config that includes module-resolver
      // In production, this could be improved with AST parsing
      // But for init, we can assume a fresh config or append if needed
    }
    // Note: Full parsing of existing babel.config.js requires AST parsing
    // For section 4.1, we assume either no babel.config.js or a standard one from Expo/Bare init
    // We'll create/overwrite with our configuration
  }

  // Find or create module-resolver plugin
  let moduleResolverPlugin: any = babelConfig.plugins.find(
    (p: any) => Array.isArray(p) && p[0] === 'module-resolver'
  );

  if (!moduleResolverPlugin) {
    moduleResolverPlugin = ['module-resolver', { root: [], alias: {} }];
    babelConfig.plugins.push(moduleResolverPlugin);
  }

  // Configure aliases (match blueprint pattern)
  // Always include @rns for workspace packages (required for @rns/* imports)
  const alias: Record<string, string> = {
    '@rns': './packages/@rns',
  };
  
  // Add @/* and @assets/* aliases if enabled and src exists (blueprint pattern)
  if (aliasEnabled && userSrcExists) {
    alias['@'] = './src';
    alias['@assets'] = './assets';
  }

  moduleResolverPlugin[1].alias = alias;

  // Set root - match blueprint: root points to src if it exists, otherwise '.'
  const root = userSrcExists ? ['./src'] : ['.'];
  moduleResolverPlugin[1].root = root;

  // Write babel.config.js
  const babelConfigContent = `module.exports = ${JSON.stringify(babelConfig, null, 2).replace(
    /"([^"]+)":/g,
    '$1:'
  ).replace(/'/g, '"')};
`;
  
  // Better approach: construct it properly
  const babelConfigJs = generateBabelConfigJs(babelConfig, target);
  writeTextFile(babelConfigPath, babelConfigJs);
}

/**
 * Generates Babel config JavaScript file content
 * Matches blueprint format: compact, single-line presets, properly formatted plugins
 */
function generateBabelConfigJs(config: any, target: 'expo' | 'bare'): string {
  // Presets: single-line array format
  const presets = config.presets.map((p: string) => `'${p}'`).join(', ');
  
  // Plugins: format each plugin
  const plugins: string[] = [];
  for (const plugin of config.plugins) {
    if (typeof plugin === 'string') {
      plugins.push(`    '${plugin}'`);
    } else if (Array.isArray(plugin)) {
      const [name, options] = plugin;
      
      // Format root array
      const rootStr = Array.isArray(options.root)
        ? `[${options.root.map((r: string) => `'${r}'`).join(', ')}]`
        : JSON.stringify(options.root);
      
      // Format alias object
      const aliasEntries: string[] = [];
      for (const [key, value] of Object.entries(options.alias || {})) {
        aliasEntries.push(`          '${key}': '${value}'`);
      }
      const aliasStr = aliasEntries.length > 0
        ? `{\n${aliasEntries.join(',\n')},\n        }`
        : '{}';
      
      plugins.push(`    [\n      '${name}',\n      {\n        root: ${rootStr},\n        alias: ${aliasStr},\n      },\n    ]`);
    } else {
      plugins.push(`    ${JSON.stringify(plugin)}`);
    }
  }

  return `module.exports = {
  presets: [${presets}],
  plugins: [
${plugins.join(',\n')}
  ],
};
`;
}

/**
 * Configures SVG import pipeline (section 4.2)
 * - Metro config for SVG transformer (provided by templates/base)
 * - SVG type declarations (provided by templates/base)
 * - assets/svgs directory (provided by templates/base)
 * 
 * NOTE: SVG pipeline configs are provided by templates/base via attachment engine.
 * This function only ensures assets/svgs exists (should already exist from templates).
 */
export function configureSvgPipeline(
  appRoot: string,
  inputs: InitInputs
): void {
  // Metro config and SVG types are provided by templates/base via attachment engine
  // Only ensure assets/svgs directory exists (should already exist from templates)
  const assetsSvgsDir = join(appRoot, 'assets', 'svgs');
  if (!pathExists(assetsSvgsDir)) {
    ensureDir(assetsSvgsDir);
    // Create placeholder SVG if it doesn't exist (should come from templates)
    createPlaceholderSvg(assetsSvgsDir);
  }
}

/**
 * Configures Metro config to handle SVG files
 * Generates metro.config.js with react-native-svg-transformer configuration
 */
function configureMetroSvgTransformer(
  appRoot: string,
  target: 'expo' | 'bare'
): void {
  const metroConfigPath = join(appRoot, 'metro.config.js');
  
  // Check if SVG transformer is already configured
  let hasSvgTransformer = false;
  if (pathExists(metroConfigPath)) {
    const existingContent = readTextFile(metroConfigPath);
    hasSvgTransformer = existingContent.includes('react-native-svg-transformer');
  }

  // If already configured, skip
  if (hasSvgTransformer) {
    return;
  }

  // Generate metro.config.js with SVG transformer configuration
  let metroConfigContent: string;
  
  if (target === 'expo') {
    // Expo metro.config.js (recommended content)
    metroConfigContent = `const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts.push('svg');

module.exports = config;
`;
  } else {
    // Bare RN metro.config.js (matches blueprint format)
    metroConfigContent = `const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

module.exports = (async () => {
  const defaultConfig = await getDefaultConfig(__dirname);

  return mergeConfig(defaultConfig, {
    transformer: {
      babelTransformerPath: require.resolve('react-native-svg-transformer'),
    },
    resolver: {
      assetExts: defaultConfig.resolver.assetExts.filter(ext => ext !== 'svg'),
      sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
    },
  });
})();
`;
  }

  writeTextFile(metroConfigPath, metroConfigContent);
}

/**
 * Creates SVG type declarations for TypeScript
 * Note: May already exist from templates/base attachment - we update it to ensure it's correct
 */
function createSvgTypeDeclarations(appRoot: string): void {
  // Create types directory if it doesn't exist
  const typesDir = join(appRoot, 'types');
  ensureDir(typesDir);

  const svgTypesPath = join(typesDir, 'svg.d.ts');
  
  // File may already exist from templates/base - update it to ensure correct content
  const svgTypesContent = `/**
 * FILE: types/svg.d.ts
 * PURPOSE: SVG import type declarations
 * OWNERSHIP: CLI
 */

declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}
`;

  writeTextFile(svgTypesPath, svgTypesContent);

  // Also create declarations.d.ts at root to match blueprint pattern
  const declarationsPath = join(appRoot, 'declarations.d.ts');
  const declarationsContent = `/**
 * FILE: declarations.d.ts
 * PURPOSE: Global type declarations for the app
 * OWNERSHIP: CLI
 */

declare module "*.svg" {
  import React from "react";
  import { SvgProps } from "react-native-svg";
  const content: React.FC<SvgProps>;
  export default content;
}
`;
  writeTextFile(declarationsPath, declarationsContent);

  // Ensure types directory and declarations.d.ts are included in tsconfig.json
  const tsconfigPath = join(appRoot, 'tsconfig.json');
  if (pathExists(tsconfigPath)) {
    const tsconfig = readJsonFile<any>(tsconfigPath);
    if (!tsconfig.include) {
      tsconfig.include = [];
    }
    if (!tsconfig.include.includes('types/**/*')) {
      tsconfig.include.push('types/**/*');
    }
    // Ensure declarations.d.ts is included (usually auto-included, but explicit is better)
    if (!tsconfig.include.includes('declarations.d.ts')) {
      tsconfig.include.push('declarations.d.ts');
    }
    writeJsonFile(tsconfigPath, tsconfig);
  }
}

/**
 * Creates a placeholder SVG file for validation
 */
function createPlaceholderSvg(assetsSvgsDir: string): void {
  const placeholderSvgPath = join(assetsSvgsDir, 'placeholder.svg');
  
  if (!pathExists(placeholderSvgPath)) {
    const placeholderSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="24" height="24" rx="4" fill="#E0E0E0"/>
<path d="M12 8V16M8 12H16" stroke="#999" stroke-width="2" stroke-linecap="round"/>
</svg>`;
    writeTextFile(placeholderSvgPath, placeholderSvg);
  }
}

/**
 * Configures fonts pipeline (section 4.3)
 * - Creates assets/fonts directory
 * - Configures font linking for Bare targets
 * - Provides safe font loading for Expo targets
 */
export function configureFontsPipeline(
  appRoot: string,
  inputs: InitInputs
): void {
  // Create assets/fonts directory
  const assetsFontsDir = join(appRoot, 'assets', 'fonts');
  ensureDir(assetsFontsDir);

  // Create a README placeholder explaining font setup
  createFontsReadme(assetsFontsDir);

  // Configure font linking for Bare targets
  if (inputs.target === 'bare') {
    configureBareFontLinking(appRoot);
  }

  // For Expo, fonts are automatically available via assets/fonts
  // No additional configuration needed - expo-font handles it
}

/**
 * Creates a README file in assets/fonts explaining font setup
 */
function createFontsReadme(assetsFontsDir: string): void {
  const readmePath = join(assetsFontsDir, 'README.md');
  
  if (!pathExists(readmePath)) {
    const readmeContent = `# Fonts Directory

Place your custom font files (.ttf, .otf) in this directory.

## Usage

### Expo Projects
Fonts in this directory are automatically available. Use them with expo-font.

### Bare React Native Projects
Fonts are auto-linked via react-native.config.js. After adding fonts:
1. Add font files to this directory
2. Run npx react-native-asset (or restart Metro bundler)
3. Use font family names in your styles

## Font Naming
- Font file names should match the font family name used in styles
- Example: Inter-Regular.ttf → fontFamily: 'Inter-Regular'
`;
    writeTextFile(readmePath, readmeContent);
  }
}

/**
 * Configures font linking for Bare React Native projects
 */
function configureBareFontLinking(appRoot: string): void {
  const reactNativeConfigPath = join(appRoot, 'react-native.config.js');
  
  let config: any;
  
  if (pathExists(reactNativeConfigPath)) {
    // Read existing config
    try {
      const configContent = readTextFile(reactNativeConfigPath);
      // Simple parsing - if it's a standard module.exports format
      // We'll recreate it with proper structure
      config = {
        assets: ['./assets/fonts/'],
      };
    } catch {
      // If parsing fails, create new config
      config = {
        assets: ['./assets/fonts/'],
      };
    }
  } else {
    // Create new config
    config = {
      assets: ['./assets/fonts/'],
    };
  }

  // Ensure assets/fonts is included
  if (!config.assets) {
    config.assets = [];
  }
  
  const fontsPath = './assets/fonts/';
  if (!config.assets.includes(fontsPath)) {
    config.assets.push(fontsPath);
  }

  // Write react-native.config.js
  const configContent = `// react-native.config.js

module.exports = {
  assets: [
${config.assets.map((path: string) => `    '${path}',`).join('\n')}
  ],
};
`;

  writeTextFile(reactNativeConfigPath, configContent);
}

/**
 * Configures environment variable pipeline (section 4.4)
 * - .env.example file (provided by templates/base)
 * - Typed env access in @rns/core/config/env.ts (provided by templates/base)
 * 
 * NOTE: Env pipeline configs are provided by templates/base via attachment engine.
 * This function only ensures .env.example exists (should already exist from templates).
 */
export function configureEnvPipeline(
  appRoot: string,
  inputs: InitInputs
): void {
  // .env.example and env.ts are provided by templates/base via attachment engine
  // Only ensure .env.example exists (should already exist from templates)
  const envExamplePath = join(appRoot, '.env.example');
  if (!pathExists(envExamplePath)) {
    createEnvExample(appRoot);
  }
}

/**
 * Creates .env.example file in host root
 */
function createEnvExample(appRoot: string): void {
  const envExamplePath = join(appRoot, '.env.example');
  
  if (!pathExists(envExamplePath)) {
    const envExampleContent = `# Environment Variables
# Copy this file to .env and fill in your values
# DO NOT commit .env to version control

# API Configuration
API_URL=https://api.example.com
WS_URL=wss://api.example.com

# Environment
ENV=development

# Feature Flags
USE_MOCK_API=0

# Add your environment variables here
`;
    writeTextFile(envExamplePath, envExampleContent);
  }
}

/**
 * Creates/updates typed env access in @rns/core/config/env.ts
 * Note: File may already exist from templates/base attachment - we update it to be target-specific
 */
function createTypedEnvAccess(coreConfigDir: string, inputs: InitInputs): void {
  const ext = inputs.language === 'ts' ? 'ts' : 'js';
  const envConfigPath = join(coreConfigDir, `env.${ext}`);
  
  // File may already exist from templates/base - we update it to be target-specific
  
  if (inputs.language === 'ts') {
    const envConfigContent = `/**
 * FILE: packages/@rns/core/config/env.ts
 * PURPOSE: Typed environment variable access with safe defaults
 * OWNERSHIP: CORE
 * 
 * PLUGIN-FREE GUARANTEE:
 * - Uses expo-constants (Expo) or react-native-config (Bare) if available
 * - Falls back to safe defaults if packages not installed
 * - Compiles even if .env is missing
 */

${inputs.target === 'expo' 
  ? `import Constants from 'expo-constants';
  
/**
 * Typed environment variable access
 * Safe defaults ensure compilation even if .env is missing
 */
export const env = {
  API_URL: (Constants.expoConfig?.extra?.env?.API_URL ?? process.env.API_URL ?? '').trim(),
  WS_URL: (Constants.expoConfig?.extra?.env?.WS_URL ?? process.env.WS_URL ?? '').trim(),
  ENV: (Constants.expoConfig?.extra?.env?.ENV ?? process.env.ENV ?? (__DEV__ ? 'development' : 'production')).trim(),
  USE_MOCK_API: (Constants.expoConfig?.extra?.env?.USE_MOCK_API ?? process.env.USE_MOCK_API ?? '0') === '1',
} as const;
`
  : `let Config: any = null;

// Try to load react-native-config if available (Bare target)
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Config = require('react-native-config').default || require('react-native-config');
} catch {
  // react-native-config not installed - use process.env with safe defaults
  Config = {};
}

/**
 * Typed environment variable access
 * Safe defaults ensure compilation even if .env is missing
 */
export const env = {
  API_URL: (Config.API_URL ?? process.env.API_URL ?? '').trim(),
  WS_URL: (Config.WS_URL ?? process.env.WS_URL ?? '').trim(),
  ENV: (Config.ENV ?? process.env.ENV ?? (__DEV__ ? 'development' : 'production')).trim(),
  USE_MOCK_API: (Config.USE_MOCK_API ?? process.env.USE_MOCK_API ?? '0') === '1',
} as const;
`}
`;
    writeTextFile(envConfigPath, envConfigContent);
  } else {
    const envConfigContent = `/**
 * FILE: packages/@rns/core/config/env.js
 * PURPOSE: Typed environment variable access with safe defaults
 * OWNERSHIP: CORE
 * 
 * PLUGIN-FREE GUARANTEE:
 * - Uses expo-constants (Expo) or react-native-config (Bare) if available
 * - Falls back to safe defaults if packages not installed
 * - Compiles even if .env is missing
 */

${inputs.target === 'expo' 
  ? `import Constants from 'expo-constants';
  
/**
 * Typed environment variable access
 * Safe defaults ensure compilation even if .env is missing
 */
export const env = {
  API_URL: (Constants.expoConfig?.extra?.env?.API_URL ?? process.env.API_URL ?? '').trim(),
  WS_URL: (Constants.expoConfig?.extra?.env?.WS_URL ?? process.env.WS_URL ?? '').trim(),
  ENV: (Constants.expoConfig?.extra?.env?.ENV ?? process.env.ENV ?? (__DEV__ ? 'development' : 'production')).trim(),
  USE_MOCK_API: (Constants.expoConfig?.extra?.env?.USE_MOCK_API ?? process.env.USE_MOCK_API ?? '0') === '1',
};
`
  : `let Config = null;

// Try to load react-native-config if available (Bare target)
try {
  Config = require('react-native-config').default || require('react-native-config');
} catch {
  // react-native-config not installed - use process.env with safe defaults
  Config = {};
}

/**
 * Typed environment variable access
 * Safe defaults ensure compilation even if .env is missing
 */
export const env = {
  API_URL: (Config.API_URL ?? process.env.API_URL ?? '').trim(),
  WS_URL: (Config.WS_URL ?? process.env.WS_URL ?? '').trim(),
  ENV: (Config.ENV ?? process.env.ENV ?? (__DEV__ ? 'development' : 'production')).trim(),
  USE_MOCK_API: (Config.USE_MOCK_API ?? process.env.USE_MOCK_API ?? '0') === '1',
};
`}
`;
    writeTextFile(envConfigPath, envConfigContent);
  }

  // Create index file to export env
  const indexPath = join(coreConfigDir, `index.${ext}`);
  const indexContent = inputs.language === 'ts'
    ? `export * from './env';
`
    : `export * from './env';
`;
  writeTextFile(indexPath, indexContent);
}

/**
 * Configures base scripts for developer workflow (section 4.5)
 * - Adds clean/doctor/reset scripts to package.json
 * - Scripts are target-safe (Expo/Bare) and don't assume user src/** exists
 */
export function configureBaseScripts(
  appRoot: string,
  inputs: InitInputs
): void {
  const packageJsonPath = join(appRoot, 'package.json');
  
  if (!pathExists(packageJsonPath)) {
    return; // Skip if package.json doesn't exist (shouldn't happen, but safe)
  }

  const packageJson = readJsonFile<any>(packageJsonPath);
  
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }

  // Base scripts that work for both Expo and Bare
  const baseScripts: Record<string, string> = {
    'cache:clean': 'npm cache clean --force',
    // Icon generation and validation scripts (from blueprint - work for both Expo and Bare)
    'gen:icons': 'node scripts/generate-icons.js',
    'check:icons': 'node scripts/check-icons-stale.js',
    'check:imports': 'node scripts/check-import-paths.js',
  };

  // Target-specific scripts
  if (inputs.target === 'expo') {
    Object.assign(baseScripts, {
      'start': 'expo start',
      'start:clear': 'expo start --clear',
      'ios': 'expo start --ios',
      'android': 'expo start --android',
      'doctor': 'npx expo-doctor',
      'clean': 'rm -rf .expo node_modules && npm install',
      'clean:watchman': 'watchman watch-del-all 2>/dev/null || true',
      'reset': 'npm run cache:clean && npm run clean && npm run clean:watchman',
    });
  } else {
    // Bare React Native - enhanced scripts from reference
    Object.assign(baseScripts, {
      'start': 'react-native start --reset-cache',
      'ios': 'react-native run-ios',
      'android': 'react-native run-android',
      'npx:ios': 'npx react-native run-ios',
      'npx:android': 'npx react-native run-android',
      'doctor': 'npx react-native doctor',
      'pod-install': 'npx pod-install ios',
      'cache:clean': 'npm cache clean --force',
      'clean:watchman': 'watchman watch-del-all 2>/dev/null || true',
      'watchman:shutdown': 'watchman shutdown-server',
      'watchman:delete': 'watchman watch-del-all',
      'clean': 'rm -rf node_modules && npm install',
      'reset': 'npm run cache:clean && npm run clean && npm run clean:watchman',
      // Android build scripts
      'android:build:debug': 'cd android && ./gradlew assembleDebug && cd .. && open android/app/build/outputs/apk/debug/',
      'android:build:release': 'cd android && ./gradlew assembleRelease && cd .. && open android/app/build/outputs/apk/release/',
      'android:build:release:store': 'npx react-native build-android --mode=release',
      'android:build:bundle': 'react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/',
      'android:clean': 'cd android && ./gradlew clean && rm -rf app/.cxx && cd ..',
      'android:rebuild': 'rm -rf android/app/build android/app/.cxx android/.gradle && cd android && ./gradlew :app:assembleDebug && cd .. && npx react-native run-android',
      // Gradle management
      'gradle:wrapper': 'cd android && gradle wrapper && cd ..',
      'gradle:debug': 'cd android && ./gradlew assembleDebug && cd ..',
      'gradle:stop': 'cd android && ./gradlew --stop && cd ..',
      'gradle:clean': 'cd android && ./gradlew clean && cd ..',
      'gradle:clean:build': 'cd android && ./gradlew cleanBuildCache && cd ..',
      // Android utilities
      'debug:key': 'cd android && ./gradlew signingReport && cd ..',
      'adb': 'adb reverse tcp:9090 tcp:9090 && adb reverse tcp:3000 tcp:3000 && adb reverse tcp:9001 tcp:9001 && adb reverse tcp:8081 tcp:8081',
    });
  }

  // Add scripts to package.json (merge with existing, don't overwrite)
  for (const [scriptName, scriptCommand] of Object.entries(baseScripts)) {
    // Only add if script doesn't already exist (preserve user customizations)
    if (!packageJson.scripts[scriptName]) {
      packageJson.scripts[scriptName] = scriptCommand;
    }
  }

  writeJsonFile(packageJsonPath, packageJson);
  
  // Ensure scripts/ folder exists if any script references scripts/*
  const scriptsDir = join(appRoot, 'scripts');
  const hasScriptsReference = Object.values(packageJson.scripts || {}).some((cmd: any) => 
    typeof cmd === 'string' && cmd.includes('scripts/')
  );
  if (hasScriptsReference && !pathExists(scriptsDir)) {
    ensureDir(scriptsDir);
    // Create a placeholder README to indicate scripts folder is for user scripts
    const scriptsReadme = `# Scripts

This directory is for custom build and development scripts.

Scripts referenced in package.json should be placed here.
`;
    writeTextFile(join(scriptsDir, 'README.md'), scriptsReadme);
  }
}

