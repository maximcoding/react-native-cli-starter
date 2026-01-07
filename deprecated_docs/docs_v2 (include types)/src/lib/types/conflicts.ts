export type SlotMode = 'single' | 'multi';

/**
 * A slot is a conflict domain such as "navigation.root" or "ui.framework".
 * If mode is "single", only one plugin may occupy it.
 * If mode is "multi", many plugins may occupy it.
 */
export interface ConflictRule {
  slot: string;
  mode: SlotMode;
  /** Optional human-facing explanation for CLI errors. */
  reason?: string;
}

export interface ConflictHit {
  slot: string;
  installedPluginId: string;
  incomingPluginId: string;
  reason?: string;
}

export interface ConflictCheckResult {
  ok: boolean;
  hits: ConflictHit[];
}
