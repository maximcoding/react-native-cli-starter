/**
 * FILE: src/lib/types/module.ts
 * PURPOSE: Module descriptor types (section 21)
 * OWNERSHIP: CLI
 * 
 * Canonical Docs: docs/cli-interface-and-types.md §2.9
 * 
 * Modules are business features (not infrastructure like plugins).
 * They generate feature code and integrate through a stable registration model.
 */

import type { RnsTarget, PlatformOS } from './common';
import type { DependencySpec } from './dependencies';
import type { RuntimeContribution } from './runtime';
import type { PermissionRequirement } from './permissions';

/**
 * Module ID - stable module key like "module.user-profile", "module.orders"
 */
export type ModuleId = string;

/**
 * Module category for taxonomy/UI
 */
export type ModuleCategory = 
  | 'auth'
  | 'user'
  | 'commerce'
  | 'social'
  | 'content'
  | 'chat'
  | 'admin'
  | 'other';

/**
 * Module support - what targets/platforms the module supports
 */
export interface ModuleSupport {
  /** Supported targets (expo/bare) */
  targets: RnsTarget[];
  /** Supported platforms (ios/android/web) */
  platforms?: PlatformOS[];
  /** Minimum React Native version (optional) */
  minReactNativeVersion?: string;
  /** Maximum React Native version (optional) */
  maxReactNativeVersion?: string;
}

/**
 * Module requirements - capabilities/plugins this module requires
 */
export interface ModuleRequirements {
  /** Required plugin IDs (must be installed) */
  plugins?: string[];
  /** Required capabilities (e.g., "navigation", "auth", "storage") */
  capabilities?: string[];
  /** Optional notes about requirements */
  notes?: string;
}

/**
 * Module generation options (for wizard/interactive selection)
 */
export interface ModuleGenerationOptions {
  /** Option key (e.g., "authProvider", "storageType") */
  key: string;
  /** Option label for UI */
  label: string;
  /** Option description */
  description?: string;
  /** Option type */
  type: 'string' | 'boolean' | 'select' | 'multi-select';
  /** Default value */
  defaultValue?: unknown;
  /** Choices for select/multi-select */
  choices?: Array<{ label: string; value: string }>;
  /** Validation function (optional) */
  validate?: (value: unknown) => boolean | string;
  /** Required flag */
  required?: boolean;
}

/**
 * Module descriptor - blueprint of a module
 * Similar to PluginDescriptor but focused on business feature generation
 */
export interface ModuleDescriptor {
  /** Module ID (must match directory name) */
  id: ModuleId;
  /** Module name (human-readable) */
  name: string;
  /** Module description */
  description?: string;
  /** Module version */
  version: string;
  /** Module category */
  category: ModuleCategory;
  /** Module support (targets/platforms) */
  support: ModuleSupport;
  /** Module requirements (plugins/capabilities) */
  requires?: ModuleRequirements;
  /** Generation options (for wizard) */
  options?: ModuleGenerationOptions[];
  /** Optional dependencies (npm packages) */
  dependencies?: {
    runtime?: DependencySpec[];
    dev?: DependencySpec[];
  };
  /** Optional runtime contributions (for registration) */
  runtimeContributions?: RuntimeContribution[];
  /** Optional permissions required */
  permissions?: PermissionRequirement[];
  /** What the module generates (summary for UI) */
  generates?: {
    /** Screens/components generated */
    screens?: string[];
    /** Flows/navigation added */
    flows?: string[];
    /** Domain models/state */
    domain?: string[];
    /** Other files */
    other?: string[];
  };
}

/**
 * Module generation context
 */
export interface ModuleGenerationContext {
  /** Project root */
  projectRoot: string;
  /** Target (expo/bare) */
  target: RnsTarget;
  /** Language (ts/js) */
  language: 'ts' | 'js';
  /** Selected generation options */
  options: Record<string, unknown>;
  /** Installed plugins (for capability checks) */
  installedPlugins: Array<{ id: string; version: string }>;
  /** Module being generated */
  moduleId: ModuleId;
}

/**
 * Module generation result
 */
export interface ModuleGenerationResult {
  /** Whether generation succeeded */
  success: boolean;
  /** Generated files/directories */
  generated?: {
    files: string[];
    directories: string[];
  };
  /** Registration operations performed */
  registrations?: Array<{
    type: 'screen' | 'route' | 'state' | 'service';
    identifier: string;
    location: string;
  }>;
  /** Errors if any */
  errors?: string[];
  /** Warnings if any */
  warnings?: string[];
}
