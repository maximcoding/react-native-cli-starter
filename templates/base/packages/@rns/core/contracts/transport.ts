/**
 * FILE: packages/@rns/core/contracts/transport.ts
 * PURPOSE: Transport facade + types + noop adapter default
 * OWNERSHIP: CORE
 * 
 * PLUGIN-FREE GUARANTEE:
 * - Pure TypeScript interfaces and noop implementations
 * - No HTTP/WebSocket dependencies (fetch, axios, etc.)
 * - Plugins can provide real implementations but must NOT modify this file
 */

/**
 * HTTP method types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Request configuration
 */
export interface TransportRequest {
  url: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  signal?: AbortSignal;
}

/**
 * Response shape
 */
export interface TransportResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

/**
 * Transport adapter interface
 */
export interface TransportAdapter {
  request<T = unknown>(config: TransportRequest): Promise<TransportResponse<T>>;
}

/**
 * Noop transport adapter (safe default)
 * All requests return empty responses
 */
class NoopTransportAdapter implements TransportAdapter {
  async request<T = unknown>(_config: TransportRequest): Promise<TransportResponse<T>> {
    return {
      data: null as T,
      status: 200,
      statusText: 'OK',
      headers: {},
    };
  }
}

/**
 * Default transport adapter (noop, can be replaced via plugins)
 */
export const transport: TransportAdapter = new NoopTransportAdapter();

/**
 * Convenience methods for common HTTP operations
 */
export const transportHelpers = {
  get<T = unknown>(url: string, config?: Omit<TransportRequest, 'url' | 'method'>): Promise<TransportResponse<T>> {
    return transport.request<T>({ ...config, url, method: 'GET' });
  },

  post<T = unknown>(url: string, body?: unknown, config?: Omit<TransportRequest, 'url' | 'method' | 'body'>): Promise<TransportResponse<T>> {
    return transport.request<T>({ ...config, url, method: 'POST', body });
  },

  put<T = unknown>(url: string, body?: unknown, config?: Omit<TransportRequest, 'url' | 'method' | 'body'>): Promise<TransportResponse<T>> {
    return transport.request<T>({ ...config, url, method: 'PUT', body });
  },

  patch<T = unknown>(url: string, body?: unknown, config?: Omit<TransportRequest, 'url' | 'method' | 'body'>): Promise<TransportResponse<T>> {
    return transport.request<T>({ ...config, url, method: 'PATCH', body });
  },

  delete<T = unknown>(url: string, config?: Omit<TransportRequest, 'url' | 'method'>): Promise<TransportResponse<T>> {
    return transport.request<T>({ ...config, url, method: 'DELETE' });
  },
};

