/**
 * FILE: src/lib/init/state/mobx.ts
 * PURPOSE: MobX infrastructure generation (Section 51)
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { ensureDir, writeTextFile } from '../../fs';
import { USER_SRC_DIR } from '../../constants';
import type { InitInputs } from '../types';

/**
 * Generates MobX infrastructure files
 */
export function generateMobxInfrastructure(
  appRoot: string,
  inputs: InitInputs
): void {
  const stateDir = join(appRoot, USER_SRC_DIR, 'state');
  const mobxDir = join(stateDir, 'mobx');
  const storesDir = join(mobxDir, 'stores');
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  ensureDir(storesDir);

  // Generate main mobx file
  const mainFilePath = join(mobxDir, `mobx.${fileExt}`);
  const mainContent = generateMobxMainFile(inputs);
  writeTextFile(mainFilePath, mainContent);

  // Generate example store
  const storeContent = generateExampleStore(inputs);
  writeTextFile(join(storesDir, `example.${fileExt}`), storeContent);
}

/**
 * Generates the main MobX file
 */
function generateMobxMainFile(inputs: InitInputs): string {
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  if (inputs.language === 'js') {
    return `/**
 * FILE: src/state/mobx/mobx.js
 * PURPOSE: MobX state management utilities (User Zone).
 * OWNERSHIP: USER
 * 
 * This file provides MobX utilities and re-exports example stores.
 * Example stores are in ./stores/.
 */

export * from 'mobx';
export * from 'mobx-react-lite';

// Re-export example stores
export * from './stores/example';
`;
  }

  return `/**
 * FILE: src/state/mobx/mobx.ts
 * PURPOSE: MobX state management utilities (User Zone).
 * OWNERSHIP: USER
 * 
 * This file provides MobX utilities and re-exports example stores.
 * Example stores are in ./stores/.
 */

export * from 'mobx';
export * from 'mobx-react-lite';

// Re-export example stores
export * from './stores/example';
`;
}

/**
 * Generates an example MobX store
 */
function generateExampleStore(inputs: InitInputs): string {
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  if (inputs.language === 'js') {
    return `/**
 * FILE: src/state/mobx/stores/example.js
 * PURPOSE: Example MobX store (User Zone).
 * OWNERSHIP: USER
 * 
 * Example MobX store demonstrating reactive state patterns.
 */

import { makeAutoObservable } from 'mobx';

export class ExampleStore {
  count = 0;

  constructor() {
    makeAutoObservable(this);
  }

  increment() {
    this.count += 1;
  }

  decrement() {
    this.count -= 1;
  }

  reset() {
    this.count = 0;
  }
}

export const exampleStore = new ExampleStore();
`;
  }

  return `/**
 * FILE: src/state/mobx/stores/example.ts
 * PURPOSE: Example MobX store (User Zone).
 * OWNERSHIP: USER
 * 
 * Example MobX store demonstrating reactive state patterns.
 */

import { makeAutoObservable } from 'mobx';

export class ExampleStore {
  count = 0;

  constructor() {
    makeAutoObservable(this);
  }

  increment(): void {
    this.count += 1;
  }

  decrement(): void {
    this.count -= 1;
  }

  reset(): void {
    this.count = 0;
  }
}

export const exampleStore = new ExampleStore();
`;
}
