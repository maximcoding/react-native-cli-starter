/**
 * FILE: packages/@rns/core/theme/ThemeProvider.tsx
 * PURPOSE: Theme provider component (CORE).
 * OWNERSHIP: CORE
 * 
 * Provides global theme context with:
 * - light/dark modes
 * - system appearance support
 * - dynamic theme switching
 * 
 * Theme definitions are imported from User Zone (src/core/theme/schemes/).
 */

import React, { useState, useEffect, useMemo, type ReactNode } from 'react';
import { Appearance } from 'react-native';
import { ThemeContext, type ThemeMode } from './ThemeContext';

// Import themes from User Zone (src/core/theme/schemes/)
// These files are always generated (minimal themes) so ThemeProvider can always import them
// Use @/ alias which maps to src/ (configured in babel.config.js)
import { lightTheme } from '@/core/theme/schemes/light';
import { darkTheme } from '@/core/theme/schemes/dark';

export function ThemeProvider({ children }: { children: ReactNode }) {
  /**
   * MODE:
   *  - 'light'        → user forced light
   *  - 'dark'         → user forced dark
   *  - 'system'       → follow OS setting
   * 
   * Initial state: 'system' (follows device appearance)
   * Future: Can persist user choice in storage (MMKV/AsyncStorage)
   */
  const [mode, setMode] = useState<ThemeMode>('system');

  /**
   * Read initial system theme.
   */
  const systemColorScheme = Appearance.getColorScheme() || 'light';

  /**
   * Listen to system theme changes when mode === 'system'.
   */
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (mode === 'system') {
        // Force re-render when system theme changes
        setMode('system');
      }
    });

    return () => subscription.remove();
  }, [mode]);

  /**
   * Compute active theme based on mode.
   * If mode is 'system', use system color scheme.
   */
  const theme = useMemo(() => {
    const usedMode = mode === 'system' ? systemColorScheme : mode;
    return usedMode === 'light' ? lightTheme : darkTheme;
  }, [mode, systemColorScheme]);

  /**
   * Safe setter for theme mode.
   * Can be called from business logic to switch themes programmatically.
   * 
   * Future: Persist to storage (MMKV/AsyncStorage) for persistence across app restarts.
   */
  const setTheme = (nextMode: ThemeMode) => {
    setMode(nextMode);
    // Future: Persist to storage
    // kvStorage.setString('themeMode', nextMode);
  };

  return (
    <ThemeContext.Provider value={{ theme, mode, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
