/**
 * FILE: src/lib/init/theme/hooks.ts
 * PURPOSE: Hook generation for i18n and theme
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { ensureDir, writeTextFile } from '../../fs';
import { USER_SRC_DIR } from '../../constants';
import type { InitInputs } from '../types';

/**
 * Generates hooks in User Zone (src/hooks/)
 * Creates convenience re-exports from System Zone hooks for discoverability.
 * 
 * Hybrid Architecture:
 * - Source of truth: hooks in System Zone (packages/@rns/core/) - CLI-managed, stable, updatable
 * - Convenience re-exports: hooks in User Zone (src/hooks/) - user-editable, discoverable
 * 
 * Benefits:
 * - Discoverable: hooks visible in src/hooks/ where developers expect them
 * - Stable: source of truth in System Zone (CLI can update)
 * - Customizable: users can override User Zone re-exports with custom implementations
 * - Consistent: both import paths work (@rns/core/i18n and @/hooks/useT)
 */
export function generateHooks(appRoot: string, inputs: InitInputs): void {
  const hooksDir = join(appRoot, USER_SRC_DIR, 'hooks');
  ensureDir(hooksDir);
  
  // Generate useT.ts hook if i18n is selected
  // This is a convenience re-export from System Zone
  if (inputs.selectedOptions.i18n) {
    const useTContent = inputs.language === 'ts'
      ? `/**
 * FILE: src/hooks/useT.ts
 * PURPOSE: Convenience re-export for i18n translation hook (User Zone).
 * OWNERSHIP: USER
 * 
 * This is a convenience re-export from System Zone (@rns/core/i18n).
 * The source of truth is in packages/@rns/core/i18n/useT.ts (CLI-managed).
 * 
 * You can import from either location:
 * - import { useT } from '@/hooks/useT';  (convenience, discoverable)
 * - import { useT } from '@rns/core/i18n'; (direct, System Zone)
 * 
 * To customize: replace this re-export with your own implementation.
 * 
 * @example
 * import { useT } from '@/hooks/useT';
 * const t = useT();
 * <Text>{t('home.title')}</Text>
 */
export { useT } from '@rns/core/i18n';
`
      : `/**
 * FILE: src/hooks/useT.js
 * PURPOSE: Convenience re-export for i18n translation hook (User Zone).
 * OWNERSHIP: USER
 * 
 * This is a convenience re-export from System Zone (@rns/core/i18n).
 * The source of truth is in packages/@rns/core/i18n/useT.ts (CLI-managed).
 * 
 * You can import from either location:
 * - import { useT } from '@/hooks/useT';  (convenience, discoverable)
 * - import { useT } from '@rns/core/i18n'; (direct, System Zone)
 * 
 * To customize: replace this re-export with your own implementation.
 */
export { useT } from '@rns/core/i18n';
`;
    
    writeTextFile(join(hooksDir, `useT.${inputs.language === 'ts' ? 'ts' : 'js'}`), useTContent);
  }
  
  // Generate useTheme.ts hook if theming is selected
  // This is a convenience re-export from System Zone
  if (inputs.selectedOptions.theming) {
    const useThemeContent = inputs.language === 'ts'
      ? `/**
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
`
      : `/**
 * FILE: src/hooks/useTheme.js
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
 */
export { useTheme } from '@rns/core/theme';
`;
    
    writeTextFile(join(hooksDir, `useTheme.${inputs.language === 'ts' ? 'ts' : 'js'}`), useThemeContent);
  }
  
  // Generate index.ts to export all hooks
  const hooksIndexContent = inputs.language === 'ts'
    ? `/**
 * FILE: src/hooks/index.ts
 * PURPOSE: Hooks exports (User Zone).
 * OWNERSHIP: USER
 * 
 * Central export point for all hooks.
 * Edit this file to add custom hooks or re-export additional hooks.
 */
${inputs.selectedOptions.i18n ? "export { useT } from './useT';" : ''}
${inputs.selectedOptions.theming ? "export { useTheme } from './useTheme';" : ''}
`
    : `/**
 * FILE: src/hooks/index.js
 * PURPOSE: Hooks exports (User Zone).
 * OWNERSHIP: USER
 * 
 * Central export point for all hooks.
 * Edit this file to add custom hooks or re-export additional hooks.
 */
${inputs.selectedOptions.i18n ? "export { useT } from './useT';" : ''}
${inputs.selectedOptions.theming ? "export { useTheme } from './useTheme';" : ''}
`;
  
  writeTextFile(join(hooksDir, `index.${inputs.language === 'ts' ? 'ts' : 'js'}`), hooksIndexContent);
}
