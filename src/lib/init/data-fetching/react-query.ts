/**
 * FILE: src/lib/init/data-fetching/react-query.ts
 * PURPOSE: React Query infrastructure generation (Section 52)
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { ensureDir, writeTextFile } from '../../fs';
import { USER_SRC_DIR } from '../../constants';
import type { InitInputs } from '../types';

/**
 * Generates React Query infrastructure files
 */
export function generateReactQueryInfrastructure(
  appRoot: string,
  inputs: InitInputs
): void {
  const dataDir = join(appRoot, USER_SRC_DIR, 'data');
  const reactQueryDir = join(dataDir, 'react-query');
  const hooksDir = join(reactQueryDir, 'hooks');
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  ensureDir(hooksDir);

  // Generate QueryClient configuration
  const clientFilePath = join(reactQueryDir, `client.${fileExt}`);
  const clientContent = generateQueryClient(inputs);
  writeTextFile(clientFilePath, clientContent);

  // Generate main react-query file
  const mainFilePath = join(reactQueryDir, `react-query.${fileExt}`);
  const mainContent = generateReactQueryMainFile(inputs);
  writeTextFile(mainFilePath, mainContent);

  // Generate example hook
  const exampleHookContent = generateExampleHook(inputs);
  writeTextFile(join(hooksDir, `example.${fileExt}`), exampleHookContent);
}

/**
 * Generates QueryClient configuration
 */
function generateQueryClient(inputs: InitInputs): string {
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  if (inputs.language === 'js') {
    return `/**
 * FILE: src/data/react-query/client.js
 * PURPOSE: React Query QueryClient configuration (User Zone).
 * OWNERSHIP: USER
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
`;
  }

  return `/**
 * FILE: src/data/react-query/client.ts
 * PURPOSE: React Query QueryClient configuration (User Zone).
 * OWNERSHIP: USER
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
`;
}

/**
 * Generates the main React Query file
 */
function generateReactQueryMainFile(inputs: InitInputs): string {
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  if (inputs.language === 'js') {
    return `/**
 * FILE: src/data/react-query/react-query.js
 * PURPOSE: React Query utilities and re-exports (User Zone).
 * OWNERSHIP: USER
 * 
 * This file re-exports React Query utilities and example hooks.
 */

export * from '@tanstack/react-query';
export { queryClient } from './client';

// Re-export example hooks
export * from './hooks/example';
`;
  }

  return `/**
 * FILE: src/data/react-query/react-query.ts
 * PURPOSE: React Query utilities and re-exports (User Zone).
 * OWNERSHIP: USER
 * 
 * This file re-exports React Query utilities and example hooks.
 */

export * from '@tanstack/react-query';
export { queryClient } from './client';

// Re-export example hooks
export * from './hooks/example';
`;
}

/**
 * Generates an example query hook
 */
function generateExampleHook(inputs: InitInputs): string {
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  if (inputs.language === 'js') {
    return `/**
 * FILE: src/data/react-query/hooks/example.js
 * PURPOSE: Example React Query hook (User Zone).
 * OWNERSHIP: USER
 * 
 * Example query hook demonstrating React Query usage.
 */

import { useQuery } from '@tanstack/react-query';

export function useExampleData() {
  return useQuery({
    queryKey: ['example'],
    queryFn: async () => {
      // Replace with your API call
      const response = await fetch('https://api.example.com/data');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      return response.json();
    },
  });
}
`;
  }

  return `/**
 * FILE: src/data/react-query/hooks/example.ts
 * PURPOSE: Example React Query hook (User Zone).
 * OWNERSHIP: USER
 * 
 * Example query hook demonstrating React Query usage.
 */

import { useQuery } from '@tanstack/react-query';

interface ExampleData {
  id: string;
  name: string;
}

export function useExampleData() {
  return useQuery<ExampleData>({
    queryKey: ['example'],
    queryFn: async () => {
      // Replace with your API call
      const response = await fetch('https://api.example.com/data');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      return response.json();
    },
  });
}
`;
}
