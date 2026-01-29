/**
 * FILE: src/lib/init/data-fetching/index.ts
 * PURPOSE: Data Fetching/Cache infrastructure generation (Section 52)
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { ensureDir, writeTextFile } from '../../fs';
import { USER_SRC_DIR } from '../../constants';
import type { InitInputs } from '../types';
import { generateReactQueryInfrastructure } from './react-query';
import { generateApolloInfrastructure } from './apollo';
import { generateSwrInfrastructure } from './swr';

/**
 * Generates data fetching infrastructure based on selected options
 */
export function generateDataFetchingInfrastructure(
  appRoot: string,
  inputs: InitInputs
): void {
  if (!inputs.selectedOptions.dataFetching) {
    return;
  }

  const dataDir = join(appRoot, USER_SRC_DIR, 'data');
  ensureDir(dataDir);

  if (inputs.selectedOptions.dataFetching.reactQuery) {
    generateReactQueryInfrastructure(appRoot, inputs);
  }

  if (inputs.selectedOptions.dataFetching.apollo) {
    generateApolloInfrastructure(appRoot, inputs);
  }

  if (inputs.selectedOptions.dataFetching.swr) {
    generateSwrInfrastructure(appRoot, inputs);
  }
}
