/**
 * FILE: packages/@rns/core/config/app-config.ts
 * LAYER: CORE config
 * OWNERSHIP: CORE
 * ---------------------------------------------------------------------
 * PURPOSE:
 *   App metadata configuration (name, version, build, logs).
 *   Plugin-free, safe defaults.
 *   This is app-specific and doesn't need registry (not extended by plugins).
 *
 * BLUEPRINT REFERENCE: docs/ReactNativeCLITemplate/src/core/config/app-config.ts
 * ---------------------------------------------------------------------
 */

export const appConfig = {
  appName: 'MyApp', // Will be replaced during init with actual app name
  version: '0.0.1',
  build: 1,
  enableLogs: __DEV__,
};


