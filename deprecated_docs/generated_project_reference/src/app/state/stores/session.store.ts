import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { kvStorage } from '@/infra/storage/mmkv';
import { constants } from '@/core/config/constants';

export type SessionStatus = 'guest' | 'auth';

export type SessionState = {
  hydrated: boolean;

  status: SessionStatus;
  accessToken: string | null;
  refreshToken: string | null;

  /** Load tokens from MMKV into memory (call once on app start). */
  hydrate: () => void;

  /** Save tokens to MMKV + memory. */
  setTokens: (p: { accessToken: string; refreshToken?: string | null }) => void;

  /** Clear tokens in MMKV + memory. */
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
      const accessToken = kvStorage.getString(constants.AUTH_TOKEN) ?? null;
      const refreshToken = kvStorage.getString(constants.REFRESH_TOKEN) ?? null;

      set({
        hydrated: true,
        accessToken,
        refreshToken,
        status: accessToken ? 'auth' : 'guest',
      });
    },

    setTokens: ({ accessToken, refreshToken }) => {
      kvStorage.setString(constants.AUTH_TOKEN, accessToken);

      // refreshToken === undefined => keep existing
      if (refreshToken !== undefined) {
        if (refreshToken)
          kvStorage.setString(constants.REFRESH_TOKEN, refreshToken);
        else kvStorage.delete(constants.REFRESH_TOKEN);
      }

      set({
        hydrated: true,
        status: 'auth',
        accessToken,
        refreshToken: refreshToken ?? get().refreshToken,
      });
    },

    clear: () => {
      kvStorage.delete(constants.AUTH_TOKEN);
      kvStorage.delete(constants.REFRESH_TOKEN);

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
