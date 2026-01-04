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
 * NOTE: This is a base version. Target-specific variants may override this.
 */

let Config: any = null;

// Try to load expo-constants first (Expo target)
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Constants = require('expo-constants');
  Config = Constants.expoConfig?.extra?.env || {};
} catch {
  // Not Expo, try react-native-config (Bare target)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Config = require('react-native-config').default || require('react-native-config');
  } catch {
    // Neither available - use process.env with safe defaults
    Config = {};
  }
}

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

