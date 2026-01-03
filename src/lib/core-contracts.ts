/**
 * FILE: src/lib/core-contracts.ts
 * PURPOSE: Generate CORE contracts with safe defaults during init
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { writeTextFile, ensureDir } from './fs';
import type { InitInputs } from './init';

/**
 * Generates CORE contracts with safe defaults in packages/@rns/core
 * All contracts are plugin-free and provide noop/memory fallback implementations
 */
export function generateCoreContracts(coreDir: string, inputs: InitInputs): void {
  const ext = inputs.language === 'ts' ? 'ts' : 'js';
  const contractsDir = join(coreDir, 'contracts');
  ensureDir(contractsDir);

  // Logging contract
  const loggingContent = generateLoggingContract(ext);
  writeTextFile(join(contractsDir, `logging.${ext}`), loggingContent);

  // Error normalization contract
  const errorContent = generateErrorContract(ext);
  writeTextFile(join(contractsDir, `error.${ext}`), errorContent);

  // Storage contracts (kv + cache)
  const storageDir = join(contractsDir, 'storage');
  ensureDir(storageDir);
  const kvStorageContent = generateKvStorageContract(ext);
  const cacheEngineContent = generateCacheEngineContract(ext);
  writeTextFile(join(storageDir, `kv-storage.${ext}`), kvStorageContent);
  writeTextFile(join(storageDir, `cache-engine.${ext}`), cacheEngineContent);

  // Network contract
  const networkContent = generateNetworkContract(ext);
  writeTextFile(join(contractsDir, `network.${ext}`), networkContent);

  // Transport contract
  const transportDir = join(contractsDir, 'transport');
  ensureDir(transportDir);
  const transportTypesContent = generateTransportTypesContract(ext);
  const transportContent = generateTransportContract(ext);
  writeTextFile(join(transportDir, `types.${ext}`), transportTypesContent);
  writeTextFile(join(transportDir, `transport.${ext}`), transportContent);

  // Offline contracts
  const offlineDir = join(contractsDir, 'offline');
  ensureDir(offlineDir);
  const offlineQueueContent = generateOfflineQueueContract(ext);
  const syncEngineContent = generateSyncEngineContract(ext);
  writeTextFile(join(offlineDir, `offline-queue.${ext}`), offlineQueueContent);
  writeTextFile(join(offlineDir, `sync-engine.${ext}`), syncEngineContent);

  // Update main index.ts to export all contracts
  const indexContent = generateContractsIndex(ext);
  writeTextFile(join(contractsDir, `index.${ext}`), indexContent);
}

function generateLoggingContract(ext: 'ts' | 'js'): string {
  if (ext === 'ts') {
    return `/**
 * FILE: packages/@rns/core/contracts/logging.ts
 * PURPOSE: Stable logger API + default console implementation
 * OWNERSHIP: CORE
 */

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/**
 * Default console-based logger implementation
 */
class ConsoleLogger implements Logger {
  debug(message: string, ...args: unknown[]): void {
    if (__DEV__) {
      console.log('[DEBUG]', message, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    console.info('[INFO]', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn('[WARN]', message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error('[ERROR]', message, ...args);
  }
}

/**
 * Default logger instance (safe default, can be replaced via plugins)
 */
export const logger: Logger = new ConsoleLogger();
`;
  } else {
    return `/**
 * FILE: packages/@rns/core/contracts/logging.js
 * PURPOSE: Stable logger API + default console implementation
 * OWNERSHIP: CORE
 */

class ConsoleLogger {
  debug(message, ...args) {
    if (__DEV__) {
      console.log('[DEBUG]', message, ...args);
    }
  }

  info(message, ...args) {
    console.info('[INFO]', message, ...args);
  }

  warn(message, ...args) {
    console.warn('[WARN]', message, ...args);
  }

  error(message, ...args) {
    console.error('[ERROR]', message, ...args);
  }
}

/**
 * Default logger instance (safe default, can be replaced via plugins)
 */
export const logger = new ConsoleLogger();
`;
  }
}

function generateErrorContract(ext: 'ts' | 'js'): string {
  if (ext === 'ts') {
    return `/**
 * FILE: packages/@rns/core/contracts/error.ts
 * PURPOSE: Error normalization contract + safe default normalizer
 * OWNERSHIP: CORE
 */

export interface NormalizedError {
  code: string | null;
  message: string;
  status?: number;
  raw: unknown;
}

function isNormalizedError(x: any): x is NormalizedError {
  return (
    x &&
    typeof x === 'object' &&
    typeof x.message === 'string' &&
    'raw' in x &&
    'code' in x
  );
}

function extractMessage(e: any): string {
  if (Array.isArray(e?.graphQLErrors) && e.graphQLErrors.length > 0) {
    return e.graphQLErrors[0].message ?? 'GraphQL error';
  }

  if (e?.response?.data?.message) return e.response.data.message;
  if (e?.response?.data?.error) return e.response.data.error;

  if (e?.errors && Array.isArray(e.errors)) {
    return e.errors.map((z: any) => z.message).join(', ');
  }

  if (e?.message && typeof e.message === 'string') return e.message;

  return e?.message ?? 'Unknown error';
}

function extractCode(e: any): string | null {
  return (
    e?.code ??
    e?.response?.data?.code ??
    e?.graphQLErrors?.[0]?.extensions?.code ??
    null
  );
}

function extractStatus(e: any): number | undefined {
  return e?.response?.status;
}

function isOfflineErrorLike(e: any): boolean {
  const code = e?.code;
  const msg = typeof e?.message === 'string' ? e.message : '';

  if (code === 'NETWORK_OFFLINE') return true;
  if (msg.startsWith('Offline:')) return true;
  if (msg === 'Network Error' || msg === 'Failed to fetch') return true;
  if (e?.isAxiosError && !e?.response) return true;

  return false;
}

/**
 * Normalize ANY error shape to consistent NormalizedError
 */
export function normalizeError(error: unknown): NormalizedError {
  if (isNormalizedError(error)) return error;

  if (typeof error === 'string') {
    const offline = error.startsWith('Offline:') || error === 'Offline';
    return {
      code: offline ? 'NETWORK_OFFLINE' : null,
      message: offline ? 'No internet connection' : error,
      raw: error,
    };
  }

  if (error instanceof Error) {
    const e: any = error;

    if (isOfflineErrorLike(e)) {
      return {
        code: 'NETWORK_OFFLINE',
        message: 'No internet connection',
        raw: error,
      };
    }

    return {
      code: extractCode(e),
      message: extractMessage(e),
      status: extractStatus(e),
      raw: error,
    };
  }

  const e: any = error ?? {};

  if (isOfflineErrorLike(e)) {
    return {
      code: 'NETWORK_OFFLINE',
      message: 'No internet connection',
      raw: error,
    };
  }

  return {
    code: extractCode(e),
    message: extractMessage(e),
    status: extractStatus(e),
    raw: error,
  };
}
`;
  } else {
    return `/**
 * FILE: packages/@rns/core/contracts/error.js
 * PURPOSE: Error normalization contract + safe default normalizer
 * OWNERSHIP: CORE
 */

function isNormalizedError(x) {
  return (
    x &&
    typeof x === 'object' &&
    typeof x.message === 'string' &&
    'raw' in x &&
    'code' in x
  );
}

function extractMessage(e) {
  if (Array.isArray(e?.graphQLErrors) && e.graphQLErrors.length > 0) {
    return e.graphQLErrors[0].message ?? 'GraphQL error';
  }

  if (e?.response?.data?.message) return e.response.data.message;
  if (e?.response?.data?.error) return e.response.data.error;

  if (e?.errors && Array.isArray(e.errors)) {
    return e.errors.map(z => z.message).join(', ');
  }

  if (e?.message && typeof e.message === 'string') return e.message;

  return e?.message ?? 'Unknown error';
}

function extractCode(e) {
  return (
    e?.code ??
    e?.response?.data?.code ??
    e?.graphQLErrors?.[0]?.extensions?.code ??
    null
  );
}

function extractStatus(e) {
  return e?.response?.status;
}

function isOfflineErrorLike(e) {
  const code = e?.code;
  const msg = typeof e?.message === 'string' ? e.message : '';

  if (code === 'NETWORK_OFFLINE') return true;
  if (msg.startsWith('Offline:')) return true;
  if (msg === 'Network Error' || msg === 'Failed to fetch') return true;
  if (e?.isAxiosError && !e?.response) return true;

  return false;
}

/**
 * Normalize ANY error shape to consistent NormalizedError
 */
export function normalizeError(error) {
  if (isNormalizedError(error)) return error;

  if (typeof error === 'string') {
    const offline = error.startsWith('Offline:') || error === 'Offline';
    return {
      code: offline ? 'NETWORK_OFFLINE' : null,
      message: offline ? 'No internet connection' : error,
      raw: error,
    };
  }

  if (error instanceof Error) {
    const e = error;

    if (isOfflineErrorLike(e)) {
      return {
        code: 'NETWORK_OFFLINE',
        message: 'No internet connection',
        raw: error,
      };
    }

    return {
      code: extractCode(e),
      message: extractMessage(e),
      status: extractStatus(e),
      raw: error,
    };
  }

  const e = error ?? {};

  if (isOfflineErrorLike(e)) {
    return {
      code: 'NETWORK_OFFLINE',
      message: 'No internet connection',
      raw: error,
    };
  }

  return {
    code: extractCode(e),
    message: extractMessage(e),
    status: extractStatus(e),
    raw: error,
  };
}
`;
  }
}

function generateKvStorageContract(ext: 'ts' | 'js'): string {
  if (ext === 'ts') {
    return `/**
 * FILE: packages/@rns/core/contracts/storage/kv-storage.ts
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
 * Memory-based fallback implementation (safe default)
 * Plugins can replace this with MMKV/Keychain/etc.
 */
function createMemoryStorage(): KeyValueStorage {
  const memory = new Map<string, string>();

  return {
    getString(key: string): string | null {
      return memory.has(key) ? memory.get(key)! : null;
    },
    setString(key: string, value: string): void {
      memory.set(key, value);
    },
    delete(key: string): void {
      memory.delete(key);
    },
    clearAll(): void {
      memory.clear();
    },
  };
}

/**
 * Default storage instance (memory fallback, can be replaced via plugins)
 */
export const kvStorage: KeyValueStorage = createMemoryStorage();
`;
  } else {
    return `/**
 * FILE: packages/@rns/core/contracts/storage/kv-storage.js
 * PURPOSE: Key-value storage API with memory fallback default
 * OWNERSHIP: CORE
 */

/**
 * Memory-based fallback implementation (safe default)
 * Plugins can replace this with MMKV/Keychain/etc.
 */
function createMemoryStorage() {
  const memory = new Map();

  return {
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
}

/**
 * Default storage instance (memory fallback, can be replaced via plugins)
 */
export const kvStorage = createMemoryStorage();
`;
  }
}

function generateCacheEngineContract(ext: 'ts' | 'js'): string {
  if (ext === 'ts') {
    return `/**
 * FILE: packages/@rns/core/contracts/storage/cache-engine.ts
 * PURPOSE: Cache engine API with memory fallback default
 * OWNERSHIP: CORE
 */

type CacheValue = unknown;

const MEMORY_CACHE = new Map<string, CacheValue>();

export const cacheEngine = {
  setSnapshot(key: string, value: CacheValue): void {
    MEMORY_CACHE.set(key, value);
  },

  getSnapshot<T>(key: string): T | undefined {
    return MEMORY_CACHE.get(key) as T | undefined;
  },

  removeSnapshot(key: string): void {
    MEMORY_CACHE.delete(key);
  },

  clear(): void {
    MEMORY_CACHE.clear();
  },
};
`;
  } else {
    return `/**
 * FILE: packages/@rns/core/contracts/storage/cache-engine.js
 * PURPOSE: Cache engine API with memory fallback default
 * OWNERSHIP: CORE
 */

const MEMORY_CACHE = new Map();

export const cacheEngine = {
  setSnapshot(key, value) {
    MEMORY_CACHE.set(key, value);
  },

  getSnapshot(key) {
    return MEMORY_CACHE.get(key);
  },

  removeSnapshot(key) {
    MEMORY_CACHE.delete(key);
  },

  clear() {
    MEMORY_CACHE.clear();
  },
};
`;
  }
}

function generateNetworkContract(ext: 'ts' | 'js'): string {
  if (ext === 'ts') {
    return `/**
 * FILE: packages/@rns/core/contracts/network.ts
 * PURPOSE: Network connectivity API with stub default
 * OWNERSHIP: CORE
 */

type NetworkListener = (offline: boolean) => void;

let offline = false;
const listeners: NetworkListener[] = [];

function emit(nextOffline: boolean): void {
  offline = nextOffline;
  listeners.forEach(cb => cb(nextOffline));
}

/**
 * Check if device is currently offline (stub default - always returns false)
 */
export function isOffline(): boolean {
  return offline;
}

/**
 * Subscribe to network changes. Returns unsubscribe function.
 */
export function onNetworkChange(cb: NetworkListener): () => void {
  listeners.push(cb);
  return () => {
    const index = listeners.indexOf(cb);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

/**
 * Initialize network monitoring (stub - no-op by default)
 * Plugins can wire this to @react-native-community/netinfo
 */
export function initNetInfoBridge(): void {
  // Stub: no-op default implementation
  // Plugins will replace this with actual NetInfo integration
}
`;
  } else {
    return `/**
 * FILE: packages/@rns/core/contracts/network.js
 * PURPOSE: Network connectivity API with stub default
 * OWNERSHIP: CORE
 */

let offline = false;
const listeners = [];

function emit(nextOffline) {
  offline = nextOffline;
  listeners.forEach(cb => cb(nextOffline));
}

/**
 * Check if device is currently offline (stub default - always returns false)
 */
export function isOffline() {
  return offline;
}

/**
 * Subscribe to network changes. Returns unsubscribe function.
 */
export function onNetworkChange(cb) {
  listeners.push(cb);
  return () => {
    const index = listeners.indexOf(cb);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

/**
 * Initialize network monitoring (stub - no-op by default)
 * Plugins can wire this to @react-native-community/netinfo
 */
export function initNetInfoBridge() {
  // Stub: no-op default implementation
  // Plugins will replace this with actual NetInfo integration
}
`;
  }
}

function generateTransportTypesContract(ext: 'ts' | 'js'): string {
  if (ext === 'ts') {
    return `/**
 * FILE: packages/@rns/core/contracts/transport/types.ts
 * PURPOSE: Transport facade types
 * OWNERSHIP: CORE
 */

export type Operation = string;

export type TransportRequestMeta = {
  offline?: boolean;
  retry?: boolean;
  tags?: string | readonly string[];
};

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
`;
  } else {
    return `/**
 * FILE: packages/@rns/core/contracts/transport/types.js
 * PURPOSE: Transport facade types
 * OWNERSHIP: CORE
 */
`;
  }
}

function generateTransportContract(ext: 'ts' | 'js'): string {
  if (ext === 'ts') {
    return `/**
 * FILE: packages/@rns/core/contracts/transport/transport.ts
 * PURPOSE: Transport facade with noop adapter default
 * OWNERSHIP: CORE
 */

import type { Transport, Operation, TransportRequestMeta } from './types';
import { isOffline } from '../network';

let activeTransport: Transport | null = null;
let offline = false;

/**
 * Set the active transport adapter (noop by default)
 */
export function setTransport(adapter: Transport): void {
  activeTransport = adapter;
}

/**
 * Set offline mode
 */
export function setOfflineMode(enabled: boolean): void {
  offline = enabled;
}

/**
 * Check if offline mode is enabled
 */
export function isOfflineMode(): boolean {
  return offline;
}

/**
 * Noop adapter - safe default implementation
 */
const noopAdapter: Transport = {
  async query() {
    if (offline || isOffline()) {
      throw new Error('Offline: Cannot perform query while offline');
    }
    throw new Error('No transport adapter configured');
  },

  async mutate() {
    if (offline || isOffline()) {
      throw new Error('Offline: Cannot perform mutation while offline');
    }
    throw new Error('No transport adapter configured');
  },

  subscribe() {
    return () => {}; // no-op unsubscribe
  },

  async upload() {
    if (offline || isOffline()) {
      throw new Error('Offline: Cannot upload while offline');
    }
    throw new Error('No transport adapter configured');
  },
};

/**
 * Transport wrapper that uses active adapter or falls back to noop
 */
export const transport: Transport = {
  async query<TResponse = unknown, TVariables = unknown>(
    operation: Operation,
    variables?: TVariables,
    meta?: TransportRequestMeta,
  ): Promise<TResponse> {
    if (activeTransport) {
      return activeTransport.query(operation, variables, meta);
    }
    return noopAdapter.query(operation, variables, meta);
  },

  async mutate<TResponse = unknown, TVariables = unknown>(
    operation: Operation,
    variables?: TVariables,
    meta?: TransportRequestMeta,
  ): Promise<TResponse> {
    if (activeTransport) {
      return activeTransport.mutate(operation, variables, meta);
    }
    return noopAdapter.mutate(operation, variables, meta);
  },

  subscribe<TData = unknown>(
    channel: string,
    handler: (data: TData) => void,
    meta?: TransportRequestMeta,
  ): () => void {
    if (activeTransport) {
      return activeTransport.subscribe(channel, handler, meta);
    }
    return noopAdapter.subscribe(channel, handler, meta);
  },

  async upload<TResponse = unknown>(
    operation: Operation,
    payload: { file: unknown; extra?: Record<string, unknown> },
    meta?: TransportRequestMeta,
  ): Promise<TResponse> {
    if (activeTransport) {
      return activeTransport.upload(operation, payload, meta);
    }
    return noopAdapter.upload(operation, payload, meta);
  },
};
`;
  } else {
    return `/**
 * FILE: packages/@rns/core/contracts/transport/transport.js
 * PURPOSE: Transport facade with noop adapter default
 * OWNERSHIP: CORE
 */

import { isOffline } from '../network';

let activeTransport = null;
let offline = false;

/**
 * Set the active transport adapter (noop by default)
 */
export function setTransport(adapter) {
  activeTransport = adapter;
}

/**
 * Set offline mode
 */
export function setOfflineMode(enabled) {
  offline = enabled;
}

/**
 * Check if offline mode is enabled
 */
export function isOfflineMode() {
  return offline;
}

/**
 * Noop adapter - safe default implementation
 */
const noopAdapter = {
  async query() {
    if (offline || isOffline()) {
      throw new Error('Offline: Cannot perform query while offline');
    }
    throw new Error('No transport adapter configured');
  },

  async mutate() {
    if (offline || isOffline()) {
      throw new Error('Offline: Cannot perform mutation while offline');
    }
    throw new Error('No transport adapter configured');
  },

  subscribe() {
    return () => {}; // no-op unsubscribe
  },

  async upload() {
    if (offline || isOffline()) {
      throw new Error('Offline: Cannot upload while offline');
    }
    throw new Error('No transport adapter configured');
  },
};

/**
 * Transport wrapper that uses active adapter or falls back to noop
 */
export const transport = {
  async query(operation, variables, meta) {
    if (activeTransport) {
      return activeTransport.query(operation, variables, meta);
    }
    return noopAdapter.query(operation, variables, meta);
  },

  async mutate(operation, variables, meta) {
    if (activeTransport) {
      return activeTransport.mutate(operation, variables, meta);
    }
    return noopAdapter.mutate(operation, variables, meta);
  },

  subscribe(channel, handler, meta) {
    if (activeTransport) {
      return activeTransport.subscribe(channel, handler, meta);
    }
    return noopAdapter.subscribe(channel, handler, meta);
  },

  async upload(operation, payload, meta) {
    if (activeTransport) {
      return activeTransport.upload(operation, payload, meta);
    }
    return noopAdapter.upload(operation, payload, meta);
  },
};
`;
  }
}

function generateOfflineQueueContract(ext: 'ts' | 'js'): string {
  if (ext === 'ts') {
    return `/**
 * FILE: packages/@rns/core/contracts/offline/offline-queue.ts
 * PURPOSE: Offline queue contract with noop defaults
 * OWNERSHIP: CORE
 */

export type Operation = string;
export type Tag = string;

export interface OfflineMutation {
  id: string;
  operation: Operation;
  variables: unknown;
  createdAt: number;
  tags?: Tag[];
}

/**
 * In-memory queue (noop defaults - no persistence)
 */
const MEMORY_QUEUE: OfflineMutation[] = [];

export const offlineQueue = {
  push(operation: Operation, variables: unknown, tags?: readonly Tag[]): void {
    MEMORY_QUEUE.push({
      id: Math.random().toString(36).slice(2),
      operation,
      variables,
      createdAt: Date.now(),
      tags: tags ? [...tags] : undefined,
    });
  },

  getAll(): OfflineMutation[] {
    return [...MEMORY_QUEUE];
  },

  remove(id: string): void {
    const index = MEMORY_QUEUE.findIndex(q => q.id === id);
    if (index > -1) {
      MEMORY_QUEUE.splice(index, 1);
    }
  },

  clear(): void {
    MEMORY_QUEUE.length = 0;
  },
};
`;
  } else {
    return `/**
 * FILE: packages/@rns/core/contracts/offline/offline-queue.js
 * PURPOSE: Offline queue contract with noop defaults
 * OWNERSHIP: CORE
 */

/**
 * In-memory queue (noop defaults - no persistence)
 */
const MEMORY_QUEUE = [];

export const offlineQueue = {
  push(operation, variables, tags) {
    MEMORY_QUEUE.push({
      id: Math.random().toString(36).slice(2),
      operation,
      variables,
      createdAt: Date.now(),
      tags: tags ? [...tags] : undefined,
    });
  },

  getAll() {
    return [...MEMORY_QUEUE];
  },

  remove(id) {
    const index = MEMORY_QUEUE.findIndex(q => q.id === id);
    if (index > -1) {
      MEMORY_QUEUE.splice(index, 1);
    }
  },

  clear() {
    MEMORY_QUEUE.length = 0;
  },
};
`;
  }
}

function generateSyncEngineContract(ext: 'ts' | 'js'): string {
  if (ext === 'ts') {
    return `/**
 * FILE: packages/@rns/core/contracts/offline/sync-engine.ts
 * PURPOSE: Sync engine contract with noop defaults (no background work)
 * OWNERSHIP: CORE
 */

import { offlineQueue } from './offline-queue';
import { transport } from '../transport/transport';

/**
 * Sync engine with noop defaults (no automatic sync without plugin)
 */
export const syncEngine = {
  /**
   * Replay offline mutations (noop by default, requires plugin to wire)
   */
  async replayOfflineMutations(): Promise<void> {
    // No-op: requires plugin to implement actual replay logic
  },

  /**
   * Called when connectivity is restored (noop by default)
   */
  async onConnected(): Promise<void> {
    // No-op: requires plugin to implement actual sync logic
  },
};
`;
  } else {
    return `/**
 * FILE: packages/@rns/core/contracts/offline/sync-engine.js
 * PURPOSE: Sync engine contract with noop defaults (no background work)
 * OWNERSHIP: CORE
 */

import { offlineQueue } from './offline-queue';
import { transport } from '../transport/transport';

/**
 * Sync engine with noop defaults (no automatic sync without plugin)
 */
export const syncEngine = {
  /**
   * Replay offline mutations (noop by default, requires plugin to wire)
   */
  async replayOfflineMutations() {
    // No-op: requires plugin to implement actual replay logic
  },

  /**
   * Called when connectivity is restored (noop by default)
   */
  async onConnected() {
    // No-op: requires plugin to implement actual sync logic
  },
};
`;
  }
}

function generateContractsIndex(ext: 'ts' | 'js'): string {
  if (ext === 'ts') {
    return `/**
 * FILE: packages/@rns/core/contracts/index.ts
 * PURPOSE: Export all CORE contracts
 * OWNERSHIP: CORE
 */

export * from './logging';
export * from './error';
export * from './network';
export * from './storage/kv-storage';
export * from './storage/cache-engine';
export * from './transport/types';
export * from './transport/transport';
export * from './offline/offline-queue';
export * from './offline/sync-engine';
`;
  } else {
    return `/**
 * FILE: packages/@rns/core/contracts/index.js
 * PURPOSE: Export all CORE contracts
 * OWNERSHIP: CORE
 */

export * from './logging';
export * from './error';
export * from './network';
export * from './storage/kv-storage';
export * from './storage/cache-engine';
export * from './transport/types';
export * from './transport/transport';
export * from './offline/offline-queue';
export * from './offline/sync-engine';
`;
  }
}
