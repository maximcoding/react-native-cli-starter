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
 * USAGE:
 *   // In plugin init:
 *   import { featureFlagsRegistry } from '@rns/core/config/feature-flags';
 *   featureFlagsRegistry.register('plugin-id', {
 *     enableAuth: true,
 *     enablePushNotifications: false,
 *     // ... plugin flags
 *   });
 * 
 *   // In app code:
 *   import { featureFlagsRegistry } from '@rns/core/config/feature-flags';
 *   const allFlags = featureFlagsRegistry.getAll();
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

