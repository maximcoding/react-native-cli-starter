import type { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { kvStorage } from '@/infra/storage/mmkv';
import { constants } from '@/core/config/constants';
import { isOffline } from '@/infra/network/netinfo';
import { performLogout } from '@/core/session/logout';
import { getSessionQueryClient } from '@/core/session/session-bridge';
import { useSessionStore } from '@/app/state';


type RefreshResponse = {
  token: string;
  refreshToken?: string;
};

// Single-flight state
let isRefreshing = false;
let waitQueue: Array<(t: string | null) => void> = [];
let logoutPromise: Promise<void> | null = null;

function enqueue(cb: (t: string | null) => void) {
  waitQueue.push(cb);
}

function resolveQueue(newToken: string | null) {
  for (const cb of waitQueue) cb(newToken);
  waitQueue = [];
}

async function logoutOnce() {
  if (!logoutPromise) {
    const qc = getSessionQueryClient() ?? undefined;
    logoutPromise = performLogout(qc).finally(() => {
      logoutPromise = null;
    });
  }
  await logoutPromise;
}

async function doRefresh(instance: AxiosInstance): Promise<string | null> {
  if (isOffline()) return null;

  // ✅ prefer store, fallback to MMKV (safety)
  const refreshToken =
    useSessionStore.getState().refreshToken ??
    kvStorage.getString(constants.REFRESH_TOKEN);

  if (!refreshToken) return null;

  try {
    const res = await instance.post<RefreshResponse>(
      '/auth/refresh',
      { refreshToken },
      { headers: { 'x-skip-auth': '1', 'x-skip-refresh': '1' } as any },
    );

    const { token, refreshToken: nextRefresh } =
      res.data || ({} as RefreshResponse);

    if (!token) return null;

    // ✅ update store (store writes to MMKV internally)
    useSessionStore.getState().setTokens({
      accessToken: token,
      refreshToken: nextRefresh ?? refreshToken,
    });

    return token;
  } catch {
    return null;
  }
}

function shouldSkipRefresh(config?: AxiosRequestConfig) {
  const url = config?.url || '';
  const skipFlag = (config?.headers as any)?.['x-skip-refresh'] === '1';

  return (
    skipFlag || url.includes('/auth/login') || url.includes('/auth/refresh')
  );
}

export function attachRefreshTokenInterceptor(instance: AxiosInstance) {
  instance.interceptors.response.use(
    res => res,
    async (error: AxiosError) => {
      const status = error.response?.status;
      const original = error.config as
        | (AxiosRequestConfig & { _retry?: boolean })
        | undefined;

      if (status !== 401 || !original) {
        return Promise.reject(error);
      }

      if (original._retry === true || shouldSkipRefresh(original)) {
        return Promise.reject(error);
      }
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          enqueue(newToken => {
            if (!newToken) return reject(error);
            original.headers = original.headers ?? {};
            (original.headers as any).Authorization = `Bearer ${newToken}`;
            resolve(instance(original));
          });
        });
      }

      isRefreshing = true;

      const newToken = await doRefresh(instance).finally(() => {
        isRefreshing = false;
      });

      resolveQueue(newToken);

      if (!newToken) {
        await logoutOnce();
        return Promise.reject(error);
      }

      original.headers = original.headers ?? {};
      (original.headers as any).Authorization = `Bearer ${newToken}`;
      return instance(original);
    },
  );
}
