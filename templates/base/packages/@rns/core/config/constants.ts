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
 * Load config from available sources (Expo, Bare, or fallback)
 * 
 * WHY THIS HELPER:
 * - Same logic as env.ts - keeps config loading consistent
 * - Handles different targets gracefully
 * - Always returns an object (never null/undefined) for safe property access
 */
function loadConfig(): Record<string, string> {
  // Try expo-constants first (Expo target)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require('expo-constants');
    return Constants.expoConfig?.extra?.env || {};
  } catch {
    // Try react-native-config (Bare target)
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require('react-native-config').default || require('react-native-config') || {};
    } catch {
      // Fallback: empty object (safe default)
      return {};
    }
  }
}

const Config = loadConfig();

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
 * WHY THIS PATTERN:
 * - Plugins need to add their own constants (e.g., AUTH_TOKEN, OFFLINE_QUEUE_KEY)
 * - We can't modify CORE files (plugin-free guarantee)
 * - Registry pattern lets plugins register without touching CORE
 * - App code gets merged values via getAll() - simple and predictable
 * - No complex abstractions - just a simple object with register/getAll methods
 * 
 * USAGE:
 *   // Plugin registers during init:
 *   import { constantsRegistry } from '@rns/core/config/constants';
 *   constantsRegistry.register('auth-core', {
 *     AUTH_TOKEN: 'auth.token',
 *     REFRESH_TOKEN: 'auth.refreshToken',
 *   });
 *   
 *   // App uses merged values:
 *   import { constantsRegistry } from '@rns/core/config/constants';
 *   const allConstants = constantsRegistry.getAll();
 *   // allConstants now includes: MAX_UPLOAD_SIZE, AUTH_TOKEN, REFRESH_TOKEN, etc.
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

