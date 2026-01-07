import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import {
  createJSONStorage,
  devtools,
  persist,
  subscribeWithSelector,
} from 'zustand/middleware';
import { mmkvStorage } from '@/app/state';

type PersistOpts<T> = {
  name: string;
  version: number;
  partialize?: (s: T) => Partial<T>;
  migrate?: (persisted: any, version: number) => T;
};

export function createPersistedStore<T>(
  creator: StateCreator<T, [['zustand/subscribeWithSelector', never]], []>,
  opts: PersistOpts<T>,
) {
  const base = subscribeWithSelector(creator);

  const withPersist = persist(base as any, {
    name: opts.name,
    version: opts.version,
    storage: createJSONStorage(() => mmkvStorage),
    partialize: opts.partialize as any,
    migrate: opts.migrate as any,
  });

  const withDevtools = __DEV__
    ? devtools(withPersist as any, { name: opts.name })
    : (withPersist as any);

  return create<T>()(withDevtools as any);
}

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
