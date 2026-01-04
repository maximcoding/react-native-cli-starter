/**
 * FILE: packages/@rns/core/config/env.ts
 * PURPOSE: Typed environment variable access with safe defaults
 * OWNERSHIP: CORE
 * 
 * PLUGIN-FREE GUARANTEE:
 * - Uses expo-constants (Expo) or react-native-config (Bare) if available
 * - Falls back to safe defaults if packages not installed
 * - Compiles even if .env is missing
 * 
 * WHY DIFFERENT TARGETS:
 * - Expo: Uses expo-constants (built into Expo runtime)
 * - Bare: Uses react-native-config (requires native linking)
 * - Fallback: process.env (for Node.js environments or when packages missing)
 * 
 * NOTE: This is a base version. Target-specific variants may override this.
 */

/**
 * Load config from available sources (Expo, Bare, or fallback)
 * 
 * WHY THIS HELPER:
 * - Reduces duplication (same logic used in constants.ts)
 * - Handles different targets gracefully
 * - Always returns an object (never null/undefined) for safe property access
 */
function loadConfig(): Record<string, string> {
  // Try to load expo-constants first (Expo target)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require('expo-constants');
    return Constants.expoConfig?.extra?.env || {};
  } catch {
    // Not Expo, try react-native-config (Bare target)
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require('react-native-config').default || require('react-native-config') || {};
    } catch {
      // Neither available - use empty object (safe fallback)
      return {};
    }
  }
}

const Config = loadConfig();

/**
 * Typed environment variable access
 * Safe defaults ensure compilation even if .env is missing
 */
export const env = {
  API_URL: (Config.API_URL ?? process.env.API_URL ?? '').trim(),
  WS_URL: (Config.WS_URL ?? process.env.WS_URL ?? '').trim(),
  ENV: (Config.ENV ?? process.env.ENV ?? (__DEV__ ? 'development' : 'production')).trim(),
  USE_MOCK_API: (Config.USE_MOCK_API ?? process.env.USE_MOCK_API ?? '0') === '1',
} as const;

