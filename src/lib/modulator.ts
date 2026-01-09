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
import { CliError, ExitCode } from './errors';
import type {
  ModulatorContext,
  ModulatorPlan,
  ModulatorResult,
  PhaseResult,
  IModulator,
} from './types/modulator';
import type { RuntimeWiringOp } from './types/runtime';
import type { PatchOp } from './types/patch-ops';
import type { DependencySpec } from './types/dependencies';

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
    // TODO: Load plugin descriptor from registry/catalog
    // For now, return a basic plan structure
    // This will be expanded when plugin framework is implemented
    
    const plan: ModulatorPlan = {
      capabilityId,
      operation: 'install',
      dependencies: {
        runtime: [],
        dev: [],
        scope: 'workspace',
      },
      runtimeWiring: [],
      patches: [],
      permissions: {
        permissionIds: [],
      },
      conflicts: [],
      filesToCreate: [],
      filesToModify: [],
      manifestUpdates: {
        plugins: [{
          id: capabilityId,
          version: '1.0.0', // TODO: get from plugin descriptor
          options: options || {},
        }],
      },
    };

    // TODO: Load plugin descriptor and populate:
    // - dependencies (runtime/dev)
    // - runtimeWiring (from plugin descriptor)
    // - patches (from plugin descriptor)
    // - permissions (from plugin descriptor)
    // - conflicts (check against installed plugins)
    // - filesToCreate (from pack attachment)
    // - filesToModify (from patches/wiring)

    return plan;
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
      // TODO: Use attachment engine to attach plugin pack
      // For now, this is a placeholder
      // const attachmentReport = attachPack({ ... });
      
      return {
        phase: 'scaffold',
        success: true,
        action: dryRun ? 'skipped' : 'executed',
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
