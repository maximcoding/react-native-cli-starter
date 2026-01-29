/**
 * FILE: src/lib/init/app-generation/entry-points.ts
 * PURPOSE: Entry point file generation
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { writeTextFile } from '../../fs';
import type { InitInputs } from '../types';

/**
 * Ensures index.ts uses expo-router/entry for Expo Router projects
 */
export function ensureExpoRouterEntryPoint(
  appRoot: string,
  inputs: InitInputs
): void {
  const indexPath = inputs.language === 'ts'
    ? join(appRoot, 'index.ts')
    : join(appRoot, 'index.js');
  
  // Create index.ts/js that imports expo-router/entry
  // This is the correct entry point for Expo Router
  const entryContent = inputs.language === 'ts'
    ? `/**
 * Entry point for Expo Router.
 * Expo Router handles the root rendering through app/_layout.tsx
 */
import 'expo-router/entry';
`
    : `/**
 * Entry point for Expo Router.
 * Expo Router handles the root rendering through app/_layout.tsx
 */
import 'expo-router/entry';
`;
  
  writeTextFile(indexPath, entryContent);
}

/**
 * Ensures index.ts uses registerRootComponent for Expo projects (without Expo Router)
 */
export function ensureExpoEntryPoint(
  appRoot: string,
  inputs: InitInputs
): void {
  const indexPath = inputs.language === 'ts'
    ? join(appRoot, 'index.ts')
    : join(appRoot, 'index.js');
  
  // Create index.ts/js that uses registerRootComponent(App)
  // This is the correct entry point for Expo projects with React Navigation
  const entryContent = inputs.language === 'ts'
    ? `import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
`
    : `import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
`;
  
  writeTextFile(indexPath, entryContent);
}
