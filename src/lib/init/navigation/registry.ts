/**
 * FILE: src/lib/init/navigation/registry.ts
 * PURPOSE: Navigation registry generation
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { ensureDir, writeTextFile } from '../../fs';
import { USER_SRC_DIR } from '../../constants';
import type { InitInputs } from '../types';

/**
 * Section 27, 29: Generates navigation registry file in User Zone for React Navigation.
 * Available for both Expo and Bare targets when React Navigation is selected.
 */
export function generateNavigationRegistry(appRoot: string, inputs: InitInputs): void {
  if (!inputs.selectedOptions.reactNavigation) {
    return;
  }

  const registryDir = join(appRoot, USER_SRC_DIR, 'app', 'navigation');
  ensureDir(registryDir);

  const registryFile = join(registryDir, 'registry.ts');
  
  // Generate registry content with example screens based on preset
  // Always overwrite (this is generated content, not user-owned)
  const registryContent = generateRegistryContent(inputs);
  writeTextFile(registryFile, registryContent);
}

/**
 * Generates registry content with example screen registrations based on preset
 */
export function generateRegistryContent(inputs: InitInputs): string {
  const preset = inputs.navigationPreset || 'stack-only';
  const fileExt = inputs.language === 'ts' ? 'tsx' : 'jsx';
  
  // Build imports based on what screens are generated
  let imports = `import type { NavScreen, CustomNavigator } from '@rns/navigation';
import { ROUTES, createRoute } from '@rns/navigation';
`;
  
  imports += `import HomeScreen from '@/screens/HomeScreen';
import SettingsScreen from '@/screens/SettingsScreen';
`;

  const hasStackNav = preset === 'stack-tabs' || preset === 'stack-tabs-modals' || preset === 'stack-only';
  if (hasStackNav) {
    imports += `import DetailScreen from '@/screens/DetailScreen';
`;
  }

  if (preset === 'stack-tabs-modals') {
    imports += `import InfoModal from '@/screens/InfoModal';
`;
  }

  // Build registry functions based on preset
  let stackScreens = '';
  let tabScreens = '';
  let modalScreens = '';
  let drawerScreens = '';

  if (preset === 'stack-only') {
    stackScreens = `  return [
    { name: ROUTES.SCREEN_HOME, component: HomeScreen, order: 10 },
    { name: ROUTES.SCREEN_SETTINGS, component: SettingsScreen, order: 20 },
    { name: createRoute('SCREEN_DETAIL'), component: DetailScreen, order: 30 },
  ];`;
  } else if (preset === 'tabs-only') {
    tabScreens = `  return [
    { name: ROUTES.TAB_HOME, component: HomeScreen, order: 10 },
    { name: ROUTES.TAB_SETTINGS, component: SettingsScreen, order: 20 },
  ];`;
  } else if (preset === 'stack-tabs') {
    stackScreens = `  return [
    { name: ROUTES.SCREEN_HOME, component: HomeScreen, order: 10 },
    { name: ROUTES.SCREEN_SETTINGS, component: SettingsScreen, order: 20 },
    { name: createRoute('SCREEN_DETAIL'), component: DetailScreen, order: 30 },
  ];`;
    tabScreens = `  return [
    { name: ROUTES.TAB_HOME, component: HomeScreen, order: 10 },
    { name: ROUTES.TAB_SETTINGS, component: SettingsScreen, order: 20 },
  ];`;
  } else if (preset === 'stack-tabs-modals') {
    stackScreens = `  return [
    { name: ROUTES.SCREEN_HOME, component: HomeScreen, order: 10 },
    { name: ROUTES.SCREEN_SETTINGS, component: SettingsScreen, order: 20 },
    { name: createRoute('SCREEN_DETAIL'), component: DetailScreen, order: 30 },
  ];`;
    tabScreens = `  return [
    { name: ROUTES.TAB_HOME, component: HomeScreen, order: 10 },
    { name: ROUTES.TAB_SETTINGS, component: SettingsScreen, order: 20 },
  ];`;
    modalScreens = `  return [
    { name: ROUTES.MODAL_INFO, component: InfoModal, order: 10 },
  ];`;
  } else if (preset === 'drawer') {
    drawerScreens = `  return [
    { name: ROUTES.SCREEN_HOME, component: HomeScreen, order: 10 },
    { name: ROUTES.SCREEN_SETTINGS, component: SettingsScreen, order: 20 },
  ];`;
  }

  // Default empty returns for functions not used by preset
  if (!stackScreens) stackScreens = '  return [];';
  if (!tabScreens) tabScreens = '  return [];';
  if (!modalScreens) modalScreens = '  return [];';
  if (!drawerScreens) drawerScreens = '  return [];';

  return `/**
 * FILE: src/app/navigation/registry.ts
 * PURPOSE: Navigation screen registry (User Zone).
 * OWNERSHIP: USER
 *
 * Register your screens here to extend or replace the CORE navigation structure.
 * All functions are optional - if not provided, placeholder screens are used.
 *
 * The preset you chose during init (${preset}) is just a starting point.
 * You can extend beyond it by registering screens here.
 *
 * Example screens have been pre-registered based on your preset.
 * You can edit or remove these registrations as needed.
 */

${imports}
/**
 * Register stack screens.
 * These appear in stack navigators (root stack, nested stacks).
 */
export function getStackScreens(): NavScreen[] {
${stackScreens}
}

/**
 * Register tab screens.
 * These appear in bottom tab navigators.
 * Works even if your preset was "stack-only" - tabs will be added to the structure.
 */
export function getTabScreens(): NavScreen[] {
${tabScreens}
}

/**
 * Register modal screens.
 * These appear as modal presentations.
 * Works regardless of preset - modals can always be added.
 */
export function getModalScreens(): NavScreen[] {
${modalScreens}
}

/**
 * Register drawer screens.
 * These appear in drawer navigators (if drawer preset was chosen).
 * You can also add drawer screens even if preset wasn't "drawer" - drawer will be added.
 */
export function getDrawerScreens(): NavScreen[] {
${drawerScreens}
}

/**
 * Register custom navigators.
 * Maximum flexibility - register entire navigator components.
 * These can be custom stacks, tabs, drawers, or any React Navigation navigator.
 */
export function getCustomNavigators(): CustomNavigator[] {
  return [];
}

/**
 * Register root stack screens.
 * These appear at the root level of the stack navigator.
 * Useful for complex hierarchies (e.g., onboarding → auth → app).
 */
export function getRootStackScreens(): NavScreen[] {
  return [];
}
`;
}
