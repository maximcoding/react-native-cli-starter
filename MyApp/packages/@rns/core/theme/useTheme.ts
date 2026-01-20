/**
 * FILE: packages/@rns/core/theme/useTheme.ts
 * PURPOSE: Hook for accessing theme context (CORE).
 * OWNERSHIP: CORE
 * 
 * Safe hook to read global theme context.
 * Provides fully typed theme, mode, and setter for programmatic theme switching.
 */

import { useContext } from 'react';
import { ThemeContext } from './ThemeContext';

/**
 * Hook to access theme context.
 * 
 * @returns { theme, mode, setTheme }
 * - theme: Current theme object (colors, spacing, typography, etc.)
 * - mode: Current theme mode ('light' | 'dark' | 'system')
 * - setTheme: Function to switch theme mode programmatically
 * 
 * @example
 * ```typescript
 * function MyScreen() {
 *   const { theme, mode, setTheme } = useTheme();
 *   
 *   const toggleTheme = () => {
 *     setTheme(mode === 'light' ? 'dark' : 'light');
 *   };
 *   
 *   return (
 *     <View style={{ backgroundColor: theme.colors.background }}>
 *       <Button onPress={toggleTheme} title="Toggle Theme" />
 *     </View>
 *   );
 * }
 * ```
 */
export function useTheme() {
  const ctx = useContext(ThemeContext);

  if (!ctx) {
    throw new Error(
      '[useTheme] ThemeContext is undefined. ' +
      'Wrap your app with <ThemeProvider>.'
    );
  }

  return ctx;
}
