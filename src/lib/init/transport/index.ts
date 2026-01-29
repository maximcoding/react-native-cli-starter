/**
 * FILE: src/lib/init/transport/index.ts
 * PURPOSE: Network Transport infrastructure generation (Section 53)
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { ensureDir } from '../../fs';
import { USER_SRC_DIR } from '../../constants';
import type { InitInputs } from '../types';
import { generateAxiosInfrastructure } from './axios';
import { generateWebSocketInfrastructure } from './websocket';
import { generateFirebaseTransportInfrastructure } from './firebase';

/**
 * Generates network transport infrastructure based on selected options
 */
export function generateTransportInfrastructure(
  appRoot: string,
  inputs: InitInputs
): void {
  if (!inputs.selectedOptions.transport) {
    return;
  }

  const transportDir = join(appRoot, USER_SRC_DIR, 'transport');
  ensureDir(transportDir);

  if (inputs.selectedOptions.transport.axios) {
    generateAxiosInfrastructure(appRoot, inputs);
  }

  if (inputs.selectedOptions.transport.websocket) {
    generateWebSocketInfrastructure(appRoot, inputs);
  }

  if (inputs.selectedOptions.transport.firebase) {
    generateFirebaseTransportInfrastructure(appRoot, inputs);
  }
}
