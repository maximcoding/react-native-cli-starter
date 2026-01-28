/**
 * FILE: src/lib/init/state/index.ts
 * PURPOSE: State Management infrastructure generation (Section 51)
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { ensureDir, writeTextFile } from '../../fs';
import { USER_SRC_DIR } from '../../constants';
import type { InitInputs } from '../types';
import { generateZustandInfrastructure } from './zustand';
import { generateXStateInfrastructure } from './xstate';
import { generateMobxInfrastructure } from './mobx';

/**
 * Generates state management infrastructure based on selected options
 */
export function generateStateManagementInfrastructure(
  appRoot: string,
  inputs: InitInputs
): void {
  if (!inputs.selectedOptions.state) {
    return;
  }

  const stateDir = join(appRoot, USER_SRC_DIR, 'state');
  ensureDir(stateDir);

  if (inputs.selectedOptions.state.zustand) {
    generateZustandInfrastructure(appRoot, inputs);
  }

  if (inputs.selectedOptions.state.xstate) {
    generateXStateInfrastructure(appRoot, inputs);
  }

  if (inputs.selectedOptions.state.mobx) {
    generateMobxInfrastructure(appRoot, inputs);
  }
}
