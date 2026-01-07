// src/infra/transport/adapters/rest.adapter.ts
/**
 * FILE: rest.adapter.ts
 * LAYER: infra/transport/adapters
 * ---------------------------------------------------------------------
 * PURPOSE:
 *   Implement Transport interface using REST-style HTTP endpoints
 *   on top of axiosInstance.
 *
 * DESIGN:
 *   - Operation-driven (OPS.*) → resolves to HTTP {method,path}
 *   - Uses axiosInstance (so auth/refresh/error/logging interceptors apply)
 *   - Fallback mapping for ops not yet mapped:
 *       query  -> GET  /{operation}
 *       mutate -> POST /{operation}
 *       upload -> POST /{operation}
 *
 * NOTES:
 *   - tags/offline/retry are handled by upper transport wrapper, not here.
 *   - subscribe() is not supported in REST adapter.
 */

import type {
  Transport,
  TransportRequestMeta,
} from '@/infra/transport/transport.types';
import { axiosInstance } from '@/infra/http/axios.instance';
import { OPS } from '@/infra/transport/operations';
import type { Operation } from '@/infra/transport/operations';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type Route = {
  method: HttpMethod;
  path: string;
};

const ROUTES: Partial<Record<Operation, Route>> = {
  // USER
  [OPS.USER_ME]: { method: 'GET', path: '/me' },
  [OPS.USER_UPDATE_PROFILE]: { method: 'PUT', path: '/me' },

  // AUTH
  [OPS.AUTH_LOGIN]: { method: 'POST', path: '/auth/login' },
  [OPS.AUTH_REFRESH]: { method: 'POST', path: '/auth/refresh' },
};

/**
 * If you want to keep dots in URL, this is fine:
 *   /auth.login
 * If you prefer path style, switch to: operation.replaceAll('.', '/')
 */
function fallbackPath(operation: Operation) {
  return `/${operation}`;
}

function resolveRoute(
  kind: 'query' | 'mutate' | 'upload',
  operation: Operation,
): Route {
  const mapped = ROUTES[operation];
  if (mapped) return mapped;

  // Fallback for ops that exist in OPS but are not mapped yet
  if (kind === 'query') return { method: 'GET', path: fallbackPath(operation) };
  // mutate/upload default to POST
  return { method: 'POST', path: fallbackPath(operation) };
}

async function request<TResponse>(
  route: Route,
  variables?: unknown,
): Promise<TResponse> {
  const { method, path } = route;

  // GET/DELETE → params by default (REST-friendly)
  const useParams = method === 'GET' || method === 'DELETE';

  const res = await axiosInstance.request<TResponse>({
    method,
    url: path,
    params: useParams ? (variables as any) : undefined,
    data: useParams ? undefined : (variables as any),
  });

  return res.data;
}

export const restAdapter: Transport = {
  async query<TResponse = unknown, TVariables = unknown>(
    operation: Operation,
    variables?: TVariables,
    _meta?: TransportRequestMeta,
  ): Promise<TResponse> {
    const route = resolveRoute('query', operation);
    return request<TResponse>(route, variables);
  },

  async mutate<TResponse = unknown, TVariables = unknown>(
    operation: Operation,
    variables?: TVariables,
    _meta?: TransportRequestMeta,
  ): Promise<TResponse> {
    const route = resolveRoute('mutate', operation);
    return request<TResponse>(route, variables);
  },

  subscribe<TData = unknown>(
    _channel: string,
    _handler: (data: TData) => void,
    _meta?: TransportRequestMeta,
  ): () => void {
    // REST adapter cannot do realtime subscriptions
    throw new Error(
      'REST transport does not support subscribe(). Use WebSocket adapter.',
    );
  },

  async upload<TResponse = unknown>(
    operation: Operation,
    payload: { file: unknown; extra?: Record<string, unknown> },
    _meta?: TransportRequestMeta,
  ): Promise<TResponse> {
    const { method, path } = resolveRoute('upload', operation);

    const form = new FormData();

    if (payload.file != null) {
      // RN FormData expects (name, file/blob)
      form.append('file', payload.file as any);
    }

    if (payload.extra) {
      for (const [k, v] of Object.entries(payload.extra)) {
        if (v === undefined || v === null) continue;
        form.append(k, String(v));
      }
    }

    const res = await axiosInstance.request<TResponse>({
      method,
      url: path,
      data: form,
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return res.data;
  },
};
