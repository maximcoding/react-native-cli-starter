/**
 * FILE: src/lib/init/styling/index.ts
 * PURPOSE: Styling module orchestration
 * OWNERSHIP: CLI
 */

import {
  configureStyling,
  configureReactNativeWeb,
  configureStyledComponents,
  configureUIKitten,
  configureReactNativePaper,
} from './config';
import type { InitInputs } from '../types';

/**
 * Configures all styling-related options for the project
 */
export function configureAllStyling(appRoot: string, inputs: InitInputs): void {
  // Main styling library (nativewind, unistyles, tamagui, restyle)
  if (inputs.selectedOptions.styling && inputs.selectedOptions.styling !== 'stylesheet') {
    configureStyling(appRoot, inputs);
  }

  // Additional styling libraries
  if (inputs.selectedOptions.reactNativeWeb) {
    configureReactNativeWeb(appRoot, inputs);
  }

  if (inputs.selectedOptions.styledComponents) {
    configureStyledComponents(appRoot, inputs);
  }

  if (inputs.selectedOptions.uiKitten) {
    configureUIKitten(appRoot, inputs);
  }

  if (inputs.selectedOptions.reactNativePaper) {
    configureReactNativePaper(appRoot, inputs);
  }
}

// Re-export individual functions for direct use if needed
export {
  configureStyling,
  configureReactNativeWeb,
  configureStyledComponents,
  configureUIKitten,
  configureReactNativePaper,
} from './config';
