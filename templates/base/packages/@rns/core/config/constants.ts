/**
 * FILE: packages/@rns/core/config/constants.ts
 * LAYER: CORE config
 * OWNERSHIP: CORE
 * ---------------------------------------------------------------------
 * PURPOSE:
 *   App-wide constants (storage keys, limits, defaults).
 *   Plugin-free base constants.
 *   Plugins can extend via constantsRegistry.register()
 *
 * BLUEPRINT REFERENCE: docs/ReactNativeCLITemplate/src/core/config/constants.ts
 * ---------------------------------------------------------------------
 */

/**
 * Base constants (CORE only) - values only (numbers, strings, storage keys)
 * Plugins extend via constantsRegistry.register()
 * 
 * WHY VALUES ONLY:
 * - Constants are values: numbers (MAX_UPLOAD_SIZE), strings (storage keys)
 * - Feature flags (booleans) are in feature-flags.ts - clear separation
 * - This keeps concerns separate: constants = values, flags = booleans
 */
export const constants = {
  // Limits
  MAX_UPLOAD_SIZE: 20 * 1024 * 1024, // 20MB
  DEFAULT_PAGE_SIZE: 20,
  
  // Storage keys (base)
  RQ_CACHE: 'rq.cache.v1',
  ONBOARDING_DONE: 'onboarding.done.v1',
};

/**
 * Type for plugin constants extensions
 */
export type ConstantsExtension = Record<string, unknown>;

/**
 * Constants registry - allows plugins to extend base constants (values only)
 * 
 * WHY THIS PATTERN:
 * - Plugins need to add their own constants (e.g., AUTH_TOKEN, OFFLINE_QUEUE_KEY, limits)
 * - We can't modify CORE files (plugin-free guarantee)
 * - Registry pattern lets plugins register without touching CORE
 * - App code gets merged values via getAll() - simple and predictable
 * - No complex abstractions - just a simple object with register/getAll methods
 * 
 * WHY VALUES ONLY (not booleans):
 * - Constants = values (numbers, strings, storage keys)
 * - Feature flags (booleans) are in feature-flags.ts with featureFlagsRegistry
 * - Clear separation of concerns makes code easier to understand
 * 
 * USAGE:
 *   // Plugin registers during init:
 *   import { constantsRegistry } from '@rns/core/config/constants';
 *   constantsRegistry.register('auth-core', {
 *     AUTH_TOKEN: 'auth.token',
 *     REFRESH_TOKEN: 'auth.refreshToken',
 *     MAX_RETRY_ATTEMPTS: 3,
 *   });
 *   
 *   // App uses merged values:
 *   import { constantsRegistry } from '@rns/core/config/constants';
 *   const allConstants = constantsRegistry.getAll();
 *   // allConstants now includes: MAX_UPLOAD_SIZE, AUTH_TOKEN, REFRESH_TOKEN, etc.
 */
export const constantsRegistry = {
  core: constants,
  plugins: {} as Record<string, ConstantsExtension>,

  /**
   * Register plugin constants (values only - numbers, strings, storage keys)
   */
  register(pluginId: string, pluginConstants: ConstantsExtension): void {
    this.plugins[pluginId] = pluginConstants;
  },

  /**
   * Get all constants (core + all plugins)
   */
  getAll(): typeof constants & Record<string, unknown> {
    return {
      ...this.core,
      ...Object.values(this.plugins).reduce((acc, c) => ({ ...acc, ...c }), {}),
    };
  },
};

