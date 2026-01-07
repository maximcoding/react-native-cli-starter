/**
 * FILE: media-picker.ts
 * LAYER: @rns/core (contracts)
 * PURPOSE: Select images/videos/documents from the device library.
 *
 * NOTE: This is intentionally high-level so different providers can implement it:
 * - Expo ImagePicker / DocumentPicker
 * - react-native-image-picker
 * - custom native module
 */

export type MediaKind = 'image' | 'video' | 'mixed' | 'document';

export interface PickOptions {
  kind: MediaKind;
  multiple?: boolean;
  /**
   * If true, allow the provider to return a base64 payload when supported.
   * Default: false
   */
  includeBase64?: boolean;
}

export interface PickedMedia {
  uri: string;
  kind: MediaKind;
  mimeType?: string;
  fileName?: string;
  fileSizeBytes?: number;
  width?: number;
  height?: number;
  durationMs?: number;
  base64?: string;
}

export interface MediaPickerInterface {
  /**
   * Opens a native picker UI and resolves with selected assets.
   * Returns empty array if user cancels.
   */
  pick(options: PickOptions): Promise<PickedMedia[]>;
}
