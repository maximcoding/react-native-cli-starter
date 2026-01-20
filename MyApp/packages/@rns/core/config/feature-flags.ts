/**
 * FILE: packages/@rns/core/config/feature-flags.ts
 * LAYER: CORE config
 * OWNERSHIP: CORE
 * ---------------------------------------------------------------------
 * PURPOSE:
 *   Feature flags for enabling/disabling app features (booleans only).
 *   Plugin-free base flags.
 *   Plugins can extend via featureFlagsRegistry.register()
 *
 * WHY ALL BOOLEANS HERE:
 * - Consolidates all feature flags in one place (was split between constants.ts and here)
 * - Clear separation: constants.ts = values, feature-flags.ts = booleans
 * - Easier to find and manage all feature toggles
 *
 * BLUEPRINT REFERENCE: docs/ReactNativeCLITemplate/src/core/config/feature-flags.ts
 * ---------------------------------------------------------------------
 */

/**
 * Load config from available sources (Expo, Bare, or fallback)
 * Needed for USE_MOCK flag that reads from env config
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
 * Base feature flags (CORE only) - all booleans
 * Plugins extend via featureFlagsRegistry.register()
 * 
 * WHY CONSOLIDATED:
 * - USE_MOCK moved from constants.ts flags - all booleans in one place
 * - Clear separation: constants = values, featureFlags = booleans
 * - Easier to understand and maintain
 */
export const featureFlags = {
  // Development/testing flags
  USE_MOCK: __DEV__ && (Config.USE_MOCK_API ?? '0') === '1',
  
  // Feature toggles
  enableNewOnboarding: false,
  enableExperimentalUI: false,
  enableOffline: true,
};

/**
 * Type for plugin feature flags extensions
 */
export type FeatureFlagsExtension = Record<string, boolean | unknown>;

/**
 * Feature flags registry - allows plugins to extend base flags (booleans only)
 * 
 * WHY THIS PATTERN:
 * - Plugins need to add their own feature flags (e.g., enableAuth, enablePushNotifications)
 * - We can't modify CORE files (plugin-free guarantee)
 * - Registry pattern lets plugins register without touching CORE
 * - App code gets merged values via getAll() - simple and predictable
 * - Separate from constants registry: flags = booleans, constants = values
 * 
 * WHY CONSOLIDATED:
 * - All feature flags (including USE_MOCK) are now in one place
 * - No more confusion between "flags" and "featureFlags"
 * - One registry for all booleans - simpler and clearer
 * 
 * USAGE:
 *   // Plugin registers during init:
 *   import { featureFlagsRegistry } from '@rns/core/config/feature-flags';
 *   featureFlagsRegistry.register('auth-core', {
 *     enableAuth: true,
 *     enableMFA: false,
 *   });
 *   
 *   // App uses merged values:
 *   import { featureFlagsRegistry } from '@rns/core/config/feature-flags';
 *   const allFlags = featureFlagsRegistry.getAll();
 *   // allFlags now includes: USE_MOCK, enableOffline, enableAuth, enableMFA, etc.
 */
export const featureFlagsRegistry = {
  core: featureFlags,
  plugins: {} as Record<string, FeatureFlagsExtension>,

  /**
   * Register plugin feature flags
   */
  register(pluginId: string, pluginFlags: FeatureFlagsExtension): void {
    this.plugins[pluginId] = pluginFlags;
  },

  /**
   * Get all feature flags (core + all plugins)
   */
  getAll(): typeof featureFlags & Record<string, unknown> {
    return {
      ...this.core,
      ...Object.values(this.plugins).reduce((acc, f) => ({ ...acc, ...f }), {}),
    };
  },
};

