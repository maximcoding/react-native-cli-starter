/**
 * FILE: src/lib/pack-manifest.ts
 * PURPOSE: Pack manifest structure and validation (section 5.2)
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { pathExists, readJsonFile } from './fs';
import { CliError, ExitCode } from './errors';
import type { PackType, PackDelivery } from './pack-locations';

/**
 * Pack manifest structure (section 5.2)
 */
export interface PackManifest {
  id: string;
  type: PackType;
  delivery: PackDelivery;
  supportedTargets: ('expo' | 'bare')[];
  supportedLanguages: ('ts' | 'js')[];
  variantResolutionHints?: Record<string, unknown>;
  defaultDestinationMapping?: string;
}

/**
 * Manifest file name
 */
export const PACK_MANIFEST_FILE = 'pack.json';

/**
 * Loads a pack manifest from a pack directory
 */
export function loadPackManifest(packPath: string): PackManifest {
  const manifestPath = join(packPath, PACK_MANIFEST_FILE);
  
  if (!pathExists(manifestPath)) {
    throw new CliError(
      `Pack manifest not found: ${manifestPath}\n` +
      `All packs must have a ${PACK_MANIFEST_FILE} manifest file (section 5.2).`,
      ExitCode.VALIDATION_STATE_FAILURE
    );
  }

  try {
    const manifest = readJsonFile<any>(manifestPath);
    return validatePackManifest(manifest, packPath);
  } catch (error) {
    throw new CliError(
      `Failed to load pack manifest from ${manifestPath}: ${error instanceof Error ? error.message : String(error)}`,
      ExitCode.VALIDATION_STATE_FAILURE
    );
  }
}

/**
 * Validates pack manifest structure
 */
function validatePackManifest(manifest: any, packPath: string): PackManifest {
  const errors: string[] = [];

  // Required fields
  if (!manifest.id || typeof manifest.id !== 'string') {
    errors.push('Manifest must have a string "id" field');
  }

  if (!manifest.type || !['core', 'plugin', 'module'].includes(manifest.type)) {
    errors.push('Manifest must have a "type" field with value "core", "plugin", or "module"');
  }

  if (!manifest.delivery || !['workspace', 'user-code'].includes(manifest.delivery)) {
    errors.push('Manifest must have a "delivery" field with value "workspace" or "user-code"');
  }

  if (!manifest.supportedTargets || !Array.isArray(manifest.supportedTargets)) {
    errors.push('Manifest must have a "supportedTargets" array field');
  } else {
    const validTargets = ['expo', 'bare'];
    const invalidTargets = manifest.supportedTargets.filter((t: string) => !validTargets.includes(t));
    if (invalidTargets.length > 0) {
      errors.push(`Manifest "supportedTargets" contains invalid values: ${invalidTargets.join(', ')}. Must be "expo" or "bare"`);
    }
  }

  if (!manifest.supportedLanguages || !Array.isArray(manifest.supportedLanguages)) {
    errors.push('Manifest must have a "supportedLanguages" array field');
  } else {
    const validLanguages = ['ts', 'js'];
    const invalidLanguages = manifest.supportedLanguages.filter((l: string) => !validLanguages.includes(l));
    if (invalidLanguages.length > 0) {
      errors.push(`Manifest "supportedLanguages" contains invalid values: ${invalidLanguages.join(', ')}. Must be "ts" or "js"`);
    }
  }

  // Optional fields validation
  if (manifest.variantResolutionHints !== undefined && typeof manifest.variantResolutionHints !== 'object') {
    errors.push('Manifest "variantResolutionHints" must be an object if present');
  }

  if (manifest.defaultDestinationMapping !== undefined && typeof manifest.defaultDestinationMapping !== 'string') {
    errors.push('Manifest "defaultDestinationMapping" must be a string if present');
  }

  if (errors.length > 0) {
    throw new CliError(
      `Invalid pack manifest at ${packPath}:\n${errors.map(e => `  - ${e}`).join('\n')}`,
      ExitCode.VALIDATION_STATE_FAILURE
    );
  }

  // Validate delivery type matches pack type expectations
  const packType = manifest.type as PackType;
  const delivery = manifest.delivery as PackDelivery;
  
  // Core and plugin packs should use workspace delivery
  if ((packType === 'core' || packType === 'plugin') && delivery !== 'workspace') {
    errors.push(`Pack type "${packType}" must use "workspace" delivery, got "${delivery}"`);
  }
  
  // Module packs should use user-code delivery
  if (packType === 'module' && delivery !== 'user-code') {
    errors.push(`Pack type "module" must use "user-code" delivery, got "${delivery}"`);
  }

  if (errors.length > 0) {
    throw new CliError(
      `Invalid pack manifest delivery type at ${packPath}:\n${errors.map(e => `  - ${e}`).join('\n')}`,
      ExitCode.VALIDATION_STATE_FAILURE
    );
  }

  return manifest as PackManifest;
}

/**
 * Checks if a pack directory has a valid manifest
 */
export function hasPackManifest(packPath: string): boolean {
  const manifestPath = join(packPath, PACK_MANIFEST_FILE);
  return pathExists(manifestPath);
}

