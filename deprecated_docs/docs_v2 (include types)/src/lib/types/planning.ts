/**
 * FILE: planning.ts
 * LAYER: CLI types (src/lib/types)
 * PURPOSE: Shared planning + audit enums used by plan/apply and state logs.
 */

export type OwnershipZone = 'user' | 'system' | 'shared';

export type ChangeKind = 'create' | 'modify' | 'delete';

export type BackupPolicy = 'always' | 'when-modifying' | 'never';

export type PluginLifecyclePhase = 'plan' | 'scaffold' | 'link' | 'inject' | 'patch' | 'verify' | 'state';

export type ApplyStatus = 'applied' | 'skipped' | 'no-op' | 'failed';

export interface FileOwnershipRecord {
  path: string;
  zone: OwnershipZone;
  owner?: string; // plugin id for system-owned paths
}
