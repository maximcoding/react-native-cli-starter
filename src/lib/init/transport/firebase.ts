/**
 * FILE: src/lib/init/transport/firebase.ts
 * PURPOSE: Firebase transport infrastructure generation (Section 53)
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { ensureDir, writeTextFile } from '../../fs';
import { USER_SRC_DIR } from '../../constants';
import type { InitInputs } from '../types';

/**
 * Generates Firebase transport infrastructure files
 */
export function generateFirebaseTransportInfrastructure(
  appRoot: string,
  inputs: InitInputs
): void {
  const transportDir = join(appRoot, USER_SRC_DIR, 'transport');
  const firebaseDir = join(transportDir, 'firebase');
  const servicesDir = join(firebaseDir, 'services');
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  ensureDir(servicesDir);

  // Generate Firebase config
  const configFilePath = join(firebaseDir, `config.${fileExt}`);
  const configContent = generateFirebaseConfig(inputs);
  writeTextFile(configFilePath, configContent);

  // Generate example service
  const exampleServiceContent = generateExampleService(inputs);
  writeTextFile(join(servicesDir, `example.${fileExt}`), exampleServiceContent);

  // Generate main firebase file
  const mainFilePath = join(firebaseDir, `firebase.${fileExt}`);
  const mainContent = generateFirebaseMainFile(inputs);
  writeTextFile(mainFilePath, mainContent);
}

function generateFirebaseConfig(inputs: InitInputs): string {
  if (inputs.language === 'js') {
    return `/**
 * FILE: src/transport/firebase/config.js
 * PURPOSE: Firebase initialization (User Zone).
 * OWNERSHIP: USER
 */

import { initializeApp, getApps } from '@react-native-firebase/app';

// Initialize Firebase if not already initialized
if (getApps().length === 0) {
  initializeApp({
    // Add your Firebase config here
    // apiKey: 'your-api-key',
    // authDomain: 'your-auth-domain',
    // projectId: 'your-project-id',
    // ...
  });
}

export { app } from '@react-native-firebase/app';
`;
  }

  return `/**
 * FILE: src/transport/firebase/config.ts
 * PURPOSE: Firebase initialization (User Zone).
 * OWNERSHIP: USER
 */

import { initializeApp, getApps, FirebaseApp } from '@react-native-firebase/app';

// Initialize Firebase if not already initialized
if (getApps().length === 0) {
  initializeApp({
    // Add your Firebase config here
    // apiKey: 'your-api-key',
    // authDomain: 'your-auth-domain',
    // projectId: 'your-project-id',
    // ...
  });
}

export { app } from '@react-native-firebase/app';
`;
}

function generateExampleService(inputs: InitInputs): string {
  if (inputs.language === 'js') {
    return `/**
 * FILE: src/transport/firebase/services/example.js
 * PURPOSE: Example Firebase service wrapper (User Zone).
 * OWNERSHIP: USER
 */

// Example Firebase service wrapper
// Replace with your actual Firebase service implementations

export class ExampleFirebaseService {
  async getData() {
    // Implement your Firebase service logic
    return null;
  }
}

export const exampleFirebaseService = new ExampleFirebaseService();
`;
  }

  return `/**
 * FILE: src/transport/firebase/services/example.ts
 * PURPOSE: Example Firebase service wrapper (User Zone).
 * OWNERSHIP: USER
 */

// Example Firebase service wrapper
// Replace with your actual Firebase service implementations

export class ExampleFirebaseService {
  async getData(): Promise<any> {
    // Implement your Firebase service logic
    return null;
  }
}

export const exampleFirebaseService = new ExampleFirebaseService();
`;
}

function generateFirebaseMainFile(inputs: InitInputs): string {
  if (inputs.language === 'js') {
    return `/**
 * FILE: src/transport/firebase/firebase.js
 * PURPOSE: Firebase utilities and re-exports (User Zone).
 * OWNERSHIP: USER
 */

export * from '@react-native-firebase/app';
export * from './config';
export * from './services/example';
`;
  }

  return `/**
 * FILE: src/transport/firebase/firebase.ts
 * PURPOSE: Firebase utilities and re-exports (User Zone).
 * OWNERSHIP: USER
 */

export * from '@react-native-firebase/app';
export * from './config';
export * from './services/example';
`;
}
