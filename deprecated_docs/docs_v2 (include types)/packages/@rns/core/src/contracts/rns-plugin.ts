/**
 * FILE: rns-plugin.ts
 * LAYER: @rns/core (contracts)
 * PURPOSE: Optional lifecycle contract that plugins/adapters may implement.
 *
 * This is NOT the CLI plugin descriptor. This is runtime code.
 * The CLI installs packages; the runtime may init/health-check adapters.
 */

export interface RnsPlugin {
  /**
   * Stable identifier for runtime modules/adapters.
   * (Often matches the plugin id, but not required.)
   */
  readonly id: string;

  /**
   * Called by @rns/runtime during bootstrap when the module is installed.
   * Must be safe to call multiple times (idempotent).
   */
  init(): Promise<void>;

  /**
   * Optional health check used by doctor tooling.
   * Return true if healthy; false otherwise.
   */
  healthCheck?(): Promise<boolean>;
}
