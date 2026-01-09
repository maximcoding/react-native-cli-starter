/**
 * FILE: src/lib/types/plugin.ts
 * PURPOSE: Plugin descriptor types (section 19)
 * OWNERSHIP: CLI
 * 
 * Canonical Docs: docs/cli-interface-and-types.md §2.3, §2.4
 */

import type { RnsTarget, PlatformOS } from './common';
import type { DependencySpec } from './dependencies';
import type { RuntimeContribution } from './runtime';
import type { PatchOp } from './patch-ops';
import type { PermissionRequirement } from './permissions';

/**
 * Plugin ID - stable plugin key like "auth.firebase"
 */
export type PluginId = string;

/**
 * Plugin category for taxonomy/UI
 */
export type PluginCategory = 
  | 'auth'
  | 'storage'
  | 'network'
  | 'ui'
  | 'navigation'
  | 'analytics'
  | 'notifications'
  | 'camera'
  | 'location'
  | 'media'
  | 'hardware'
  | 'data'
  | 'other';

/**
 * Plugin tier (optional, for UX/catalog)
 */
export type PluginTier = 'core' | 'recommended' | 'advanced';

/**
 * Plugin support - what targets/platforms/runtime the plugin supports
 */
export interface PluginSupport {
  /** Supported targets (expo/bare) */
  targets: RnsTarget[];
  /** Supported platforms (ios/android/web) */
  platforms?: PlatformOS[];
  /** Supported Expo runtime (if target is expo) */
  expoRuntime?: ('expo-go' | 'dev-client' | 'standalone')[];
  /** Minimum React Native version (optional) */
  minReactNativeVersion?: string;
  /** Maximum React Native version (optional) */
  maxReactNativeVersion?: string;
}

/**
 * Slot ID - stable string identifier for capability slots
 * Examples: "navigation.root", "ui.framework", "network.transport"
 */
export type SlotId = string;

/**
 * Slot mode - single or multi
 */
export type SlotMode = 'single' | 'multi';

/**
 * Slot rule - defines a slot that this plugin occupies
 */
export interface SlotRule {
  /** Slot ID */
  slot: SlotId;
  /** Slot mode */
  mode: SlotMode;
}

/**
 * Conflict check result
 */
export interface ConflictCheckResult {
  /** Whether installation is allowed */
  allowed: boolean;
  /** Conflicts detected */
  conflicts: Array<{
    /** Conflict type */
    type: 'slot' | 'dependency' | 'permission' | 'file';
    /** Conflict description */
    description: string;
    /** Affected plugin IDs */
    affectedPlugins: string[];
    /** Severity */
    severity: 'error' | 'warning';
  }>;
}

/**
 * Plugin descriptor - blueprint of a plugin
 * 
 * This is the contract between plugin and engine.
 * The descriptor carries all "knowledge" needed to install the plugin.
 */
export interface PluginDescriptor {
  /** Plugin ID (stable key, e.g., "auth.firebase") */
  id: PluginId;
  /** Plugin name (human-readable) */
  name: string;
  /** Plugin description */
  description?: string;
  /** Plugin version */
  version: string;
  /** Plugin category */
  category: PluginCategory;
  /** Plugin tier (optional, for UX) */
  tier?: PluginTier;
  /** Support matrix (targets/platforms/runtime) */
  support: PluginSupport;
  /** Slot rules (conflicts) */
  slots?: SlotRule[];
  /** Required dependencies (other plugins) */
  requires?: PluginId[];
  /** Conflicts with other plugins (by ID) */
  conflictsWith?: PluginId[];
  /** Runtime dependencies (npm packages) */
  dependencies?: {
    /** Runtime dependencies */
    runtime?: DependencySpec[];
    /** Dev dependencies */
    dev?: DependencySpec[];
  };
  /** Runtime contributions (wiring) */
  runtimeContributions?: RuntimeContribution[];
  /** Patch operations (native/config changes) */
  patches?: PatchOp[];
  /** Permission requirements */
  permissions?: PermissionRequirement[];
  /** Optional installation options schema */
  optionsSchema?: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'array' | 'object';
      description?: string;
      default?: unknown;
      required?: boolean;
    };
  };
}
