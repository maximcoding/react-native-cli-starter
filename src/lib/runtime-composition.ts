/**
 * FILE: src/lib/runtime-composition.ts
 * PURPOSE: Generate runtime composition layer during init
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { writeTextFile, ensureDir } from './fs';
import type { InitInputs } from './init';
import { CORE_PACKAGE_NAME } from './constants';

/**
 * Generates runtime composition layer in packages/@rns/runtime
 * Provides minimal bootable app component that initializes CORE
 */
export function generateRuntimeComposition(runtimeDir: string, inputs: InitInputs): void {
  const ext = inputs.language === 'ts' ? 'ts' : 'js';
  
  // Generate CORE init function
  const coreInitContent = generateCoreInit(ext, inputs);
  writeTextFile(join(runtimeDir, `core-init.${ext}`), coreInitContent);

  // Generate main runtime index (simplified - App.tsx now contains providers directly)
  const runtimeIndexContent = generateRuntimeIndex(ext, inputs);
  // Bare projects use .tsx/.jsx for JSX, Expo uses .ts/.js
  const runtimeIndexExt = inputs.target === 'bare' 
    ? (ext === 'ts' ? 'tsx' : 'jsx')
    : ext;
  writeTextFile(join(runtimeDir, `index.${runtimeIndexExt}`), runtimeIndexContent);
}

function generateCoreInit(ext: 'ts' | 'js', inputs: InitInputs): string {
  const corePackageName = CORE_PACKAGE_NAME;
  const i18nImport = inputs.selectedOptions?.i18n 
    ? `// Initialize I18n early (section 28 - CORE)
// Import ensures i18n instance is initialized on app startup
import '@rns/core/i18n';
`
    : '';
  const i18nComment = inputs.selectedOptions?.i18n 
    ? `  // I18n is initialized via import above (section 28)

`
    : '';
  
  if (ext === 'ts') {
    return `/**
 * FILE: packages/@rns/runtime/core-init.ts
 * PURPOSE: Initialize CORE contracts (called once at app startup)
 * OWNERSHIP: CORE
 * 
 * PLUGIN-FREE GUARANTEE:
 * - Only imports from @rns/core (no plugin dependencies)
 * - initNetInfoBridge() is a stub (no NetInfo required)
 * - Plugins can extend initialization via runtime hooks, NOT modify this file
 */

import { logger } from '${corePackageName}';
import { initNetInfoBridge } from '${corePackageName}';
${i18nImport}
let initialized = false;

/**
 * Initialize CORE contracts exactly once
 * Equivalent to prior appInit() behavior
 */
export function initCore(): void {
  if (initialized) {
    logger.warn('CORE already initialized, skipping');
    return;
  }

  logger.info('Initializing CORE...');

  // Initialize network monitoring (stub by default, plugins can wire NetInfo)
  initNetInfoBridge();
${i18nComment}
  // @rns-marker:init-steps:start
  // Plugin initialization steps will be injected here
  // @rns-marker:init-steps:end

  // @rns-marker:registrations:start
  // Plugin registrations will be injected here
  // @rns-marker:registrations:end

  initialized = true;
  logger.info('CORE initialized');
}
`;
  } else {
    return `/**
 * FILE: packages/@rns/runtime/core-init.js
 * PURPOSE: Initialize CORE contracts (called once at app startup)
 * OWNERSHIP: CORE
 */

import { logger } from '${corePackageName}';
import { initNetInfoBridge } from '${corePackageName}';
${i18nImport}
let initialized = false;

/**
 * Initialize CORE contracts exactly once
 * Equivalent to prior appInit() behavior
 */
export function initCore() {
  if (initialized) {
    logger.warn('CORE already initialized, skipping');
    return;
  }

  logger.info('Initializing CORE...');

  // Initialize network monitoring (stub by default, plugins can wire NetInfo)
  initNetInfoBridge();
${i18nComment}
  // @rns-marker:init-steps:start
  // Plugin initialization steps will be injected here
  // @rns-marker:init-steps:end

  // @rns-marker:registrations:start
  // Plugin registrations will be injected here
  // @rns-marker:registrations:end

  initialized = true;
  logger.info('CORE initialized');
}
`;
  }
}

function generateRuntimeIndex(ext: 'ts' | 'js', inputs: InitInputs): string {
  if (ext === 'ts') {
    // For Bare projects, generate a runtime index that exports initCore and provides RnsApp as deprecated wrapper
    // For Expo projects, generate minimal runtime index
    if (inputs.target === 'bare') {
      return `/**
 * FILE: packages/@rns/runtime/index.tsx
 * PURPOSE: Runtime utilities and deprecated RnsApp wrapper
 * OWNERSHIP: CORE
 * 
 * NOTE: App.tsx now contains all providers and navigation directly.
 * RnsApp is kept for backward compatibility but is deprecated.
 * New projects should use App.tsx directly.
 * 
 * Navigation is provided via @rns/navigation (imported in App.tsx).
 */

import React from 'react';
export { initCore } from './core-init';
// Reference to @rns/navigation for verification (actual usage is in App.tsx)
export type { RouteName } from '@rns/navigation';

/**
 * @deprecated Use App.tsx directly instead. RnsApp is kept for backward compatibility only.
 * App.tsx now contains all providers and navigation directly visible.
 */
export function RnsApp(): React.ReactElement {
  // This is a deprecated wrapper - App.tsx should be used directly
  throw new Error(
    'RnsApp is deprecated. Use App.tsx directly - it now contains all providers and navigation.'
  );
}
`;
    } else {
      // Expo projects - minimal runtime
      return `/**
 * FILE: packages/@rns/runtime/index.ts
 * PURPOSE: Runtime utilities for Expo projects
 * OWNERSHIP: CORE
 */

export { initCore } from './core-init';
`;
    }
  } else {
    // JavaScript version
    if (inputs.target === 'bare') {
      return `/**
 * FILE: packages/@rns/runtime/index.jsx
 * PURPOSE: Runtime utilities and deprecated RnsApp wrapper
 * OWNERSHIP: CORE
 * 
 * NOTE: App.js now contains all providers and navigation directly.
 * RnsApp is kept for backward compatibility but is deprecated.
 * New projects should use App.js directly.
 * 
 * Navigation is provided via @rns/navigation (imported in App.js).
 */

export { initCore } from './core-init';
// Reference to @rns/navigation for verification (actual usage is in App.js)
// eslint-disable-next-line no-unused-vars
import '@rns/navigation';

/**
 * @deprecated Use App.js directly instead. RnsApp is kept for backward compatibility only.
 * App.js now contains all providers and navigation directly visible.
 */
export function RnsApp() {
  // This is a deprecated wrapper - App.js should be used directly
  throw new Error(
    'RnsApp is deprecated. Use App.js directly - it now contains all providers and navigation.'
  );
}
`;
    } else {
      // Expo projects - minimal runtime
      return `/**
 * FILE: packages/@rns/runtime/index.js
 * PURPOSE: Runtime utilities for Expo projects
 * OWNERSHIP: CORE
 */

export { initCore } from './core-init';
`;
    }
  }
}

