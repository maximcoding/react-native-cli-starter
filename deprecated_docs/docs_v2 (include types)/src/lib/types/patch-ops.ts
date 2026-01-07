import type { AppPlatform, RnsTarget } from './common';

/**
 * Patch operations are declarative + idempotent.
 * Engine executes them with backups and markers/anchors.
 */
export type PatchOpKind =
  | 'text.insertOnce'
  | 'text.replaceOnce'
  | 'json.merge'
  | 'plist.ensureKeys'
  | 'androidManifest.ensurePermissions';

export interface PatchOpBase {
  id: string;                 // stable id for auditing (e.g. "camera.permissions")
  kind: PatchOpKind;
  targets?: RnsTarget[];      // default: both
  platforms?: AppPlatform[];  // default: all supported
  file: string;               // relative path from project root
}

/** Insert content near an anchor (idempotent once). */
export interface TextInsertOnceOp extends PatchOpBase {
  kind: 'text.insertOnce';
  anchor: string;
  position: 'before' | 'after';
  content: string;
}

/** Replace a block near an anchor (idempotent once). */
export interface TextReplaceOnceOp extends PatchOpBase {
  kind: 'text.replaceOnce';
  anchor: string;
  match: string;
  replacement: string;
}

/** Merge JSON object (deep merge) into file content. */
export interface JsonMergeOp extends PatchOpBase {
  kind: 'json.merge';
  merge: Record<string, unknown>;
}

/** Ensure Info.plist keys exist (string values set by policy elsewhere). */
export interface PlistEnsureKeysOp extends PatchOpBase {
  kind: 'plist.ensureKeys';
  keys: string[];
}

/** Ensure Android manifest permissions exist. */
export interface AndroidManifestEnsurePermissionsOp extends PatchOpBase {
  kind: 'androidManifest.ensurePermissions';
  permissions: string[];
}

export type PatchOp =
  | TextInsertOnceOp
  | TextReplaceOnceOp
  | JsonMergeOp
  | PlistEnsureKeysOp
  | AndroidManifestEnsurePermissionsOp;

export interface PatchPlan {
  ops: PatchOp[];
  /** Which files will be modified (for plan output). */
  files: string[];
}
