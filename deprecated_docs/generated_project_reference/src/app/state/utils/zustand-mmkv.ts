import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

const mmkv = createMMKV({
  id: 'app-storage',
  readOnly: false,
  mode: 'multi-process',
});

export const mmkvStorage: StateStorage = {
  setItem: (key, value) => mmkv.set(key, value),
  getItem: key => mmkv.getString(key) ?? null,
  removeItem: key => mmkv.remove(key),
};
