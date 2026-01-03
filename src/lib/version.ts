/**
 * FILE: src/lib/version.ts
 * PURPOSE: Single source for CLI version used everywhere (init/plugins/modules/log headers)
 * OWNERSHIP: CLI
 */

import { readFileSync } from 'fs';
import { join } from 'path';

let cachedVersion: string | null = null;

/**
 * Gets the CLI version from package.json
 */
export function getCliVersion(): string {
  if (cachedVersion !== null) {
    return cachedVersion;
  }

  try {
    const packageJsonPath = join(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const version = packageJson.version || '0.0.0';
    cachedVersion = version;
    return version;
  } catch {
    return '0.0.0';
  }
}
