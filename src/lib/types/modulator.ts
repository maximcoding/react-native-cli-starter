/**
 * FILE: src/lib/types/modulator.ts
 * PURPOSE: Modulator engine types (plan/apply/remove) (section 15)
 * OWNERSHIP: CLI
 * 
 * Canonical Docs: docs/cli-interface-and-types.md §2.13
 */

import type { RuntimeContext } from '../runtime';
import type { RnsProjectManifest } from './manifest';
import type { PackageManager, RnsTarget } from './common';
import type { DependencySpec } from './dependencies';
import type { RuntimeWiringOp } from './runtime';
import type { PatchOp } from './patch-ops';

/**
 * Modulator context - project environment and configuration
 */
export interface ModulatorContext {
  /** Project root directory */
  projectRoot: string;
  /** Target platform (expo/bare) */
  target: RnsTarget;
  /** Package manager */
  packageManager: PackageManager;
  /** Project manifest */
  manifest: RnsProjectManifest;
  /** Runtime context (logger, flags, etc.) */
  runtimeContext: RuntimeContext;
}

/**
 * Phase execution result
 */
export interface PhaseResult {
  /** Phase name */
  phase: string;
  /** Success status */
  success: boolean;
  /** Action taken */
  action: 'executed' | 'skipped' | 'error';
  /** Error message if failed */
  error?: string;
  /** Warnings */
  warnings?: string[];
}

/**
 * Dependency installation plan
 */
export interface DependencyPlan {
  /** Runtime dependencies to install */
  runtime: DependencySpec[];
  /** Dev dependencies to install */
  dev: DependencySpec[];
  /** Scope for installation */
  scope?: 'workspace' | 'host' | `package:${string}`;
}

/**
 * Permissions summary
 */
export interface PermissionsSummary {
  /** Permission IDs required */
  permissionIds: string[];
  /** iOS Info.plist keys */
  iosKeys?: string[];
  /** Android manifest permissions */
  androidPermissions?: string[];
  /** Android manifest features */
  androidFeatures?: string[];
}

/**
 * Conflict detection result
 */
export interface ConflictResult {
  /** Conflict type */
  type: 'slot' | 'dependency' | 'permission' | 'file';
  /** Conflict description */
  description: string;
  /** Affected plugin IDs */
  affectedPlugins: string[];
  /** Severity */
  severity: 'error' | 'warning';
}

/**
 * Modulator plan - dry-run plan of changes
 */
export interface ModulatorPlan {
  /** Plugin/module ID */
  capabilityId: string;
  /** Plan type */
  operation: 'install' | 'remove';
  /** Dependency plan */
  dependencies: DependencyPlan;
  /** Runtime wiring operations */
  runtimeWiring: RuntimeWiringOp[];
  /** Patch operations */
  patches: PatchOp[];
  /** Permissions summary */
  permissions: PermissionsSummary;
  /** Conflicts detected */
  conflicts: ConflictResult[];
  /** Files that will be created */
  filesToCreate: string[];
  /** Files that will be modified */
  filesToModify: string[];
  /** Files that will be removed (remove operation only) */
  filesToRemove?: string[];
  /** Manifest updates */
  manifestUpdates: {
    plugins?: Array<{ id: string; version: string; options?: Record<string, unknown> }>;
    modules?: Array<{ id: string; version: string; options?: Record<string, unknown> }>;
  };
}

/**
 * Modulator result - result of apply/remove operation
 */
export interface ModulatorResult {
  /** Success status */
  success: boolean;
  /** Operation type */
  operation: 'install' | 'remove';
  /** Capability ID */
  capabilityId: string;
  /** Phase results */
  phases: PhaseResult[];
  /** Warnings */
  warnings: string[];
  /** Errors */
  errors: string[];
  /** Manifest updated */
  manifestUpdated: boolean;
  /** Backup directory (if created) */
  backupDir?: string;
}

/**
 * Modulator engine interface
 */
export interface IModulator {
  /**
   * Plans changes (dry-run)
   * 
   * @param context - Modulator context
   * @param capabilityId - Plugin/module ID to plan
   * @param operation - Operation type (install/remove)
   * @param options - Installation options
   * @returns Plan of changes
   */
  plan(
    context: ModulatorContext,
    capabilityId: string,
    operation: 'install' | 'remove',
    options?: Record<string, unknown>
  ): Promise<ModulatorPlan>;

  /**
   * Applies planned changes
   * 
   * @param context - Modulator context
   * @param plan - Plan to apply
   * @param dryRun - If true, don't actually apply changes
   * @returns Result of apply operation
   */
  apply(
    context: ModulatorContext,
    plan: ModulatorPlan,
    dryRun?: boolean
  ): Promise<ModulatorResult>;

  /**
   * Removes a plugin/module
   * 
   * @param context - Modulator context
   * @param capabilityId - Plugin/module ID to remove
   * @param dryRun - If true, don't actually remove
   * @returns Result of remove operation
   */
  remove(
    context: ModulatorContext,
    capabilityId: string,
    dryRun?: boolean
  ): Promise<ModulatorResult>;
}
