/**
 * FILE: packages/@rns/plugin-state-zustand/index.ts
 * PURPOSE: Zustand state management plugin exports with persistence support
 * OWNERSHIP: Plugin (System Zone)
 * 
 * This plugin provides Zustand state management capabilities with persistence support.
 * Users can import create, store factories, and storage adapters from this package.
 */

// Re-export Zustand's core create function
export { create } from 'zustand';

// Re-export Zustand types
export type {
  StateCreator,
  StoreApi,
  UseBoundStore,
  StoreMutatorIdentifier,
} from 'zustand';

// Re-export middleware utilities
export { persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware';

// Re-export devtools middleware (if available)
// Note: @zustand/devtools requires additional setup for React Native
// Users can install it separately if needed
import { devtools } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import type { KeyValueStorage } from '@rns/core/contracts/storage';

/**
 * Storage adapter for Zustand persistence
 * Converts CORE KeyValueStorage contract to Zustand's StateStorage interface
 * 
 * @example
 * ```ts
 * import { createStorageAdapter } from '@rns/plugin-state-zustand';
 * import { kvStorage } from '@rns/core/contracts/storage';
 * 
 * const storage = createStorageAdapter(kvStorage);
 * ```
 */
export function createStorageAdapter(storage: KeyValueStorage): StateStorage {
  return {
    getItem: (key: string) => storage.getString(key),
    setItem: (key: string, value: string) => storage.setString(key, value),
    removeItem: (key: string) => storage.delete(key),
  };
}

/**
 * Optional: MMKV storage adapter (if react-native-mmkv is installed)
 * Uses the same pattern as deprecated docs mmkv.ts
 * 
 * @returns StateStorage adapter using MMKV, or null if react-native-mmkv is not installed
 * 
 * @example
 * ```ts
 * import { getMmkvStorage } from '@rns/plugin-state-zustand';
 * 
 * const mmkvStorage = getMmkvStorage();
 * if (mmkvStorage) {
 *   // Use MMKV storage
 * }
 * ```
 */
let mmkvStorageAdapter: StateStorage | null = null;

try {
  // Dynamic require so builds don't fail if MMKV isn't installed yet.
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const { MMKV } = require('react-native-mmkv');

  // NOTE: Add encryptionKey in production apps.
  const mmkv = new MMKV({
    id: 'app-storage',
    // encryptionKey: 'secure-key', // ← configure via env for production
  });

  mmkvStorageAdapter = {
    getItem: (key: string) => mmkv.getString(key) ?? null,
    setItem: (key: string, value: string) => mmkv.set(key, value),
    removeItem: (key: string) => mmkv.remove(key),
  };
} catch {
  // react-native-mmkv not installed, use CORE storage contract instead
  mmkvStorageAdapter = null;
}

/**
 * Get MMKV storage adapter if available, otherwise returns null
 * Users should use createStorageAdapter() with CORE storage contract as fallback
 */
export function getMmkvStorage(): StateStorage | null {
  return mmkvStorageAdapter;
}

/**
 * Store factory options for persisted stores
 */
export interface PersistStoreOptions<T> {
  name: string;
  version: number;
  storage?: StateStorage;
  partialize?: (state: T) => Partial<T>;
  migrate?: (persistedState: any, version: number) => T;
  enableDevtools?: boolean;
}

/**
 * Store factory options for volatile stores
 */
export interface VolatileStoreOptions {
  name: string;
  enableDevtools?: boolean;
}

/**
 * Creates a persisted Zustand store with optional devtools support
 * Uses the provided storage adapter (or MMKV if available)
 * 
 * @example
 * ```ts
 * import { createPersistedStore, createStorageAdapter } from '@rns/plugin-state-zustand';
 * import { kvStorage } from '@rns/core/contracts/storage';
 * 
 * interface SessionState {
 *   token: string | null;
 *   setToken: (token: string) => void;
 * }
 * 
 * const useSessionStore = createPersistedStore<SessionState>(
 *   (set) => ({
 *     token: null,
 *     setToken: (token) => set({ token }),
 *   }),
 *   {
 *     name: 'session-store',
 *     version: 1,
 *     storage: createStorageAdapter(kvStorage),
 *   }
 * );
 * ```
 */
export function createPersistedStore<T>(
  creator: StateCreator<T, [['zustand/subscribeWithSelector', never]], []>,
  options: PersistStoreOptions<T>
) {
  const base = subscribeWithSelector(creator);
  
  // Use provided storage, MMKV if available, or throw error
  const storage = options.storage || getMmkvStorage();
  if (!storage) {
    throw new Error(
      'No storage provided. Either pass a storage adapter via options.storage, ' +
      'install react-native-mmkv, or use createStorageAdapter() with CORE storage contract.'
    );
  }

  const withPersist = persist(base as any, {
    name: options.name,
    version: options.version,
    storage: createJSONStorage(() => storage),
    partialize: options.partialize as any,
    migrate: options.migrate as any,
  });

  const withDevtools = __DEV__ && options.enableDevtools !== false
    ? devtools(withPersist as any, { name: options.name })
    : (withPersist as any);

  return create<T>()(withDevtools as any);
}

/**
 * Creates a volatile (non-persisted) Zustand store with optional devtools support
 * 
 * @example
 * ```ts
 * import { createVolatileStore } from '@rns/plugin-state-zustand';
 * 
 * interface UIState {
 *   isMenuOpen: boolean;
 *   toggleMenu: () => void;
 * }
 * 
 * const useUIStore = createVolatileStore<UIState>(
 *   (set) => ({
 *     isMenuOpen: false,
 *     toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
 *   }),
 *   {
 *     name: 'ui-store',
 *   }
 * );
 * ```
 */
export function createVolatileStore<T>(
  creator: StateCreator<T, [['zustand/subscribeWithSelector', never]], []>,
  options: VolatileStoreOptions
) {
  const base = subscribeWithSelector(creator);
  
  const withDevtools = __DEV__ && options.enableDevtools !== false
    ? devtools(base as any, { name: options.name })
    : (base as any);
    
  return create<T>()(withDevtools as any);
}
