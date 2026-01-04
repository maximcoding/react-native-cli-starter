/**
 * FILE: packages/@rns/core/contracts/transport.ts
 * PURPOSE: Transport facade + types + noop adapter default
 * OWNERSHIP: CORE
 * 
 * PLUGIN-FREE GUARANTEE:
 * - Pure TypeScript interfaces and noop implementations
 * - No HTTP/WebSocket/GraphQL dependencies (fetch, axios, etc.)
 * - Plugins can provide real implementations but must NOT modify this file
 * 
 * BLUEPRINT REFERENCE:
 * - Matches blueprint pattern: operation-based transport (query/mutate/subscribe/upload)
 * - Not HTTP-method-based - uses operations (string identifiers)
 * - Plugins implement concrete adapters (REST/GraphQL/WebSocket/etc.)
 */

/**
 * Transport operation identifier (string constant)
 * Plugins define operation constants (e.g., 'auth.login', 'user.profile')
 */
export type Operation = string;

/**
 * Transport request metadata
 */
export type TransportRequestMeta = {
  offline?: boolean;
  retry?: boolean;
  tags?: string | readonly string[]; // Query invalidation tags
};

/**
 * Transport interface (matches blueprint pattern)
 * Operation-based, not HTTP-method-based
 * Supports query/mutate/subscribe/upload operations
 */
export interface Transport {
  /**
   * Execute a query operation (read-only, cacheable)
   */
  query<TResponse = unknown, TVariables = unknown>(
    operation: Operation,
    variables?: TVariables,
    meta?: TransportRequestMeta,
  ): Promise<TResponse>;

  /**
   * Execute a mutation operation (write, not cacheable)
   */
  mutate<TResponse = unknown, TVariables = unknown>(
    operation: Operation,
    variables?: TVariables,
    meta?: TransportRequestMeta,
  ): Promise<TResponse>;

  /**
   * Subscribe to a channel (real-time updates)
   * Returns unsubscribe function
   */
  subscribe<TData = unknown>(
    channel: string,
    handler: (data: TData) => void,
    meta?: TransportRequestMeta,
  ): () => void;

  /**
   * Upload a file
   */
  upload<TResponse = unknown>(
    operation: Operation,
    payload: { file: unknown; extra?: Record<string, unknown> },
    meta?: TransportRequestMeta,
  ): Promise<TResponse>;
}

/**
 * Noop transport adapter (safe default)
 * All operations return empty/null responses
 * No actual network calls, no offline queue integration
 */
class NoopTransportAdapter implements Transport {
  async query<TResponse = unknown, _TVariables = unknown>(
    _operation: Operation,
    _variables?: unknown,
    _meta?: TransportRequestMeta,
  ): Promise<TResponse> {
    return null as TResponse;
  }

  async mutate<TResponse = unknown, _TVariables = unknown>(
    _operation: Operation,
    _variables?: unknown,
    _meta?: TransportRequestMeta,
  ): Promise<TResponse> {
    return null as TResponse;
  }

  subscribe<TData = unknown>(
    _channel: string,
    _handler: (data: TData) => void,
    _meta?: TransportRequestMeta,
  ): () => void {
    // Return no-op unsubscribe function
    return () => {
      // No-op
    };
  }

  async upload<TResponse = unknown>(
    _operation: Operation,
    _payload: { file: unknown; extra?: Record<string, unknown> },
    _meta?: TransportRequestMeta,
  ): Promise<TResponse> {
    return null as TResponse;
  }
}

/**
 * Default transport adapter (noop, can be replaced via plugins)
 * Plugins should replace this instance with their adapter implementation
 */
let activeTransport: Transport = new NoopTransportAdapter();

/**
 * Get the active transport adapter
 */
export const transport: Transport = new Proxy({} as Transport, {
  get(_target, prop) {
    return (activeTransport as any)[prop];
  },
});

/**
 * Set the active transport adapter (called by plugins)
 * Plugins can replace the default noop adapter with their implementation
 */
export function setTransport(adapter: Transport): void {
  activeTransport = adapter;
}
