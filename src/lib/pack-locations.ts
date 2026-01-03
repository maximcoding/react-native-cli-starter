/**
 * FILE: src/lib/pack-locations.ts
 * PURPOSE: Standardized pack location constants and path resolution (section 5.1)
 * OWNERSHIP: CLI
 */

import { join, dirname } from 'path';

/**
 * Pack type definitions
 */
export type PackType = 'core' | 'plugin' | 'module';
export type PackDelivery = 'workspace' | 'user-code';

/**
 * Standard pack locations (section 5.1)
 * All paths are relative to CLI project root (where the CLI package.json lives)
 */
export const PACK_TEMPLATES_DIR = 'templates/packs';
export const CORE_PACKS_DIR = join(PACK_TEMPLATES_DIR, 'core');
export const PLUGIN_PACKS_DIR = join(PACK_TEMPLATES_DIR, 'plugins');
export const MODULE_PACKS_DIR = join(PACK_TEMPLATES_DIR, 'modules');

/**
 * Standard attachment destinations in generated apps
 */
export const APP_WORKSPACE_PACKAGES_DIR = 'packages/@rns';
export const APP_USER_SRC_DIR = 'src';

/**
 * Resolves the CLI root directory (where templates/ lives)
 * This is the directory containing the CLI's package.json
 */
function resolveCliRoot(): string {
  // CLI root is where this source file's dist/ equivalent lives
  // When running from dist/, go up to find package.json
  // When running from source, go up from src/lib/ to find package.json
  let current = __dirname;
  
  // Navigate up until we find package.json
  while (current !== dirname(current)) {
    try {
      // Check if package.json exists here
      const fs = require('fs');
      if (fs.existsSync(join(current, 'package.json'))) {
        return current;
      }
    } catch {
      // If require fails, continue searching
    }
    current = dirname(current);
  }
  
  // Fallback to process.cwd() if we can't find it
  return process.cwd();
}

/**
 * Resolves the template pack source directory path for a given pack type and ID
 */
export function resolvePackSourcePath(packType: PackType, packId: string): string {
  const cliRoot = resolveCliRoot();
  
  switch (packType) {
    case 'core':
      return join(cliRoot, CORE_PACKS_DIR, packId);
    case 'plugin':
      return join(cliRoot, PLUGIN_PACKS_DIR, packId);
    case 'module':
      return join(cliRoot, MODULE_PACKS_DIR, packId);
    default:
      throw new Error(`Unknown pack type: ${packType}`);
  }
}

/**
 * Resolves the destination path in the generated app for a given pack type and ID
 * 
 * Rules (section 5.1):
 * - CORE packs: packages/@rns/<packId>
 * - Plugin packs: packages/@rns/plugin-<pluginId>
 * - Module packs: src/modules/<moduleId> (user-owned business code)
 */
export function resolvePackDestinationPath(
  packType: PackType,
  packId: string,
  appRoot: string
): string {
  switch (packType) {
    case 'core':
      // CORE packs attach as workspace packages under packages/@rns/*
      return join(appRoot, APP_WORKSPACE_PACKAGES_DIR, packId);
    case 'plugin':
      // Plugin packs attach as workspace packages: packages/@rns/plugin-<pluginId>
      return join(appRoot, APP_WORKSPACE_PACKAGES_DIR, `plugin-${packId}`);
    case 'module':
      // Module packs attach as user-owned business code: src/modules/<moduleId>
      // Note: Could be src/features/<moduleId> based on CLI policy, but default is modules
      return join(appRoot, APP_USER_SRC_DIR, 'modules', packId);
    default:
      throw new Error(`Unknown pack type: ${packType}`);
  }
}

/**
 * Gets the expected delivery type for a pack type
 * 
 * Rules (section 5.1):
 * - CORE packs: workspace delivery
 * - Plugin packs: workspace delivery
 * - Module packs: user-code delivery
 */
export function getDefaultDeliveryType(packType: PackType): PackDelivery {
  switch (packType) {
    case 'core':
    case 'plugin':
      return 'workspace';
    case 'module':
      return 'user-code';
    default:
      throw new Error(`Unknown pack type: ${packType}`);
  }
}

/**
 * Validates pack location structure exists
 */
export function validatePackLocationStructure(cliRoot: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check that templates/packs directory exists
  const packsDir = join(cliRoot, PACK_TEMPLATES_DIR);
  
  // We don't require all directories to exist yet (they'll be created as packs are added)
  // This is just for documentation/structure definition
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

