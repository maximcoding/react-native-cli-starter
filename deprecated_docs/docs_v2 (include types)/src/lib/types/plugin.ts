import type { AppPlatform, ExpoRuntime, RnsTarget } from './common';
import type { ConflictRule } from './conflicts';
import type { PermissionRequirement } from './permissions';
import type { PatchOp } from './patch-ops';
import type { RuntimeContribution } from './runtime';

export type PluginId = string;

export type PluginCategory =
  | 'foundation'
  | 'ui'
  | 'navigation'
  | 'state'
  | 'data'
  | 'transport'
  | 'auth'
  | 'storage'
  | 'offline'
  | 'device'
  | 'payments'
  | 'notifications'
  | 'analytics'
  | 'i18n'
  | 'dx'
  | 'testing'
  | 'other';

export interface PluginSupport {
  targets: Array<RnsTarget>;              // expo/bare
  platforms?: Array<AppPlatform>;         // ios/android/web
  expoRuntime?: Array<ExpoRuntime>;       // for expo target: expo-go/dev-client/standalone
  notes?: string;
}

export interface PluginDependencies {
  /** npm dependencies required by this plugin (runtime). */
  deps?: Record<string, string>;
  /** dev dependencies required by this plugin (tooling). */
  devDeps?: Record<string, string>;
  /** Other plugins required before installing this one. */
  requiresPlugins?: PluginId[];
}

export interface PluginDescriptor {
  id: PluginId;
  name: string;
  category: PluginCategory;

  support: PluginSupport;

  conflicts?: ConflictRule[];

  dependencies?: PluginDependencies;

  permissions?: {
    required?: PermissionRequirement[];
    optional?: PermissionRequirement[];
  };

  runtime?: {
    contributions?: RuntimeContribution[];
  };

  patches?: PatchOp[];

  /** Optional schema version for plugin descriptor migrations. */
  schemaVersion?: string;
}
