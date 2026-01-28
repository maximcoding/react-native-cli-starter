/**
 * FILE: src/lib/init/auth/index.ts
 * PURPOSE: Auth infrastructure generation (Section 54)
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { ensureDir } from '../../fs';
import { USER_SRC_DIR } from '../../constants';
import type { InitInputs } from '../types';
import {
  generateFirebaseAuthInfrastructure,
  generateCognitoAuthInfrastructure,
  generateAuth0Infrastructure,
  generateJwtAuthInfrastructure,
} from './firebase';

/**
 * Generates auth infrastructure based on selected options
 */
export function generateAuthInfrastructure(
  appRoot: string,
  inputs: InitInputs
): void {
  if (!inputs.selectedOptions.auth) {
    return;
  }

  const authDir = join(appRoot, USER_SRC_DIR, 'auth');
  ensureDir(authDir);

  if (inputs.selectedOptions.auth.firebase) {
    generateFirebaseAuthInfrastructure(appRoot, inputs);
  }

  if (inputs.selectedOptions.auth.cognito) {
    generateCognitoAuthInfrastructure(appRoot, inputs);
  }

  if (inputs.selectedOptions.auth.auth0) {
    generateAuth0Infrastructure(appRoot, inputs);
  }

  if (inputs.selectedOptions.auth.customJwt) {
    generateJwtAuthInfrastructure(appRoot, inputs);
  }
}
