/**
 * FILE: src/lib/idempotency.ts
 * PURPOSE: Idempotency checks to prevent duplicate injections (section 8)
 * OWNERSHIP: CLI
 */

import { readTextFile, pathExists } from './fs';
import { CliError, ExitCode } from './errors';

/**
 * Marker pattern for tracking injections
 * Format: // @rns-inject:<operationId>:<timestamp>
 */
export const INJECTION_MARKER_PATTERN = /\/\/\s*@rns-inject:([^:]+):([^\s]+)/;

/**
 * Checks if an injection marker exists in a file
 * 
 * @param filePath - Path to file to check
 * @param operationId - Operation ID to check for
 * @returns true if marker exists, false otherwise
 */
export function hasInjectionMarker(filePath: string, operationId: string): boolean {
  if (!pathExists(filePath)) {
    return false;
  }

  try {
    const content = readTextFile(filePath);
    const regex = new RegExp(`@rns-inject:${operationId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:`, 'g');
    return regex.test(content);
  } catch {
    return false;
  }
}

/**
 * Creates an injection marker comment
 * 
 * @param operationId - Unique operation ID (e.g., plugin ID, pack ID)
 * @param timestamp - Timestamp of injection
 * @returns Marker comment string
 */
export function createInjectionMarker(operationId: string, timestamp?: string): string {
  const ts = timestamp || new Date().toISOString();
  return `// @rns-inject:${operationId}:${ts}`;
}

/**
 * Checks if a file modification would be idempotent
 * For idempotent operations, re-running should be a NO-OP
 * 
 * @param filePath - Path to file to check
 * @param operationId - Operation ID
 * @param expectedContent - Expected content after operation
 * @returns true if operation is idempotent (already applied), false if needs application
 */
export function isIdempotent(
  filePath: string,
  operationId: string,
  expectedContent?: string
): boolean {
  // If file doesn't exist, not idempotent (needs creation)
  if (!pathExists(filePath)) {
    return false;
  }

  // Check for injection marker
  if (hasInjectionMarker(filePath, operationId)) {
    return true;
  }

  // If expected content provided, check if file already matches
  if (expectedContent) {
    try {
      const currentContent = readTextFile(filePath);
      if (currentContent === expectedContent) {
        return true;
      }
    } catch {
      // If we can't read, assume not idempotent
      return false;
    }
  }

  return false;
}

/**
 * Validates that an operation is idempotent (safe to re-run)
 * Throws if operation would create duplicates
 * 
 * @param filePath - Path to file to check
 * @param operationId - Operation ID
 * @param operationType - Type of operation (for error messages)
 */
export function validateIdempotent(
  filePath: string,
  operationId: string,
  operationType: string = 'operation'
): void {
  if (hasInjectionMarker(filePath, operationId)) {
    throw new CliError(
      `${operationType} "${operationId}" has already been applied to ${filePath}. ` +
      `Re-running would create duplicates. This operation is idempotent and safe to skip.`,
      ExitCode.VALIDATION_STATE_FAILURE
    );
  }
}

/**
 * Ownership zones for idempotency checks
 */
export const OWNERSHIP_ZONES = {
  SYSTEM: [
    'packages/@rns/**',
    '.rns/**',
  ],
  USER: [
    'src/**',
    'assets/**',
  ],
} as const;

/**
 * Determines if a file path is in a CLI-managed zone
 * 
 * @param filePath - Absolute file path
 * @param projectRoot - Project root directory
 * @returns true if CLI-managed, false if user-owned
 */
export function isCliManagedZone(filePath: string, projectRoot: string): boolean {
  const { relative } = require('path');
  const relPath = relative(projectRoot, filePath);

  // Check SYSTEM zones
  for (const pattern of OWNERSHIP_ZONES.SYSTEM) {
    if (matchesPattern(relPath, pattern)) {
      return true;
    }
  }

  return false;
}

/**
 * Simple pattern matching (supports ** wildcards)
 */
function matchesPattern(path: string, pattern: string): boolean {
  // Replace ** with placeholder first to avoid conflict with * replacement
  // Then replace * with [^/]*, then replace placeholder with .*
  const placeholder = '__DOUBLE_STAR_PLACEHOLDER__';
  let regexStr = pattern.replace(/\*\*/g, placeholder);
  regexStr = regexStr.replace(/\*/g, '[^/]*');
  // Replace placeholder back with .* (match any chars including slashes)
  regexStr = regexStr.replace(placeholder, '.*');
  const regex = new RegExp('^' + regexStr + '$');
  return regex.test(path);
}

