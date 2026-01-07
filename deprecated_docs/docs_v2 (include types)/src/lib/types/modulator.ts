/**
 * FILE: modulator.ts
 * LAYER: CLI types (src/lib/types)
 * PURPOSE: Contracts for the Modulator Engine (plugin install/remove pipeline).
 *
 * Important:
 * - "Plan" is the dry-run output. It MUST be deterministic.
 * - "Apply" executes planned ops end-to-end (deps + AST wiring + patch ops + verify + state).
 * - All JS/TS wiring is AST-only via ts-morph (no regex injection).
 * - Native/config changes are patch-ops based, anchored, idempotent, with backups.
 */

import type { PackageManager, RnsTarget } from './common';
import type { RnsProjectManifest, InstalledPluginRecord } from './manifest';
import type { PluginId } from './plugin';
import type { PluginDescriptor } from './plugin';
import type { RuntimeContribution } from './runtime';
import type { PatchOp } from './patch-ops';
import type { ConflictCheckResult } from './conflicts';

// ----------------------------------------------------------------------------
// Phase result shapes
// ----------------------------------------------------------------------------

export interface ScaffoldResult {
  ok: boolean;
  packageName: string;     // "@rns/plugin-xyz"
  targetPath: string;      // "packages/@rns/plugin-xyz"
  createdFiles: string[];
  error?: string;
}

export interface LinkResult {
  ok: boolean;
  workspaceUpdated: boolean;
  installedDependencies: string[];
  nativeInstallTriggered: boolean; // pod install / gradle sync when applicable
  error?: string;
}

export interface InjectResult {
  ok: boolean;
  /** CLI-owned runtime composition file (never developer src/**) */
  targetFile: string;
  importsAdded: string[];
  registrationsAdded: string[];
  error?: string;
}

export interface PatchResult {
  ok: boolean;
  applied: PatchOp[];
  skipped: PatchOp[];
  backupDir?: string;
  error?: string;
}

export interface VerifyResult {
  ok: boolean;
  warnings: string[];
  errors: string[];
}

// ----------------------------------------------------------------------------
// Context / Plan / Result
// ----------------------------------------------------------------------------

export interface ModulatorContext {
  projectRoot: string;
  packageManager: PackageManager;
  target: RnsTarget;

  /** execution flags */
  dryRun?: boolean;
  verbose?: boolean;
  force?: boolean;

  manifest: RnsProjectManifest;
}

export interface PlannedAction {
  id: string;
  kind:
    | 'scaffold'
    | 'link'
    | 'inject'
    | 'patch'
    | 'verify'
    | 'state.update';
  description: string;
  /**
   * Optional structured payload for tooling/UI.
   * Keep it JSON-serializable.
   */
  payload?: Record<string, unknown>;
}

export interface ModulatorPlan {
  plugin: PluginDescriptor;
  allowed: boolean;
  conflict: ConflictCheckResult;
  warnings: string[];

  /** The ordered actions that would run during apply() */
  actions: PlannedAction[];

  /** What will be injected into runtime (symbol-based) */
  runtime: RuntimeContribution[];

  /** What patch ops will run (iOS/Android/Expo/text anchors) */
  patches: PatchOp[];
}

export interface ModulatorResult {
  ok: boolean;
  plugin: PluginDescriptor;

  scaffold?: ScaffoldResult;
  link?: LinkResult;
  inject?: InjectResult;
  patch?: PatchResult;
  verify?: VerifyResult;

  manifestUpdated: boolean;
  installedRecord?: InstalledPluginRecord;

  warnings: string[];
  errors: string[];
  summary: string;
  nextSteps?: string[];
}

// ----------------------------------------------------------------------------
// Main Modulator API and phase executors
// ----------------------------------------------------------------------------

export interface IModulator {
  plan(pluginId: PluginId, ctx: ModulatorContext): Promise<ModulatorPlan>;
  apply(pluginId: PluginId, ctx: ModulatorContext): Promise<ModulatorResult>;
  remove(pluginId: PluginId, ctx: ModulatorContext): Promise<ModulatorResult>;
}

export interface IPackageScaffolder {
  scaffold(plugin: PluginDescriptor, ctx: ModulatorContext): Promise<ScaffoldResult>;
}

export interface IWorkspaceLinker {
  link(plugin: PluginDescriptor, ctx: ModulatorContext): Promise<LinkResult>;
}

export interface IRuntimeInjector {
  inject(plugin: PluginDescriptor, ctx: ModulatorContext): Promise<InjectResult>;
  eject(plugin: PluginDescriptor, ctx: ModulatorContext): Promise<InjectResult>;
  isInjected(plugin: PluginDescriptor, ctx: ModulatorContext): Promise<boolean>;
}

export interface INativePatcher {
  apply(patches: PatchOp[], ctx: ModulatorContext): Promise<PatchResult>;
}

export interface IVerifier {
  verify(plugin: PluginDescriptor, ctx: ModulatorContext): Promise<VerifyResult>;
}
