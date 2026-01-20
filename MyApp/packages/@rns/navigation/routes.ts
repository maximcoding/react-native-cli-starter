/**
 * FILE: packages/@rns/navigation/routes.ts
 * PURPOSE: Central route constants + types (modeled after deprecated reference).
 * OWNERSHIP: CORE
 *
 * Users can extend routes by:
 * 1. Adding new route constants in their registry
 * 2. Using TypeScript module augmentation to extend param lists (see registry.ts for example)
 */

export const ROUTES = {
  ROOT_STACK: 'ROOT_STACK',
  ROOT_TABS: 'ROOT_TABS',
  ROOT_DRAWER: 'ROOT_DRAWER',

  TAB_HOME: 'TAB_HOME',
  TAB_SETTINGS: 'TAB_SETTINGS',

  SCREEN_HOME: 'SCREEN_HOME',
  SCREEN_SETTINGS: 'SCREEN_SETTINGS',

  MODAL_INFO: 'MODAL_INFO',
} as const;

export type RouteName = (typeof ROUTES)[keyof typeof ROUTES];

/**
 * Helper to create custom route constants.
 * Users can use this in their registry to add new routes with type safety.
 */
export function createRoute(name: string): string {
  return name;
}

/**
 * Type helper for extending route param lists.
 * Users can use this in their registry for TypeScript module augmentation.
 *
 * Example:
 * ```typescript
 * declare global {
 *   namespace ReactNavigation {
 *     interface RootParamList {
 *       SCREEN_PROFILE: { userId: string };
 *       TAB_PROFILE: undefined;
 *     }
 *   }
 * }
 * ```
 */
export type ExtendRoutes<T extends Record<string, any>> = T;

