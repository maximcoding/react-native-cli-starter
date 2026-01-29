/**
 * FILE: src/lib/init/state/zustand.ts
 * PURPOSE: Zustand infrastructure generation (Section 51)
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { ensureDir, writeTextFile } from '../../fs';
import { USER_SRC_DIR } from '../../constants';
import type { InitInputs } from '../types';

/**
 * Generates Zustand infrastructure files
 */
export function generateZustandInfrastructure(
  appRoot: string,
  inputs: InitInputs
): void {
  const stateDir = join(appRoot, USER_SRC_DIR, 'state');
  const zustandDir = join(stateDir, 'zustand');
  const storesDir = join(zustandDir, 'stores');
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  ensureDir(storesDir);

  // Generate main zustand file
  const mainFilePath = join(zustandDir, `zustand.${fileExt}`);
  const mainContent = generateZustandMainFile(inputs);
  writeTextFile(mainFilePath, mainContent);

  // Generate store files
  const sessionContent = generateSessionStore(inputs);
  writeTextFile(join(storesDir, `session.${fileExt}`), sessionContent);

  const settingsContent = generateSettingsStore(inputs);
  writeTextFile(join(storesDir, `settings.${fileExt}`), settingsContent);

  const uiContent = generateUIStore(inputs);
  writeTextFile(join(storesDir, `ui.${fileExt}`), uiContent);
}

/**
 * Generates the main Zustand file with factory functions
 */
function generateZustandMainFile(inputs: InitInputs): string {
  const hasMmkv = inputs.selectedOptions.storage?.mmkv ?? false;
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  if (inputs.language === 'js') {
    return `/**
 * FILE: src/state/zustand/zustand.js
 * PURPOSE: Zustand state management with example stores (User Zone).
 * OWNERSHIP: USER
 * 
 * This file provides Zustand store factory functions and re-exports example stores.
 * Example stores are in ./stores/ (session, settings, UI).
 */

import { create } from 'zustand';
import { subscribeWithSelector, devtools, persist, createJSONStorage } from 'zustand/middleware';
${hasMmkv ? `import { MMKV } from 'react-native-mmkv';

// MMKV storage instance
const mmkv = new MMKV({
  id: 'app-storage',
  // encryptionKey: 'secure-key', // ← configure via env for production
});

const mmkvStorage = {
  getItem: (key) => mmkv.getString(key) ?? null,
  setItem: (key, value) => mmkv.set(key, value),
  removeItem: (key) => mmkv.remove(key),
};` : `// No MMKV storage available - stores will be in-memory only`}

/**
 * Creates a persisted Zustand store with devtools support
 */
export function createPersistedStore(creator, opts) {
  const base = subscribeWithSelector(creator);
  
  const storage = ${hasMmkv ? 'mmkvStorage' : 'null'};
  
  if (storage) {
    const withPersist = persist(base, {
      name: opts.name,
      version: opts.version,
      storage: createJSONStorage(() => storage),
      partialize: opts.partialize,
      migrate: opts.migrate,
    });
    
    const withDevtools = __DEV__
      ? devtools(withPersist, { name: opts.name })
      : withPersist;
    
    return create(withDevtools);
  } else {
    // No storage available, create volatile store
    const withDevtools = __DEV__
      ? devtools(base, { name: opts.name })
      : base;
    return create(withDevtools);
  }
}

/**
 * Creates a volatile (non-persisted) Zustand store with devtools support
 */
export function createVolatileStore(creator, name) {
  const base = subscribeWithSelector(creator);
  const withDevtools = __DEV__
    ? devtools(base, { name })
    : base;
  return create(withDevtools);
}

// Re-export example stores
export * from './stores/session';
export * from './stores/settings';
export * from './stores/ui';
`;
  }

  // TypeScript version
  return `/**
 * FILE: src/state/zustand/zustand.ts
 * PURPOSE: Zustand state management with example stores (User Zone).
 * OWNERSHIP: USER
 * 
 * This file provides Zustand store factory functions and re-exports example stores.
 * Example stores are in ./stores/ (session, settings, UI).
 */

import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import {
  subscribeWithSelector,
  devtools,
  persist,
  createJSONStorage,
} from 'zustand/middleware';
${hasMmkv ? `import { MMKV } from 'react-native-mmkv';

// MMKV storage instance
const mmkv = new MMKV({
  id: 'app-storage',
  // encryptionKey: 'secure-key', // ← configure via env for production
});

const mmkvStorage = {
  getItem: (key: string): string | null => mmkv.getString(key) ?? null,
  setItem: (key: string, value: string): void => mmkv.set(key, value),
  removeItem: (key: string): void => mmkv.remove(key),
};` : `// No MMKV storage available - stores will be in-memory only`}

// Store factory options
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
  opts: PersistOpts<T>
) {
  const base = subscribeWithSelector(creator);
  
  ${hasMmkv ? `const storage = mmkvStorage;` : `const storage = null;`}
  
  if (storage) {
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
  } else {
    // No storage available, create volatile store
    const withDevtools = __DEV__
      ? devtools(base as any, { name: opts.name })
      : (base as any);
    return create<T>()(withDevtools as any);
  }
}

/**
 * Creates a volatile (non-persisted) Zustand store with devtools support
 */
export function createVolatileStore<T>(
  creator: StateCreator<T, [['zustand/subscribeWithSelector', never]], []>,
  name: string
) {
  const base = subscribeWithSelector(creator);
  const withDevtools = __DEV__
    ? devtools(base as any, { name })
    : (base as any);
  return create<T>()(withDevtools as any);
}

// Re-export example stores
export * from './stores/session';
export * from './stores/settings';
export * from './stores/ui';
`;
}

/**
 * Generates the Session store file
 */
function generateSessionStore(inputs: InitInputs): string {
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  if (inputs.language === 'js') {
    return `/**
 * FILE: src/state/zustand/stores/session.js
 * PURPOSE: Session store example (User Zone).
 * OWNERSHIP: USER
 * 
 * Example session store for managing authentication state.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export const useSessionStore = create((set, get) => ({
  hydrated: false,
  status: 'guest',
  accessToken: null,
  refreshToken: null,

  hydrate: () => {
    // Load tokens from storage (implement based on your storage solution)
    set({
      hydrated: true,
      accessToken: null,
      refreshToken: null,
      status: 'guest',
    });
  },

  setTokens: ({ accessToken, refreshToken }) => {
    // Save tokens to storage (implement based on your storage solution)
    set({
      hydrated: true,
      status: 'auth',
      accessToken,
      refreshToken: refreshToken ?? get().refreshToken,
    });
  },

  clear: () => {
    // Clear tokens from storage
    set({
      hydrated: true,
      status: 'guest',
      accessToken: null,
      refreshToken: null,
    });
  },

  isAuthed: () => get().status === 'auth' && !!get().accessToken,
}))(subscribeWithSelector);
`;
  }

  return `/**
 * FILE: src/state/zustand/stores/session.ts
 * PURPOSE: Session store example (User Zone).
 * OWNERSHIP: USER
 * 
 * Example session store for managing authentication state.
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
      // Load tokens from storage (implement based on your storage solution)
      set({
        hydrated: true,
        accessToken: null,
        refreshToken: null,
        status: 'guest',
      });
    },

    setTokens: ({ accessToken, refreshToken }) => {
      // Save tokens to storage (implement based on your storage solution)
      set({
        hydrated: true,
        status: 'auth',
        accessToken,
        refreshToken: refreshToken ?? get().refreshToken,
      });
    },

    clear: () => {
      // Clear tokens from storage
      set({
        hydrated: true,
        status: 'guest',
        accessToken: null,
        refreshToken: null,
      });
    },

    isAuthed: () => get().status === 'auth' && !!get().accessToken,
  }))
);
`;
}

/**
 * Generates the Settings store file
 */
function generateSettingsStore(inputs: InitInputs): string {
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  if (inputs.language === 'js') {
    return `/**
 * FILE: src/state/zustand/stores/settings.js
 * PURPOSE: Settings store example (User Zone).
 * OWNERSHIP: USER
 * 
 * Example settings store for managing app preferences.
 */

import type { StateCreator } from 'zustand';
import { createPersistedStore } from '../zustand';

const settingsCreator = (set) => ({
  themeMode: 'system',
  language: 'en',
  setThemeMode: (m) => set({ themeMode: m }),
  setLanguage: (l) => set({ language: l }),
});

export const useSettingsStore = createPersistedStore(settingsCreator, {
  name: 'settings',
  version: 1,
  partialize: (s) => ({ themeMode: s.themeMode, language: s.language }),
});
`;
  }

  return `/**
 * FILE: src/state/zustand/stores/settings.ts
 * PURPOSE: Settings store example (User Zone).
 * OWNERSHIP: USER
 * 
 * Example settings store for managing app preferences (theme, language, etc.).
 * Uses createPersistedStore for persistence.
 */

import type { StateCreator } from 'zustand';
import { createPersistedStore } from '../zustand';

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
function generateUIStore(inputs: InitInputs): string {
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  if (inputs.language === 'js') {
    return `/**
 * FILE: src/state/zustand/stores/ui.js
 * PURPOSE: UI store example (User Zone).
 * OWNERSHIP: USER
 * 
 * Example UI store for managing transient UI state.
 */

import { createVolatileStore } from '../zustand';

const uiCreator = (set) => ({
  busy: false,
  toast: null,
  setBusy: (v) => set({ busy: v }),
  showToast: (t) => set({ toast: t }),
  clearToast: () => set({ toast: null }),
});

export const useUIStore = createVolatileStore(uiCreator, 'ui');
`;
  }

  return `/**
 * FILE: src/state/zustand/stores/ui.ts
 * PURPOSE: UI store example (User Zone).
 * OWNERSHIP: USER
 * 
 * Example UI store for managing transient UI state (loading, toasts, etc.).
 * Uses createVolatileStore (non-persisted).
 */

import type { StateCreator } from 'zustand';
import { createVolatileStore } from '../zustand';

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
