/**
 * FILE: packages/@rns/navigation/preset.ts
 * PURPOSE: Bare init navigation preset selector (section 26).
 * OWNERSHIP: CORE
 *
 * The CLI overwrites this value during init based on user selection.
 */

export type NavigationPreset =
  | 'stack-only'
  | 'tabs-only'
  | 'stack-tabs'
  | 'stack-tabs-modals'
  | 'drawer';

export const NAVIGATION_PRESET: NavigationPreset = 'stack-tabs';

