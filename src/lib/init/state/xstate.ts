/**
 * FILE: src/lib/init/state/xstate.ts
 * PURPOSE: XState infrastructure generation (Section 51)
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { ensureDir, writeTextFile } from '../../fs';
import { USER_SRC_DIR } from '../../constants';
import type { InitInputs } from '../types';

/**
 * Generates XState infrastructure files
 */
export function generateXStateInfrastructure(
  appRoot: string,
  inputs: InitInputs
): void {
  const stateDir = join(appRoot, USER_SRC_DIR, 'state');
  const xstateDir = join(stateDir, 'xstate');
  const machinesDir = join(xstateDir, 'machines');
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  ensureDir(machinesDir);

  // Generate main xstate file
  const mainFilePath = join(xstateDir, `xstate.${fileExt}`);
  const mainContent = generateXStateMainFile(inputs);
  writeTextFile(mainFilePath, mainContent);

  // Generate example state machine
  const machineContent = generateExampleMachine(inputs);
  writeTextFile(join(machinesDir, `example.${fileExt}`), machineContent);
}

/**
 * Generates the main XState file
 */
function generateXStateMainFile(inputs: InitInputs): string {
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  if (inputs.language === 'js') {
    return `/**
 * FILE: src/state/xstate/xstate.js
 * PURPOSE: XState state machine utilities (User Zone).
 * OWNERSHIP: USER
 * 
 * This file provides XState utilities and re-exports example machines.
 * Example machines are in ./machines/.
 */

export * from 'xstate';
export * from '@xstate/react';

// Re-export example machines
export * from './machines/example';
`;
  }

  return `/**
 * FILE: src/state/xstate/xstate.ts
 * PURPOSE: XState state machine utilities (User Zone).
 * OWNERSHIP: USER
 * 
 * This file provides XState utilities and re-exports example machines.
 * Example machines are in ./machines/.
 */

export * from 'xstate';
export * from '@xstate/react';

// Re-export example machines
export * from './machines/example';
`;
}

/**
 * Generates an example state machine
 */
function generateExampleMachine(inputs: InitInputs): string {
  const fileExt = inputs.language === 'ts' ? 'ts' : 'js';

  if (inputs.language === 'js') {
    return `/**
 * FILE: src/state/xstate/machines/example.js
 * PURPOSE: Example XState state machine (User Zone).
 * OWNERSHIP: USER
 * 
 * Example state machine demonstrating XState patterns.
 */

import { createMachine, assign } from 'xstate';
import { useMachine } from '@xstate/react';

export const exampleMachine = createMachine({
  id: 'example',
  initial: 'idle',
  context: {
    count: 0,
  },
  states: {
    idle: {
      on: {
        START: 'active',
      },
    },
    active: {
      on: {
        INCREMENT: {
          actions: assign({
            count: (context) => context.count + 1,
          }),
        },
        DECREMENT: {
          actions: assign({
            count: (context) => context.count - 1,
          }),
        },
        STOP: 'idle',
      },
    },
  },
});

export function useExampleMachine() {
  return useMachine(exampleMachine);
}
`;
  }

  return `/**
 * FILE: src/state/xstate/machines/example.ts
 * PURPOSE: Example XState state machine (User Zone).
 * OWNERSHIP: USER
 * 
 * Example state machine demonstrating XState patterns.
 */

import { createMachine, assign, ActorRefFrom } from 'xstate';
import { useMachine } from '@xstate/react';

interface ExampleContext {
  count: number;
}

type ExampleEvent =
  | { type: 'START' }
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'STOP' };

export const exampleMachine = createMachine({
  id: 'example',
  initial: 'idle',
  context: {
    count: 0,
  },
  types: {} as {
    context: ExampleContext;
    events: ExampleEvent;
  },
  states: {
    idle: {
      on: {
        START: 'active',
      },
    },
    active: {
      on: {
        INCREMENT: {
          actions: assign({
            count: ({ context }) => context.count + 1,
          }),
        },
        DECREMENT: {
          actions: assign({
            count: ({ context }) => context.count - 1,
          }),
        },
        STOP: 'idle',
      },
    },
  },
});

export function useExampleMachine() {
  return useMachine(exampleMachine);
}
`;
}
