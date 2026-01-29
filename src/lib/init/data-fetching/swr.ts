/**
 * FILE: src/lib/init/data-fetching/swr.ts
 * PURPOSE: SWR infrastructure generation (Section 52)
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { ensureDir, writeTextFile } from '../../fs';
import { USER_SRC_DIR } from '../../constants';
import type { InitInputs } from '../types';

/**
 * Generates SWR infrastructure files
 */
export function generateSwrInfrastructure(
  appRoot: string,
  inputs: InitInputs
): void {
  const dataDir = join(appRoot, USER_SRC_DIR, 'data');
  const swrDir = join(dataDir, 'swr');
  const hooksDir = join(swrDir, 'hooks');
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  ensureDir(hooksDir);

  // Generate SWR configuration
  const configFilePath = join(swrDir, `config.${fileExt}`);
  const configContent = generateSwrConfig(inputs);
  writeTextFile(configFilePath, configContent);

  // Generate main swr file
  const mainFilePath = join(swrDir, `swr.${fileExt}`);
  const mainContent = generateSwrMainFile(inputs);
  writeTextFile(mainFilePath, mainContent);

  // Generate example hook
  const exampleHookContent = generateExampleHook(inputs);
  writeTextFile(join(hooksDir, `example.${fileExt}`), exampleHookContent);
}

/**
 * Generates SWR configuration
 */
function generateSwrConfig(inputs: InitInputs): string {
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  if (inputs.language === 'js') {
    return `/**
 * FILE: src/data/swr/config.js
 * PURPOSE: SWR configuration (User Zone).
 * OWNERSHIP: USER
 */

export const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
};
`;
  }

  return `/**
 * FILE: src/data/swr/config.ts
 * PURPOSE: SWR configuration (User Zone).
 * OWNERSHIP: USER
 */

import { SWRConfiguration } from 'swr';

export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
};
`;
}

/**
 * Generates the main SWR file
 */
function generateSwrMainFile(inputs: InitInputs): string {
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  if (inputs.language === 'js') {
    return `/**
 * FILE: src/data/swr/swr.js
 * PURPOSE: SWR utilities and re-exports (User Zone).
 * OWNERSHIP: USER
 * 
 * This file re-exports SWR utilities and example hooks.
 */

export * from 'swr';
export { swrConfig } from './config';

// Re-export example hooks
export * from './hooks/example';
`;
  }

  return `/**
 * FILE: src/data/swr/swr.ts
 * PURPOSE: SWR utilities and re-exports (User Zone).
 * OWNERSHIP: USER
 * 
 * This file re-exports SWR utilities and example hooks.
 */

export * from 'swr';
export { swrConfig } from './config';

// Re-export example hooks
export * from './hooks/example';
`;
}

/**
 * Generates an example SWR hook
 */
function generateExampleHook(inputs: InitInputs): string {
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  if (inputs.language === 'js') {
    return `/**
 * FILE: src/data/swr/hooks/example.js
 * PURPOSE: Example SWR hook (User Zone).
 * OWNERSHIP: USER
 * 
 * Example hook demonstrating SWR usage.
 */

import useSWR from 'swr';

const fetcher = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return response.json();
};

export function useExampleData() {
  return useSWR('https://api.example.com/data', fetcher);
}
`;
  }

  return `/**
 * FILE: src/data/swr/hooks/example.ts
 * PURPOSE: Example SWR hook (User Zone).
 * OWNERSHIP: USER
 * 
 * Example hook demonstrating SWR usage.
 */

import useSWR from 'swr';

interface ExampleData {
  id: string;
  name: string;
}

const fetcher = async (url: string): Promise<ExampleData> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return response.json();
};

export function useExampleData() {
  return useSWR<ExampleData>('https://api.example.com/data', fetcher);
}
`;
}
