/**
 * FILE: packages/@rns/runtime/core-init.ts
 * PURPOSE: Initialize CORE contracts (called once at app startup)
 * OWNERSHIP: CORE
 * 
 * PLUGIN-FREE GUARANTEE:
 * - Only imports from @rns/core (no plugin dependencies)
 * - initNetInfoBridge() is a stub (no NetInfo required)
 * - Plugins can extend initialization via runtime hooks, NOT modify this file
 */

import { logger } from '@rns/core';
import { initNetInfoBridge } from '@rns/core';
// Initialize I18n early (section 28 - CORE)
// Import ensures i18n instance is initialized on app startup
import '@rns/core/i18n';

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
  // I18n is initialized via import above (section 28)


  // @rns-marker:init-steps:start
  // Plugin initialization steps will be injected here
  // @rns-marker:init-steps:end

  // @rns-marker:registrations:start
  // Plugin registrations will be injected here
  // @rns-marker:registrations:end

  initialized = true;
  logger.info('CORE initialized');
}
