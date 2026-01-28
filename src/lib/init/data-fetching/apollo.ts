/**
 * FILE: src/lib/init/data-fetching/apollo.ts
 * PURPOSE: Apollo Client infrastructure generation (Section 52)
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { ensureDir, writeTextFile } from '../../fs';
import { USER_SRC_DIR } from '../../constants';
import type { InitInputs } from '../types';

/**
 * Generates Apollo Client infrastructure files
 */
export function generateApolloInfrastructure(
  appRoot: string,
  inputs: InitInputs
): void {
  const dataDir = join(appRoot, USER_SRC_DIR, 'data');
  const apolloDir = join(dataDir, 'apollo');
  const hooksDir = join(apolloDir, 'hooks');
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  ensureDir(hooksDir);

  // Generate Apollo Client configuration
  const clientFilePath = join(apolloDir, `client.${fileExt}`);
  const clientContent = generateApolloClient(inputs);
  writeTextFile(clientFilePath, clientContent);

  // Generate main apollo file
  const mainFilePath = join(apolloDir, `apollo.${fileExt}`);
  const mainContent = generateApolloMainFile(inputs);
  writeTextFile(mainFilePath, mainContent);

  // Generate example GraphQL query and hook
  const exampleQueryContent = generateExampleQuery(inputs);
  writeTextFile(join(hooksDir, `example.${fileExt}`), exampleQueryContent);
}

/**
 * Generates Apollo Client configuration
 */
function generateApolloClient(inputs: InitInputs): string {
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  if (inputs.language === 'js') {
    return `/**
 * FILE: src/data/apollo/client.js
 * PURPOSE: Apollo Client configuration (User Zone).
 * OWNERSHIP: USER
 */

import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

const httpLink = createHttpLink({
  uri: 'https://api.example.com/graphql', // Replace with your GraphQL endpoint
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});
`;
  }

  return `/**
 * FILE: src/data/apollo/client.ts
 * PURPOSE: Apollo Client configuration (User Zone).
 * OWNERSHIP: USER
 */

import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

const httpLink = createHttpLink({
  uri: 'https://api.example.com/graphql', // Replace with your GraphQL endpoint
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});
`;
}

/**
 * Generates the main Apollo file
 */
function generateApolloMainFile(inputs: InitInputs): string {
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  if (inputs.language === 'js') {
    return `/**
 * FILE: src/data/apollo/apollo.js
 * PURPOSE: Apollo Client utilities and re-exports (User Zone).
 * OWNERSHIP: USER
 * 
 * This file re-exports Apollo Client utilities and example hooks.
 */

export * from '@apollo/client';
export { apolloClient } from './client';

// Re-export example hooks
export * from './hooks/example';
`;
  }

  return `/**
 * FILE: src/data/apollo/apollo.ts
 * PURPOSE: Apollo Client utilities and re-exports (User Zone).
 * OWNERSHIP: USER
 * 
 * This file re-exports Apollo Client utilities and example hooks.
 */

export * from '@apollo/client';
export { apolloClient } from './client';

// Re-export example hooks
export * from './hooks/example';
`;
}

/**
 * Generates an example GraphQL query and hook
 */
function generateExampleQuery(inputs: InitInputs): string {
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  if (inputs.language === 'js') {
    return `/**
 * FILE: src/data/apollo/hooks/example.js
 * PURPOSE: Example Apollo GraphQL query and hook (User Zone).
 * OWNERSHIP: USER
 * 
 * Example GraphQL query and hook demonstrating Apollo usage.
 */

import { gql, useQuery } from '@apollo/client';

const GET_EXAMPLE_DATA = gql\`
  query GetExampleData {
    example {
      id
      name
    }
  }
\`;

export function useExampleData() {
  return useQuery(GET_EXAMPLE_DATA);
}
`;
  }

  return `/**
 * FILE: src/data/apollo/hooks/example.ts
 * PURPOSE: Example Apollo GraphQL query and hook (User Zone).
 * OWNERSHIP: USER
 * 
 * Example GraphQL query and hook demonstrating Apollo usage.
 */

import { gql, useQuery } from '@apollo/client';

const GET_EXAMPLE_DATA = gql\`
  query GetExampleData {
    example {
      id
      name
    }
  }
\`;

interface ExampleData {
  example: {
    id: string;
    name: string;
  };
}

export function useExampleData() {
  return useQuery<ExampleData>(GET_EXAMPLE_DATA);
}
`;
}
