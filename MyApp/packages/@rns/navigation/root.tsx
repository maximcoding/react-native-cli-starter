/**
 * FILE: packages/@rns/navigation/root.tsx
 * PURPOSE: Root navigator that supports multiple presets + user registry (section 27).
 * OWNERSHIP: CORE
 *
 * This navigator reads from User Zone registry (src/app/navigation/registry.ts) if available.
 * Falls back to placeholder screens if registry is missing or has errors.
 * Maximum flexibility: users can extend beyond preset constraints.
 */

import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer, type LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { enableScreens } from 'react-native-screens';

import { NAVIGATION_PRESET } from './preset';
import { ROUTES } from './routes';
import { HomeScreen, SettingsScreen, InfoModalScreen } from './screens';
import type { NavScreen, CustomNavigator, NavigationRegistry } from './types';

// Try to import i18n hook (optional - only if i18n is selected)
let useT: (() => (key: string) => string) | undefined;
try {
  const i18nModule = require('@rns/core/i18n');
  useT = i18nModule.useT;
} catch {
  // i18n not available - use fallback
}

enableScreens();

/**
 * Try to import user registry from User Zone.
 * Gracefully falls back to undefined if registry doesn't exist or has errors.
 * 
 * Path resolution: From packages/@rns/navigation/root.tsx to src/app/navigation/registry.ts
 * - ../../ goes to packages/
 * - ../../../ goes to project root
 * - ../../../src/app/navigation/registry resolves to User Zone registry
 */
function getUserRegistry(): NavigationRegistry | undefined {
  try {
    // Dynamic require from User Zone (src/app/navigation/registry.ts)
    // Path is relative to the generated app structure:
    // packages/@rns/navigation/root.tsx -> ../../../src/app/navigation/registry
    const registry = require('../../../src/app/navigation/registry');
    return {
      getStackScreens: registry.getStackScreens,
      getTabScreens: registry.getTabScreens,
      getModalScreens: registry.getModalScreens,
      getDrawerScreens: registry.getDrawerScreens,
      getCustomNavigators: registry.getCustomNavigators,
      getRootStackScreens: registry.getRootStackScreens,
    };
  } catch (error) {
    // Registry doesn't exist or has errors - use placeholders
    // This is expected and fine - users may not have created registry yet
    // Silently fallback (no console.error to avoid noise in production)
    return undefined;
  }
}

/**
 * Get screens from registry or fallback to placeholders.
 * User screens take precedence over placeholders.
 */
function getScreens(
  registryFn: (() => NavScreen[]) | undefined,
  placeholders: NavScreen[]
): NavScreen[] {
  try {
    const userScreens = registryFn?.() || [];
    if (userScreens.length === 0) {
      return placeholders;
    }
    
    // Merge: user screens replace placeholders with same name, new screens are added
    const screenMap = new Map<string, NavScreen>();
    
    // Add placeholders first
    placeholders.forEach(screen => {
      screenMap.set(screen.name, screen);
    });
    
    // User screens override placeholders or add new ones
    userScreens.forEach(screen => {
      screenMap.set(screen.name, screen);
    });
    
    // Sort by order
    return Array.from(screenMap.values()).sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
  } catch (error) {
    // Registry function has error - use placeholders
    console.warn('[@rns/navigation] Registry function error, using placeholders:', error);
    return placeholders;
  }
}

type RootStackParamList = {
  [ROUTES.ROOT_STACK]: undefined;
  [ROUTES.ROOT_TABS]: undefined;
  [ROUTES.MODAL_INFO]: undefined;
  [ROUTES.SCREEN_HOME]: undefined;
  [ROUTES.SCREEN_SETTINGS]: undefined;
};

type TabsParamList = {
  [ROUTES.TAB_HOME]: undefined;
  [ROUTES.TAB_SETTINGS]: undefined;
};

type DrawerParamList = {
  [ROUTES.SCREEN_HOME]: undefined;
  [ROUTES.SCREEN_SETTINGS]: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabsParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

const linking: LinkingOptions<any> = {
  prefixes: [],
  config: {
    screens: {},
  },
};

/**
 * Get default tab icon (simple text-based fallback)
 * Users can override via registry options.tabBarIcon
 */
function getDefaultTabIcon(routeName: string, focused: boolean, color: string, size: number): React.ReactElement {
  // Simple emoji-based icons as fallback
  const iconMap: Record<string, string> = {
    [ROUTES.TAB_HOME]: '🏠',
    [ROUTES.TAB_SETTINGS]: '⚙️',
  };
  
  const icon = iconMap[routeName] || '●';
  
  return (
    <Text style={{ fontSize: size, color }}>
      {icon}
    </Text>
  );
}

/**
 * Get translated tab label
 * Falls back to route name if i18n not available or translation missing
 */
function getTabLabel(routeName: string, t?: (key: string) => string): string {
  if (!t) {
    // Fallback to readable name
    return routeName.replace('TAB_', '').replace('_', ' ');
  }
  
  // Try navigation.tabs.{routeName} translation key
  const translationKey = `navigation.tabs.${routeName.toLowerCase()}`;
  const translated = t(translationKey);
  
  // If translation returns the key itself, it means translation is missing
  if (translated === translationKey) {
    // Fallback to readable name
    return routeName.replace('TAB_', '').replace('_', ' ');
  }
  
  return translated;
}

function TabsNavigator(): React.ReactElement {
  const registry = getUserRegistry();
  
  // Get translation function if i18n is available
  const t = useT ? useT() : undefined;
  
  // Get tab screens from registry or use placeholders
  const placeholderTabs: NavScreen[] = [
    { name: ROUTES.TAB_HOME, component: HomeScreen, order: 10 },
    { name: ROUTES.TAB_SETTINGS, component: SettingsScreen, order: 20 },
  ];
  
  const tabs = getScreens(registry?.getTabScreens, placeholderTabs);
  
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {tabs.map(screen => {
        // Merge default options with screen-specific options
        const defaultOptions = {
          title: getTabLabel(screen.name, t),
          tabBarIcon: screen.options?.tabBarIcon 
            ? screen.options.tabBarIcon 
            : ({ focused, color, size }: { focused: boolean; color: string; size: number }) =>
                getDefaultTabIcon(screen.name, focused, color, size),
        };
        
        const mergedOptions = {
          ...defaultOptions,
          ...screen.options,
          // Ensure title is set (user options can override)
          title: screen.options?.title || defaultOptions.title,
          // Ensure icon is set (user options can override)
          tabBarIcon: screen.options?.tabBarIcon || defaultOptions.tabBarIcon,
        };
        
        return (
          <Tabs.Screen
            key={screen.name}
            name={screen.name as any}
            component={screen.component}
            options={mergedOptions}
          />
        );
      })}
    </Tabs.Navigator>
  );
}

function DrawerNavigator(): React.ReactElement {
  const registry = getUserRegistry();
  
  // Get drawer screens from registry or use placeholders
  const placeholderDrawer: NavScreen[] = [
    { name: ROUTES.SCREEN_HOME, component: HomeScreen, order: 10 },
    { name: ROUTES.SCREEN_SETTINGS, component: SettingsScreen, order: 20 },
  ];
  
  const drawerScreens = getScreens(registry?.getDrawerScreens, placeholderDrawer);
  
  return (
    <Drawer.Navigator screenOptions={{ headerShown: false }}>
      {drawerScreens.map(screen => (
        <Drawer.Screen
          key={screen.name}
          name={screen.name as any}
          component={screen.component}
          options={screen.options || { title: screen.name }}
        />
      ))}
    </Drawer.Navigator>
  );
}

function RootStackNavigator(): React.ReactElement {
  const registry = getUserRegistry();
  const preset = NAVIGATION_PRESET;
  
  // Preset flags (starting point, not constraint)
  const presetHasTabs = preset === 'stack-tabs' || preset === 'stack-tabs-modals' || preset === 'tabs-only';
  const presetHasModals = preset === 'stack-tabs-modals';
  const presetStackOnly = preset === 'stack-only';
  const presetTabsOnly = preset === 'tabs-only';
  const presetDrawer = preset === 'drawer';
  
  // Maximum flexibility: check if user registered screens regardless of preset
  const hasUserTabs = (registry?.getTabScreens?.() || []).length > 0;
  const hasUserModals = (registry?.getModalScreens?.() || []).length > 0;
  const hasUserDrawer = (registry?.getDrawerScreens?.() || []).length > 0;
  const hasUserStack = (registry?.getStackScreens?.() || []).length > 0;
  const hasCustomNavigators = (registry?.getCustomNavigators?.() || []).length > 0;
  const hasRootStackScreens = (registry?.getRootStackScreens?.() || []).length > 0;
  
  // Determine what to render (preset OR user extensions)
  const shouldRenderTabs = presetTabsOnly || presetHasTabs || hasUserTabs;
  const shouldRenderDrawer = presetDrawer || hasUserDrawer;
  const shouldRenderModals = presetHasModals || hasUserModals;
  const shouldRenderStack = presetStackOnly || hasUserStack || hasRootStackScreens;
  
  // Get stack screens from registry or use placeholders
  const placeholderStack: NavScreen[] = [
    { name: ROUTES.SCREEN_HOME, component: HomeScreen, order: 10 },
    { name: ROUTES.SCREEN_SETTINGS, component: SettingsScreen, order: 20 },
  ];
  const stackScreens = getScreens(registry?.getStackScreens, placeholderStack);
  
  // Get modal screens from registry or use placeholders
  const placeholderModals: NavScreen[] = [
    { name: ROUTES.MODAL_INFO, component: InfoModalScreen, order: 10 },
  ];
  const modalScreens = getScreens(registry?.getModalScreens, placeholderModals);
  
  // Get custom navigators
  const customNavigators = registry?.getCustomNavigators?.() || [];
  const sortedCustomNavigators = customNavigators.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
  
  // Get root stack screens
  const rootStackScreens = registry?.getRootStackScreens?.() || [];
  const sortedRootStackScreens = rootStackScreens.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
  
  // Render based on preset or user extensions
  if (presetTabsOnly && !hasUserStack && !hasCustomNavigators) {
    return <TabsNavigator />;
  }
  
  if (presetDrawer && !hasUserStack && !hasCustomNavigators && !shouldRenderTabs) {
    return <DrawerNavigator />;
  }
  
  // Root stack navigator (most flexible)
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {/* Root stack screens (highest priority) */}
      {sortedRootStackScreens.map(screen => (
        <RootStack.Screen
          key={screen.name}
          name={screen.name as any}
          component={screen.component}
          options={screen.options}
        />
      ))}
      
      {/* Custom navigators */}
      {sortedCustomNavigators.map(nav => (
        <RootStack.Screen
          key={nav.name}
          name={nav.name as any}
          component={nav.component}
          options={nav.options}
        />
      ))}
      
      {/* Tabs (if preset or user registered) */}
      {shouldRenderTabs ? (
        <RootStack.Screen name={ROUTES.ROOT_TABS} component={TabsNavigator} />
      ) : null}
      
      {/* Drawer (if preset or user registered) */}
      {shouldRenderDrawer && !shouldRenderTabs ? (
        <RootStack.Screen name={ROUTES.ROOT_DRAWER} component={DrawerNavigator} />
      ) : null}
      
      {/* Stack screens (if preset or user registered) */}
      {shouldRenderStack ? (
        stackScreens.map(screen => (
          <RootStack.Screen
            key={screen.name}
            name={screen.name as any}
            component={screen.component}
            options={screen.options}
          />
        ))
      ) : null}
      
      {/* Modals (if preset or user registered) */}
      {shouldRenderModals && modalScreens.length > 0 ? (
        <RootStack.Group screenOptions={{ presentation: 'modal' }}>
          {modalScreens.map(screen => (
            <RootStack.Screen
              key={screen.name}
              name={screen.name as any}
              component={screen.component}
              options={screen.options}
            />
          ))}
        </RootStack.Group>
      ) : null}
    </RootStack.Navigator>
  );
}

export function RnsNavigationRoot(): React.ReactElement {
  return (
    <NavigationContainer linking={linking}>
      <RootStackNavigator />
    </NavigationContainer>
  );
}

