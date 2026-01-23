/**
 * FILE: src/lib/pack-discovery.ts
 * PURPOSE: Single source pack discovery module (section 5.4)
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { readdirSync } from 'fs';
import { pathExists, isDirectory } from './fs';
import { CliError, ExitCode } from './errors';
import { resolvePackSourcePath, resolvePackDestinationPath, type PackType, type PackDelivery } from './pack-locations';
import { loadPackManifest, hasPackManifest, type PackManifest } from './pack-manifest';
import { resolvePackVariant, normalizeOptionsKey, type VariantResolutionInputs } from './pack-variants';

/**
 * Pack discovery result
 */
export interface DiscoveredPack {
  id: string;
  type: PackType;
  manifest: PackManifest;
  sourcePath: string;
}

/**
 * Pack resolution result (section 5.4)
 * Contains everything needed for the attachment engine
 */
export interface PackResolution {
  pack: DiscoveredPack;
  variantPath: string;
  delivery: PackDelivery;
  destinationPath: string;
}

/**
 * Resolves CLI root directory (same logic as pack-locations.ts)
 */
function resolveCliRoot(): string {
  const { dirname } = require('path');
  let current = __dirname;
  
  // Navigate up until we find package.json
  while (current !== dirname(current)) {
    try {
      const fs = require('fs');
      if (fs.existsSync(join(current, 'package.json'))) {
        return current;
      }
    } catch {
      // Continue searching
    }
    current = dirname(current);
  }
  
  return process.cwd();
}

/**
 * Lists all packs of a given type
 * 
 * @param packType - Type of packs to list (core, plugin, or module)
 * @returns Array of discovered packs with their manifests
 */
export function listPacks(packType: PackType): DiscoveredPack[] {
  const packs: DiscoveredPack[] = [];
  const cliRoot = resolveCliRoot();
  
  let packsDir: string;
  switch (packType) {
    case 'core':
      // CORE pack is at templates/base (single pack, no subdirectories)
      const corePackPath = join(cliRoot, 'templates', 'base');
      if (pathExists(corePackPath) && hasPackManifest(corePackPath)) {
        try {
          const manifest = loadPackManifest(corePackPath);
          packs.push({
            id: manifest.id,
            type: 'core',
            manifest,
            sourcePath: corePackPath,
          });
        } catch (error) {
          // Skip invalid packs, but log error
          throw new CliError(
            `Failed to load CORE pack manifest: ${error instanceof Error ? error.message : String(error)}`,
            ExitCode.VALIDATION_STATE_FAILURE
          );
        }
      }
      return packs;
      
    case 'plugin':
      packsDir = join(cliRoot, 'templates', 'plugins');
      break;
      
    case 'module':
      packsDir = join(cliRoot, 'templates', 'modules');
      break;
      
    default:
      throw new CliError(`Unknown pack type: ${packType}`, ExitCode.VALIDATION_STATE_FAILURE);
  }
  
  // If directory doesn't exist, return empty array
  if (!pathExists(packsDir) || !isDirectory(packsDir)) {
    return packs;
  }
  
  // Scan directory for pack subdirectories
  const entries = readdirSync(packsDir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    
    const packPath = join(packsDir, entry.name);
    
    // Check if this directory has a pack manifest
    if (!hasPackManifest(packPath)) {
      // Skip directories without manifests (they're not valid packs)
      continue;
    }
    
    try {
      const manifest = loadPackManifest(packPath);
      
      // Validate manifest type matches expected type
      if (manifest.type !== packType) {
        throw new CliError(
          `Pack at ${packPath} has type "${manifest.type}" but expected "${packType}"`,
          ExitCode.VALIDATION_STATE_FAILURE
        );
      }
      
      // Validate manifest id matches directory name (for plugins/modules)
      // Allow dots in pack ID (canonical format) while directory uses dashes (filesystem-safe)
      // Directory: state-zustand -> Pack ID: state.zustand
      if (packType === 'plugin' || packType === 'module') {
        const normalizedPackId = manifest.id.replace(/\./g, '-');
        const normalizedDirName = entry.name;
        if (normalizedPackId !== normalizedDirName) {
          throw new CliError(
            `Pack manifest id "${manifest.id}" (normalized: "${normalizedPackId}") does not match directory name "${entry.name}" at ${packPath}`,
            ExitCode.VALIDATION_STATE_FAILURE
          );
        }
      }
      
      packs.push({
        id: manifest.id,
        type: packType,
        manifest,
        sourcePath: packPath,
      });
    } catch (error) {
      // If it's a CliError, re-throw it
      if (error instanceof CliError) {
        throw error;
      }
      // Otherwise, skip invalid packs but log warning
      // In production, might want to collect warnings and return them
      throw new CliError(
        `Failed to load pack manifest from ${packPath}: ${error instanceof Error ? error.message : String(error)}`,
        ExitCode.VALIDATION_STATE_FAILURE
      );
    }
  }
  
  return packs;
}

/**
 * Discovers all packs (CORE, plugins, and modules)
 * 
 * @returns Object with arrays of discovered packs by type
 */
export function discoverAllPacks(): {
  core: DiscoveredPack[];
  plugins: DiscoveredPack[];
  modules: DiscoveredPack[];
} {
  const core = listPacks('core');
  const plugins = listPacks('plugin');
  const modules = listPacks('module');
  
  // Validate uniqueness of ids per type (section 5.4)
  validatePackIdUniqueness(core, 'core');
  validatePackIdUniqueness(plugins, 'plugin');
  validatePackIdUniqueness(modules, 'module');
  
  return {
    core,
    plugins,
    modules,
  };
}

/**
 * Validates that pack IDs are unique within each type (section 5.4)
 */
function validatePackIdUniqueness(packs: DiscoveredPack[], packType: PackType): void {
  const idMap = new Map<string, string>(); // id -> sourcePath
  
  for (const pack of packs) {
    if (idMap.has(pack.id)) {
      const existingPath = idMap.get(pack.id)!;
      throw new CliError(
        `Duplicate pack ID "${pack.id}" found for type "${packType}":\n` +
        `  - ${existingPath}\n` +
        `  - ${pack.sourcePath}\n` +
        `Pack IDs must be unique within each type (section 5.4).`,
        ExitCode.VALIDATION_STATE_FAILURE
      );
    }
    idMap.set(pack.id, pack.sourcePath);
  }
}

/**
 * Resolves a pack by id, type, target, language, and optional options
 * Returns complete resolution information for the attachment engine (section 5.4)
 * 
 * @param packId - Pack ID to resolve
 * @param packType - Pack type (core, plugin, or module)
 * @param target - Target platform (expo or bare)
 * @param language - Language (ts or js)
 * @param appRoot - Generated app root directory (for destination resolution)
 * @param options - Optional pack-specific options (will be normalized)
 * @returns Pack resolution with variant path, delivery, and destination
 */
export function resolvePack(
  packId: string,
  packType: PackType,
  target: 'expo' | 'bare',
  language: 'ts' | 'js',
  appRoot: string,
  options?: Record<string, unknown>
): PackResolution {
  // Discover the pack
  const packs = listPacks(packType);
  const pack = packs.find(p => p.id === packId);
  
  if (!pack) {
    const availableIds = packs.map(p => p.id).join(', ');
    throw new CliError(
      `Pack "${packId}" of type "${packType}" not found.\n` +
      `Available ${packType} packs: ${availableIds || '(none)'}\n` +
      `Pack path: ${resolvePackSourcePath(packType, packId)}`,
      ExitCode.VALIDATION_STATE_FAILURE
    );
  }
  
  // Validate pack supports requested target and language
  if (!pack.manifest.supportedTargets.includes(target)) {
    throw new CliError(
      `Pack "${packId}" does not support target "${target}". ` +
      `Supported targets: ${pack.manifest.supportedTargets.join(', ')}`,
      ExitCode.VALIDATION_STATE_FAILURE
    );
  }
  
  if (!pack.manifest.supportedLanguages.includes(language)) {
    throw new CliError(
      `Pack "${packId}" does not support language "${language}". ` +
      `Supported languages: ${pack.manifest.supportedLanguages.join(', ')}`,
      ExitCode.VALIDATION_STATE_FAILURE
    );
  }
  
  // Resolve variant path
  const normalizedOptionsKey = normalizeOptionsKey(options);
  const variantInputs: VariantResolutionInputs = {
    target,
    language,
    packType,
    normalizedOptionsKey,
  };
  
  const variantPath = resolvePackVariant(packId, packType, pack.manifest, variantInputs);
  
  // Resolve destination path
  const destinationPath = resolvePackDestinationPath(packType, packId, appRoot);
  
  // Get delivery type from manifest
  const delivery = pack.manifest.delivery;
  
  return {
    pack,
    variantPath,
    delivery,
    destinationPath,
  };
}

/**
 * Gets a pack by ID and type without resolving variant
 * Useful for listing/querying packs
 */
export function getPack(packId: string, packType: PackType): DiscoveredPack | null {
  const packs = listPacks(packType);
  return packs.find(p => p.id === packId) || null;
}

