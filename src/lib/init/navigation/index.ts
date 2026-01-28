/**
 * FILE: src/lib/init/navigation/index.ts
 * PURPOSE: Navigation module orchestration
 * OWNERSHIP: CLI
 */

import { configureNavigationPreset } from './preset';
import { generateNavigationRegistry } from './registry';
import { generateExampleScreens } from './screens';
import { attachNavigationPackageFiles } from './files';
import type { InitInputs } from '../types';

/**
 * Configures navigation for the project based on init inputs
 */
export function configureNavigation(appRoot: string, inputs: InitInputs): void {
  if (!inputs.selectedOptions.reactNavigation) {
    return;
  }

  // Configure navigation preset (System Zone)
  configureNavigationPreset(appRoot, inputs);

  // Attach navigation package files (for Expo projects)
  attachNavigationPackageFiles(appRoot, inputs);

  // Generate navigation registry (User Zone)
  generateNavigationRegistry(appRoot, inputs);

  // Generate example screens (User Zone)
  generateExampleScreens(appRoot, inputs);
}

// Re-export individual functions for direct use if needed
export { configureNavigationPreset } from './preset';
export { generateNavigationRegistry } from './registry';
export { generateExampleScreens } from './screens';
export { attachNavigationPackageFiles } from './files';
