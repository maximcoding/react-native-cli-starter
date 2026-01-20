/**
 * FILE: src/lib/markers.ts
 * PURPOSE: Marker contract and validation (section 9)
 * OWNERSHIP: CLI
 */

import { readTextFile, pathExists } from './fs';
import { CliError, ExitCode } from './errors';

/**
 * Canonical marker types for plugin/module integration
 */
export type MarkerType = 
  | 'imports'      // Import statements region
  | 'providers'    // Provider wrappers region
  | 'init-steps'   // Initialization steps region
  | 'root'         // Root component region
  | 'registrations'; // Registration calls region

/**
 * Marker format: // @rns-marker:<type>:start and // @rns-marker:<type>:end
 */
export const MARKER_START_PATTERN = /\/\/\s*@rns-marker:([^:]+):start/;
export const MARKER_END_PATTERN = /\/\/\s*@rns-marker:([^:]+):end/;

/**
 * Marker definition
 */
export interface MarkerDefinition {
  type: MarkerType;
  file: string; // Relative path from project root
  description: string; // Human-readable description
  required: boolean; // Whether marker must exist
}

/**
 * Canonical marker contract (section 9)
 * These markers must exist in CORE and be validated before patching
 */
export const CANONICAL_MARKERS: MarkerDefinition[] = [
  {
    type: 'imports',
    file: 'packages/@rns/runtime/index.ts',
    description: 'Import statements region for plugin providers/hooks',
    required: true,
  },
  {
    type: 'providers',
    file: 'packages/@rns/runtime/index.ts',
    description: 'Provider wrappers region for plugin providers',
    required: true,
  },
  {
    type: 'init-steps',
    file: 'packages/@rns/runtime/core-init.ts',
    description: 'Initialization steps region for plugin init code',
    required: true,
  },
  {
    type: 'root',
    file: 'packages/@rns/runtime/index.ts',
    description: 'Root component region for replacing MinimalUI',
    required: true,
  },
  {
    type: 'registrations',
    file: 'packages/@rns/runtime/core-init.ts',
    description: 'Registration calls region for plugin registrations',
    required: false, // Optional, plugins may not need registrations
  },
];

/**
 * Finds a marker in a file
 * 
 * @param filePath - Absolute path to file
 * @param markerType - Type of marker to find
 * @returns Object with start and end line numbers, or null if not found
 */
export function findMarker(
  filePath: string,
  markerType: MarkerType
): { startLine: number; endLine: number; startContent: string; endContent: string } | null {
  if (!pathExists(filePath)) {
    return null;
  }

  try {
    const content = readTextFile(filePath);
    const lines = content.split('\n');
    
    let startLine: number | null = null;
    let endLine: number | null = null;
    let startContent = '';
    let endContent = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const startMatch = line.match(MARKER_START_PATTERN);
      const endMatch = line.match(MARKER_END_PATTERN);

      if (startMatch && startMatch[1] === markerType) {
        startLine = i + 1; // 1-based line numbers
        startContent = line;
      }

      if (endMatch && endMatch[1] === markerType) {
        endLine = i + 1; // 1-based line numbers
        endContent = line;
        break; // Found both, exit
      }
    }

    if (startLine !== null && endLine !== null && startLine < endLine) {
      return { startLine, endLine, startContent, endContent };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Validates that a marker exists and is well-formed
 * 
 * @param projectRoot - Project root directory
 * @param marker - Marker definition to validate
 * @returns Validation result with error message if invalid
 */
export function validateMarker(
  projectRoot: string,
  marker: MarkerDefinition
): { valid: boolean; error?: string } {
  const { join } = require('path');
  const filePath = join(projectRoot, marker.file);

  if (!pathExists(filePath)) {
    return {
      valid: false,
      error: `Marker file not found: ${marker.file}`,
    };
  }

  const markerInfo = findMarker(filePath, marker.type);

  if (!markerInfo) {
    if (marker.required) {
      return {
        valid: false,
        error: `Required marker "@rns-marker:${marker.type}" not found in ${marker.file}`,
      };
    }
    // Optional markers are valid if not found
    return { valid: true };
  }

  // Validate marker is well-formed (start before end)
  if (markerInfo.startLine >= markerInfo.endLine) {
    return {
      valid: false,
      error: `Marker "@rns-marker:${marker.type}" in ${marker.file} is malformed: start line (${markerInfo.startLine}) must be before end line (${markerInfo.endLine})`,
    };
  }

  return { valid: true };
}

/**
 * Validates that a marker exists and is well-formed in a specific file
 * 
 * @param filePath - Absolute path to file
 * @param markerType - Marker type to validate
 * @param required - Whether marker is required (default: true)
 * @returns Validation result with error message if invalid
 */
export function validateMarkerInFile(
  filePath: string,
  markerType: MarkerType,
  required: boolean = true
): { valid: boolean; error?: string } {
  if (!pathExists(filePath)) {
    return {
      valid: false,
      error: `Marker file not found: ${filePath}`,
    };
  }

  const markerInfo = findMarker(filePath, markerType);

  if (!markerInfo) {
    if (required) {
      return {
        valid: false,
        error: `Required marker "@rns-marker:${markerType}" not found in ${filePath}`,
      };
    }
    // Optional markers are valid if not found
    return { valid: true };
  }

  // Validate marker is well-formed (start before end)
  if (markerInfo.startLine >= markerInfo.endLine) {
    return {
      valid: false,
      error: `Marker "@rns-marker:${markerType}" in ${filePath} is malformed: start line (${markerInfo.startLine}) must be before end line (${markerInfo.endLine})`,
    };
  }

  return { valid: true };
}

/**
 * Validates all canonical markers in a project
 * 
 * @param projectRoot - Project root directory
 * @returns Array of validation errors (empty if all valid)
 */
export function validateAllMarkers(projectRoot: string): string[] {
  const errors: string[] = [];

  for (const marker of CANONICAL_MARKERS) {
    const result = validateMarker(projectRoot, marker);
    if (!result.valid) {
      errors.push(result.error!);
    }
  }

  return errors;
}

/**
 * Gets marker content (lines between start and end markers)
 * 
 * @param filePath - Absolute path to file
 * @param markerType - Type of marker
 * @returns Content between markers (excluding marker lines), or null if not found
 */
export function getMarkerContent(
  filePath: string,
  markerType: MarkerType
): string | null {
  const markerInfo = findMarker(filePath, markerType);
  if (!markerInfo) {
    return null;
  }

  try {
    const content = readTextFile(filePath);
    const lines = content.split('\n');
    
    // Extract lines between markers (exclusive of marker lines)
    const contentLines = lines.slice(markerInfo.startLine, markerInfo.endLine - 1);
    return contentLines.join('\n');
  } catch {
    return null;
  }
}

/**
 * Creates a marker comment
 * 
 * @param markerType - Type of marker
 * @param position - 'start' or 'end'
 * @returns Marker comment string
 */
export function createMarkerComment(markerType: MarkerType, position: 'start' | 'end'): string {
  return `// @rns-marker:${markerType}:${position}`;
}

/**
 * Formats a helpful error message when a marker is missing or corrupted
 * 
 * @param marker - Marker definition
 * @param filePath - Absolute path to file
 * @param error - Error details
 * @returns Actionable error message
 */
export function formatMarkerError(
  marker: MarkerDefinition,
  filePath: string,
  error: string
): string {
  return `Marker validation failed: ${error}\n\n` +
    `Marker: @rns-marker:${marker.type}\n` +
    `File: ${marker.file}\n` +
    `Description: ${marker.description}\n\n` +
    `To restore this marker:\n` +
    `1. Ensure the file exists at: ${filePath}\n` +
    `2. Add the marker pair:\n` +
    `   ${createMarkerComment(marker.type, 'start')}\n` +
    `   // ... your code here ...\n` +
    `   ${createMarkerComment(marker.type, 'end')}\n`;
}

