/**
 * FILE: packages/@rns/core/contracts/transport.ts
 * LAYER: CORE contracts
 * OWNERSHIP: CORE
 * ---------------------------------------------------------------------
 * PURPOSE:
 *   Define a backend-agnostic interface for all data transports used
 *   in the app (REST, GraphQL, Firebase, WebSocket, gRPC, etc.).
 *
 *   This is the CORE contract - plugin-free with noop default implementation.
 *   Plugins provide real adapters (REST/GraphQL/WebSocket/etc.) that implement
 *   this interface.
 *
 * RESPONSIBILITIES:
 *   - Provide generic signatures for query/mutate/subscribe/upload.
 *   - Allow adapters to implement concrete protocols.
 *   - Provide noop default implementation (plugin-free guarantee).
 *
 * DATA-FLOW:
 *   service layer
 *      → transport (wrapper)
 *         → active adapter (REST/GraphQL/Firebase/WebSocket/...)
 *
 * EXTENSION GUIDELINES:
 *   - Keep interface stable; extend meta if needed.
 *   - Plugins implement concrete adapters but must NOT modify this file.
 * ---------------------------------------------------------------------
 */

/**
 * Transport operation identifier (string constant)
 * Plugins define operation constants (e.g., 'auth.login', 'user.profile')
 * 
 * BLUEPRINT REFERENCE: docs/ReactNativeCLITemplate/src/infra/transport/operations.ts
 */
export type Operation = string;

/**
 * Transport request metadata
 * 
 * BLUEPRINT REFERENCE: docs/ReactNativeCLITemplate/src/infra/transport/transport.types.ts
 */
export type TransportRequestMeta = {
  offline?: boolean;
  retry?: boolean;
  tags?: string | readonly string[]; // Query invalidation tags (simplified from blueprint Tag type)
};

/**
 * Transport interface (matches blueprint pattern)
 * Operation-based, not HTTP-method-based
 * Supports query/mutate/subscribe/upload operations
 * 
 * BLUEPRINT REFERENCE: docs/ReactNativeCLITemplate/src/infra/transport/transport.types.ts
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
 * Noop transport adapter (safe default, plugin-free)
 * All operations return empty/null responses
 * No actual network calls, no offline queue integration
 * 
 * Plugins replace this with real implementations (REST/GraphQL/WebSocket/etc.)
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
 * Uses Proxy to allow runtime replacement by plugins
 */
export const transport: Transport = new Proxy({} as Transport, {
  get(_target, prop) {
    return (activeTransport as any)[prop];
  },
});

/**
 * Set the active transport adapter (called by plugins)
 * Plugins can replace the default noop adapter with their implementation
 * 
 * WHY THIS PATTERN:
 * - Plugins need to swap noop adapter with real implementations (REST/GraphQL/WebSocket)
 * - Proxy pattern allows runtime replacement while keeping type safety
 * - Consistent pattern - same approach used for storage/offline contracts
 * - No complex abstractions - just swap the implementation
 * 
 * BLUEPRINT REFERENCE: docs/ReactNativeCLITemplate/src/infra/transport/transport.ts
 */
export function setTransport(adapter: Transport): void {
  activeTransport = adapter;
}
