/**
 * FILE: packages/@rns/core/theme/ThemeContext.tsx
 * PURPOSE: Theme context definition (CORE).
 * OWNERSHIP: CORE
 * 
 * Provides strongly-typed global theme context shared across the app.
 * Theme definitions (lightTheme, darkTheme) are imported from User Zone.
 */

import { createContext } from 'react';

// Import themes from User Zone (src/core/theme/schemes/)
// These are user-editable files
// Use @/ alias which maps to src/ (configured in babel.config.js)
import { lightTheme } from '@/core/theme/schemes/light';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  /** Resolved theme object (light or dark based on mode) */
  theme: typeof lightTheme;
  /** Current theme mode (light | dark | system) */
  mode: ThemeMode;
  /** Function to switch theme mode programmatically */
  setTheme: (nextMode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  mode: 'system',
  setTheme: () => {},
});
