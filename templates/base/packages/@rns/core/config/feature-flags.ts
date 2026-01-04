/**
 * FILE: packages/@rns/core/config/feature-flags.ts
 * LAYER: CORE config
 * OWNERSHIP: CORE
 * ---------------------------------------------------------------------
 * PURPOSE:
 *   Feature flags for enabling/disabling app features.
 *   Plugin-free base flags.
 *   Plugins can extend via featureFlagsRegistry.register()
 *
 * BLUEPRINT REFERENCE: docs/ReactNativeCLITemplate/src/core/config/feature-flags.ts
 * ---------------------------------------------------------------------
 */

/**
 * Base feature flags (CORE only)
 * Plugins extend via featureFlagsRegistry.register()
 */
export const featureFlags = {
  enableNewOnboarding: false,
  enableExperimentalUI: false,
  enableOffline: true,
};

/**
 * Type for plugin feature flags extensions
 */
export type FeatureFlagsExtension = Record<string, boolean | unknown>;

/**
 * Feature flags registry - allows plugins to extend base flags
 * 
 * WHY THIS PATTERN:
 * - Plugins need to add their own feature flags (e.g., enableAuth, enablePushNotifications)
 * - We can't modify CORE files (plugin-free guarantee)
 * - Registry pattern lets plugins register without touching CORE
 * - App code gets merged values via getAll() - simple and predictable
 * - Separate from constants registry because flags are boolean/feature toggles, not string keys
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
 *   // allFlags now includes: enableOffline, enableAuth, enableMFA, etc.
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

