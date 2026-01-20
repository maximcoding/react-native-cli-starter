/**
 * FILE: src/hooks/useTheme.ts
 * PURPOSE: Convenience re-export for theme context hook (User Zone).
 * OWNERSHIP: USER
 * 
 * This is a convenience re-export from System Zone (@rns/core/theme).
 * The source of truth is in packages/@rns/core/theme/useTheme.ts (CLI-managed).
 * 
 * You can import from either location:
 * - import { useTheme } from '@/hooks/useTheme';  (convenience, discoverable)
 * - import { useTheme } from '@rns/core/theme'; (direct, System Zone)
 * 
 * To customize: replace this re-export with your own implementation.
 * 
 * @returns { theme, mode, setTheme }
 * - theme: Current theme object (colors, spacing, typography, etc.)
 * - mode: Current theme mode ('light' | 'dark' | 'system')
 * - setTheme: Function to switch theme mode programmatically
 * 
 * @example
 * import { useTheme } from '@/hooks/useTheme';
 * function MyScreen() {
 *   const { theme, mode, setTheme } = useTheme();
 *   const toggleTheme = () => setTheme(mode === 'light' ? 'dark' : 'light');
 *   return <View style={{ backgroundColor: theme.colors.background }} />;
 * }
 */
export { useTheme } from '@rns/core/theme';
export type { ThemeMode, ThemeContextValue } from '@rns/core/theme';
