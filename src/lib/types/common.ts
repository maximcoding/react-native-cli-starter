/**
 * FILE: src/lib/types/common.ts
 * PURPOSE: Common types and enums shared across the CLI
 * OWNERSHIP: CLI
 * 
 * Canonical Docs: docs/cli-interface-and-types.md §2.1
 */

/**
 * Package manager type
 */
export type PackageManager = 'npm' | 'pnpm' | 'yarn';

/**
 * Target platform
 */
export type RnsTarget = 'expo' | 'bare';

/**
 * Platform OS
 */
export type PlatformOS = 'ios' | 'android' | 'web';

/**
 * Expo runtime
 */
export type ExpoRuntime = 'expo-go' | 'dev-client' | 'standalone';
