/**
 * FILE: src/lib/init/wiring.ts
 * PURPOSE: Build runtime wiring ops from init inputs and apply provider injection (Phase A).
 * OWNERSHIP: CLI
 *
 * When user selects data-fetching (React Query, Apollo, SWR) or offline (NetInfo), we inject
 * the corresponding provider into packages/@rns/runtime so the app has working wiring.
 */

import { pathExists } from '../fs';
import { wireRuntimeContributions } from '../runtime-wiring';
import type { InitInputs } from './types';
import type { RuntimeWiringOp } from '../types/runtime';

/** Runtime index file in generated bare app (template uses .tsx). */
const RUNTIME_INDEX_FILE = 'packages/@rns/runtime/index.tsx';

/**
 * Builds runtime wiring operations from init inputs for capabilities that need a provider.
 * Only includes ops for options that are selected and that require provider injection.
 */
export function buildWiringOpsFromInputs(appRoot: string, inputs: InitInputs): RuntimeWiringOp[] {
  const ops: RuntimeWiringOp[] = [];
  const file = RUNTIME_INDEX_FILE;

  // Data fetching: React Query
  if (inputs.selectedOptions.dataFetching?.reactQuery) {
    ops.push({
      capabilityId: 'data.reactQuery',
      file,
      markerType: 'imports',
      contribution: {
        type: 'import',
        imports: [
          { symbol: 'QueryClientProvider', source: '@/data/react-query/client' },
          { symbol: 'queryClient', source: '@/data/react-query/client' },
        ],
        order: 10,
      },
      order: 10,
    });
    ops.push({
      capabilityId: 'data.reactQuery',
      file,
      markerType: 'providers',
      contribution: {
        type: 'provider',
        provider: { symbol: 'QueryClientProvider', source: '@/data/react-query/client' },
        props: { client: 'queryClient' },
        order: 10,
      },
      order: 10,
    });
  }

  // Data fetching: Apollo (ApolloProvider from @apollo/client, apolloClient from generated client)
  if (inputs.selectedOptions.dataFetching?.apollo) {
    ops.push({
      capabilityId: 'data.apollo',
      file,
      markerType: 'imports',
      contribution: {
        type: 'import',
        imports: [
          { symbol: 'ApolloProvider', source: '@apollo/client' },
          { symbol: 'apolloClient', source: '@/data/apollo/client' },
        ],
        order: 11,
      },
      order: 11,
    });
    ops.push({
      capabilityId: 'data.apollo',
      file,
      markerType: 'providers',
      contribution: {
        type: 'provider',
        provider: { symbol: 'ApolloProvider', source: '@apollo/client' },
        props: { client: 'apolloClient' },
        order: 11,
      },
      order: 11,
    });
  }

  // Data fetching: SWR (SWRConfig from swr, swrConfig from generated config)
  if (inputs.selectedOptions.dataFetching?.swr) {
    ops.push({
      capabilityId: 'data.swr',
      file,
      markerType: 'imports',
      contribution: {
        type: 'import',
        imports: [
          { symbol: 'SWRConfig', source: 'swr' },
          { symbol: 'swrConfig', source: '@/data/swr/config' },
        ],
        order: 12,
      },
      order: 12,
    });
    ops.push({
      capabilityId: 'data.swr',
      file,
      markerType: 'providers',
      contribution: {
        type: 'provider',
        provider: { symbol: 'SWRConfig', source: 'swr' },
        props: { value: 'swrConfig' },
        order: 12,
      },
      order: 12,
    });
  }

  // Offline: NetInfo (NetworkInfoProvider)
  if (inputs.selectedOptions.offline?.netinfo) {
    ops.push({
      capabilityId: 'offline.netinfo',
      file,
      markerType: 'imports',
      contribution: {
        type: 'import',
        imports: [{ symbol: 'NetworkInfoProvider', source: '@/offline/netinfo/context' }],
        order: 20,
      },
      order: 20,
    });
    ops.push({
      capabilityId: 'offline.netinfo',
      file,
      markerType: 'providers',
      contribution: {
        type: 'provider',
        provider: { symbol: 'NetworkInfoProvider', source: '@/offline/netinfo/context' },
        order: 20,
      },
      order: 20,
    });
  }

  return ops;
}

/**
 * Wires init-selected capabilities into the runtime (provider/import injection).
 * No-op if runtime file does not exist (e.g. Expo without bare runtime) or ops is empty.
 */
export function wireInitCapabilities(appRoot: string, inputs: InitInputs): void {
  const ops = buildWiringOpsFromInputs(appRoot, inputs);
  if (ops.length === 0) {
    return;
  }

  const runtimePath = `${appRoot}/${RUNTIME_INDEX_FILE}`;
  if (!pathExists(runtimePath)) {
    return;
  }

  wireRuntimeContributions(appRoot, ops, false);
}
