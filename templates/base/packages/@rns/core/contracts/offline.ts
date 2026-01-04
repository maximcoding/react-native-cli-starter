/**
 * FILE: packages/@rns/core/contracts/offline.ts
 * LAYER: CORE contracts
 * OWNERSHIP: CORE
 * ---------------------------------------------------------------------
 * PURPOSE:
 *   Queue write operations (mutations / uploads) attempted while the app
 *   is offline. When the device reconnects, sync-engine replays queued
 *   operations in FIFO order.
 *
 *   This is the CORE contract - plugin-free with noop default implementations.
 *   Plugins provide real offline queue and sync engine implementations.
 *
 * RESPONSIBILITIES:
 *   - push(operation, variables, tags?) → store new offline task.
 *   - getAll()                         → return snapshot for replay/inspection.
 *   - remove(id)                       → remove successfully replayed mutation.
 *   - clear()                          → wipe queue on logout or environment reset.
 *   - replayOfflineMutations()         → replay queued operations when online.
 *   - onConnected()                    → main entry point when connectivity restored.
 *
 * DATA-FLOW:
 *   service.mutate()
 *      → transport.mutate()
 *         → offline? → offlineQueue.push(operation, variables, tags?)
 *
 *   connectivity restored (NetInfo)
 *      → syncEngine.onConnected()
 *         → replayOfflineMutations()
 *            → transport.mutate()
 *            → (optional) invalidate by tags
 *            → offlineQueue.remove(id)
 *
 * DESIGN NOTES:
 *   - In-memory array used only for development/CORE baseline.
 *   - Replace with MMKV/SQLite for persistence (recommended via plugins).
 *
 * EXTENSION GUIDELINES:
 *   - Add retry metadata: { retryCount, lastAttempt, lastError }.
 *   - Add conflict-resolution strategies:
 *       optimistic merge, server-wins, client-wins, CRDT.
 *   - Add deduplication based on operation + payload hash.
 *   - Add TTL ("discard after X hours offline").
 *   - Add encryption if persistent storage contains sensitive data.
 *
 * THREAD SAFETY:
 *   - JS thread is single-threaded → array operations are safe.
 *   - When using SQLite/MMKV ensure atomic writes.
 * 
 * BLUEPRINT REFERENCE:
 *   - docs/ReactNativeCLITemplate/src/infra/offline/offline-queue.ts
 *   - docs/ReactNativeCLITemplate/src/infra/offline/sync-engine.ts
 * ---------------------------------------------------------------------
 */

import type { Operation } from './transport';

// Re-export Operation type for convenience
export type { Operation };

/**
 * Offline mutation entry
 */
export interface OfflineMutation {
  id: string;
  operation: Operation;
  variables: unknown;
  createdAt: number;
  tags?: string[]; // Query invalidation tags (stored as mutable copy)
}

/**
 * Offline queue interface
 */
export interface OfflineOutbox {
  /**
   * Push a new offline mutation into the FIFO queue.
   * Backward-compatible: `tags` is optional.
   */
  push(operation: Operation, variables: unknown, tags?: readonly string[]): void;

  /**
   * Get all queued mutations (snapshot for replay/inspection).
   */
  getAll(): OfflineMutation[];

  /**
   * Remove successfully replayed mutation.
   */
  remove(id: string): void;

  /**
   * Clear entire queue (logout, environment reset).
   */
  clear(): void;
}

/**
 * Sync engine interface
 */
export interface SyncEngine {
  /**
   * Replay all queued offline mutations in FIFO order.
   * Stops on first failure to avoid destructive cascading errors.
   */
  replayOfflineMutations(): Promise<void>;

  /**
   * Main entry point when connectivity is restored.
   * Replays all queued mutations.
   */
  onConnected(): Promise<void>;
}

/**
 * In-memory offline queue (safe default, plugin-free)
 * 
 * DESIGN NOTES:
 *   - In-memory array used only for development/CORE baseline.
 *   - Replace with MMKV/SQLite for persistence (recommended via plugins).
 */
class InMemoryOfflineQueue implements OfflineOutbox {
  private queue: OfflineMutation[] = [];

  push(operation: Operation, variables: unknown, tags?: readonly string[]): void {
    this.queue.push({
      id: Math.random().toString(36).slice(2),
      operation,
      variables,
      createdAt: Date.now(),
      tags: tags ? [...tags] : undefined, // ✅ copy readonly -> mutable
    });
  }

  getAll(): OfflineMutation[] {
    return [...this.queue];
  }

  remove(id: string): void {
    const index = this.queue.findIndex(q => q.id === id);
    if (index !== -1) this.queue.splice(index, 1);
  }

  clear(): void {
    this.queue.length = 0;
  }
}

/**
 * Noop sync engine (safe default, plugin-free)
 * 
 * DESIGN NOTES:
 *   - Noop implementation - does nothing (plugin-free guarantee).
 *   - Plugins provide real sync engine that replays mutations.
 *   - Real sync engine should:
 *       - Read queued mutations from offlineQueue
 *       - Re-run them (FIFO) using transport.mutate()
 *       - Remove successfully replayed entries
 *       - Stop on first failure
 *       - Invalidate React Query caches by tags (if wired)
 */
class NoopSyncEngine implements SyncEngine {
  async replayOfflineMutations(): Promise<void> {
    // No-op: plugins provide real implementation
  }

  async onConnected(): Promise<void> {
    // No-op: plugins provide real implementation
  }
}

/**
 * Default offline queue (in-memory, can be replaced via plugins)
 * 
 * WHY: Plugins need to replace this with persistent storage (MMKV/SQLite)
 * Same pattern as transport.setTransport() for consistency
 */
let activeOfflineQueue: OfflineOutbox = new InMemoryOfflineQueue();

/**
 * Default sync engine (noop, can be replaced via plugins)
 */
let activeSyncEngine: SyncEngine = new NoopSyncEngine();

/**
 * Get the active offline queue
 * Uses Proxy to allow runtime replacement by plugins (same pattern as transport)
 */
export const offlineQueue: OfflineOutbox = new Proxy({} as OfflineOutbox, {
  get(_target, prop) {
    return (activeOfflineQueue as any)[prop];
  },
});

/**
 * Get the active sync engine
 * Uses Proxy to allow runtime replacement by plugins
 */
export const syncEngine: SyncEngine = new Proxy({} as SyncEngine, {
  get(_target, prop) {
    return (activeSyncEngine as any)[prop];
  },
});

/**
 * Set the active offline queue (called by plugins)
 * Plugins can replace the default in-memory queue with persistent implementations
 * 
 * WHY THIS PATTERN:
 * - Consistent with transport.setTransport() - same approach everywhere
 * - Plugins need to swap implementations without modifying CORE
 * - Proxy pattern allows runtime replacement while keeping type safety
 */
export function setOfflineQueue(queue: OfflineOutbox): void {
  activeOfflineQueue = queue;
}

/**
 * Set the active sync engine (called by plugins)
 * Plugins can replace the default noop sync engine with real implementations
 */
export function setSyncEngine(engine: SyncEngine): void {
  activeSyncEngine = engine;
}
