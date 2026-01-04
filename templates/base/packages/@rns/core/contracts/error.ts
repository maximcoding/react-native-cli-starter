/**
 * FILE: packages/@rns/core/contracts/error.ts
 * PURPOSE: Error normalization contract + safe default normalizer
 * OWNERSHIP: CORE
 * 
 * PLUGIN-FREE GUARANTEE:
 * - Pure TypeScript types and utilities (no external dependencies)
 * - Safe default normalizer that handles any error type
 * - Plugins can extend error handling but must NOT modify this file
 */

/**
 * Normalized error shape (stable contract)
 */
export interface NormalizedError {
  message: string;
  code?: string;
  statusCode?: number;
  stack?: string;
  cause?: unknown;
  metadata?: Record<string, unknown>;
}

/**
 * Normalizes any error into a stable shape
 * Safe default implementation that handles all error types
 */
export function normalizeError(error: unknown): NormalizedError {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    };
  }

  if (typeof error === 'string') {
    return {
      message: error,
    };
  }

  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    return {
      message: String(err.message || err.error || 'Unknown error'),
      code: err.code ? String(err.code) : undefined,
      statusCode: typeof err.statusCode === 'number' ? err.statusCode : undefined,
      stack: err.stack ? String(err.stack) : undefined,
      cause: err.cause,
      metadata: err.metadata as Record<string, unknown> | undefined,
    };
  }

  return {
    message: 'Unknown error occurred',
  };
}

/**
 * Checks if an error is a network error (by status code)
 */
export function isNetworkError(error: NormalizedError): boolean {
  return error.statusCode !== undefined && error.statusCode >= 400 && error.statusCode < 600;
}

/**
 * Checks if an error is a client error (4xx)
 */
export function isClientError(error: NormalizedError): boolean {
  return error.statusCode !== undefined && error.statusCode >= 400 && error.statusCode < 500;
}

/**
 * Checks if an error is a server error (5xx)
 */
export function isServerError(error: NormalizedError): boolean {
  return error.statusCode !== undefined && error.statusCode >= 500 && error.statusCode < 600;
}

