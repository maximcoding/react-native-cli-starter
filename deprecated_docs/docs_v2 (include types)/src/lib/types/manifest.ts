import type { CliMeta, ISODateString, Language, PackageManager, RnsTarget, ExpoRuntime } from './common';
import type { PermissionsSummary } from './permissions';
import type { PluginId } from './plugin';

export interface RnsProjectIdentity {
  name: string;
  displayName?: string;
  bundleId?: string;      // iOS
  packageName?: string;   // Android
  version?: string;       // semver
  buildNumber?: number;
}

export interface RnsProjectConfig {
  target: RnsTarget;
  language: Language;
  packageManager: PackageManager;

  framework: 'expo' | 'react-native';
  frameworkVersion?: string;
  expoRuntime?: ExpoRuntime; // when target=expo
}

export interface InstalledPluginRecord {
  id: PluginId;
  version?: string;
  installedAt: ISODateString;
  config?: Record<string, unknown>;

  /** bookkeeping for doctor/remove */
  ownedPaths?: string[];
  modifiedFiles?: string[];
}

export interface RnsProjectManifest {
  schemaVersion: string;
  cli: CliMeta;

  identity: RnsProjectIdentity;
  project: RnsProjectConfig;

  plugins: Record<PluginId, InstalledPluginRecord>;

  permissions?: PermissionsSummary;

  deps?: {
    runtime?: Record<string, string>;
    dev?: Record<string, string>;
  };
}
