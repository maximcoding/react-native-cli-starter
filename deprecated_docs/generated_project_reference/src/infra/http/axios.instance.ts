import axios from 'axios';
import { attachLoggingInterceptor } from '@/infra/http/interceptors/logging.interceptor';
import { attachAuthInterceptor } from '@/infra/http/interceptors/auth.interceptor';
import { attachErrorInterceptor } from '@/infra/http/interceptors/error.interceptor';
import { attachRefreshTokenInterceptor } from '@/infra/http/interceptors/refresh.interceptor';

// ✅ session store

// TODO: Replace with your env/config provider
// @ts-ignore
import { env } from '@/core/config/env';
import { useSessionStore } from '@/app/state';
const BASE_URL = env.API_URL?.trim() ?? '';

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor order MATTERS:
 * 1. Logging  → logs both request and response
 * 2. Auth     → attaches token
 * 3. Refresh  → handles 401 once, retries original
 * 4. Error    → normalizes all errors
 */
attachLoggingInterceptor(axiosInstance);

// ✅ token now comes from session-store (MMKV remains inside store)
attachAuthInterceptor(
  axiosInstance,
  () => useSessionStore.getState().accessToken,
);

attachRefreshTokenInterceptor(axiosInstance);
attachErrorInterceptor(axiosInstance);
