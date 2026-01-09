/**
 * FILE: src/lib/module-generator.ts
 * PURPOSE: Module generation engine (section 21)
 * OWNERSHIP: CLI
 * 
 * This engine generates business module feature code and integrates through a stable registration model.
 * Modules generate to USER ZONE (src/modules/<moduleId>) and can register through SYSTEM ZONE registries.
 */

import { join } from 'path';
import { pathExists, isDirectory } from './fs';
import { CliError, ExitCode } from './errors';
import { attachPack, type AttachmentOptions, type AttachmentReport } from './attachment-engine';
import { resolvePackSourcePath, resolvePackDestinationPath } from './pack-locations';
import { loadPackManifest } from './pack-manifest';
import { resolvePackVariant } from './pack-variants';
import { wireRuntimeContributions } from './runtime-wiring';
import { addModuleToManifest } from './manifest';
import type { ModuleDescriptor, ModuleGenerationContext, ModuleGenerationResult } from './types/module';
import type { InstalledPluginRecord } from './types/manifest';
import type { RnsTarget } from './types/common';

/**
 * Generates a module (scaffolds feature code and integrates)
 * 
 * @param context - Module generation context
 * @param descriptor - Module descriptor
 * @param dryRun - Whether this is a dry run
 * @returns Generation result
 */
export async function generateModule(
  context: ModuleGenerationContext,
  descriptor: ModuleDescriptor,
  dryRun: boolean = false
): Promise<ModuleGenerationResult> {
  const { projectRoot, target, language, options, installedPlugins } = context;
  const { id: moduleId } = descriptor;

  const result: ModuleGenerationResult = {
    success: false,
    generated: { files: [], directories: [] },
    registrations: [],
    errors: [],
    warnings: [],
  };

  try {
    // 1. Validate module requirements (plugins/capabilities)
    const requirementValidation = validateModuleRequirements(descriptor, installedPlugins);
    if (requirementValidation.errors.length > 0) {
      result.errors = requirementValidation.errors;
      return result;
    }
    if (requirementValidation.warnings.length > 0) {
      result.warnings = [...(result.warnings || []), ...requirementValidation.warnings];
    }

    // 2. Check if module pack exists
    const packSourcePath = resolvePackSourcePath('module', moduleId);
    if (!pathExists(packSourcePath) || !isDirectory(packSourcePath)) {
      result.errors!.push(`Module pack not found at ${packSourcePath}`);
      return result;
    }

    // 3. Load pack manifest
    const packManifest = loadPackManifest(packSourcePath);
    if (!packManifest) {
      result.errors!.push(`Module pack manifest not found at ${join(packSourcePath, 'pack.json')}`);
      return result;
    }

    // Validate pack type matches
    if (packManifest.type !== 'module') {
      result.errors!.push(`Pack type mismatch: expected "module", got "${packManifest.type}"`);
      return result;
    }

    // Validate pack delivery is user-code (modules go to USER ZONE)
    if (packManifest.delivery !== 'user-code') {
      result.errors!.push(`Module pack delivery must be "user-code", got "${packManifest.delivery}"`);
      return result;
    }

    // 4. Resolve variant (target/language specific)
    const variantPath = resolvePackVariant(
      moduleId,
      'module',
      packManifest,
      {
        target,
        language,
        packType: 'module',
        normalizedOptionsKey: '',
      }
    );

    // 5. Attach module pack (generates code to USER ZONE: src/modules/<moduleId>)
    const attachmentOptions: AttachmentOptions = {
      projectRoot,
      packManifest,
      resolvedPackPath: variantPath || packSourcePath,
      target: target as RnsTarget,
      language,
      mode: 'MODULE',
      options,
      dryRun,
    };

    const attachmentReport: AttachmentReport = attachPack(attachmentOptions);

    // Collect generated files/directories
    result.generated = {
      files: [...attachmentReport.created, ...attachmentReport.updated],
      directories: [],
    };

    // Check for conflicts (user-owned files)
    if (attachmentReport.conflicts.length > 0) {
      result.warnings?.push(
        `Conflicts detected (files already exist): ${attachmentReport.conflicts.join(', ')}`
      );
    }

    // 6. Apply runtime contributions (registration) if any
    // Modules can register through SYSTEM ZONE registries via runtime contributions
    if (descriptor.runtimeContributions && descriptor.runtimeContributions.length > 0 && !dryRun) {
      const wiringOps = descriptor.runtimeContributions.map(contribution => ({
        contribution,
        markerType: 'registrations' as const,
        file: 'packages/@rns/runtime/core-init.ts', // Registration target
        capabilityId: moduleId,
        order: (contribution as any).order, // Order is optional on all contribution types
      }));

      const wiringResults = await wireRuntimeContributions(projectRoot, wiringOps, dryRun);

      // Collect registration operations
      for (const wiringResult of wiringResults) {
        if (wiringResult.success && wiringResult.action === 'injected') {
          result.registrations?.push({
            type: 'screen', // Default type, can be refined based on contribution
            identifier: moduleId,
            location: wiringResult.file,
          });
        } else if (!wiringResult.success) {
          result.warnings?.push(`Registration failed for ${wiringResult.file}: ${wiringResult.error}`);
        }
      }
    }

    // 7. Update manifest (track installed module)
    if (!dryRun) {
      const moduleRecord: InstalledPluginRecord = {
        id: moduleId,
        version: descriptor.version,
        installedAt: new Date().toISOString(),
        options,
        ownedFiles: attachmentReport.ownedFilesCandidate,
      };

      addModuleToManifest(projectRoot, moduleRecord);
    }

    result.success = true;
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!result.errors) {
      result.errors = [];
    }
    result.errors.push(errorMessage);
    result.success = false;
    return result;
  }
}

/**
 * Validates module requirements (plugins/capabilities)
 * 
 * @param descriptor - Module descriptor
 * @param installedPlugins - Currently installed plugins
 * @returns Validation result with errors and warnings
 */
function validateModuleRequirements(
  descriptor: ModuleDescriptor,
  installedPlugins: Array<{ id: string; version: string }>
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!descriptor.requires) {
    return { errors, warnings };
  }

  const installedPluginIds = new Set(installedPlugins.map(p => p.id));

  // Check required plugins
  if (descriptor.requires.plugins && descriptor.requires.plugins.length > 0) {
    for (const requiredPluginId of descriptor.requires.plugins) {
      if (!installedPluginIds.has(requiredPluginId)) {
        errors.push(
          `Required plugin "${requiredPluginId}" is not installed. ` +
          `Install it first: rns plugin add ${requiredPluginId}`
        );
      }
    }
  }

  // Check required capabilities (if any capability checking logic exists)
  // For now, capabilities are informational - actual capability detection
  // would require checking installed plugins for capability exports
  if (descriptor.requires.capabilities && descriptor.requires.capabilities.length > 0) {
    // This is a placeholder - actual capability validation would need
    // to check if installed plugins provide the required capabilities
    // For now, we just warn if no plugins are installed
    if (installedPlugins.length === 0) {
      warnings.push(
        `Module requires capabilities: ${descriptor.requires.capabilities.join(', ')}. ` +
        `Make sure required plugins are installed.`
      );
    }
  }

  return { errors, warnings };
}
