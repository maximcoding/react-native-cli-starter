/**
 * FILE: src/lib/init/theme/files.ts
 * PURPOSE: Theme file generation and removal
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { unlinkSync, rmdirSync, readdirSync, statSync } from 'fs';
import { pathExists, ensureDir, writeTextFile, isDirectory, copyDir } from '../../fs';
import { USER_SRC_DIR } from '../../constants';
import { resolvePackSourcePath } from '../../pack-locations';
import type { InitInputs } from '../types';

/**
 * Removes theme files when Theming is not selected (Section 29)
 * The base template includes theme files, so we need to remove them if Theming is not selected
 */
export function removeThemeFilesIfNotSelected(appRoot: string): void {
  const userThemeDir = join(appRoot, USER_SRC_DIR, 'core', 'theme');
  
  // Remove theme directory if it exists (from template attachment)
  if (pathExists(userThemeDir) && isDirectory(userThemeDir)) {
    try {
      // Recursively remove directory
      function removeDir(dir: string): void {
        const files = readdirSync(dir);
        for (const file of files) {
          const filePath = join(dir, file);
          const stat = statSync(filePath);
          if (stat.isDirectory()) {
            removeDir(filePath);
          } else {
            unlinkSync(filePath);
          }
        }
        rmdirSync(dir);
      }
      
      removeDir(userThemeDir);
    } catch (e) {
      // Ignore errors - directory might not exist or already removed
    }
  }
}

/**
 * Section 29: Generates theme files (CORE).
 * Creates theme files in User Zone (src/core/theme/) from templates.
 * Theme is CORE for both Expo and Bare targets (target-agnostic).
 */
export function generateThemeFiles(appRoot: string, inputs: InitInputs): void {
  // User Zone: where users edit theme files (src/core/theme/)
  const userThemeDir = join(appRoot, USER_SRC_DIR, 'core', 'theme');
  
  // Ensure directory exists
  ensureDir(userThemeDir);
  
  // Get template theme directory from variant (target-aware)
  const basePackPath = resolvePackSourcePath('core', 'base');
  
  // Try target-specific variant first, then fall back to bare (theme is target-agnostic)
  const targetVariant = inputs.target === 'expo' ? 'expo' : 'bare';
  const templateThemePath = join(basePackPath, 'variants', targetVariant, USER_SRC_DIR, 'core', 'theme');
  const fallbackThemePath = join(basePackPath, 'variants', 'bare', USER_SRC_DIR, 'core', 'theme');
  
  // Copy theme templates from variant to User Zone (try target variant, fallback to bare)
  const sourceThemePath = (pathExists(templateThemePath) && isDirectory(templateThemePath))
    ? templateThemePath
    : (pathExists(fallbackThemePath) && isDirectory(fallbackThemePath))
      ? fallbackThemePath
      : null;
  
  if (sourceThemePath) {
    copyDir(sourceThemePath, userThemeDir);
  } else {
    // Fallback: create minimal theme structure if template doesn't exist
    // This should not happen in normal operation, but provides safety
    const schemesDir = join(userThemeDir, 'schemes');
    const tokensDir = join(userThemeDir, 'tokens');
    ensureDir(schemesDir);
    ensureDir(tokensDir);
    
    // Create minimal light theme
    const lightThemeContent = `import { spacing } from '../tokens/spacing';
import { radius } from '../tokens/radius';
import { typography } from '../tokens/typography';
import { elevation } from '../tokens/elevation';

export const lightTheme = {
  colors: {
    background: '#FFFFFF',
    textPrimary: '#000000',
    primary: '#5247E6',
  },
  spacing,
  radius,
  typography,
  elevation,
} as const;
`;
    writeTextFile(join(schemesDir, 'light.ts'), lightThemeContent);
    
    // Create minimal dark theme
    const darkThemeContent = `import { spacing } from '../tokens/spacing';
import { radius } from '../tokens/radius';
import { typography } from '../tokens/typography';
import { elevation } from '../tokens/elevation';

export const darkTheme = {
  colors: {
    background: '#000000',
    textPrimary: '#FFFFFF',
    primary: '#9C92FF',
  },
  spacing,
  radius,
  typography,
  elevation,
} as const;
`;
    writeTextFile(join(schemesDir, 'dark.ts'), darkThemeContent);
  }
}
