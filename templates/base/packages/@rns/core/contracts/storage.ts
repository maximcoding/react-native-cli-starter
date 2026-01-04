/**
 * FILE: packages/@rns/core/contracts/storage.ts
 * PURPOSE: Storage (kv + cache engine) APIs with memory fallback default
 * OWNERSHIP: CORE
 * 
 * PLUGIN-FREE GUARANTEE:
 * - Pure TypeScript interfaces and memory-based implementations
 * - No external storage dependencies (MMKV, AsyncStorage, etc.)
 * - Plugins can replace implementations but must NOT modify this file
 */

/**
 * Key-value storage interface
 */
export interface KeyValueStorage {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
}

/**
 * Cache engine interface
 */
export interface CacheEngine {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T, ttl?: number): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

/**
 * Memory-based key-value storage (safe default)
 * Data is lost on app restart
 */
class MemoryKeyValueStorage implements KeyValueStorage {
  private storage = new Map<string, unknown>();

  async get<T = unknown>(key: string): Promise<T | null> {
    const value = this.storage.get(key);
    return (value as T) ?? null;
  }

  async set<T = unknown>(key: string, value: T): Promise<void> {
    this.storage.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }

  async getAllKeys(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }
}

/**
 * Memory-based cache engine (safe default)
 * Data is lost on app restart, TTL is not enforced
 */
class MemoryCacheEngine implements CacheEngine {
  private cache = new Map<string, { value: unknown; expires?: number }>();

  async get<T = unknown>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check TTL if set
    if (entry.expires && Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return (entry.value as T) ?? null;
  }

  async set<T = unknown>(key: string, value: T, ttl?: number): Promise<void> {
    const expires = ttl ? Date.now() + ttl * 1000 : undefined;
    this.cache.set(key, { value, expires });
  }

  async remove(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    // Check TTL if set
    if (entry.expires && Date.now() > entry.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

/**
 * Default storage instances (memory-based, can be replaced via plugins)
 */
export const kvStorage: KeyValueStorage = new MemoryKeyValueStorage();
export const cacheEngine: CacheEngine = new MemoryCacheEngine();

