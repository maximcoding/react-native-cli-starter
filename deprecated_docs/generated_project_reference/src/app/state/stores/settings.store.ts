import type { StateCreator } from 'zustand';
import { createPersistedStore } from '@/app/state';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Lang = 'en' | 'ru' | 'de';

type SettingsState = {
  themeMode: ThemeMode;
  language: Lang;

  setThemeMode: (m: ThemeMode) => void;
  setLanguage: (l: Lang) => void;
};

const creator: StateCreator<
  SettingsState,
  [['zustand/subscribeWithSelector', never]],
  []
> = set => ({
  themeMode: 'system',
  language: 'en',
  setThemeMode: m => set({ themeMode: m }),
  setLanguage: l => set({ language: l }),
});

export const useSettingsStore = createPersistedStore<SettingsState>(creator, {
  name: 'settings',
  version: 1,
  partialize: s => ({ themeMode: s.themeMode, language: s.language }),
});
