/**
 * FILE: src/lib/init/utils.ts
 * PURPOSE: Utility functions and constants for init pipeline
 * OWNERSHIP: CLI
 */

import type { InitInputs } from './types';

// Default values
export const DEFAULT_TARGET = 'expo';
export const DEFAULT_LANGUAGE = 'ts';
export const DEFAULT_PACKAGE_MANAGER = 'npm';
export const DEFAULT_RN_VERSION = 'latest';
export const DEFAULT_NAV_PRESET: InitInputs['navigationPreset'] = 'stack-tabs';
export const DEFAULT_LOCALES = ['en']; // English is always included by default
export const DEFAULT_CORE_TOGGLES = {
  alias: true,
  svg: true,
  fonts: true,
  env: true,
};

/**
 * Available locales for I18n selection
 */
export const AVAILABLE_LOCALES = [
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Russian' },
  { code: 'de', name: 'German' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'it', name: 'Italian' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'tr', name: 'Turkish' },
];

/**
 * Extracts package name from dependency spec string
 * Handles both scoped (@scope/package@version) and unscoped (package@version) packages
 * 
 * @param depSpec - Dependency spec string (e.g., "@expo/vector-icons@latest" or "react-native@0.74.0")
 * @returns Package name (e.g., "@expo/vector-icons" or "react-native")
 */
export function extractPackageName(depSpec: string): string {
  // For scoped packages like "@expo/vector-icons@latest", split on '@' gives ['', 'expo/vector-icons', 'latest']
  // For unscoped packages like "react-native@latest", split on '@' gives ['react-native', 'latest']
  const parts = depSpec.split('@');
  
  if (depSpec.startsWith('@')) {
    // Scoped package: join first two parts (empty string + scope/name)
    // e.g., "@expo/vector-icons@latest" -> ['', 'expo/vector-icons', 'latest'] -> '@expo/vector-icons'
    return `@${parts[1]}`;
  } else {
    // Unscoped package: first part is the package name
    // e.g., "react-native@latest" -> ['react-native', 'latest'] -> 'react-native'
    return parts[0];
  }
}
