/**
 * FILE: packages/@rns/runtime/index.tsx
 * PURPOSE: Bare runtime composition includes CORE navigation (section 26).
 * OWNERSHIP: CORE
 *
 * Note: The Expo target keeps the plugin-free MinimalUI runtime.
 */

import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initCore } from './core-init';
import { ThemeProvider } from '@rns/core/theme';
import { RnsNavigationRoot } from '@rns/navigation';

// @rns-marker:imports:start
// Plugin imports will be injected here
// @rns-marker:imports:end

function RootProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  useEffect(() => {
    initCore();
  }, []);

  // Wrap with ThemeProvider (CORE - section 29)
  // ThemeProvider must wrap all UI components to provide theme context
  return (
    <ThemeProvider>
      {/* @rns-marker:providers:start */}
      {/* Plugin providers will wrap children here */}
      {/* @rns-marker:providers:end */}
      {children}
    </ThemeProvider>
  );
}

export function RnsApp(): React.ReactElement {
  // @rns-marker:root:start
  return (
    <RootProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <RnsNavigationRoot />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </RootProvider>
  );
  // @rns-marker:root:end
}
