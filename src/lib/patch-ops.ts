/**
 * FILE: src/lib/patch-ops.ts
 * PURPOSE: Patch Operations System for native/config files (section 12)
 * OWNERSHIP: CLI
 * 
 * This engine provides declarative, idempotent patch operations for:
 * - Expo config (app.json/app.config.*)
 * - iOS plist keys / entitlements
 * - Android manifest permissions/features
 * - anchored text edits (Gradle/Podfile)
 * 
 * Rules: anchored, insert-once, backed up under `.rns/backups/...`, traceable by plugin id.
 */

import { join } from 'path';
import { readTextFile, writeTextFile, writeJsonFile, readJsonFile, pathExists } from './fs';
import { backupFile, createBackupDirectory } from './backup';
import { hasInjectionMarker, createInjectionMarker } from './idempotency';
import type {
  PatchOp,
  PatchOpResult,
  ExpoConfigPatchOp,
  PlistPatchOp,
  EntitlementsPatchOp,
  AndroidManifestPatchOp,
  GradlePatchOp,
  PodfilePatchOp,
  TextAnchorPatchOp,
} from './types/patch-ops';

/**
 * Applies a single patch operation
 * 
 * @param projectRoot - Project root directory
 * @param patch - Patch operation to apply
 * @param dryRun - If true, don't write changes
 * @returns Patch result
 */
export function applyPatchOp(
  projectRoot: string,
  patch: PatchOp,
  dryRun: boolean = false
): PatchOpResult {
  const filePath = join(projectRoot, patch.file);

  // Validate file exists
  if (!pathExists(filePath)) {
    return {
      success: false,
      file: patch.file,
      capabilityId: patch.capabilityId,
      operationId: patch.operationId,
      patchType: patch.type,
      action: 'error',
      error: `File not found: ${patch.file}`,
    };
  }

  // Check for duplicate operation (idempotency)
  // Different patch types use different idempotency tracking
  if (patch.type === 'expo-config') {
    // Expo config uses _rns_patches array in the JSON
    try {
      const config = readJsonFile<Record<string, unknown>>(filePath);
      const patches = config._rns_patches as string[] | undefined;
      if (patches && patches.includes(patch.operationId)) {
        return {
          success: true,
          file: patch.file,
          capabilityId: patch.capabilityId,
          operationId: patch.operationId,
          patchType: patch.type,
          action: 'skipped',
        };
      }
    } catch {
      // If we can't read the file, continue with normal patch
    }
  } else if (patch.type === 'gradle' || patch.type === 'podfile' || patch.type === 'text-anchor') {
    // Gradle/Podfile/text files use @rns-operation: comments
    const content = readTextFile(filePath);
    if (content.includes(`@rns-operation:${patch.operationId}`)) {
      return {
        success: true,
        file: patch.file,
        capabilityId: patch.capabilityId,
        operationId: patch.operationId,
        patchType: patch.type,
        action: 'skipped',
      };
    }
  } else {
    // Other types (plist, android-manifest) use @rns-inject: markers or similar
    if (hasInjectionMarker(filePath, patch.operationId)) {
      return {
        success: true,
        file: patch.file,
        capabilityId: patch.capabilityId,
        operationId: patch.operationId,
        patchType: patch.type,
        action: 'skipped',
      };
    }
  }

  // Create backup before modification
  let backupPath: string | null = null;
  if (!dryRun) {
    const backupDir = createBackupDirectory(projectRoot, `patch-${patch.capabilityId}`);
    backupPath = backupFile(projectRoot, filePath, backupDir);
  }

  // Apply patch based on type
  try {
    if (!dryRun) {
      switch (patch.type) {
        case 'expo-config':
          applyExpoConfigPatch(filePath, patch);
          break;
        case 'plist':
          applyPlistPatch(filePath, patch);
          break;
        case 'entitlements':
          applyEntitlementsPatch(filePath, patch);
          break;
        case 'android-manifest':
          applyAndroidManifestPatch(filePath, patch);
          break;
        case 'gradle':
        case 'podfile':
        case 'text-anchor':
          applyTextAnchorPatch(filePath, patch);
          break;
        default:
          throw new Error(`Unknown patch type: ${(patch as any).type}`);
      }
    }

    return {
      success: true,
      file: patch.file,
      capabilityId: patch.capabilityId,
      operationId: patch.operationId,
      patchType: patch.type,
      action: 'applied',
      backupPath: backupPath || undefined,
    };
  } catch (error) {
    return {
      success: false,
      file: patch.file,
      capabilityId: patch.capabilityId,
      operationId: patch.operationId,
      patchType: patch.type,
      action: 'error',
      error: error instanceof Error ? error.message : String(error),
      backupPath: backupPath || undefined,
    };
  }
}

/**
 * Applies multiple patch operations
 * 
 * @param projectRoot - Project root directory
 * @param patches - Array of patch operations
 * @param dryRun - If true, don't write changes
 * @returns Array of patch results
 */
export function applyPatchOps(
  projectRoot: string,
  patches: PatchOp[],
  dryRun: boolean = false
): PatchOpResult[] {
  return patches.map(patch => applyPatchOp(projectRoot, patch, dryRun));
}

/**
 * Applies Expo config patch
 */
function applyExpoConfigPatch(filePath: string, patch: ExpoConfigPatchOp): void {
  const config = readJsonFile<Record<string, unknown>>(filePath);
  
  // Navigate to the path and set/merge value
  const pathParts = patch.path.split('.');
  let current: any = config;
  
  // Navigate to parent object
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
      current[part] = {};
    }
    current = current[part];
  }
  
  const lastKey = pathParts[pathParts.length - 1];
  const mode = patch.mode || 'set';
  
  if (mode === 'set') {
    current[lastKey] = patch.value;
  } else if (mode === 'merge') {
    // Deep merge objects, preserving structure
    if (typeof current[lastKey] === 'object' && current[lastKey] !== null && typeof patch.value === 'object' && patch.value !== null) {
      if (Array.isArray(current[lastKey]) || Array.isArray(patch.value)) {
        // Arrays don't merge, replace
        current[lastKey] = patch.value;
      } else {
        // Deep merge objects
        current[lastKey] = deepMerge(current[lastKey] as Record<string, unknown>, patch.value as Record<string, unknown>);
      }
    } else {
      current[lastKey] = patch.value;
    }
  } else if (mode === 'append') {
    if (!Array.isArray(current[lastKey])) {
      current[lastKey] = [];
    }
    const arr = current[lastKey] as unknown[];
    
    // If patch.value is an array, append each element individually
    // If patch.value is a single value, append it if not already present
    if (Array.isArray(patch.value)) {
      // Append array elements (check for duplicates per element)
      for (const item of patch.value) {
        if (!arr.includes(item)) {
          arr.push(item);
        }
      }
    } else {
      // Append single value (check if already exists)
      if (!arr.includes(patch.value)) {
        arr.push(patch.value);
      }
    }
  }
  
  // Add injection marker as comment in JSON (store in a metadata field)
  // For JSON files, we'll add a comment field if possible, or use a special metadata object
  // Since JSON doesn't support comments, we'll track idempotency via the operationId in a metadata field
  if (!config._rns_patches) {
    config._rns_patches = [];
  }
  const patches = (config._rns_patches as string[]) || [];
  if (!patches.includes(patch.operationId)) {
    patches.push(patch.operationId);
  }
  config._rns_patches = patches;
  
  writeJsonFile(filePath, config);
}

/**
 * Applies plist patch (XML-based)
 */
function applyPlistPatch(filePath: string, patch: PlistPatchOp): void {
  let content = readTextFile(filePath);
  
  // Check if already patched
  if (content.includes(`<!-- @rns-patch:${patch.operationId} -->`)) {
    return; // Already applied
  }
  
  // Simple XML/plist manipulation
  // Find the <dict> or <array> root and add key-value pair
  const keyPattern = new RegExp(`<key>${escapeXml(patch.key)}</key>\\s*<[^>]+>`, 'g');
  const exists = keyPattern.test(content);
  
  if (exists && patch.mode === 'append' && Array.isArray(patch.value)) {
    // Append to existing array
    const arrayPattern = new RegExp(`<key>${escapeXml(patch.key)}</key>\\s*<array>([\\s\\S]*?)</array>`, 'g');
    content = content.replace(arrayPattern, (match, arrayContent) => {
      const newItems = (patch.value as string[])
        .filter((v: string) => !arrayContent.includes(`<string>${escapeXml(String(v))}</string>`))
        .map((v: string) => `\n        <string>${escapeXml(String(v))}</string>`)
        .join('');
      return `<key>${escapeXml(patch.key)}</key>\n        <array>${arrayContent}${newItems}\n        </array>`;
    });
  } else if (!exists) {
    // Add new key-value pair before </dict> or </plist>
    const valueXml = formatPlistValue(patch.value);
    const injectionMarker = `<!-- @rns-patch:${patch.operationId} -->`;
    const newEntry = `\n    ${injectionMarker}\n    <key>${escapeXml(patch.key)}</key>\n    ${valueXml}`;
    
    // Insert before closing </dict> or </plist>
    content = content.replace(/(\s*)(<\/dict>|<\/plist>)/, `${newEntry}$1$2`);
  }
  
  writeTextFile(filePath, content);
}

/**
 * Applies entitlements patch (XML-based, similar to plist)
 */
function applyEntitlementsPatch(filePath: string, patch: EntitlementsPatchOp): void {
  let content = readTextFile(filePath);
  
  // Check if already patched
  if (content.includes(`<!-- @rns-patch:${patch.operationId} -->`)) {
    return; // Already applied
  }
  
  // Find or add entitlement key
  const keyPattern = new RegExp(`<key>${escapeXml(patch.key)}</key>\\s*<[^>]+>`, 'g');
  const exists = keyPattern.test(content);
  
  if (!exists) {
    const valueXml = formatPlistValue(patch.value);
    const injectionMarker = `<!-- @rns-patch:${patch.operationId} -->`;
    const newEntry = `\n    ${injectionMarker}\n    <key>${escapeXml(patch.key)}</key>\n    ${valueXml}`;
    
    // Insert before closing </dict> or </plist>
    content = content.replace(/(\s*)(<\/dict>|<\/plist>)/, `${newEntry}$1$2`);
  }
  
  writeTextFile(filePath, content);
}

/**
 * Applies Android manifest patch
 */
function applyAndroidManifestPatch(filePath: string, patch: AndroidManifestPatchOp): void {
  let content = readTextFile(filePath);
  
  // Check if already patched
  const patchMarker = `<!-- @rns-patch:${patch.operationId} -->`;
  if (content.includes(patchMarker)) {
    return; // Already applied
  }
  
  if (patch.action === 'add') {
    // Build XML element
    let element = '';
    if (patch.manifestOp === 'permission') {
      element = `<uses-permission android:name="${patch.name}" />`;
    } else if (patch.manifestOp === 'feature') {
      element = `<uses-feature android:name="${patch.name}" android:required="false" />`;
    } else if (patch.manifestOp === 'meta-data') {
      const value = patch.attributes?.value || '';
      element = `<meta-data android:name="${patch.name}" android:value="${value}" />`;
    } else {
      // activity, service, receiver
      const attrs = patch.attributes || {};
      const attrsStr = Object.entries(attrs)
        .map(([k, v]) => `android:${k}="${v}"`)
        .join(' ');
      element = `<${patch.manifestOp} android:name="${patch.name}" ${attrsStr} />`;
    }
    
    // Check if element already exists
    if (content.includes(element.replace(/\s+/g, ' ').trim())) {
      return; // Already exists
    }
    
    // Insert before </manifest>
    const injectionMarker = `    ${patchMarker}\n    `;
    content = content.replace(/(\s*)(<\/manifest>)/, `${injectionMarker}${element}\n$1$2`);
  } else if (patch.action === 'remove') {
    // Remove element (if it exists)
    // This is more complex - we'd need to parse XML properly
    // For now, we'll use a simple pattern match
    const patterns = [
      new RegExp(`\\s*<!-- @rns-patch:${patch.operationId} -->\\s*<uses-permission[^>]*android:name="${patch.name}"[^>]*/>\\s*`, 'g'),
      new RegExp(`\\s*<!-- @rns-patch:${patch.operationId} -->\\s*<uses-feature[^>]*android:name="${patch.name}"[^>]*/>\\s*`, 'g'),
    ];
    
    for (const pattern of patterns) {
      content = content.replace(pattern, '');
    }
  }
  
  writeTextFile(filePath, content);
}

/**
 * Applies text anchor patch (Gradle, Podfile, or generic text)
 */
function applyTextAnchorPatch(
  filePath: string,
  patch: GradlePatchOp | PodfilePatchOp | TextAnchorPatchOp
): void {
  let content = readTextFile(filePath);
  
  // Check if already patched (use @rns-operation: marker for Gradle/Podfile/text)
  const operationMarkerCheck = `@rns-operation:${patch.operationId}`;
  if (content.includes(operationMarkerCheck)) {
    return; // Already applied
  }
  
  // Check if content already exists (idempotency)
  if (patch.ensureUnique && content.includes(patch.content.trim())) {
    return; // Content already exists
  }
  
  // Find anchor
  const anchorIndex = content.indexOf(patch.anchor);
  if (anchorIndex === -1) {
    throw new Error(`Anchor not found in file: "${patch.anchor}"`);
  }
  
  // Insert content with operation marker (use @rns-operation: for Gradle/Podfile/text files)
  const operationMarker = `// @rns-operation:${patch.operationId}`;
  const contentToInsert = patch.mode === 'before'
    ? `${patch.content}\n    ${operationMarker}\n`
    : `\n    ${operationMarker}\n    ${patch.content}`;
  
  const insertPos = patch.mode === 'before'
    ? anchorIndex
    : anchorIndex + patch.anchor.length;
  
  content = content.slice(0, insertPos) + contentToInsert + content.slice(insertPos);
  
  writeTextFile(filePath, content);
}

/**
 * Formats a value as plist XML
 */
function formatPlistValue(value: string | number | boolean | string[]): string {
  if (typeof value === 'string') {
    return `<string>${escapeXml(value)}</string>`;
  } else if (typeof value === 'number') {
    return `<integer>${value}</integer>`;
  } else if (typeof value === 'boolean') {
    return value ? '<true/>' : '<false/>';
  } else if (Array.isArray(value)) {
    const items = value.map(v => `\n        <string>${escapeXml(v)}</string>`).join('');
    return `<array>${items}\n        </array>`;
  }
  return `<string>${escapeXml(String(value))}</string>`;
}

/**
 * Deep merges two objects, preserving nested structure
 */
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = result[key];
      
      if (
        typeof targetValue === 'object' &&
        targetValue !== null &&
        !Array.isArray(targetValue) &&
        typeof sourceValue === 'object' &&
        sourceValue !== null &&
        !Array.isArray(sourceValue)
      ) {
        // Recursively merge nested objects
        result[key] = deepMerge(targetValue as Record<string, unknown>, sourceValue as Record<string, unknown>);
      } else {
        // Replace with source value
        result[key] = sourceValue;
      }
    }
  }
  
  return result;
}

/**
 * Escapes XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
