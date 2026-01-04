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

// Try to load react-native-config if available (Bare target)
let Config: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Config = require('react-native-config').default || require('react-native-config');
} catch {
  // Not available - use safe defaults
  Config = {};
}

/**
 * Base constants (CORE only)
 * Plugins extend via constantsRegistry.register()
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
 * Base flags (CORE only)
 * Plugins extend via constantsRegistry.register()
 */
export const flags = {
  USE_MOCK: __DEV__ && (Config.USE_MOCK_API ?? '0') === '1',
};

/**
 * Type for plugin constants extensions
 */
export type ConstantsExtension = Record<string, unknown>;

/**
 * Constants registry - allows plugins to extend base constants
 * 
 * USAGE:
 *   // In plugin init:
 *   import { constantsRegistry } from '@rns/core/config/constants';
 *   constantsRegistry.register('plugin-id', {
 *     AUTH_TOKEN: 'auth.token',
 *     // ... plugin constants
 *   });
 * 
 *   // In app code:
 *   import { constantsRegistry } from '@rns/core/config/constants';
 *   const allConstants = constantsRegistry.getAll();
 */
export const constantsRegistry = {
  core: constants,
  flags: flags,
  plugins: {} as Record<string, ConstantsExtension>,
  flagsPlugins: {} as Record<string, ConstantsExtension>,

  /**
   * Register plugin constants
   */
  register(pluginId: string, pluginConstants: ConstantsExtension): void {
    this.plugins[pluginId] = pluginConstants;
  },

  /**
   * Register plugin feature flags
   */
  registerFlags(pluginId: string, pluginFlags: ConstantsExtension): void {
    this.flagsPlugins[pluginId] = pluginFlags;
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

  /**
   * Get all flags (core + all plugins)
   */
  getAllFlags(): typeof flags & Record<string, unknown> {
    return {
      ...this.flags,
      ...Object.values(this.flagsPlugins).reduce((acc, f) => ({ ...acc, ...f }), {}),
    };
  },
};

