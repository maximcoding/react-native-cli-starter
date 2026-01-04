/**
 * FILE: packages/@rns/core/contracts/storage.ts
 * LAYER: CORE contracts
 * OWNERSHIP: CORE
 * ---------------------------------------------------------------------
 * PURPOSE:
 *   Abstract key-value storage and cache engine contracts used as the
 *   single storage layer for the entire app (tokens, session, preferences, caches).
 *
 *   This is the CORE contract - plugin-free with in-memory default implementations.
 *   Plugins provide real storage backends (MMKV/SQLite/Keychain/etc.).
 *
 * RESPONSIBILITIES:
 *   - Provide minimal and universal key-value API.
 *   - Provide lightweight snapshot cache API.
 *   - Ensure consistent method signatures across all environments.
 *   - Hide implementation details from services and stores.
 *
 * DATA-FLOW:
 *   AuthService.login()
 *      → kvStorage.setString('token', ...)
 *
 *   transport.authInterceptor()
 *      → kvStorage.getString('token')
 *
 *   logout()
 *      → kvStorage.clearAll()
 *
 *   ONLINE:
 *     transport.query()
 *        → cacheEngine.setSnapshot()
 *        → UI reads via cacheEngine.getSnapshot()
 *
 *   OFFLINE:
 *     transport.query() throws offline
 *        → UI falls back to cacheEngine.getSnapshot()
 *
 * EXTENSION GUIDELINES:
 *   - Replace in-memory Map with:
 *       - react-native-mmkv for key-value storage
 *       - MMKV/SQLite for cache persistence
 *   - Preserve the interfaces EXACTLY.
 *   - If using encrypted MMKV, pass encryptionKey during MMKV init.
 *   - Do NOT store sensitive data in plain strings (only encrypted storage).
 *   - Implement namespace separation if needed:
 *       auth.*, session.*, cache.*, prefs.*
 *
 * SECURITY:
 *   - Storage should be encrypted on production builds.
 *   - On logout: ALWAYS clear tokens and sensitive keys.
 *
 * THREAD SAFETY:
 *   - In-memory Map is safe for RN JS thread (single-threaded).
 *   - When migrating to native storage, ensure atomic writes.
 * 
 * BLUEPRINT REFERENCE:
 *   - docs/ReactNativeCLITemplate/src/infra/storage/mmkv.ts
 *   - docs/ReactNativeCLITemplate/src/infra/storage/cache-engine.ts
 * ---------------------------------------------------------------------
 */

/**
 * Key-value storage interface
 * Used for tokens, session, preferences, etc.
 */
export interface KeyValueStorage {
  /**
   * Read a string value from storage.
   */
  getString(key: string): string | null;

  /**
   * Store a string value.
   */
  setString(key: string, value: string): void;

  /**
   * Remove a specific key.
   */
  delete(key: string): void;

  /**
   * Clear all storage (logout, hard reset).
   */
  clearAll(): void;
}

/**
 * Cache engine interface
 * Used for offline-first snapshot cache (NOT persistent by default)
 */
export interface CacheEngine {
  /**
   * Save snapshot under the provided key.
   * Keys SHOULD be namespaced (e.g., "user.profile", "feed.home", etc.)
   */
  setSnapshot(key: string, value: unknown): void;

  /**
   * Retrieve previously cached snapshot.
   * Returns undefined if nothing is cached.
   */
  getSnapshot<T>(key: string): T | undefined;

  /**
   * Remove specific snapshot entry.
   */
  removeSnapshot(key: string): void;

  /**
   * Clear entire snapshot cache.
   * Called typically on logout or environment reset.
   */
  clear(): void;
}

/**
 * In-memory key-value storage (safe default, plugin-free)
 * 
 * DESIGN NOTES:
 *   - In-memory Map used only for development/CORE baseline.
 *   - Replace with react-native-mmkv or secure storage backend in production.
 *   - Preserves the KeyValueStorage interface EXACTLY.
 * 
 * EXTENSION:
 *   - Replace `memory` Map with:
 *       import { MMKV } from 'react-native-mmkv';
 *       const mmkv = new MMKV({ id: 'app-storage' });
 *   - If using encrypted MMKV, pass encryptionKey during MMKV init.
 */
class InMemoryKeyValueStorage implements KeyValueStorage {
  private memory = new Map<string, string>();

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
 * In-memory cache engine (safe default, plugin-free)
 * 
 * DESIGN NOTES:
 *   - Lightweight offline-first snapshot cache. NOT persistent.
 *   - Used by services and query layers as a minimal data cache before
 *     integrating MMKV/SQLite-based persistence.
 *   - Designed to support:
 *       - stale-while-revalidate patterns
 *       - offline fallback
 *       - domain-level prefetching
 *       - high-level services using transport.query()
 * 
 * EXTENSION GUIDELINES:
 *   - Replace Map with MMKV/SQLite for persistence.
 *   - Add TTL per entry: { data, cachedAt, ttlMs }
 *   - Add versioning per domain: { version: schemaVersion, data }
 *   - Add "listeners" (pub/sub): cacheEngine.subscribe(key, callback)
 *   - Keep API stable — do NOT change public signatures.
 */
class InMemoryCacheEngine implements CacheEngine {
  private memory = new Map<string, unknown>();

  setSnapshot(key: string, value: unknown): void {
    this.memory.set(key, value);
  }

  getSnapshot<T>(key: string): T | undefined {
    return this.memory.get(key) as T | undefined;
  }

  removeSnapshot(key: string): void {
    this.memory.delete(key);
  }

  clear(): void {
    this.memory.clear();
  }
}

/**
 * Default key-value storage (in-memory, can be replaced via plugins)
 */
export const kvStorage: KeyValueStorage = new InMemoryKeyValueStorage();

/**
 * Default cache engine (in-memory, can be replaced via plugins)
 */
export const cacheEngine: CacheEngine = new InMemoryCacheEngine();
