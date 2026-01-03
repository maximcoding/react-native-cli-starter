/**
 * FILE: src/lib/core-contracts.ts
 * PURPOSE: Generate CORE contracts with safe defaults for packages/@rns/core
 * OWNERSHIP: CLI
 */

import { writeTextFile, ensureDir } from './fs';
import { join } from 'path';
import { InitInputs } from './init';

/**
 * Generates CORE contract files for packages/@rns/core
 */
export function generateCoreContracts(coreDir: string, inputs: InitInputs): void {
  const ext = inputs.language === 'ts' ? 'ts' : 'js';
  
  // Generate logging contract
  writeLoggingContract(coreDir, ext);
  
  // Generate error contract
  writeErrorContract(coreDir, ext);
  
  // Generate storage contracts
  writeStorageContracts(coreDir, ext);
  
  // Generate network contract
  writeNetworkContract(coreDir, ext);
  
  // Generate transport contracts
  writeTransportContracts(coreDir, ext);
  
  // Generate offline contracts
  writeOfflineContracts(coreDir, ext);
  
  // Update core index.ts to export all contracts
  updateCoreIndex(coreDir, ext);
}

function writeLoggingContract(coreDir: string, ext: string): void {
  const content = ext === 'ts' ? `/**
 * FILE: packages/@rns/core/contracts/logging.ts
 * PURPOSE: Stable logger API + default console implementation
 * OWNERSHIP: CORE
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/**
 * Default console-based logger implementation (safe default, no plugin deps)
 */
class ConsoleLogger implements Logger {
  private enabled: boolean;

  constructor(enabled: boolean = __DEV__) {
    this.enabled = enabled;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.enabled) {
      console.debug('[DEBUG] ' + message, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.enabled) {
      console.info('[INFO] ' + message, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.enabled) {
      console.warn('[WARN] ' + message, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.enabled) {
      console.error('[ERROR] ' + message, ...args);
    }
  }
}

/**
 * Default logger instance (can be replaced by plugins)
 */
export const logger: Logger = new ConsoleLogger();
` : `/**
 * FILE: packages/@rns/core/contracts/logging.js
 * PURPOSE: Stable logger API + default console implementation
 * OWNERSHIP: CORE
 */

/**
 * Default logger instance (can be replaced by plugins)
 */
export const logger = {
  debug(message, ...args) {
    if (__DEV__) {
      console.debug('[DEBUG] ' + message, ...args);
    }
  },

  info(message, ...args) {
    if (__DEV__) {
      console.info('[INFO] ' + message, ...args);
    }
  },

  warn(message, ...args) {
    if (__DEV__) {
      console.warn('[WARN] ' + message, ...args);
    }
  },

  error(message, ...args) {
    if (__DEV__) {
      console.error('[ERROR] ' + message, ...args);
    }
  },
};
`;
  
  writeTextFile(join(coreDir, 'contracts', `logging.${ext}`), content);
}

function writeErrorContract(coreDir: string, ext: string): void {
  const content = ext === 'ts' ? `/**
 * FILE: packages/@rns/core/contracts/error.ts
 * PURPOSE: Error normalization contract + safe default normalizer
 * OWNERSHIP: CORE
 */

export type NormalizedError = {
  code: string | null;
  message: string;
  status?: number;
  raw: unknown;
};

/**
 * Normalizes ANY error shape to consistent NormalizedError.
 * Safe default implementation (plugin-free).
 */
export function normalizeError(error: unknown): NormalizedError {
  // Already normalized
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    'code' in error &&
    'raw' in error
  ) {
    return error as NormalizedError;
  }

  // String thrown
  if (typeof error === 'string') {
    const offline = error.startsWith('Offline:') || error === 'Offline';
    return {
      code: offline ? 'NETWORK_OFFLINE' : null,
      message: offline ? 'No internet connection' : error,
      raw: error,
    };
  }

  // Native JS Error
  if (error instanceof Error) {
    const e: any = error;
    
    // Offline detection
    const code = e?.code;
    const msg = typeof e?.message === 'string' ? e.message : '';
    const isOffline =
      code === 'NETWORK_OFFLINE' ||
      msg.startsWith('Offline:') ||
      msg === 'Network Error' ||
      msg === 'Failed to fetch' ||
      (e?.isAxiosError && !e?.response);

    if (isOffline) {
      return {
        code: 'NETWORK_OFFLINE',
        message: 'No internet connection',
        raw: error,
      };
    }

    return {
      code: e?.code ?? e?.response?.data?.code ?? null,
      message: e?.message ?? 'Unknown error',
      status: e?.response?.status,
      raw: error,
    };
  }

  // Unknown object
  const e: any = error ?? {};
  const msg = typeof e?.message === 'string' ? e.message : '';
  const isOffline = msg.startsWith('Offline:') || msg === 'Network Error';

  return {
    code: e?.code ?? null,
    message: msg || 'Unknown error',
    status: e?.response?.status,
    raw: error,
  };
}
` : `/**
 * FILE: packages/@rns/core/contracts/error.js
 * PURPOSE: Error normalization contract + safe default normalizer
 * OWNERSHIP: CORE
 */

/**
 * Normalizes ANY error shape to consistent NormalizedError.
 * Safe default implementation (plugin-free).
 */
export function normalizeError(error) {
  // Already normalized
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    'code' in error &&
    'raw' in error
  ) {
    return error;
  }

  // String thrown
  if (typeof error === 'string') {
    const offline = error.startsWith('Offline:') || error === 'Offline';
    return {
      code: offline ? 'NETWORK_OFFLINE' : null,
      message: offline ? 'No internet connection' : error,
      raw: error,
    };
  }

  // Native JS Error
  if (error instanceof Error) {
    const e = error;
    
    // Offline detection
    const code = e?.code;
    const msg = typeof e?.message === 'string' ? e.message : '';
    const isOffline =
      code === 'NETWORK_OFFLINE' ||
      msg.startsWith('Offline:') ||
      msg === 'Network Error' ||
      msg === 'Failed to fetch' ||
      (e?.isAxiosError && !e?.response);

    if (isOffline) {
      return {
        code: 'NETWORK_OFFLINE',
        message: 'No internet connection',
        raw: error,
      };
    }

    return {
      code: e?.code ?? e?.response?.data?.code ?? null,
      message: e?.message ?? 'Unknown error',
      status: e?.response?.status,
      raw: error,
    };
  }

  // Unknown object
  const e = error ?? {};
  const msg = typeof e?.message === 'string' ? e.message : '';
  const isOffline = msg.startsWith('Offline:') || msg === 'Network Error';

  return {
    code: e?.code ?? null,
    message: msg || 'Unknown error',
    status: e?.response?.status,
    raw: error,
  };
}
`;
  
  writeTextFile(join(coreDir, 'contracts', `error.${ext}`), content);
}

function writeStorageContracts(coreDir: string, ext: string): void {
  const kvContent = ext === 'ts' ? `/**
 * FILE: packages/@rns/core/contracts/storage-kv.ts
 * PURPOSE: Key-value storage API with memory fallback default
 * OWNERSHIP: CORE
 */

export interface KeyValueStorage {
  getString(key: string): string | null;
  setString(key: string, value: string): void;
  delete(key: string): void;
  clearAll(): void;
}

/**
 * Default in-memory storage implementation (safe default, no plugin deps)
 */
class MemoryKeyValueStorage implements KeyValueStorage {
  private memory: Map<string, string> = new Map();

  getString(key: string): string | null {
    return this.memory.has(key) ? this.memory.get(key)! : null;
  }

  setString(key: string, value: string): void {
    this.memory.set(key, value);
  }

  delete(key: string): void {
    this.memory.delete(key);
  }

  clearAll(): void {
    this.memory.clear();
  }
}

/**
 * Default storage instance (can be replaced by plugins with MMKV/Keychain)
 */
export const kvStorage: KeyValueStorage = new MemoryKeyValueStorage();
` : `/**
 * FILE: packages/@rns/core/contracts/storage-kv.js
 * PURPOSE: Key-value storage API with memory fallback default
 * OWNERSHIP: CORE
 */

/**
 * Default storage instance (can be replaced by plugins with MMKV/Keychain)
 */
const memory = new Map();

export const kvStorage = {
  getString(key) {
    return memory.has(key) ? memory.get(key) : null;
  },

  setString(key, value) {
    memory.set(key, value);
  },

  delete(key) {
    memory.delete(key);
  },

  clearAll() {
    memory.clear();
  },
};
`;

  const cacheContent = ext === 'ts' ? `/**
 * FILE: packages/@rns/core/contracts/storage-cache.ts
 * PURPOSE: Cache engine API with memory fallback default
 * OWNERSHIP: CORE
 */

type CacheValue = unknown;

/**
 * Cache engine interface
 */
export interface CacheEngine {
  setSnapshot(key: string, value: CacheValue): void;
  getSnapshot<T>(key: string): T | undefined;
  removeSnapshot(key: string): void;
  clear(): void;
}

/**
 * Default in-memory cache implementation (safe default, no plugin deps)
 */
class MemoryCacheEngine implements CacheEngine {
  private cache: Map<string, CacheValue> = new Map();

  setSnapshot(key: string, value: CacheValue): void {
    this.cache.set(key, value);
  }

  getSnapshot<T>(key: string): T | undefined {
    return this.cache.get(key) as T | undefined;
  }

  removeSnapshot(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Default cache engine instance (can be replaced by plugins with persistent storage)
 */
export const cacheEngine: CacheEngine = new MemoryCacheEngine();
` : `/**
 * FILE: packages/@rns/core/contracts/storage-cache.js
 * PURPOSE: Cache engine API with memory fallback default
 * OWNERSHIP: CORE
 */

/**
 * Default cache engine instance (can be replaced by plugins with persistent storage)
 */
const cache = new Map();

export const cacheEngine = {
  setSnapshot(key, value) {
    cache.set(key, value);
  },

  getSnapshot(key) {
    return cache.get(key);
  },

  removeSnapshot(key) {
    cache.delete(key);
  },

  clear() {
    cache.clear();
  },
};
`;
  
  writeTextFile(join(coreDir, 'contracts', `storage-kv.${ext}`), kvContent);
  writeTextFile(join(coreDir, 'contracts', `storage-cache.${ext}`), cacheContent);
}

function writeNetworkContract(coreDir: string, ext: string): void {
  const content = ext === 'ts' ? `/**
 * FILE: packages/@rns/core/contracts/network.ts
 * PURPOSE: Network connectivity API with stub default
 * OWNERSHIP: CORE
 */

type NetworkChangeListener = (offline: boolean) => void;

/**
 * Network connectivity interface
 */
export interface NetworkConnectivity {
  isOffline(): boolean;
  onNetworkChange(listener: NetworkChangeListener): () => void;
  init(): void;
}

/**
 * Default stub implementation (safe default, no plugin deps)
 * Plugins can wire real NetInfo if installed
 */
class StubNetworkConnectivity implements NetworkConnectivity {
  private offline: boolean = false;
  private listeners: NetworkChangeListener[] = [];

  isOffline(): boolean {
    return this.offline;
  }

  onNetworkChange(listener: NetworkChangeListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  init(): void {
    // Stub: no-op. Plugins can override to wire real NetInfo
  }

  // Internal method for plugins to update state
  _setOffline(offline: boolean): void {
    if (this.offline !== offline) {
      this.offline = offline;
      this.listeners.forEach((listener) => listener(offline));
    }
  }
}

/**
 * Default network connectivity instance (can be replaced by plugins)
 */
export const networkConnectivity: NetworkConnectivity = new StubNetworkConnectivity();
` : `/**
 * FILE: packages/@rns/core/contracts/network.js
 * PURPOSE: Network connectivity API with stub default
 * OWNERSHIP: CORE
 */

/**
 * Default network connectivity instance (can be replaced by plugins)
 */
let offline = false;
const listeners = [];

export const networkConnectivity = {
  isOffline() {
    return offline;
  },

  onNetworkChange(listener) {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) listeners.splice(index, 1);
    };
  },

  init() {
    // Stub: no-op. Plugins can override to wire real NetInfo
  },
};
`;
  
  writeTextFile(join(coreDir, 'contracts', `network.${ext}`), content);
}

function writeTransportContracts(coreDir: string, ext: string): void {
  const typesContent = ext === 'ts' ? `/**
 * FILE: packages/@rns/core/contracts/transport-types.ts
 * PURPOSE: Transport facade types + interfaces
 * OWNERSHIP: CORE
 */

export type Operation = string | { type: string; [key: string]: unknown };

export type TransportRequestMeta = {
  offline?: boolean;
  retry?: boolean;
  tags?: string | readonly string[];
};

/**
 * Transport interface for backend-agnostic data operations
 */
export interface Transport {
  query<TResponse = unknown, TVariables = unknown>(
    operation: Operation,
    variables?: TVariables,
    meta?: TransportRequestMeta,
  ): Promise<TResponse>;

  mutate<TResponse = unknown, TVariables = unknown>(
    operation: Operation,
    variables?: TVariables,
    meta?: TransportRequestMeta,
  ): Promise<TResponse>;

  subscribe<TData = unknown>(
    channel: string,
    handler: (data: TData) => void,
    meta?: TransportRequestMeta,
  ): () => void;

  upload<TResponse = unknown>(
    operation: Operation,
    payload: { file: unknown; extra?: Record<string, unknown> },
    meta?: TransportRequestMeta,
  ): Promise<TResponse>;
}
` : `/**
 * FILE: packages/@rns/core/contracts/transport-types.js
 * PURPOSE: Transport facade types + interfaces (JS version has no types)
 * OWNERSHIP: CORE
 */
`;

  const transportContent = ext === 'ts' ? `/**
 * FILE: packages/@rns/core/contracts/transport.ts
 * PURPOSE: Transport facade + noop adapter default
 * OWNERSHIP: CORE
 */

import type { Transport, Operation, TransportRequestMeta } from './transport-types';
import { networkConnectivity } from './network';

/**
 * Noop adapter implementation (safe default, no plugin deps)
 */
class NoopTransportAdapter implements Transport {
  async query<TResponse = unknown, TVariables = unknown>(
    operation: Operation,
    variables?: TVariables,
    meta?: TransportRequestMeta,
  ): Promise<TResponse> {
    throw new Error('Transport adapter not configured. Plugins must provide an adapter.');
  }

  async mutate<TResponse = unknown, TVariables = unknown>(
    operation: Operation,
    variables?: TVariables,
    meta?: TransportRequestMeta,
  ): Promise<TResponse> {
    throw new Error('Transport adapter not configured. Plugins must provide an adapter.');
  }

  subscribe<TData = unknown>(
    channel: string,
    handler: (data: TData) => void,
    meta?: TransportRequestMeta,
  ): () => void {
    return () => {};
  }

  async upload<TResponse = unknown>(
    operation: Operation,
    payload: { file: unknown; extra?: Record<string, unknown> },
    meta?: TransportRequestMeta,
  ): Promise<TResponse> {
    throw new Error('Transport adapter not configured. Plugins must provide an adapter.');
  }
}

/**
 * Transport wrapper that handles offline mode and delegates to adapter
 */
class TransportWrapper implements Transport {
  private adapter: Transport;

  constructor(adapter: Transport) {
    this.adapter = adapter;
  }

  setAdapter(adapter: Transport): void {
    this.adapter = adapter;
  }

  async query<TResponse = unknown, TVariables = unknown>(
    operation: Operation,
    variables?: TVariables,
    meta?: TransportRequestMeta,
  ): Promise<TResponse> {
    if (networkConnectivity.isOffline()) {
      const err: any = new Error('Offline: query is not available');
      err.code = 'NETWORK_OFFLINE';
      throw err;
    }
    return this.adapter.query<TResponse, TVariables>(operation, variables, meta);
  }

  async mutate<TResponse = unknown, TVariables = unknown>(
    operation: Operation,
    variables?: TVariables,
    meta?: TransportRequestMeta,
  ): Promise<TResponse> {
    if (networkConnectivity.isOffline()) {
      // In offline mode, mutations should be queued (handled by offline contracts)
      // For now, throw error - plugins can wire offline queue
      const err: any = new Error('Offline: mutation is not available');
      err.code = 'NETWORK_OFFLINE';
      throw err;
    }
    return this.adapter.mutate<TResponse, TVariables>(operation, variables, meta);
  }

  subscribe<TData = unknown>(
    channel: string,
    handler: (data: TData) => void,
    meta?: TransportRequestMeta,
  ): () => void {
    if (networkConnectivity.isOffline()) {
      return () => {};
    }
    return this.adapter.subscribe<TData>(channel, handler, meta);
  }

  async upload<TResponse = unknown>(
    operation: Operation,
    payload: { file: unknown; extra?: Record<string, unknown> },
    meta?: TransportRequestMeta,
  ): Promise<TResponse> {
    if (networkConnectivity.isOffline()) {
      const err: any = new Error('Offline: upload is not available');
      err.code = 'NETWORK_OFFLINE';
      throw err;
    }
    return this.adapter.upload<TResponse>(operation, payload, meta);
  }
}

const noopAdapter = new NoopTransportAdapter();
const transportWrapper = new TransportWrapper(noopAdapter);

/**
 * Default transport instance (can be configured by plugins)
 */
export const transport = transportWrapper;

/**
 * Set the active transport adapter (called by plugins)
 */
export function setTransport(adapter: Transport): void {
  transportWrapper.setAdapter(adapter);
}
` : `/**
 * FILE: packages/@rns/core/contracts/transport.js
 * PURPOSE: Transport facade + noop adapter default
 * OWNERSHIP: CORE
 */

import { networkConnectivity } from './network';

/**
 * Noop adapter implementation (safe default, no plugin deps)
 */
class NoopTransportAdapter {
  async query(operation, variables, meta) {
    throw new Error('Transport adapter not configured. Plugins must provide an adapter.');
  }

  async mutate(operation, variables, meta) {
    throw new Error('Transport adapter not configured. Plugins must provide an adapter.');
  }

  subscribe(channel, handler, meta) {
    return () => {};
  }

  async upload(operation, payload, meta) {
    throw new Error('Transport adapter not configured. Plugins must provide an adapter.');
  }
}

/**
 * Transport wrapper that handles offline mode and delegates to adapter
 */
class TransportWrapper {
  constructor(adapter) {
    this.adapter = adapter;
  }

  setAdapter(adapter) {
    this.adapter = adapter;
  }

  async query(operation, variables, meta) {
    if (networkConnectivity.isOffline()) {
      const err = new Error('Offline: query is not available');
      err.code = 'NETWORK_OFFLINE';
      throw err;
    }
    return this.adapter.query(operation, variables, meta);
  }

  async mutate(operation, variables, meta) {
    if (networkConnectivity.isOffline()) {
      const err = new Error('Offline: mutation is not available');
      err.code = 'NETWORK_OFFLINE';
      throw err;
    }
    return this.adapter.mutate(operation, variables, meta);
  }

  subscribe(channel, handler, meta) {
    if (networkConnectivity.isOffline()) {
      return () => {};
    }
    return this.adapter.subscribe(channel, handler, meta);
  }

  async upload(operation, payload, meta) {
    if (networkConnectivity.isOffline()) {
      const err = new Error('Offline: upload is not available');
      err.code = 'NETWORK_OFFLINE';
      throw err;
    }
    return this.adapter.upload(operation, payload, meta);
  }
}

const noopAdapter = new NoopTransportAdapter();
const transportWrapper = new TransportWrapper(noopAdapter);

/**
 * Default transport instance (can be configured by plugins)
 */
export const transport = transportWrapper;

/**
 * Set the active transport adapter (called by plugins)
 */
export function setTransport(adapter) {
  transportWrapper.setAdapter(adapter);
}
`;
  
  writeTextFile(join(coreDir, 'contracts', `transport-types.${ext}`), typesContent);
  writeTextFile(join(coreDir, 'contracts', `transport.${ext}`), transportContent);
}

function writeOfflineContracts(coreDir: string, ext: string): void {
  const queueContent = ext === 'ts' ? `/**
 * FILE: packages/@rns/core/contracts/offline-queue.ts
 * PURPOSE: Offline queue contract with noop default
 * OWNERSHIP: CORE
 */

import type { Operation } from './transport-types';

export interface OfflineMutation {
  id: string;
  operation: Operation;
  variables: unknown;
  createdAt: number;
  tags?: string[];
}

/**
 * Offline queue interface
 */
export interface OfflineQueue {
  push(operation: Operation, variables: unknown, tags?: readonly string[]): void;
  getAll(): OfflineMutation[];
  remove(id: string): void;
  clear(): void;
}

/**
 * Default in-memory queue implementation (safe default, no plugin deps)
 */
class MemoryOfflineQueue implements OfflineQueue {
  private queue: OfflineMutation[] = [];

  push(operation: Operation, variables: unknown, tags?: readonly string[]): void {
    this.queue.push({
      id: Math.random().toString(36).slice(2),
      operation,
      variables,
      createdAt: Date.now(),
      tags: tags ? [...tags] : undefined,
    });
  }

  getAll(): OfflineMutation[] {
    return [...this.queue];
  }

  remove(id: string): void {
    const index = this.queue.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
  }

  clear(): void {
    this.queue.length = 0;
  }
}

/**
 * Default offline queue instance (can be replaced by plugins with persistent storage)
 */
export const offlineQueue: OfflineQueue = new MemoryOfflineQueue();
` : `/**
 * FILE: packages/@rns/core/contracts/offline-queue.js
 * PURPOSE: Offline queue contract with noop default
 * OWNERSHIP: CORE
 */

/**
 * Default offline queue instance (can be replaced by plugins with persistent storage)
 */
const queue = [];

export const offlineQueue = {
  push(operation, variables, tags) {
    queue.push({
      id: Math.random().toString(36).slice(2),
      operation,
      variables,
      createdAt: Date.now(),
      tags: tags ? [...tags] : undefined,
    });
  },

  getAll() {
    return [...queue];
  },

  remove(id) {
    const index = queue.findIndex((item) => item.id === id);
    if (index !== -1) {
      queue.splice(index, 1);
    }
  },

  clear() {
    queue.length = 0;
  },
};
`;

  const syncContent = ext === 'ts' ? `/**
 * FILE: packages/@rns/core/contracts/sync-engine.ts
 * PURPOSE: Sync engine contract with noop default
 * OWNERSHIP: CORE
 */

import { offlineQueue } from './offline-queue';
import { transport } from './transport';

/**
 * Sync engine interface for offline → online synchronization
 */
export interface SyncEngine {
  replayOfflineMutations(): Promise<void>;
  onConnected(): Promise<void>;
}

/**
 * Default sync engine implementation (safe default, noop without plugin wiring)
 */
class DefaultSyncEngine implements SyncEngine {
  async replayOfflineMutations(): Promise<void> {
    const items = offlineQueue.getAll();
    
    for (const item of items) {
      try {
        await transport.mutate(item.operation, item.variables);
        offlineQueue.remove(item.id);
      } catch {
        // Stop on first failure
        return;
      }
    }
  }

  async onConnected(): Promise<void> {
    await this.replayOfflineMutations();
  }
}

/**
 * Default sync engine instance (can be enhanced by plugins)
 */
export const syncEngine: SyncEngine = new DefaultSyncEngine();
` : `/**
 * FILE: packages/@rns/core/contracts/sync-engine.js
 * PURPOSE: Sync engine contract with noop default
 * OWNERSHIP: CORE
 */

import { offlineQueue } from './offline-queue';
import { transport } from './transport';

/**
 * Default sync engine instance (can be enhanced by plugins)
 */
export const syncEngine = {
  async replayOfflineMutations() {
    const items = offlineQueue.getAll();
    
    for (const item of items) {
      try {
        await transport.mutate(item.operation, item.variables);
        offlineQueue.remove(item.id);
      } catch {
        // Stop on first failure
        return;
      }
    }
  },

  async onConnected() {
    await this.replayOfflineMutations();
  },
};
`;
  
  writeTextFile(join(coreDir, 'contracts', `offline-queue.${ext}`), queueContent);
  writeTextFile(join(coreDir, 'contracts', `sync-engine.${ext}`), syncContent);
}

function updateCoreIndex(coreDir: string, ext: string): void {
  const content = ext === 'ts' ? `/**
 * FILE: packages/@rns/core/index.ts
 * PURPOSE: CORE contracts and safe defaults (plugin-free)
 * OWNERSHIP: CORE
 */

// Logging
export { logger, type Logger, type LogLevel } from './contracts/logging';

// Error
export { normalizeError, type NormalizedError } from './contracts/error';

// Storage
export { kvStorage, type KeyValueStorage } from './contracts/storage-kv';
export { cacheEngine, type CacheEngine } from './contracts/storage-cache';

// Network
export { networkConnectivity, type NetworkConnectivity } from './contracts/network';

// Transport
export {
  transport,
  setTransport,
  type Transport,
  type Operation,
  type TransportRequestMeta,
} from './contracts/transport';

// Offline
export { offlineQueue, type OfflineQueue, type OfflineMutation } from './contracts/offline-queue';
export { syncEngine, type SyncEngine } from './contracts/sync-engine';
` : `/**
 * FILE: packages/@rns/core/index.js
 * PURPOSE: CORE contracts and safe defaults (plugin-free)
 * OWNERSHIP: CORE
 */

// Logging
export { logger } from './contracts/logging';

// Error
export { normalizeError } from './contracts/error';

// Storage
export { kvStorage } from './contracts/storage-kv';
export { cacheEngine } from './contracts/storage-cache';

// Network
export { networkConnectivity } from './contracts/network';

// Transport
export { transport, setTransport } from './contracts/transport';

// Offline
export { offlineQueue } from './contracts/offline-queue';
export { syncEngine } from './contracts/sync-engine';
`;
  
  writeTextFile(join(coreDir, `index.${ext}`), content);
}

