/**
 * FILE: src/lib/plugin-reexports.ts
 * PURPOSE: Plugin re-export generation for discoverability (Hybrid Architecture)
 * OWNERSHIP: CLI
 * 
 * This module generates convenience re-exports for installed plugins in User Zone,
 * organized by category (state/, auth/, storage/, etc.), following the same hybrid
 * pattern used for hooks.
 * 
 * Hybrid Architecture:
 * - Source of truth: plugins in System Zone (packages/@rns/{category}/{pluginName}/) - CLI-managed, stable, updatable
 * - Convenience re-exports: plugins in User Zone (src/{category}/) - user-editable, discoverable, includes examples
 * 
 * Benefits:
 * - Discoverable: plugins visible in src/{category}/ where developers expect them
 * - Stable: source of truth in System Zone (CLI can update)
 * - Customizable: users can override User Zone re-exports with custom implementations
 * - Consistent: both import paths work (@rns/{category} and @/{category}/*)
 * - Example stores: state.zustand includes ready-to-use example stores (session, settings, UI)
 */

import { join } from 'path';
import { unlinkSync } from 'fs';
import { ensureDir, writeTextFile, pathExists } from './fs';
import { USER_SRC_DIR } from './constants';

/**
 * Maps plugin ID to category directory name
 * Extracts category prefix from plugin ID (before first dot)
 * 
 * @param pluginId - Plugin ID (e.g., "state.zustand", "auth.firebase")
 * @returns Category name (e.g., "state", "auth", "plugins" as fallback)
 * 
 * @example
 * getPluginCategory("state.zustand") // "state"
 * getPluginCategory("auth.firebase") // "auth"
 * getPluginCategory("example") // "plugins"
 */
export function getPluginCategory(pluginId: string): string {
  const dotIndex = pluginId.indexOf('.');
  if (dotIndex === -1) {
    // No category prefix, use fallback
    return 'plugins';
  }
  return pluginId.substring(0, dotIndex);
}

/**
 * Normalizes plugin ID to filename (strips category prefix)
 * 
 * @param pluginId - Plugin ID (e.g., "state.zustand", "auth.firebase")
 * @returns Normalized name (e.g., "zustand", "firebase")
 * 
 * @example
 * normalizePluginName("state.zustand") // "zustand"
 * normalizePluginName("auth.firebase") // "firebase"
 * normalizePluginName("example") // "example"
 */
export function normalizePluginName(pluginId: string): string {
  const dotIndex = pluginId.indexOf('.');
  if (dotIndex === -1) {
    return pluginId;
  }
  return pluginId.substring(dotIndex + 1);
}

/**
 * Gets the System Zone package name for a plugin (category-based)
 * Uses category as package name (e.g., "@rns/state" instead of "@rns/plugin-state-zustand")
 * 
 * @param pluginId - Plugin ID (e.g., "state.zustand")
 * @returns Package name (e.g., "@rns/state")
 * 
 * @example
 * getPluginPackageName("state.zustand") // "@rns/state"
 * getPluginPackageName("auth.firebase") // "@rns/auth"
 * getPluginPackageName("example") // "@rns/plugins"
 */
export function getPluginPackageName(pluginId: string): string {
  const category = getPluginCategory(pluginId);
  return `@rns/${category}`;
}

/**
 * Ensures a category directory exists in User Zone
 * 
 * @param projectRoot - Project root directory
 * @param category - Category name (e.g., "state", "auth")
 */
export function ensureCategoryDir(projectRoot: string, category: string): void {
  const categoryDir = join(projectRoot, USER_SRC_DIR, category);
  ensureDir(categoryDir);
}


/**
 * Generates a plugin re-export file with example stores (for state plugins) or simple re-export (for other plugins)
 * 
 * @param projectRoot - Project root directory
 * @param pluginId - Plugin ID (e.g., "state.zustand")
 * @param language - Language ('ts' | 'js')
 */
export function generatePluginReExport(
  projectRoot: string,
  pluginId: string,
  language: 'ts' | 'js' = 'ts'
): void {
  const category = getPluginCategory(pluginId);
  const pluginName = normalizePluginName(pluginId);
  const packageName = getPluginPackageName(pluginId);
  
  // Ensure category directory exists
  ensureCategoryDir(projectRoot, category);
  
  // Get plugin description for documentation
  const pluginDescription = getPluginDescription(pluginId);
  
  // For Zustand plugin, generate multiple files (main + stores)
  if (category === 'state' && pluginName === 'zustand') {
    generateZustandFiles(projectRoot, category, pluginName, packageName, pluginDescription, language);
  } else {
    // For other plugins, simple re-export
    const categoryDir = join(projectRoot, USER_SRC_DIR, category);
    const fileExt = language === 'ts' ? 'ts' : 'js';
    const filePath = join(categoryDir, `${pluginName}.${fileExt}`);
    const content = generateSimpleReExportContent(category, pluginName, packageName, pluginDescription, language);
    writeTextFile(filePath, content);
  }
}

/**
 * Removes a plugin re-export file and associated directories
 * 
 * @param projectRoot - Project root directory
 * @param pluginId - Plugin ID (e.g., "state.zustand")
 * @param language - Language ('ts' | 'js')
 */
export function removePluginReExport(
  projectRoot: string,
  pluginId: string,
  language: 'ts' | 'js' = 'ts'
): void {
  const category = getPluginCategory(pluginId);
  const pluginName = normalizePluginName(pluginId);
  const fileExt = language === 'ts' ? 'ts' : 'js';
  const filePath = join(projectRoot, USER_SRC_DIR, category, `${pluginName}.${fileExt}`);
  
  // Remove main file
  if (pathExists(filePath)) {
    unlinkSync(filePath);
  }
  
  // For Zustand, also remove stores directory
  if (category === 'state' && pluginName === 'zustand') {
    const storesDir = join(projectRoot, USER_SRC_DIR, category, pluginName, 'stores');
    if (pathExists(storesDir)) {
      // Remove individual store files
      const storeFiles = ['session', 'settings', 'ui'];
      for (const storeFile of storeFiles) {
        const storePath = join(storesDir, `${storeFile}.${fileExt}`);
        if (pathExists(storePath)) {
          unlinkSync(storePath);
        }
      }
      
      // Try to remove stores directory (will fail if not empty, which is fine)
      try {
        const { rmdirSync } = require('fs');
        rmdirSync(storesDir);
      } catch {
        // Ignore errors - directory might not be empty or might not exist
      }
      
      // Try to remove plugin directory
      const pluginDir = join(projectRoot, USER_SRC_DIR, category, pluginName);
      try {
        const { rmdirSync } = require('fs');
        rmdirSync(pluginDir);
      } catch {
        // Ignore errors - directory might not be empty or might not exist
      }
    }
  }
}

/**
 * Gets a human-readable description for a plugin
 * Used in generated re-export file comments
 * 
 * @param pluginId - Plugin ID
 * @returns Description string
 */
function getPluginDescription(pluginId: string): string {
  // Map common plugin IDs to descriptions
  const descriptions: Record<string, string> = {
    'state.zustand': 'Zustand state management plugin',
    'state.redux-toolkit': 'Redux Toolkit state management plugin',
    'state.xstate': 'XState state management plugin',
    'auth.firebase': 'Firebase authentication plugin',
    'auth.cognito': 'AWS Cognito authentication plugin',
    'auth.auth0': 'Auth0 authentication plugin',
    'storage.mmkv': 'MMKV storage plugin',
    'storage.sqlite': 'SQLite storage plugin',
    'storage.secure': 'Secure storage plugin',
    'nav.react-navigation': 'React Navigation plugin',
    'nav.expo-router': 'Expo Router plugin',
  };
  
  return descriptions[pluginId] || `${pluginId} plugin`;
}

/**
 * Generates all Zustand files (main file + separate store files)
 */
function generateZustandFiles(
  projectRoot: string,
  category: string,
  pluginName: string,
  packageName: string,
  pluginDescription: string,
  language: 'ts' | 'js'
): void {
  const categoryDir = join(projectRoot, USER_SRC_DIR, category);
  const storesDir = join(categoryDir, pluginName, 'stores');
  const fileExt = language === 'ts' ? 'ts' : 'js';
  
  // Ensure stores directory exists
  ensureDir(storesDir);
  
  // Generate main zustand.ts file
  const mainFilePath = join(categoryDir, `${pluginName}.${fileExt}`);
  const mainContent = generateZustandMainFile(category, pluginName, packageName, pluginDescription, language);
  writeTextFile(mainFilePath, mainContent);
  
  // Generate store files
  const sessionContent = generateSessionStore(category, pluginName, packageName, language);
  writeTextFile(join(storesDir, `session.${fileExt}`), sessionContent);
  
  const settingsContent = generateSettingsStore(category, pluginName, packageName, language);
  writeTextFile(join(storesDir, `settings.${fileExt}`), settingsContent);
  
  const uiContent = generateUIStore(category, pluginName, packageName, language);
  writeTextFile(join(storesDir, `ui.${fileExt}`), uiContent);
}

/**
 * Generates the main Zustand file with re-exports and factory functions
 */
function generateZustandMainFile(
  category: string,
  pluginName: string,
  packageName: string,
  pluginDescription: string,
  language: 'ts' | 'js'
): string {
  if (language === 'js') {
    // JavaScript version (simplified)
    return `/**
 * FILE: src/${category}/${pluginName}.js
 * PURPOSE: ${pluginDescription} with example stores (User Zone).
 * OWNERSHIP: USER
 * 
 * This file re-exports Zustand utilities and includes example stores.
 * The source of truth is in packages/@rns/${category}/${pluginName}/ (CLI-managed).
 * 
 * You can import from either location:
 * - import { createPersistedStore, useSessionStore } from '@/${category}/${pluginName}';
 * - import { createPersistedStore } from '${packageName}';
 */
export * from '${packageName}';
`;
  }

  // TypeScript version
  return `/**
 * FILE: src/${category}/${pluginName}.ts
 * PURPOSE: ${pluginDescription} with example stores (User Zone).
 * OWNERSHIP: USER
 * 
 * This file re-exports Zustand utilities and factory functions.
 * Example stores are in ./${pluginName}/stores/ (session, settings, UI).
 * The source of truth is in packages/@rns/${category}/${pluginName}/ (CLI-managed).
 * 
 * You can import from either location:
 * - import { createPersistedStore, useSessionStore } from '@/${category}/${pluginName}';
 * - import { createPersistedStore } from '${packageName}';
 */

// Re-export plugin utilities
export * from '${packageName}';

// Import utilities for factory functions
import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import {
  createJSONStorage,
  devtools,
  persist,
  subscribeWithSelector,
} from 'zustand/middleware';
import { createStorageAdapter, getMmkvStorage } from '${packageName}';
import { kvStorage } from '@rns/core/contracts/storage';

// MMKV storage adapter (if available)
let mmkvStorage: ReturnType<typeof getMmkvStorage> = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const { MMKV } = require('react-native-mmkv');
  const mmkv = new MMKV({
    id: 'app-storage',
    // encryptionKey: 'secure-key', // ← configure via env for production
  });
  mmkvStorage = {
    getItem: (key: string) => mmkv.getString(key) ?? null,
    setItem: (key: string, value: string) => mmkv.set(key, value),
    removeItem: (key: string) => mmkv.remove(key),
  };
} catch {
  // react-native-mmkv not installed, will use CORE storage contract
}

// Store factory functions
type PersistOpts<T> = {
  name: string;
  version: number;
  partialize?: (s: T) => Partial<T>;
  migrate?: (persisted: any, version: number) => T;
};

/**
 * Creates a persisted Zustand store with devtools support
 */
export function createPersistedStore<T>(
  creator: StateCreator<T, [['zustand/subscribeWithSelector', never]], []>,
  opts: PersistOpts<T>,
) {
  const base = subscribeWithSelector(creator);
  
  // Use MMKV if available, otherwise CORE storage contract
  const storage = mmkvStorage || createStorageAdapter(kvStorage);

  const withPersist = persist(base as any, {
    name: opts.name,
    version: opts.version,
    storage: createJSONStorage(() => storage),
    partialize: opts.partialize as any,
    migrate: opts.migrate as any,
  });

  const withDevtools = __DEV__
    ? devtools(withPersist as any, { name: opts.name })
    : (withPersist as any);

  return create<T>()(withDevtools as any);
}

/**
 * Creates a volatile (non-persisted) Zustand store with devtools support
 */
export function createVolatileStore<T>(
  creator: StateCreator<T, [['zustand/subscribeWithSelector', never]], []>,
  name: string,
) {
  const base = subscribeWithSelector(creator);
  const withDevtools = __DEV__
    ? devtools(base as any, { name })
    : (base as any);
  return create<T>()(withDevtools as any);
}

// Re-export example stores
export * from './${pluginName}/stores/session';
export * from './${pluginName}/stores/settings';
export * from './${pluginName}/stores/ui';
`;
}

/**
 * Generates the Session store file
 */
function generateSessionStore(
  category: string,
  pluginName: string,
  packageName: string,
  language: 'ts' | 'js'
): string {
  if (language === 'js') {
    return `/**
 * FILE: src/${category}/${pluginName}/stores/session.js
 * PURPOSE: Session store example (User Zone).
 * OWNERSHIP: USER
 */
export * from '@/${category}/${pluginName}';
`;
  }

  return `/**
 * FILE: src/${category}/${pluginName}/stores/session.ts
 * PURPOSE: Session store example (User Zone).
 * OWNERSHIP: USER
 * 
 * Example session store for managing authentication state.
 * Import factory functions from parent: import { createPersistedStore } from '@/${category}/${pluginName}';
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type SessionStatus = 'guest' | 'auth';

export type SessionState = {
  hydrated: boolean;
  status: SessionStatus;
  accessToken: string | null;
  refreshToken: string | null;
  /** Load tokens from storage into memory (call once on app start). */
  hydrate: () => void;
  /** Save tokens to storage + memory. */
  setTokens: (p: { accessToken: string; refreshToken?: string | null }) => void;
  /** Clear tokens in storage + memory. */
  clear: () => void;
  isAuthed: () => boolean;
};

export const useSessionStore = create<SessionState>()(
  subscribeWithSelector((set, get) => ({
    hydrated: false,
    status: 'guest',
    accessToken: null,
    refreshToken: null,

    hydrate: () => {
      // In a real app, load from storage using your storage adapter
      // For now, this is a placeholder
      set({
        hydrated: true,
        accessToken: null,
        refreshToken: null,
        status: 'guest',
      });
    },

    setTokens: ({ accessToken, refreshToken }) => {
      // In a real app, save to storage using your storage adapter
      set({
        hydrated: true,
        status: 'auth',
        accessToken,
        refreshToken: refreshToken ?? get().refreshToken,
      });
    },

    clear: () => {
      // In a real app, clear from storage
      set({
        hydrated: true,
        status: 'guest',
        accessToken: null,
        refreshToken: null,
      });
    },

    isAuthed: () => get().status === 'auth' && !!get().accessToken,
  })),
);
`;
}

/**
 * Generates the Settings store file
 */
function generateSettingsStore(
  category: string,
  pluginName: string,
  packageName: string,
  language: 'ts' | 'js'
): string {
  if (language === 'js') {
    return `/**
 * FILE: src/${category}/${pluginName}/stores/settings.js
 * PURPOSE: Settings store example (User Zone).
 * OWNERSHIP: USER
 */
export * from '@/${category}/${pluginName}';
`;
  }

  return `/**
 * FILE: src/${category}/${pluginName}/stores/settings.ts
 * PURPOSE: Settings store example (User Zone).
 * OWNERSHIP: USER
 * 
 * Example settings store for managing app preferences (theme, language, etc.).
 * Uses createPersistedStore for persistence.
 */

import type { StateCreator } from 'zustand';
import { createPersistedStore } from '@/${category}/${pluginName}';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Lang = 'en' | 'ru' | 'de';

type SettingsState = {
  themeMode: ThemeMode;
  language: Lang;
  setThemeMode: (m: ThemeMode) => void;
  setLanguage: (l: Lang) => void;
};

const settingsCreator: StateCreator<
  SettingsState,
  [['zustand/subscribeWithSelector', never]],
  []
> = set => ({
  themeMode: 'system',
  language: 'en',
  setThemeMode: m => set({ themeMode: m }),
  setLanguage: l => set({ language: l }),
});

export const useSettingsStore = createPersistedStore<SettingsState>(settingsCreator, {
  name: 'settings',
  version: 1,
  partialize: s => ({ themeMode: s.themeMode, language: s.language }),
});
`;
}

/**
 * Generates the UI store file
 */
function generateUIStore(
  category: string,
  pluginName: string,
  packageName: string,
  language: 'ts' | 'js'
): string {
  if (language === 'js') {
    return `/**
 * FILE: src/${category}/${pluginName}/stores/ui.js
 * PURPOSE: UI store example (User Zone).
 * OWNERSHIP: USER
 */
export * from '@/${category}/${pluginName}';
`;
  }

  return `/**
 * FILE: src/${category}/${pluginName}/stores/ui.ts
 * PURPOSE: UI store example (User Zone).
 * OWNERSHIP: USER
 * 
 * Example UI store for managing transient UI state (loading, toasts, etc.).
 * Uses createVolatileStore (non-persisted).
 */

import type { StateCreator } from 'zustand';
import { createVolatileStore } from '@/${category}/${pluginName}';

type Toast = { message: string; type: 'info' | 'success' | 'error' };

type UIState = {
  busy: boolean;
  toast: Toast | null;
  setBusy: (v: boolean) => void;
  showToast: (t: Toast) => void;
  clearToast: () => void;
};

const uiCreator: StateCreator<
  UIState,
  [['zustand/subscribeWithSelector', never]],
  []
> = set => ({
  busy: false,
  toast: null,
  setBusy: v => set({ busy: v }),
  showToast: t => set({ toast: t }),
  clearToast: () => set({ toast: null }),
});

export const useUIStore = createVolatileStore<UIState>(uiCreator, 'ui');
`;
}

/**
 * Generates content for state.zustand plugin with example stores (deprecated - kept for reference)
 */
function generateStateZustandContent(
  category: string,
  pluginName: string,
  packageName: string,
  pluginDescription: string,
  language: 'ts' | 'js'
): string {
  if (language === 'js') {
    // JavaScript version (simplified)
    return `/**
 * FILE: src/${category}/${pluginName}.js
 * PURPOSE: ${pluginDescription} with example stores (User Zone).
 * OWNERSHIP: USER
 * 
 * This file re-exports Zustand utilities and includes example stores.
 * The source of truth is in packages/@rns/${category}/${pluginName}/ (CLI-managed).
 * 
 * You can import from either location:
 * - import { createPersistedStore, useSessionStore } from '@/${category}/${pluginName}';
 * - import { createPersistedStore } from '${packageName}';
 */
export * from '${packageName}';
`;
  }

  // TypeScript version with example stores
  return `/**
 * FILE: src/${category}/${pluginName}.ts
 * PURPOSE: ${pluginDescription} with example stores (User Zone).
 * OWNERSHIP: USER
 * 
 * This file re-exports Zustand utilities and includes example stores (session, settings, UI).
 * The source of truth is in packages/@rns/${category}/${pluginName}/ (CLI-managed).
 * 
 * You can import from either location:
 * - import { createPersistedStore, useSessionStore } from '@/${category}/${pluginName}';
 * - import { createPersistedStore } from '${packageName}';
 */

// Re-export plugin utilities
export * from '${packageName}';

// Import utilities for example stores
import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import {
  createJSONStorage,
  devtools,
  persist,
  subscribeWithSelector,
} from 'zustand/middleware';
import { createStorageAdapter, getMmkvStorage } from '${packageName}';
import { kvStorage } from '@rns/core/contracts/storage';

// MMKV storage adapter (if available)
let mmkvStorage: ReturnType<typeof getMmkvStorage> = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const { MMKV } = require('react-native-mmkv');
  const mmkv = new MMKV({
    id: 'app-storage',
    // encryptionKey: 'secure-key', // ← configure via env for production
  });
  mmkvStorage = {
    getItem: (key: string) => mmkv.getString(key) ?? null,
    setItem: (key: string, value: string) => mmkv.set(key, value),
    removeItem: (key: string) => mmkv.remove(key),
  };
} catch {
  // react-native-mmkv not installed, will use CORE storage contract
}

// Store factory functions
type PersistOpts<T> = {
  name: string;
  version: number;
  partialize?: (s: T) => Partial<T>;
  migrate?: (persisted: any, version: number) => T;
};

/**
 * Creates a persisted Zustand store with devtools support
 */
export function createPersistedStore<T>(
  creator: StateCreator<T, [['zustand/subscribeWithSelector', never]], []>,
  opts: PersistOpts<T>,
) {
  const base = subscribeWithSelector(creator);
  
  // Use MMKV if available, otherwise CORE storage contract
  const storage = mmkvStorage || createStorageAdapter(kvStorage);

  const withPersist = persist(base as any, {
    name: opts.name,
    version: opts.version,
    storage: createJSONStorage(() => storage),
    partialize: opts.partialize as any,
    migrate: opts.migrate as any,
  });

  const withDevtools = __DEV__
    ? devtools(withPersist as any, { name: opts.name })
    : (withPersist as any);

  return create<T>()(withDevtools as any);
}

/**
 * Creates a volatile (non-persisted) Zustand store with devtools support
 */
export function createVolatileStore<T>(
  creator: StateCreator<T, [['zustand/subscribeWithSelector', never]], []>,
  name: string,
) {
  const base = subscribeWithSelector(creator);
  const withDevtools = __DEV__
    ? devtools(base as any, { name })
    : (base as any);
  return create<T>()(withDevtools as any);
}

// Example: Session Store
export type SessionStatus = 'guest' | 'auth';

export type SessionState = {
  hydrated: boolean;
  status: SessionStatus;
  accessToken: string | null;
  refreshToken: string | null;
  /** Load tokens from storage into memory (call once on app start). */
  hydrate: () => void;
  /** Save tokens to storage + memory. */
  setTokens: (p: { accessToken: string; refreshToken?: string | null }) => void;
  /** Clear tokens in storage + memory. */
  clear: () => void;
  isAuthed: () => boolean;
};

export const useSessionStore = create<SessionState>()(
  subscribeWithSelector((set, get) => ({
    hydrated: false,
    status: 'guest',
    accessToken: null,
    refreshToken: null,

    hydrate: () => {
      // In a real app, load from storage using your storage adapter
      // For now, this is a placeholder
      set({
        hydrated: true,
        accessToken: null,
        refreshToken: null,
        status: 'guest',
      });
    },

    setTokens: ({ accessToken, refreshToken }) => {
      // In a real app, save to storage using your storage adapter
      set({
        hydrated: true,
        status: 'auth',
        accessToken,
        refreshToken: refreshToken ?? get().refreshToken,
      });
    },

    clear: () => {
      // In a real app, clear from storage
      set({
        hydrated: true,
        status: 'guest',
        accessToken: null,
        refreshToken: null,
      });
    },

    isAuthed: () => get().status === 'auth' && !!get().accessToken,
  })),
);

// Example: Settings Store
export type ThemeMode = 'light' | 'dark' | 'system';
export type Lang = 'en' | 'ru' | 'de';

type SettingsState = {
  themeMode: ThemeMode;
  language: Lang;
  setThemeMode: (m: ThemeMode) => void;
  setLanguage: (l: Lang) => void;
};

const settingsCreator: StateCreator<
  SettingsState,
  [['zustand/subscribeWithSelector', never]],
  []
> = set => ({
  themeMode: 'system',
  language: 'en',
  setThemeMode: m => set({ themeMode: m }),
  setLanguage: l => set({ language: l }),
});

export const useSettingsStore = createPersistedStore<SettingsState>(settingsCreator, {
  name: 'settings',
  version: 1,
  partialize: s => ({ themeMode: s.themeMode, language: s.language }),
});

// Example: UI Store (volatile)
type Toast = { message: string; type: 'info' | 'success' | 'error' };

type UIState = {
  busy: boolean;
  toast: Toast | null;
  setBusy: (v: boolean) => void;
  showToast: (t: Toast) => void;
  clearToast: () => void;
};

const uiCreator: StateCreator<
  UIState,
  [['zustand/subscribeWithSelector', never]],
  []
> = set => ({
  busy: false,
  toast: null,
  setBusy: v => set({ busy: v }),
  showToast: t => set({ toast: t }),
  clearToast: () => set({ toast: null }),
});

export const useUIStore = createVolatileStore<UIState>(uiCreator, 'ui');
`;
}

/**
 * Generates simple re-export content for non-state plugins
 */
function generateSimpleReExportContent(
  category: string,
  pluginName: string,
  packageName: string,
  pluginDescription: string,
  language: 'ts' | 'js'
): string {
  const fileExt = language === 'ts' ? 'ts' : 'js';
  
  if (language === 'js') {
    return `/**
 * FILE: src/${category}/${pluginName}.js
 * PURPOSE: Convenience re-export for ${pluginDescription} (User Zone).
 * OWNERSHIP: USER
 * 
 * This is a convenience re-export from System Zone (${packageName}).
 * The source of truth is in packages/@rns/${category}/${pluginName}/ (CLI-managed).
 * 
 * You can import from either location:
 * - import { ... } from '@/${category}/${pluginName}';  (convenience, discoverable)
 * - import { ... } from '${packageName}'; (direct, System Zone)
 * 
 * To customize: replace this re-export with your own implementation.
 */
export * from '${packageName}';
`;
  }

  return `/**
 * FILE: src/${category}/${pluginName}.ts
 * PURPOSE: Convenience re-export for ${pluginDescription} (User Zone).
 * OWNERSHIP: USER
 * 
 * This is a convenience re-export from System Zone (${packageName}).
 * The source of truth is in packages/@rns/${category}/${pluginName}/ (CLI-managed).
 * 
 * You can import from either location:
 * - import { ... } from '@/${category}/${pluginName}';  (convenience, discoverable)
 * - import { ... } from '${packageName}'; (direct, System Zone)
 * 
 * To customize: replace this re-export with your own implementation.
 * 
 * @example
 * import { SomeFunction } from '@/${category}/${pluginName}';
 */
export * from '${packageName}';
`;
}
