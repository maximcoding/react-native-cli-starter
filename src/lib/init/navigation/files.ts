/**
 * FILE: src/lib/init/navigation/files.ts
 * PURPOSE: Navigation package file attachment
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { pathExists, ensureDir, readTextFile, writeTextFile } from '../../fs';
import { resolvePackSourcePath } from '../../pack-locations';
import type { InitInputs } from '../types';

/**
 * Section 26, 29: Copies navigation package files from bare variant to Expo projects.
 * For Expo projects, navigation files are not in the variant template, so we copy them from bare variant.
 */
export function attachNavigationPackageFiles(appRoot: string, inputs: InitInputs): void {
  if (!inputs.selectedOptions.reactNavigation || inputs.target !== 'expo') {
    return; // Only needed for Expo projects (bare variant already has these files)
  }

  const bareVariantPath = resolvePackSourcePath('core', 'base');
  const bareNavigationPath = join(bareVariantPath, 'variants', 'bare', 'packages', '@rns', 'navigation');
  const targetNavigationPath = join(appRoot, 'packages', '@rns', 'navigation');

  if (!pathExists(bareNavigationPath)) {
    return; // Bare variant navigation files don't exist
  }

  // Copy navigation package files (excluding preset.ts which is generated separately)
  const filesToCopy = ['index.ts', 'routes.ts', 'screens.tsx', 'types.ts', 'package.json', 'tsconfig.json'];
  const rootFile = 'root.tsx';

  ensureDir(targetNavigationPath);

  // Copy root.tsx
  const rootSource = join(bareNavigationPath, rootFile);
  if (pathExists(rootSource)) {
    const rootContent = readTextFile(rootSource);
    writeTextFile(join(targetNavigationPath, rootFile), rootContent);
  }

  // Copy other files
  for (const file of filesToCopy) {
    const sourceFile = join(bareNavigationPath, file);
    if (pathExists(sourceFile)) {
      const content = readTextFile(sourceFile);
      writeTextFile(join(targetNavigationPath, file), content);
    }
  }
}
