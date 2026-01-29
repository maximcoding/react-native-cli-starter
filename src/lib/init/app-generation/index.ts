/**
 * FILE: src/lib/init/app-generation/index.ts
 * PURPOSE: App generation orchestration
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { writeTextFile } from '../../fs';
import { configureExpoRouter } from './expo-router';
import { generateAppTsxContent } from './app-tsx';
import { generateAppJsContent } from './app-js';
import { ensureExpoRouterEntryPoint, ensureExpoEntryPoint } from './entry-points';
import type { InitInputs } from '../types';

/**
 * Ensures host App.tsx contains all providers and navigation directly visible (standard React Native structure)
 * App.tsx is in User Zone (user-editable) with marker-based injection points for plugins
 * ALWAYS creates App.tsx/App.js if it doesn't exist (required for Option A)
 */
export function ensureMinimalAppEntrypoint(
  appRoot: string,
  inputs: InitInputs
): void {
  // Skip creating App.tsx for Expo Router projects - Expo Router uses app/_layout.tsx instead
  const hasExpoRouter = inputs.selectedOptions?.expoRouter === true && inputs.target === 'expo';
  if (hasExpoRouter) {
    // For Expo Router, ensure index.ts uses expo-router/entry instead
    ensureExpoRouterEntryPoint(appRoot, inputs);
    return;
  }
  
  const appEntryPath = inputs.language === 'ts' 
    ? join(appRoot, 'App.tsx')
    : join(appRoot, 'App.js');
  
  // Generate App.tsx with all providers and navigation directly visible
  // This follows standard React Native patterns and makes the structure accessible to users
  const appContent = inputs.language === 'ts'
    ? generateAppTsxContent(inputs)
    : generateAppJsContent(inputs);
  
  // Write the App.tsx (create or replace)
  writeTextFile(appEntryPath, appContent);
  
  // For Expo projects (without Expo Router), ensure index.ts uses registerRootComponent
  if (inputs.target === 'expo' && !hasExpoRouter) {
    ensureExpoEntryPoint(appRoot, inputs);
  }
}

// Re-export individual functions for direct use if needed
export { configureExpoRouter } from './expo-router';
export { generateAppTsxContent } from './app-tsx';
export { generateAppJsContent } from './app-js';
export { ensureExpoRouterEntryPoint, ensureExpoEntryPoint } from './entry-points';
