import type { StateCreator } from 'zustand';
import { createVolatileStore } from '@/app/state';

type Toast = { message: string; type: 'info' | 'success' | 'error' };

type UIState = {
  busy: boolean;
  toast: Toast | null;

  setBusy: (v: boolean) => void;
  showToast: (t: Toast) => void;
  clearToast: () => void;
};

const creator: StateCreator<
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

export const useUIStore = createVolatileStore<UIState>(creator, 'ui');
