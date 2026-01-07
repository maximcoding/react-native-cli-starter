import type { AppPlatform, RnsTarget } from './common';

export type PermissionId = string;

/**
 * Platform-specific permission spec. This is what the CLI applies via patch ops.
 */
export interface PlatformPermissionSpec {
  iosInfoPlistKeys?: string[];              // e.g. NSCameraUsageDescription
  androidManifestPermissions?: string[];     // e.g. android.permission.CAMERA
  androidFeatures?: string[];                // e.g. android.hardware.camera
  notes?: string;
}

export interface PermissionRequirement {
  id: PermissionId;
  mandatory: boolean;
  /** Optional note for UX output (why needed / when requested). */
  reason?: string;
}

export interface PermissionsByPlugin {
  pluginId: string;
  mandatory: PermissionId[];
  optional: PermissionId[];
}

export interface PermissionsSummary {
  iosInfoPlistKeys: string[];
  androidManifestPermissions: string[];
  androidFeatures?: string[];
  byPlugin: Record<string, { mandatory: PermissionId[]; optional: PermissionId[] }>;
}

/**
 * Permission provider describes how JS checks/requests permissions.
 * This can map to Expo modules OR react-native-permissions OR RN core.
 */
export interface PermissionProviderDescriptor {
  id: string;
  target: RnsTarget | 'both';
  platforms: AppPlatform[];
  /** For docs/UX: what JS API to call. */
  apis: string[];
  /** For docs/UX: required native declarations. */
  spec: PlatformPermissionSpec;
  notes?: string;
}
