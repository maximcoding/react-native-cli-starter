/**
 * FILE: src/lib/marker-patcher.ts
 * PURPOSE: Marker Patcher Engine v1 - safe code injection via markers (section 10)
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { readTextFile, writeTextFile, pathExists } from './fs';
import { findMarker, validateMarker, formatMarkerError, type MarkerType, CANONICAL_MARKERS } from './markers';
import { backupFile, createBackupDirectory } from './backup';
import { hasInjectionMarker, createInjectionMarker } from './idempotency';
import { CliError, ExitCode } from './errors';

/**
 * Patch operation for marker-based injection
 */
export interface MarkerPatch {
  markerType: MarkerType;
  file: string; // Relative path from project root
  content: string; // Content to inject
  capabilityId: string; // Plugin/module ID for traceability
  insertMode?: 'append' | 'prepend' | 'replace'; // Default: append
}

/**
 * Patch result
 */
export interface MarkerPatchResult {
  success: boolean;
  file: string;
  markerType: MarkerType;
  capabilityId: string;
  action: 'injected' | 'skipped' | 'error';
  error?: string;
  backupPath?: string;
}

/**
 * Patches a file by injecting content into a marker region
 * 
 * @param projectRoot - Project root directory
 * @param patch - Patch operation
 * @param dryRun - If true, don't write changes
 * @returns Patch result
 */
export function patchMarker(
  projectRoot: string,
  patch: MarkerPatch,
  dryRun: boolean = false
): MarkerPatchResult {
  const filePath = join(projectRoot, patch.file);

  // Validate file exists
  if (!pathExists(filePath)) {
    return {
      success: false,
      file: patch.file,
      markerType: patch.markerType,
      capabilityId: patch.capabilityId,
      action: 'error',
      error: `File not found: ${patch.file}`,
    };
  }

  // Find marker definition
  const markerDef = CANONICAL_MARKERS.find(m => m.type === patch.markerType);
  if (!markerDef) {
    return {
      success: false,
      file: patch.file,
      markerType: patch.markerType,
      capabilityId: patch.capabilityId,
      action: 'error',
      error: `Unknown marker type: ${patch.markerType}`,
    };
  }

  // Validate marker exists and is well-formed
  const validation = validateMarker(projectRoot, markerDef);
  if (!validation.valid) {
    return {
      success: false,
      file: patch.file,
      markerType: patch.markerType,
      capabilityId: patch.capabilityId,
      action: 'error',
      error: formatMarkerError(markerDef, filePath, validation.error!),
    };
  }

  // Check for duplicate injection (idempotency)
  const operationId = `${patch.capabilityId}-${patch.markerType}`;
  if (hasInjectionMarker(filePath, operationId)) {
    return {
      success: true,
      file: patch.file,
      markerType: patch.markerType,
      capabilityId: patch.capabilityId,
      action: 'skipped',
    };
  }

  // Find marker location
  const markerInfo = findMarker(filePath, patch.markerType);
  if (!markerInfo) {
    return {
      success: false,
      file: patch.file,
      markerType: patch.markerType,
      capabilityId: patch.capabilityId,
      action: 'error',
      error: `Marker not found: @rns-marker:${patch.markerType}`,
    };
  }

  // Read file content
  const originalContent = readTextFile(filePath);
  const lines = originalContent.split('\n');

  // Create backup before modification
  let backupPath: string | null = null;
  if (!dryRun) {
    const backupDir = createBackupDirectory(projectRoot, `patch-${patch.capabilityId}`);
    backupPath = backupFile(projectRoot, filePath, backupDir);
  }

  // Prepare injection content with traceability marker
  const injectionMarker = createInjectionMarker(operationId);
  const contentToInject = patch.insertMode === 'prepend'
    ? `${patch.content}\n${injectionMarker}\n`
    : `${injectionMarker}\n${patch.content}\n`;

  // Insert content based on mode
  const insertMode = patch.insertMode || 'append';
  let newLines: string[];

  if (insertMode === 'replace') {
    // Replace content between markers (excluding marker lines)
    newLines = [
      ...lines.slice(0, markerInfo.startLine - 1), // Lines before start marker
      lines[markerInfo.startLine - 1], // Start marker line
      contentToInject.trim(), // New content
      lines[markerInfo.endLine - 1], // End marker line
      ...lines.slice(markerInfo.endLine), // Lines after end marker
    ];
  } else if (insertMode === 'prepend') {
    // Insert at the beginning of marker region (after start marker)
    newLines = [
      ...lines.slice(0, markerInfo.startLine), // Lines up to and including start marker
      contentToInject.trim(), // New content
      ...lines.slice(markerInfo.startLine, markerInfo.endLine - 1), // Existing content in marker
      ...lines.slice(markerInfo.endLine - 1), // End marker and rest
    ];
  } else {
    // append (default): Insert before end marker
    newLines = [
      ...lines.slice(0, markerInfo.endLine - 1), // Lines up to end marker
      contentToInject.trim(), // New content
      lines[markerInfo.endLine - 1], // End marker line
      ...lines.slice(markerInfo.endLine), // Lines after end marker
    ];
  }

  // Write modified content
  if (!dryRun) {
    const newContent = newLines.join('\n');
    writeTextFile(filePath, newContent);
  }

  return {
    success: true,
    file: patch.file,
    markerType: patch.markerType,
    capabilityId: patch.capabilityId,
    action: 'injected',
    backupPath: backupPath || undefined,
  };
}

/**
 * Patches multiple markers in a single operation
 * 
 * @param projectRoot - Project root directory
 * @param patches - Array of patch operations
 * @param dryRun - If true, don't write changes
 * @returns Array of patch results
 */
export function patchMarkers(
  projectRoot: string,
  patches: MarkerPatch[],
  dryRun: boolean = false
): MarkerPatchResult[] {
  return patches.map(patch => patchMarker(projectRoot, patch, dryRun));
}

/**
 * Validates that all required markers exist before patching
 * 
 * @param projectRoot - Project root directory
 * @param patches - Array of patch operations
 * @returns Array of validation errors (empty if all valid)
 */
export function validatePatches(
  projectRoot: string,
  patches: MarkerPatch[]
): string[] {
  const errors: string[] = [];

  for (const patch of patches) {
    const markerDef = CANONICAL_MARKERS.find(m => m.type === patch.markerType);
    if (!markerDef) {
      errors.push(`Unknown marker type: ${patch.markerType} (capability: ${patch.capabilityId})`);
      continue;
    }

    const validation = validateMarker(projectRoot, markerDef);
    if (!validation.valid) {
      errors.push(
        `Marker validation failed for ${patch.capabilityId}: ${validation.error}`
      );
    }
  }

  return errors;
}

