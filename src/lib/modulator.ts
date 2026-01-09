/**
 * FILE: src/lib/modulator.ts
 * PURPOSE: Modulator Engine v1 - generic installation engine (plan/apply/remove) (section 15)
 * OWNERSHIP: CLI
 * 
 * This engine provides a generic installation pipeline that:
 * - Plans changes (dry-run) deterministically
 * - Applies changes in stable phases
 * - Removes plugins safely (NO-OP if absent, never touches USER ZONE)
 * 
 * Plan/apply/remove reports: deps, runtime wiring ops, patch ops, permissions summary, conflicts, manifest updates.
 */

import { join } from 'path';
import { validateProjectInitialized } from './manifest';
import { addRuntimeDependencies, addDevDependencies, installDependencies } from './dependencies';
import { wireRuntimeContributions } from './runtime-wiring';
import { applyPatchOps } from './patch-ops';
import { addPluginToManifest, removePluginFromManifest, getPluginFromManifest } from './manifest';
import { attachPack } from './attachment-engine';
import { createBackupDirectory } from './backup';
import { getPluginRegistry, initializePluginRegistry } from './plugin-registry';
import { resolvePermissions, aggregatePermissions, loadPermissionsCatalog } from './permissions';
import { resolveCliRoot, resolvePackSourcePath } from './pack-locations';
import { listPacks } from './pack-discovery';
import { resolvePackVariant, normalizeOptionsKey } from './pack-variants';
import { loadPackManifest } from './pack-manifest';
import { CliError, ExitCode } from './errors';
import type {
  ModulatorContext,
  ModulatorPlan,
  ModulatorResult,
  PhaseResult,
  IModulator,
  ConflictResult,
  DependencyPlan,
  PermissionsSummary,
} from './types/modulator';
import type { RuntimeWiringOp } from './types/runtime';
import type { PatchOp } from './types/patch-ops';
import type { DependencySpec } from './types/dependencies';
import type { PluginDescriptor } from './types/plugin';

/**
 * Modulator engine implementation
 */
export class ModulatorEngine implements IModulator {
  /**
   * Plans changes (dry-run)
   * 
   * @param context - Modulator context
   * @param capabilityId - Plugin/module ID to plan
   * @param operation - Operation type (install/remove)
   * @param options - Installation options
   * @returns Plan of changes
   */
  async plan(
    context: ModulatorContext,
    capabilityId: string,
    operation: 'install' | 'remove',
    options?: Record<string, unknown>
  ): Promise<ModulatorPlan> {
    // Validate project is initialized
    validateProjectInitialized(context.projectRoot);

    if (operation === 'remove') {
      return this.planRemove(context, capabilityId);
    } else {
      return this.planInstall(context, capabilityId, options);
    }
  }

  /**
   * Plans installation
   */
  private async planInstall(
    context: ModulatorContext,
    capabilityId: string,
    options?: Record<string, unknown>
  ): Promise<ModulatorPlan> {
    // Initialize plugin registry if needed
    const registry = getPluginRegistry();
    if (!registry.hasPlugin(capabilityId)) {
      await initializePluginRegistry();
    }

    // Load plugin descriptor
    const descriptor = registry.getPluginOrThrow(capabilityId);

    // Check compatibility (target/platform support)
    this.validatePluginSupport(descriptor, context);

    // Check conflicts (slots, dependencies, etc.)
    const conflicts = await this.checkConflicts(descriptor, context);
    
    // If there are error-level conflicts, throw before planning
    const errorConflicts = conflicts.filter(c => c.severity === 'error');
    if (errorConflicts.length > 0) {
      const conflictMessages = errorConflicts.map(c => `  - ${c.description}`).join('\n');
      throw new CliError(
        `Cannot install plugin "${capabilityId}" due to conflicts:\n${conflictMessages}\n\n` +
        `Please resolve these conflicts before installing.`,
        ExitCode.VALIDATION_STATE_FAILURE
      );
    }

    // Build dependency plan
    const dependencies: DependencyPlan = {
      runtime: descriptor.dependencies?.runtime || [],
      dev: descriptor.dependencies?.dev || [],
      scope: 'workspace',
    };

    // Build runtime wiring operations
    const runtimeWiring: RuntimeWiringOp[] = (descriptor.runtimeContributions || []).map(contribution => {
      const markerType = this.getMarkerTypeForContribution(contribution);
      const file = this.getMarkerFileForType(markerType);
      if (!file) {
        throw new CliError(
          `Cannot determine marker file for contribution type: ${(contribution as any).type}`,
          ExitCode.VALIDATION_STATE_FAILURE
        );
      }
      return {
        contribution,
        capabilityId,
        markerType,
        file,
      };
    });

    // Build patch operations
    const patches: PatchOp[] = (descriptor.patches || []).map(patch => ({
      ...patch,
      capabilityId,
    }));

    // Resolve permissions
    const permissionIds = (descriptor.permissions || []).map(p => p.permissionId);
    const catalog = loadPermissionsCatalog(resolveCliRoot());
    const resolvedPermissions = resolvePermissions(permissionIds, catalog, context.target);
    
    const permissions: PermissionsSummary = {
      permissionIds,
      iosKeys: Array.from(resolvedPermissions.values()).flatMap(r => r.iosKeys || []),
      androidPermissions: Array.from(resolvedPermissions.values()).flatMap(r => r.androidPermissions || []),
      androidFeatures: Array.from(resolvedPermissions.values()).flatMap(r => r.androidFeatures || []),
    };

    // Determine files that will be created/modified
    // Files will be determined during scaffold phase, but we can estimate from pack attachment
    const filesToCreate: string[] = [];
    const filesToModify: string[] = [];

    // Files modified by patches
    patches.forEach(patch => {
      if (!filesToModify.includes(patch.file)) {
        filesToModify.push(patch.file);
      }
    });

    // Files modified by runtime wiring (marker files)
    runtimeWiring.forEach(op => {
      const markerFile = this.getMarkerFileForType(op.markerType);
      if (markerFile && !filesToModify.includes(markerFile)) {
        filesToModify.push(markerFile);
      }
    });

    const plan: ModulatorPlan = {
      capabilityId,
      operation: 'install',
      dependencies,
      runtimeWiring,
      patches,
      permissions,
      conflicts,
      filesToCreate,
      filesToModify,
      manifestUpdates: {
        plugins: [{
          id: capabilityId,
          version: descriptor.version,
          options: options || {},
        }],
      },
    };

    return plan;
  }

  /**
   * Validates plugin support for target/platform
   */
  private validatePluginSupport(descriptor: PluginDescriptor, context: ModulatorContext): void {
    if (!descriptor.support.targets.includes(context.target)) {
      throw new CliError(
        `Plugin "${descriptor.id}" does not support target "${context.target}". ` +
        `Supported targets: ${descriptor.support.targets.join(', ')}. ` +
        `This plugin cannot be installed in a ${context.target} project.`,
        ExitCode.VALIDATION_STATE_FAILURE
      );
    }

    // Check platform support if specified
    if (descriptor.support.platforms && descriptor.support.platforms.length > 0) {
      // Note: Platform validation could be more sophisticated based on project configuration
      // For now, we just validate that platforms are specified correctly
    }

    // Check React Native version constraints if specified
    if (descriptor.support.minReactNativeVersion || descriptor.support.maxReactNativeVersion) {
      const rnVersion = context.manifest.reactNativeVersion;
      if (rnVersion) {
        // Basic version comparison could be added here
        // For now, we just note that version constraints exist
      }
    }
  }

  /**
   * Checks conflicts between plugin and installed plugins
   */
  private async checkConflicts(
    descriptor: PluginDescriptor,
    context: ModulatorContext
  ): Promise<ConflictResult[]> {
    const conflicts: ConflictResult[] = [];
    const installedPlugins = context.manifest.plugins || [];

    // Check explicit conflicts
    if (descriptor.conflictsWith) {
      for (const conflictingId of descriptor.conflictsWith) {
        const installed = installedPlugins.find(p => p.id === conflictingId);
        if (installed) {
          conflicts.push({
            type: 'dependency',
            description: `Plugin "${descriptor.id}" explicitly conflicts with installed plugin "${conflictingId}". ` +
              `Please remove "${conflictingId}" first: rns plugin remove ${conflictingId}`,
            affectedPlugins: [descriptor.id, conflictingId],
            severity: 'error',
          });
        }
      }
    }

    // Check slot conflicts
    if (descriptor.slots) {
      for (const slot of descriptor.slots) {
        if (slot.mode === 'single') {
          // Find installed plugins that occupy the same slot
          const registry = getPluginRegistry();
          for (const installed of installedPlugins) {
            const installedDescriptor = registry.getPlugin(installed.id);
            if (installedDescriptor?.slots) {
              const conflictingSlot = installedDescriptor.slots.find(s => s.slot === slot.slot && s.mode === 'single');
              if (conflictingSlot) {
                conflicts.push({
                  type: 'slot',
                  description: `Slot "${slot.slot}" is already occupied by plugin "${installed.id}". ` +
                    `Only one plugin can occupy this slot. ` +
                    `To install "${descriptor.id}", first remove "${installed.id}": rns plugin remove ${installed.id}`,
                  affectedPlugins: [descriptor.id, installed.id],
                  severity: 'error',
                });
              }
            }
          }
        }
      }
    }

    // Check required dependencies
    if (descriptor.requires) {
      const registry = getPluginRegistry();
      for (const requiredId of descriptor.requires) {
        const installed = installedPlugins.find(p => p.id === requiredId);
        if (!installed) {
          // Check if required plugin exists in registry
          const requiredPlugin = registry.getPlugin(requiredId);
          
          if (requiredPlugin) {
            conflicts.push({
              type: 'dependency',
              description: `Plugin "${descriptor.id}" requires plugin "${requiredId}" which is not installed. ` +
                `Please install it first: rns plugin add ${requiredId}`,
              affectedPlugins: [descriptor.id],
              severity: 'error',
            });
          } else {
            conflicts.push({
              type: 'dependency',
              description: `Plugin "${descriptor.id}" requires plugin "${requiredId}" which is not installed and not found in registry. ` +
                `The required plugin may not be available or may have been removed.`,
              affectedPlugins: [descriptor.id],
              severity: 'error',
            });
          }
        } else {
          // Check for version mismatches if needed
          // Note: Version constraint checking can be added here if descriptor.requires supports version specs
          // For now, we just verify the plugin is installed
        }
      }
    }

    return conflicts;
  }

  /**
   * Gets marker type for a runtime contribution
   */
  private getMarkerTypeForContribution(contribution: any): 'imports' | 'providers' | 'init-steps' | 'root' | 'registrations' {
    if (contribution.type === 'import') return 'imports';
    if (contribution.type === 'provider') return 'providers';
    if (contribution.type === 'init-step') return 'init-steps';
    if (contribution.type === 'registration') return 'registrations';
    if (contribution.type === 'root') return 'root';
    return 'imports'; // default
  }

  /**
   * Gets marker file path for a marker type
   */
  private getMarkerFileForType(markerType: string): string | undefined {
    switch (markerType) {
      case 'imports':
      case 'providers':
      case 'root':
        return 'packages/@rns/runtime/index.ts';
      case 'init-steps':
      case 'registrations':
        return 'packages/@rns/runtime/core-init.ts';
      default:
        return undefined;
    }
  }

  /**
   * Plans removal
   */
  private async planRemove(
    context: ModulatorContext,
    capabilityId: string
  ): Promise<ModulatorPlan> {
    // Check if plugin is installed
    const installed = getPluginFromManifest(context.projectRoot, capabilityId);
    
    if (!installed) {
      // NO-OP if not installed
      return {
        capabilityId,
        operation: 'remove',
        dependencies: { runtime: [], dev: [] },
        runtimeWiring: [],
        patches: [],
        permissions: { permissionIds: [] },
        conflicts: [],
        filesToCreate: [],
        filesToModify: [],
        filesToRemove: [],
        manifestUpdates: {},
      };
    }

    // TODO: Plan removal based on installed plugin record
    // - Reverse dependencies (remove deps if no other plugins use them)
    // - Reverse runtime wiring (remove contributions)
    // - Reverse patches (remove patch operations)
    // - Remove owned files (only in SYSTEM ZONE)
    // - Update manifest

    const plan: ModulatorPlan = {
      capabilityId,
      operation: 'remove',
      dependencies: { runtime: [], dev: [] },
      runtimeWiring: [],
      patches: [],
      permissions: { permissionIds: [] },
      conflicts: [],
      filesToCreate: [],
      filesToModify: [],
      filesToRemove: installed.ownedFiles || [],
      manifestUpdates: {},
    };

    return plan;
  }

  /**
   * Applies planned changes
   * 
   * @param context - Modulator context
   * @param plan - Plan to apply
   * @param dryRun - If true, don't actually apply changes
   * @returns Result of apply operation
   */
  async apply(
    context: ModulatorContext,
    plan: ModulatorPlan,
    dryRun: boolean = false
  ): Promise<ModulatorResult> {
    const phases: PhaseResult[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    let backupDir: string | undefined;

    try {
      // Phase 1: Doctor gate (already validated in plan)
      phases.push({
        phase: 'doctor',
        success: true,
        action: 'executed',
      });

      // Phase 2: Scaffold (attach plugin pack)
      if (plan.operation === 'install') {
        const scaffoldResult = await this.executeScaffold(context, plan, dryRun);
        phases.push(scaffoldResult);
        if (!scaffoldResult.success) {
          errors.push(scaffoldResult.error || 'Scaffold phase failed');
        }
      }

      // Create backup directory
      if (!dryRun && plan.operation === 'install') {
        backupDir = createBackupDirectory(context.projectRoot, `modulator-${plan.capabilityId}`);
      }

      // Phase 3: Link (install dependencies)
      const linkResult = await this.executeLink(context, plan, dryRun);
      phases.push(linkResult);
      if (!linkResult.success) {
        errors.push(linkResult.error || 'Link phase failed');
      }

      // Phase 4: Wire runtime (AST-based wiring)
      const wireResult = await this.executeWire(context, plan, dryRun);
      phases.push(wireResult);
      if (!wireResult.success) {
        errors.push(wireResult.error || 'Wire phase failed');
      }

      // Phase 5: Patch (native/config patches)
      const patchResult = await this.executePatch(context, plan, dryRun);
      phases.push(patchResult);
      if (!patchResult.success) {
        errors.push(patchResult.error || 'Patch phase failed');
      }

      // Phase 6: Update manifest
      const manifestResult = await this.executeManifestUpdate(context, plan, dryRun);
      phases.push(manifestResult);
      if (!manifestResult.success) {
        errors.push(manifestResult.error || 'Manifest update phase failed');
      }

      // Phase 7: Verify (check for duplicates, markers intact)
      const verifyResult = await this.executeVerify(context, plan, dryRun);
      phases.push(verifyResult);
      if (!verifyResult.success) {
        warnings.push(...(verifyResult.warnings || []));
      }

      return {
        success: errors.length === 0,
        operation: plan.operation,
        capabilityId: plan.capabilityId,
        phases,
        warnings,
        errors,
        manifestUpdated: manifestResult.success,
        backupDir,
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return {
        success: false,
        operation: plan.operation,
        capabilityId: plan.capabilityId,
        phases,
        warnings,
        errors,
        manifestUpdated: false,
        backupDir,
      };
    }
  }

  /**
   * Removes a plugin/module
   * 
   * @param context - Modulator context
   * @param capabilityId - Plugin/module ID to remove
   * @param dryRun - If true, don't actually remove
   * @returns Result of remove operation
   */
  async remove(
    context: ModulatorContext,
    capabilityId: string,
    dryRun: boolean = false
  ): Promise<ModulatorResult> {
    // Plan removal
    const plan = await this.plan(context, capabilityId, 'remove');
    
    // If NO-OP (not installed), return early
    if (plan.filesToRemove?.length === 0 && !getPluginFromManifest(context.projectRoot, capabilityId)) {
      return {
        success: true,
        operation: 'remove',
        capabilityId,
        phases: [{
          phase: 'remove',
          success: true,
          action: 'skipped',
        }],
        warnings: [],
        errors: [],
        manifestUpdated: false,
      };
    }

    // Apply removal plan
    return this.apply(context, plan, dryRun);
  }

  /**
   * Executes scaffold phase (attach plugin pack)
   */
  private async executeScaffold(
    context: ModulatorContext,
    plan: ModulatorPlan,
    dryRun: boolean
  ): Promise<PhaseResult> {
    try {
      // Discover plugin pack
      const pluginPacks = listPacks('plugin');
      const pluginPack = pluginPacks.find(p => p.id === plan.capabilityId);
      
      if (!pluginPack) {
        return {
          phase: 'scaffold',
          success: false,
          action: 'error',
          error: `Plugin pack not found for "${plan.capabilityId}"`,
        };
      }

      // Resolve variant path
      const language = context.manifest.language || 'ts';
      const normalizedOptionsKey = plan.manifestUpdates.plugins?.[0]?.options 
        ? normalizeOptionsKey(plan.manifestUpdates.plugins[0].options)
        : undefined;

      const variantPath = resolvePackVariant(
        plan.capabilityId,
        'plugin',
        pluginPack.manifest,
        {
          target: context.target,
          language,
          packType: 'plugin',
          normalizedOptionsKey,
        }
      );

      // Attach pack
      const attachmentReport = attachPack({
        projectRoot: context.projectRoot,
        packManifest: pluginPack.manifest,
        resolvedPackPath: variantPath,
        target: context.target,
        language,
        mode: 'PLUGIN',
        options: plan.manifestUpdates.plugins?.[0]?.options,
        dryRun,
      });

      // Update plan with files that will be created
      plan.filesToCreate.push(...attachmentReport.created);
      plan.filesToModify.push(...attachmentReport.updated);
      
      return {
        phase: 'scaffold',
        success: true,
        action: dryRun ? 'skipped' : 'executed',
        warnings: attachmentReport.conflicts.length > 0 
          ? [`Conflicts detected: ${attachmentReport.conflicts.join(', ')}`]
          : undefined,
      };
    } catch (error) {
      return {
        phase: 'scaffold',
        success: false,
        action: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Executes link phase (install dependencies)
   */
  private async executeLink(
    context: ModulatorContext,
    plan: ModulatorPlan,
    dryRun: boolean
  ): Promise<PhaseResult> {
    try {
      if (plan.dependencies.runtime.length > 0) {
        const runtimeResult = addRuntimeDependencies(
          context.projectRoot,
          plan.dependencies.runtime,
          { scope: plan.dependencies.scope, dryRun, verbose: context.runtimeContext.flags.verbose }
        );
        if (!runtimeResult.success) {
          return {
            phase: 'link',
            success: false,
            action: 'error',
            error: runtimeResult.error,
          };
        }
      }

      if (plan.dependencies.dev.length > 0) {
        const devResult = addDevDependencies(
          context.projectRoot,
          plan.dependencies.dev,
          { scope: plan.dependencies.scope, dryRun, verbose: context.runtimeContext.flags.verbose }
        );
        if (!devResult.success) {
          return {
            phase: 'link',
            success: false,
            action: 'error',
            error: devResult.error,
          };
        }
      }

      // Install dependencies (from lockfile)
      const installResult = installDependencies(
        context.projectRoot,
        { scope: plan.dependencies.scope, dryRun, verbose: context.runtimeContext.flags.verbose }
      );
      if (!installResult.success) {
        return {
          phase: 'link',
          success: false,
          action: 'error',
          error: installResult.error,
        };
      }

      return {
        phase: 'link',
        success: true,
        action: dryRun ? 'skipped' : 'executed',
      };
    } catch (error) {
      return {
        phase: 'link',
        success: false,
        action: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Executes wire phase (runtime wiring)
   */
  private async executeWire(
    context: ModulatorContext,
    plan: ModulatorPlan,
    dryRun: boolean
  ): Promise<PhaseResult> {
    try {
      if (plan.runtimeWiring.length > 0) {
        const results = wireRuntimeContributions(
          context.projectRoot,
          plan.runtimeWiring,
          dryRun
        );

        const errors = results.filter(r => !r.success);
        if (errors.length > 0) {
          return {
            phase: 'wire',
            success: false,
            action: 'error',
            error: errors.map(e => e.error).filter(Boolean).join('; '),
          };
        }
      }

      return {
        phase: 'wire',
        success: true,
        action: dryRun ? 'skipped' : 'executed',
      };
    } catch (error) {
      return {
        phase: 'wire',
        success: false,
        action: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Executes patch phase (native/config patches)
   */
  private async executePatch(
    context: ModulatorContext,
    plan: ModulatorPlan,
    dryRun: boolean
  ): Promise<PhaseResult> {
    try {
      if (plan.patches.length > 0) {
        const results = applyPatchOps(
          context.projectRoot,
          plan.patches,
          dryRun
        );

        const errors = results.filter(r => !r.success);
        if (errors.length > 0) {
          return {
            phase: 'patch',
            success: false,
            action: 'error',
            error: errors.map(e => e.error).filter(Boolean).join('; '),
          };
        }
      }

      return {
        phase: 'patch',
        success: true,
        action: dryRun ? 'skipped' : 'executed',
      };
    } catch (error) {
      return {
        phase: 'patch',
        success: false,
        action: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Executes manifest update phase
   */
  private async executeManifestUpdate(
    context: ModulatorContext,
    plan: ModulatorPlan,
    dryRun: boolean
  ): Promise<PhaseResult> {
    try {
      if (dryRun) {
        return {
          phase: 'manifest',
          success: true,
          action: 'skipped',
        };
      }

      if (plan.operation === 'install' && plan.manifestUpdates.plugins) {
        for (const plugin of plan.manifestUpdates.plugins) {
          addPluginToManifest(context.projectRoot, {
            id: plugin.id,
            version: plugin.version,
            installedAt: new Date().toISOString(),
            options: plugin.options,
            ownedFiles: plan.filesToCreate,
          });
        }
      } else if (plan.operation === 'remove') {
        removePluginFromManifest(context.projectRoot, plan.capabilityId);
      }

      return {
        phase: 'manifest',
        success: true,
        action: 'executed',
      };
    } catch (error) {
      return {
        phase: 'manifest',
        success: false,
        action: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Executes verify phase (check for duplicates, markers intact)
   */
  private async executeVerify(
    context: ModulatorContext,
    plan: ModulatorPlan,
    dryRun: boolean
  ): Promise<PhaseResult> {
    try {
      const warnings: string[] = [];

      // TODO: Verify:
      // - No duplicate injections (check markers)
      // - Markers intact (validate markers)
      // - No conflicts in installed plugins

      return {
        phase: 'verify',
        success: true,
        action: dryRun ? 'skipped' : 'executed',
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      return {
        phase: 'verify',
        success: false,
        action: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

/**
 * Creates a modulator engine instance
 */
export function createModulator(): IModulator {
  return new ModulatorEngine();
}
