// src/core/session/logout.ts
/**
 * Centralized logout helper:
 * - removes tokens from storage (access + refresh)
 * - clears persisted React Query cache snapshot (MMKV)
 * - clears offline queue + in-memory snapshot cache
 * - clears QueryClient in-memory cache (if available)
 * - resets navigation to ROOT_AUTH
 */

import type { QueryClient } from '@tanstack/react-query';

import { kvStorage } from '@/infra/storage/mmkv';
import { constants } from '@/core/config/constants';
import { resetRoot } from '@/app/navigation/helpers/navigation-helpers';
import { ROUTES } from '@/app/navigation/routes';

import { offlineQueue } from '@/infra/offline/offline-queue';
import { cacheEngine } from '@/infra/storage/cache-engine';
import { getSessionQueryClient } from '@/core/session/session-bridge';
import { useSessionStore } from '@/app/state';

let lastLogoutAt = 0;

/**
 * Call on user sign-out, token expiry, refresh failure, or 401-guard.
 * Optional QueryClient passed to clear in-memory cache too.
 */
export async function performLogout(qc?: QueryClient) {
  // Guard: prevent double-tap logout storms
  const now = Date.now();
  if (now - lastLogoutAt < 500) {
    resetRoot({ index: 0, routes: [{ name: ROUTES.ROOT_AUTH as never }] });
    return;
  }
  lastLogoutAt = now;

  const client = qc ?? getSessionQueryClient();

  try {
    // 1) Clear Zustand session (and MMKV tokens)
    useSessionStore.getState().clear();

    // (Legacy safety) ensure tokens removed from storage
    kvStorage.delete(constants.AUTH_TOKEN);
    kvStorage.delete(constants.REFRESH_TOKEN);

    // 2) Clear persisted React Query snapshot (MMKV)
    kvStorage.delete(constants.RQ_CACHE);

    // 3) Clear offline queue + any snapshot engines
    offlineQueue.clear?.();
    cacheEngine.clear?.();

    // 4) Clear QueryClient in-memory cache (best-effort)
    if (client) {
      await client.cancelQueries().catch(() => undefined);
      client.clear();
    }
  } catch {
    // ignore: we still must reset navigation
  } finally {
    // 5) Reset navigation to Auth root (always)
    resetRoot({
      index: 0,
      routes: [{ name: ROUTES.ROOT_AUTH as never }],
    });
  }
}
