/**
 * FILE: packages/@rns/core/contracts/offline.ts
 * PURPOSE: Offline/outbox/sync contracts with noop defaults (no background work without plugin)
 * OWNERSHIP: CORE
 * 
 * PLUGIN-FREE GUARANTEE:
 * - Pure TypeScript interfaces and noop implementations
 * - No background sync, no queue processing
 * - Plugins can provide real implementations but must NOT modify this file
 */

/**
 * Outbox entry (queued mutation)
 */
export interface OutboxEntry {
  id: string;
  operation: string;
  payload: unknown;
  timestamp: number;
  retries: number;
  maxRetries?: number;
}

/**
 * Sync status
 */
export interface SyncStatus {
  isSyncing: boolean;
  lastSyncAt?: number;
  pendingCount: number;
  failedCount: number;
}

/**
 * Outbox interface (queue for offline mutations)
 */
export interface Outbox {
  enqueue(operation: string, payload: unknown): Promise<string>;
  dequeue(): Promise<OutboxEntry | null>;
  remove(id: string): Promise<void>;
  getAll(): Promise<OutboxEntry[]>;
  clear(): Promise<void>;
  getStatus(): Promise<SyncStatus>;
}

/**
 * Sync engine interface
 */
export interface SyncEngine {
  sync(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  getStatus(): Promise<SyncStatus>;
}

/**
 * Noop outbox implementation (safe default)
 * No actual queuing, all operations are no-ops
 */
class NoopOutbox implements Outbox {
  async enqueue(_operation: string, _payload: unknown): Promise<string> {
    return 'noop-id';
  }

  async dequeue(): Promise<OutboxEntry | null> {
    return null;
  }

  async remove(_id: string): Promise<void> {
    // No-op
  }

  async getAll(): Promise<OutboxEntry[]> {
    return [];
  }

  async clear(): Promise<void> {
    // No-op
  }

  async getStatus(): Promise<SyncStatus> {
    return {
      isSyncing: false,
      pendingCount: 0,
      failedCount: 0,
    };
  }
}

/**
 * Noop sync engine implementation (safe default)
 * No background sync, no processing
 */
class NoopSyncEngine implements SyncEngine {
  async sync(): Promise<void> {
    // No-op
  }

  async start(): Promise<void> {
    // No-op
  }

  async stop(): Promise<void> {
    // No-op
  }

  async getStatus(): Promise<SyncStatus> {
    return {
      isSyncing: false,
      pendingCount: 0,
      failedCount: 0,
    };
  }
}

/**
 * Default offline instances (noop, can be replaced via plugins)
 */
export const outbox: Outbox = new NoopOutbox();
export const syncEngine: SyncEngine = new NoopSyncEngine();

