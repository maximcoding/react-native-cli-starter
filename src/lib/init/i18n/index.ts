/**
 * FILE: src/lib/init/i18n/index.ts
 * PURPOSE: I18n module orchestration
 * OWNERSHIP: CLI
 */

import { generateI18nFiles, removeI18nFilesIfNotSelected } from './files';
import type { InitInputs } from '../types';

/**
 * Configures I18n for the project based on init inputs
 */
export function configureI18n(appRoot: string, inputs: InitInputs): void {
  if (inputs.selectedOptions.i18n) {
    generateI18nFiles(appRoot, inputs);
  } else {
    removeI18nFilesIfNotSelected(appRoot);
  }
}

// Re-export individual functions for direct use if needed
export { generateI18nFiles, removeI18nFilesIfNotSelected } from './files';
