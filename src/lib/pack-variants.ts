/**
 * FILE: src/lib/pack-variants.ts
 * PURPOSE: Variant resolution for packs (section 5.3)
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { readdirSync } from 'fs';
import { pathExists, isDirectory } from './fs';
import { CliError, ExitCode } from './errors';
import type { PackType } from './pack-locations';
import type { PackManifest } from './pack-manifest';
import { resolvePackSourcePath } from './pack-locations';

/**
 * Variant resolution inputs (section 5.3)
 */
export interface VariantResolutionInputs {
  target: 'expo' | 'bare';
  language: 'ts' | 'js';
  packType: PackType;
  normalizedOptionsKey?: string; // Optional normalized options for plugin/module variants
}

/**
 * Resolves the pack variant path for a given pack and resolution inputs
 * 
 * Variants must be resolvable deterministically by:
 * - target (expo/bare)
 * - language (ts/js)
 * - pack delivery type (workspace/user-code)
 * - plugin/module options (only if required and only from normalized options key)
 * 
 * Variant directory structure:
 * - <packPath>/variants/<target>/<language>/
 * - Or: <packPath>/variants/<target>-<language>/
 * - Or: <packPath>/variants/<target>/<language>/<optionsKey>/ (if options provided)
 */
export function resolvePackVariant(
  packId: string,
  packType: PackType,
  manifest: PackManifest,
  inputs: VariantResolutionInputs
): string {
  const packPath = resolvePackSourcePath(packType, packId);
  
  // Validate pack supports requested target and language
  if (!manifest.supportedTargets.includes(inputs.target)) {
    throw new CliError(
      `Pack "${packId}" does not support target "${inputs.target}". ` +
      `Supported targets: ${manifest.supportedTargets.join(', ')}`,
      ExitCode.VALIDATION_STATE_FAILURE
    );
  }
  
  if (!manifest.supportedLanguages.includes(inputs.language)) {
    throw new CliError(
      `Pack "${packId}" does not support language "${inputs.language}". ` +
      `Supported languages: ${manifest.supportedLanguages.join(', ')}`,
      ExitCode.VALIDATION_STATE_FAILURE
    );
  }

  // Try to resolve variant path using deterministic patterns
  const variantPaths = generateVariantPaths(packPath, inputs);
  
  // Find first existing variant path
  for (const variantPath of variantPaths) {
    if (pathExists(variantPath) && isDirectory(variantPath)) {
      return variantPath;
    }
  }

  // No variant found - fail with actionable error
  const expectedPaths = variantPaths.map(p => `  - ${p}`).join('\n');
  throw new CliError(
    `No variant found for pack "${packId}" with:\n` +
    `  target: ${inputs.target}\n` +
    `  language: ${inputs.language}\n` +
    `${inputs.normalizedOptionsKey ? `  options: ${inputs.normalizedOptionsKey}\n` : ''}\n` +
    `Expected variant paths:\n${expectedPaths}\n` +
    `Pack path: ${packPath}`,
    ExitCode.VALIDATION_STATE_FAILURE
  );
}

/**
 * Generates possible variant paths in order of preference
 * 
 * Variant resolution order (most specific to least specific):
 * 1. variants/<target>/<language>/<optionsKey>/ (if options provided)
 * 2. variants/<target>-<language>-<optionsKey>/ (if options provided)
 * 3. variants/<target>/<language>/
 * 4. variants/<target>-<language>/
 * 5. variants/<target>/
 * 6. variants/<language>/
 * 7. variants/default/
 * 8. root pack directory (if no variants directory exists)
 */
function generateVariantPaths(packPath: string, inputs: VariantResolutionInputs): string[] {
  const paths: string[] = [];
  const variantsDir = join(packPath, 'variants');
  
  // If normalized options key provided, try options-specific variants first
  if (inputs.normalizedOptionsKey) {
    // variants/<target>/<language>/<optionsKey>/
    paths.push(join(variantsDir, inputs.target, inputs.language, inputs.normalizedOptionsKey));
    
    // variants/<target>-<language>-<optionsKey>/
    paths.push(join(variantsDir, `${inputs.target}-${inputs.language}-${inputs.normalizedOptionsKey}`));
  }
  
  // Target + language combinations
  // variants/<target>/<language>/
  paths.push(join(variantsDir, inputs.target, inputs.language));
  
  // variants/<target>-<language>/
  paths.push(join(variantsDir, `${inputs.target}-${inputs.language}`));
  
  // Target-only
  // variants/<target>/
  paths.push(join(variantsDir, inputs.target));
  
  // Language-only
  // variants/<language>/
  paths.push(join(variantsDir, inputs.language));
  
  // Default fallback
  // variants/default/
  paths.push(join(variantsDir, 'default'));
  
  // Root pack directory (if no variants)
  paths.push(packPath);
  
  return paths;
}

/**
 * Normalizes options into a deterministic key for variant resolution
 * 
 * This ensures that the same options map always produces the same key,
 * regardless of key order or formatting differences.
 */
export function normalizeOptionsKey(options: Record<string, unknown> | undefined): string | undefined {
  if (!options || Object.keys(options).length === 0) {
    return undefined;
  }
  
  // Sort keys and stringify to create deterministic key
  const sortedEntries = Object.entries(options)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => {
      // Normalize values: convert to string, handle null/undefined consistently
      const normalizedValue = value === null || value === undefined 
        ? 'null' 
        : typeof value === 'object' 
          ? JSON.stringify(value).replace(/\s+/g, '') 
          : String(value);
      return `${key}:${normalizedValue}`;
    });
  
  return sortedEntries.join('|');
}

/**
 * Lists all available variants for a pack
 */
export function listPackVariants(packId: string, packType: PackType): string[] {
  const packPath = resolvePackSourcePath(packType, packId);
  const variantsDir = join(packPath, 'variants');
  
  if (!pathExists(variantsDir) || !isDirectory(variantsDir)) {
    // No variants directory - pack uses root directory as variant
    return [packPath];
  }
  
  const variants: string[] = [];
  
  function traverseVariants(dir: string, prefix: string = ''): void {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const entryPath = join(dir, entry);
      
      if (isDirectory(entryPath)) {
        const variantName = prefix ? `${prefix}/${entry}` : entry;
        variants.push(join(variantsDir, variantName));
        // Recursively check for nested variants
        traverseVariants(entryPath, variantName);
      }
    }
  }
  
  traverseVariants(variantsDir);
  
  // If no variants found in variants directory, return root pack path
  return variants.length > 0 ? variants : [packPath];
}

