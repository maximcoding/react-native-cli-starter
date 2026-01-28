/**
 * FILE: src/lib/init/styling/config.ts
 * PURPOSE: Styling library configuration
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { pathExists, ensureDir, writeTextFile, readTextFile } from '../../fs';
import type { InitInputs } from '../types';

/**
 * Configures Styling library integration (Section 29)
 * Configures babel/metro config and setup files for selected styling library
 */
export function configureStyling(appRoot: string, inputs: InitInputs): void {
  if (!inputs.selectedOptions.styling || inputs.selectedOptions.styling === 'stylesheet') {
    return;
  }
  
  const stylingLib = inputs.selectedOptions.styling;
  
  // Generate styling config files in System Zone
  const stylingConfigDir = join(appRoot, 'packages', '@rns', 'core', 'config', 'styling');
  ensureDir(stylingConfigDir);
  
  if (stylingLib === 'nativewind') {
    // NativeWind requires tailwind.config.js and babel plugin
    const tailwindConfigPath = join(appRoot, 'tailwind.config.js');
    if (!pathExists(tailwindConfigPath)) {
      writeTextFile(tailwindConfigPath, `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
};
`);
    }
  } else if (stylingLib === 'unistyles') {
    // Unistyles requires setup file
    const unistylesSetupPath = join(stylingConfigDir, 'unistyles.ts');
    if (!pathExists(unistylesSetupPath)) {
      const unistylesContent = inputs.language === 'ts'
        ? `import { createStyleSheet } from 'react-native-unistyles';

export const stylesheet = createStyleSheet((theme) => ({
  // Add your styles here
}));
`
        : `import { createStyleSheet } from 'react-native-unistyles';

export const stylesheet = createStyleSheet((theme) => ({
  // Add your styles here
}));
`;
      writeTextFile(unistylesSetupPath, unistylesContent);
    }
  } else if (stylingLib === 'tamagui') {
    // Tamagui requires tamagui.config.ts
    const tamaguiConfigPath = join(appRoot, 'tamagui.config.ts');
    if (!pathExists(tamaguiConfigPath)) {
      writeTextFile(tamaguiConfigPath, `import { config } from '@tamagui/config/v2';
import { createTamagui } from 'tamagui';

const appConfig = createTamagui(config);

export default appConfig;

export type Conf = typeof appConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}
`);
    }
    
    // Generate Tamagui setup file in styling config directory
    const tamaguiSetupPath = join(stylingConfigDir, 'tamagui-setup.ts');
    if (!pathExists(tamaguiSetupPath)) {
      const tamaguiSetupContent = inputs.language === 'ts'
        ? `/**
 * Tamagui setup and configuration
 * Import this in your app root to initialize Tamagui
 */
import tamaguiConfig from '../../../../tamagui.config';

export { tamaguiConfig };
export default tamaguiConfig;
`
        : `/**
 * Tamagui setup and configuration
 * Import this in your app root to initialize Tamagui
 */
import tamaguiConfig from '../../../../tamagui.config';

export { tamaguiConfig };
export default tamaguiConfig;
`;
      writeTextFile(tamaguiSetupPath, tamaguiSetupContent);
    }
    
    // Add Tamagui Babel plugin to babel.config.js
    const babelConfigPath = join(appRoot, 'babel.config.js');
    if (pathExists(babelConfigPath)) {
      let babelContent = readTextFile(babelConfigPath);
      
      // Check if Tamagui plugin is already present
      if (!babelContent.includes('tamagui/babel-plugin')) {
        // Add Tamagui plugin - insert before the closing of plugins array
        const tamaguiPlugin = `    'tamagui/babel-plugin',`;
        
        // Find the plugins array and insert before closing bracket
        // Format: plugins: [\n  [...],\n],\n}
        // We want to insert before the closing ], of the plugins array
        if (babelContent.includes('plugins:')) {
          // Match the closing ], of the plugins array (before the closing } of module.exports)
          // Pattern: ],\n],\n} or ],\n  ],\n}
          // More specific: match ],\n  ],\n} where the first ], closes the module-resolver array
          babelContent = babelContent.replace(
            /(\],\s*\n\s*)(\],\s*\n\s*\})/,
            `$1${tamaguiPlugin}\n$2`
          );
          
          // If that didn't work, try matching just before the closing bracket of plugins array
          if (!babelContent.includes('tamagui/babel-plugin')) {
            babelContent = babelContent.replace(
              /(\],\s*\n\s*)(\],\s*\n\s*\})/,
              `$1${tamaguiPlugin}\n$2`
            );
          }
          
          // Only write if we successfully added the plugin
          if (babelContent.includes('tamagui/babel-plugin')) {
            writeTextFile(babelConfigPath, babelContent);
          }
        }
      }
    }
  } else if (stylingLib === 'restyle') {
    // Restyle requires theme setup
    const restyleThemePath = join(stylingConfigDir, 'restyle-theme.ts');
    if (!pathExists(restyleThemePath)) {
      const restyleContent = inputs.language === 'ts'
        ? `import { createTheme } from '@shopify/restyle';

export const theme = createTheme({
  colors: {
    // Add your colors here
  },
  spacing: {
    // Add your spacing here
  },
  // Add other theme properties
});

export type Theme = typeof theme;
`
        : `import { createTheme } from '@shopify/restyle';

export const theme = createTheme({
  colors: {
    // Add your colors here
  },
  spacing: {
    // Add your spacing here
  },
  // Add other theme properties
});

export type Theme = typeof theme;
`;
      writeTextFile(restyleThemePath, restyleContent);
    }
  }
}

/**
 * Configures React Native Web (Section 30)
 * Sets up metro config for web support
 */
export function configureReactNativeWeb(appRoot: string, inputs: InitInputs): void {
  if (!inputs.selectedOptions.reactNativeWeb) {
    return;
  }
  
  // React Native Web works out of the box with metro config
  // The metro config should already support web via react-native-web
  // No additional configuration needed - just ensure metro.config.js exists
  // If needed, we can add web-specific metro config here in the future
}

/**
 * Configures Styled Components (Section 30)
 * Sets up babel plugin for styled-components
 */
export function configureStyledComponents(appRoot: string, inputs: InitInputs): void {
  if (!inputs.selectedOptions.styledComponents) {
    return;
  }
  
  // Styled Components works out of the box in React Native
  // No babel plugin needed for React Native (only for Next.js/web)
  // Just install dependencies - no additional config needed
}

/**
 * Configures UI Kitten (Section 30)
 * Sets up Eva Design system configuration
 */
export function configureUIKitten(appRoot: string, inputs: InitInputs): void {
  if (!inputs.selectedOptions.uiKitten) {
    return;
  }
  
  // UI Kitten requires Eva Design theme setup
  // Generate basic theme configuration in System Zone
  const uiKittenConfigDir = join(appRoot, 'packages', '@rns', 'core', 'config', 'ui-kitten');
  ensureDir(uiKittenConfigDir);
  
  const uiKittenThemePath = join(uiKittenConfigDir, 'theme.ts');
  if (!pathExists(uiKittenThemePath)) {
    const themeContent = inputs.language === 'ts'
      ? `import * as eva from '@eva-design/eva';
import { ApplicationProvider } from '@ui-kitten/components';

/**
 * UI Kitten theme configuration
 * Uses Eva Design system
 */
export const lightTheme = eva.light;
export const darkTheme = eva.dark;

/**
 * ApplicationProvider wrapper component
 * Wrap your app with this to enable UI Kitten components
 */
export { ApplicationProvider };
`
      : `import * as eva from '@eva-design/eva';
import { ApplicationProvider } from '@ui-kitten/components';

/**
 * UI Kitten theme configuration
 * Uses Eva Design system
 */
export const lightTheme = eva.light;
export const darkTheme = eva.dark;

/**
 * ApplicationProvider wrapper component
 * Wrap your app with this to enable UI Kitten components
 */
export { ApplicationProvider };
`;
    writeTextFile(uiKittenThemePath, themeContent);
  }
}

/**
 * Configures React Native Paper (Section 30)
 * Sets up Material Design theme configuration
 */
export function configureReactNativePaper(appRoot: string, inputs: InitInputs): void {
  if (!inputs.selectedOptions.reactNativePaper) {
    return;
  }
  
  // React Native Paper works out of the box with default theme
  // Users can customize theme by wrapping with PaperProvider
  // No additional config files needed - just install dependencies
}
