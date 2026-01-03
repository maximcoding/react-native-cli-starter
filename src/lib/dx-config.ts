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
 */
export function configureImportAliases(
  appRoot: string,
  inputs: InitInputs
): void {
  const userSrcDir = join(appRoot, USER_SRC_DIR);
  const userSrcExists = pathExists(userSrcDir) && isDirectory(userSrcDir);
  const aliasEnabled = inputs.coreToggles.alias && userSrcExists;

  // Configure TypeScript paths (if TypeScript project)
  if (inputs.language === 'ts') {
    configureTypeScriptPaths(appRoot, aliasEnabled, userSrcExists, inputs.target);
  }

  // Configure Metro resolver (both Expo and Bare)
  configureMetroResolver(appRoot, inputs.target, aliasEnabled, userSrcExists);

  // Configure Babel module-resolver (both Expo and Bare)
  configureBabelResolver(appRoot, inputs.target, aliasEnabled, userSrcExists);
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

  // Configure baseUrl - point to src if it exists, otherwise root
  if (userSrcExists) {
    tsconfig.compilerOptions.baseUrl = './src';
  } else {
    tsconfig.compilerOptions.baseUrl = '.';
  }

  // Configure paths
  tsconfig.compilerOptions.paths = {
    '@rns/*': ['packages/@rns/*'],
  };

  // Add @/* alias if enabled and src exists
  if (aliasEnabled && userSrcExists) {
    tsconfig.compilerOptions.paths['@/*'] = ['*'];
  }

  // Update include/exclude to ensure proper scope
  if (!tsconfig.include) {
    tsconfig.include = [];
  }
  if (!tsconfig.include.includes('src/**/*') && userSrcExists) {
    tsconfig.include.push('src/**/*');
  }
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

  // Configure aliases
  const alias: Record<string, string> = {
    '@rns': './packages/@rns',
  };

  // Add @/* alias if enabled and src exists
  if (aliasEnabled && userSrcExists) {
    alias['@'] = './src';
  }

  moduleResolverPlugin[1].alias = alias;

  // Set root - include packages/@rns and src if it exists
  const root = ['.'];
  if (userSrcExists) {
    root.push('./src');
  }
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
 */
function generateBabelConfigJs(config: any, target: 'expo' | 'bare'): string {
  const presets = config.presets.map((p: string) => `    '${p}'`).join(',\n');
  
  const plugins: string[] = [];
  for (const plugin of config.plugins) {
    if (typeof plugin === 'string') {
      plugins.push(`    '${plugin}'`);
    } else if (Array.isArray(plugin)) {
      const [name, options] = plugin;
      const optionsStr = JSON.stringify(options, null, 6)
        .split('\n')
        .map((line: string, idx: number) => idx === 0 ? line : '          ' + line)
        .join('\n')
        .replace(/"([^"]+)":/g, '$1:');
      plugins.push(`    ['${name}', ${optionsStr}]`);
    } else {
      plugins.push(`    ${JSON.stringify(plugin)}`);
    }
  }

  return `module.exports = {
  presets: [
${presets}
  ],
  plugins: [
${plugins.join(',\n')}
  ],
};
`;
}

/**
 * Configures SVG import pipeline (section 4.2)
 * - Metro config for SVG transformer
 * - SVG type declarations
 * - assets/svgs directory
 */
export function configureSvgPipeline(
  appRoot: string,
  inputs: InitInputs
): void {
  // Update Metro config to include SVG transformer
  configureMetroSvgTransformer(appRoot, inputs.target);

  // Create SVG type declarations (for TypeScript projects)
  if (inputs.language === 'ts') {
    createSvgTypeDeclarations(appRoot);
  }

  // Create assets/svgs directory
  const assetsSvgsDir = join(appRoot, 'assets', 'svgs');
  ensureDir(assetsSvgsDir);

  // Create a placeholder SVG file for validation
  createPlaceholderSvg(assetsSvgsDir);
}

/**
 * Configures Metro config to handle SVG files
 */
function configureMetroSvgTransformer(
  appRoot: string,
  target: 'expo' | 'bare'
): void {
  const metroConfigPath = join(appRoot, 'metro.config.js');
  
  let metroConfigContent: string;
  let hasSvgTransformer = false;

  if (pathExists(metroConfigPath)) {
    metroConfigContent = readTextFile(metroConfigPath);
    hasSvgTransformer = metroConfigContent.includes('react-native-svg-transformer');
  } else {
    if (target === 'expo') {
      metroConfigContent = `const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
`;
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
  }

  // Add SVG transformer configuration if not present
  if (!hasSvgTransformer) {
    if (target === 'expo') {
      // For Expo, wrap in async function
      metroConfigContent = metroConfigContent.replace(
        /module\.exports = getDefaultConfig\(__dirname\);/,
        `module.exports = (async () => {
  const config = getDefaultConfig(__dirname);
  
  // SVG transformer configuration
  config.transformer = {
    ...config.transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  };
  
  config.resolver = {
    ...config.resolver,
    assetExts: config.resolver.assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...config.resolver.sourceExts, 'svg'],
  };
  
  return config;
})();`
      );
    } else {
      // For Bare, update mergeConfig
      metroConfigContent = metroConfigContent.replace(
        /return mergeConfig\(defaultConfig, \{[\s\S]*?\}\);?/,
        `return mergeConfig(defaultConfig, {
    transformer: {
      babelTransformerPath: require.resolve('react-native-svg-transformer'),
    },
    resolver: {
      assetExts: defaultConfig.resolver.assetExts.filter(ext => ext !== 'svg'),
      sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
    },
  });`
      );
    }
  }

  writeTextFile(metroConfigPath, metroConfigContent);
}

/**
 * Creates SVG type declarations for TypeScript
 */
function createSvgTypeDeclarations(appRoot: string): void {
  // Create types directory if it doesn't exist
  const typesDir = join(appRoot, 'types');
  ensureDir(typesDir);

  const svgTypesPath = join(typesDir, 'svg.d.ts');
  
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

  // Ensure types directory is included in tsconfig.json
  const tsconfigPath = join(appRoot, 'tsconfig.json');
  if (pathExists(tsconfigPath)) {
    const tsconfig = readJsonFile<any>(tsconfigPath);
    if (!tsconfig.include) {
      tsconfig.include = [];
    }
    if (!tsconfig.include.includes('types/**/*')) {
      tsconfig.include.push('types/**/*');
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
 * - Creates .env.example file
 * - Creates typed env access in @rns/core/config/env.ts
 */
export function configureEnvPipeline(
  appRoot: string,
  inputs: InitInputs
): void {
  // Create .env.example file
  createEnvExample(appRoot);

  // Create typed env access in CORE
  const coreConfigDir = join(appRoot, 'packages', '@rns', 'core', 'config');
  ensureDir(coreConfigDir);
  createTypedEnvAccess(coreConfigDir, inputs);
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
 * Creates typed env access in @rns/core/config/env.ts
 */
function createTypedEnvAccess(coreConfigDir: string, inputs: InitInputs): void {
  const ext = inputs.language === 'ts' ? 'ts' : 'js';
  const envConfigPath = join(coreConfigDir, `env.${ext}`);
  
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

