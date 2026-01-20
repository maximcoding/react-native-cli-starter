/**
 * FILE: src/app/navigation/registry.ts
 * PURPOSE: Navigation screen registry (User Zone).
 * OWNERSHIP: USER
 *
 * Register your screens here to extend or replace the CORE navigation structure.
 * All functions are optional - if not provided, placeholder screens are used.
 *
 * The preset you chose during init (stack-only, tabs-only, etc.) is just a starting point.
 * You can extend beyond it by registering screens here.
 *
 * Example: Even if your preset is "stack-only", you can register tabs here and they will be rendered.
 *
 * TYPE SAFETY:
 * To add TypeScript types for custom routes, use module augmentation:
 *
 * ```typescript
 * declare global {
 *   namespace ReactNavigation {
 *     interface RootParamList {
 *       SCREEN_PROFILE: { userId: string };
 *       TAB_PROFILE: undefined;
 *       MODAL_CUSTOM: { data: string };
 *     }
 *   }
 * }
 * ```
 */

import type { NavScreen, CustomNavigator } from '@rns/navigation';
import { ROUTES, createRoute } from '@rns/navigation';

// Import your screens from User Zone
// import HomeScreen from '@/screens/HomeScreen';
// import ProfileScreen from '@/screens/ProfileScreen';
// import SettingsScreen from '@/screens/SettingsScreen';

/**
 * Register stack screens.
 * These appear in stack navigators (root stack, nested stacks).
 * You can replace placeholder screens (SCREEN_HOME, SCREEN_SETTINGS) or add new ones.
 */
export function getStackScreens(): NavScreen[] {
  return [
    // Replace placeholder screens
    // { name: ROUTES.SCREEN_HOME, component: HomeScreen, order: 10 },
    // { name: ROUTES.SCREEN_SETTINGS, component: SettingsScreen, order: 20 },
    
    // Add new stack screens
    // { name: createRoute('SCREEN_PROFILE'), component: ProfileScreen, order: 30 },
  ];
}

/**
 * Register tab screens.
 * These appear in bottom tab navigators.
 * Works even if your preset was "stack-only" - tabs will be added to the structure.
 */
export function getTabScreens(): NavScreen[] {
  return [
    // Replace placeholder tabs
    // { name: ROUTES.TAB_HOME, component: HomeScreen, order: 10 },
    // { name: ROUTES.TAB_SETTINGS, component: SettingsScreen, order: 20 },
    
    // Add more tabs
    // { name: createRoute('TAB_PROFILE'), component: ProfileScreen, order: 30, options: { tabBarIcon: ... } },
  ];
}

/**
 * Register modal screens.
 * These appear as modal presentations.
 * Works regardless of preset - modals can always be added.
 */
export function getModalScreens(): NavScreen[] {
  return [
    // Replace placeholder modal
    // { name: ROUTES.MODAL_INFO, component: InfoModal, order: 10 },
    
    // Add more modals
    // { name: createRoute('MODAL_CUSTOM'), component: CustomModal, order: 20 },
  ];
}

/**
 * Register drawer screens.
 * These appear in drawer navigators (if drawer preset was chosen).
 * You can also add drawer screens even if preset wasn't "drawer" - drawer will be added.
 */
export function getDrawerScreens(): NavScreen[] {
  return [
    // Replace placeholder drawer screens
    // { name: ROUTES.SCREEN_HOME, component: HomeScreen, order: 10 },
    // { name: ROUTES.SCREEN_SETTINGS, component: SettingsScreen, order: 20 },
    
    // Add more drawer screens
    // { name: createRoute('SCREEN_PROFILE'), component: ProfileScreen, order: 30 },
  ];
}

/**
 * Register custom navigators.
 * Maximum flexibility - register entire navigator components.
 * These can be custom stacks, tabs, drawers, or any React Navigation navigator.
 */
export function getCustomNavigators(): CustomNavigator[] {
  return [
    // Example: Custom auth flow navigator
    // {
    //   name: 'AUTH_STACK',
    //   component: AuthStackNavigator,
    //   order: 100,
    // },
    
    // Example: Custom tabs navigator
    // {
    //   name: 'CUSTOM_TABS',
    //   component: CustomTabsNavigator,
    //   order: 200,
    // },
  ];
}

/**
 * Register root stack screens.
 * These appear at the root level of the stack navigator.
 * Useful for complex hierarchies (e.g., onboarding → auth → app).
 */
export function getRootStackScreens(): NavScreen[] {
  return [
    // Example: Root-level screens
    // { name: createRoute('ONBOARDING'), component: OnboardingScreen, order: 10 },
    // { name: createRoute('AUTH'), component: AuthScreen, order: 20 },
  ];
}
