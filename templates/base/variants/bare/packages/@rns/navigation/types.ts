/**
 * FILE: packages/@rns/navigation/types.ts
 * PURPOSE: Type definitions for navigation registry (section 27).
 * OWNERSHIP: CORE
 *
 * These types are exported for users to import in their registry files.
 */

import type { ComponentType } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { DrawerScreenProps } from '@react-navigation/drawer';

/**
 * Base screen registration type.
 * Users register screens using this shape.
 */
export interface NavScreen {
  /** Route name (must match a route constant or custom string) */
  name: string;
  /** React component to render for this screen */
  component: ComponentType<any>;
  /** Display order (lower numbers appear first) */
  order?: number;
  /** Screen options (tab icons, drawer labels, stack options, etc.) */
  options?: Record<string, any>;
}

/**
 * Custom navigator registration type.
 * Allows users to register entire navigator components.
 */
export interface CustomNavigator {
  /** Route name for this navigator */
  name: string;
  /** Navigator component (e.g., a Stack, Tabs, or custom navigator) */
  component: ComponentType<any>;
  /** Display order */
  order?: number;
  /** Screen options for the navigator itself */
  options?: Record<string, any>;
  /** Whether this navigator should be rendered as a modal group */
  modal?: boolean;
}

/**
 * Registry functions that users can implement.
 * All functions are optional - if not provided, placeholder screens are used.
 */
export interface NavigationRegistry {
  /** Stack screens (for stack navigators) */
  getStackScreens?: () => NavScreen[];
  /** Tab screens (for bottom tab navigators) */
  getTabScreens?: () => NavScreen[];
  /** Modal screens (for modal presentation) */
  getModalScreens?: () => NavScreen[];
  /** Drawer screens (for drawer navigators) */
  getDrawerScreens?: () => NavScreen[];
  /** Custom navigators (full flexibility - user-defined navigator components) */
  getCustomNavigators?: () => CustomNavigator[];
  /** Root stack screens (for root-level stack navigation) */
  getRootStackScreens?: () => NavScreen[];
}
