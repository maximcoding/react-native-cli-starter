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

import { logger, initNetInfoBridge } from '@rns/core';

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

  initialized = true;
  logger.info('CORE initialized');
}


