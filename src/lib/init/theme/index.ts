/**
 * FILE: src/lib/init/theme/index.ts
 * PURPOSE: Theme module orchestration
 * OWNERSHIP: CLI
 */

import { generateThemeFiles, removeThemeFilesIfNotSelected } from './files';
import { generateHooks } from './hooks';
import type { InitInputs } from '../types';

/**
 * Configures theme for the project based on init inputs
 */
export function configureTheme(appRoot: string, inputs: InitInputs): void {
  // Always generate minimal theme files so ThemeProvider can import them
  // Theming option controls whether useTheme hook is generated, not whether theme files exist
  generateThemeFiles(appRoot, inputs);
}

/**
 * Generates hooks in User Zone (src/hooks/) - always generate if i18n or theming is selected
 */
export function configureHooks(appRoot: string, inputs: InitInputs): void {
  if (inputs.selectedOptions.i18n || inputs.selectedOptions.theming) {
    generateHooks(appRoot, inputs);
  }
}

// Re-export individual functions for direct use if needed
export { generateThemeFiles, removeThemeFilesIfNotSelected } from './files';
export { generateHooks } from './hooks';
