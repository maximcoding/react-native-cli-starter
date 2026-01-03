/**
 * FILE: src/lib/runtime-composition.ts
 * PURPOSE: Generate runtime composition layer during init
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { writeTextFile, ensureDir } from './fs';
import type { InitInputs } from './init';
import { CORE_PACKAGE_NAME } from './constants';

/**
 * Generates runtime composition layer in packages/@rns/runtime
 * Provides minimal bootable app component that initializes CORE
 */
export function generateRuntimeComposition(runtimeDir: string, inputs: InitInputs): void {
  const ext = inputs.language === 'ts' ? 'ts' : 'js';
  
  // Generate CORE init function
  const coreInitContent = generateCoreInit(ext);
  writeTextFile(join(runtimeDir, `core-init.${ext}`), coreInitContent);

  // Generate main runtime index with RnsApp component
  const runtimeIndexContent = generateRuntimeIndex(ext);
  writeTextFile(join(runtimeDir, `index.${ext}`), runtimeIndexContent);
}

function generateCoreInit(ext: 'ts' | 'js'): string {
  const corePackageName = CORE_PACKAGE_NAME;
  if (ext === 'ts') {
    return `/**
 * FILE: packages/@rns/runtime/core-init.ts
 * PURPOSE: Initialize CORE contracts (called once at app startup)
 * OWNERSHIP: CORE
 */

import { logger } from '${corePackageName}';
import { initNetInfoBridge } from '${corePackageName}';

let initialized = false;

/**
 * Initialize CORE contracts exactly once
 * Equivalent to prior appInit() behavior
 */
export function initCore(): void {
  if (initialized) {
    logger.warn('CORE already initialized, skipping');
    return;
  }

  logger.info('Initializing CORE...');

  // Initialize network monitoring (stub by default, plugins can wire NetInfo)
  initNetInfoBridge();

  initialized = true;
  logger.info('CORE initialized');
}
`;
  } else {
    return `/**
 * FILE: packages/@rns/runtime/core-init.js
 * PURPOSE: Initialize CORE contracts (called once at app startup)
 * OWNERSHIP: CORE
 */

import { logger } from '${corePackageName}';
import { initNetInfoBridge } from '${corePackageName}';

let initialized = false;

/**
 * Initialize CORE contracts exactly once
 * Equivalent to prior appInit() behavior
 */
export function initCore() {
  if (initialized) {
    logger.warn('CORE already initialized, skipping');
    return;
  }

  logger.info('Initializing CORE...');

  // Initialize network monitoring (stub by default, plugins can wire NetInfo)
  initNetInfoBridge();

  initialized = true;
  logger.info('CORE initialized');
}
`;
  }
}

function generateRuntimeIndex(ext: 'ts' | 'js'): string {
  if (ext === 'ts') {
    return `/**
 * FILE: packages/@rns/runtime/index.ts
 * PURPOSE: Runtime composition layer that wires CORE into the app
 * OWNERSHIP: CORE
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { initCore } from './core-init';

/**
 * Minimal root composition provider (stable for future plugin integration)
 * Plugins can extend this via registries/hooks without modifying CORE
 */
function RootProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  // Initialize CORE exactly once when provider mounts
  useEffect(() => {
    initCore();
  }, []);

  return <>{children}</>;
}

/**
 * Minimal UI component (not blank, renders basic status)
 * No navigation/i18n/query/auth required - all optional via plugins
 */
function MinimalUI(): React.ReactElement {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>React Native CLI</Text>
        <Text style={styles.subtitle}>CORE runtime initialized</Text>
        <Text style={styles.hint}>Ready for plugin integration</Text>
      </View>
    </View>
  );
}

/**
 * Runtime app component - bootable without plugins
 * Provides minimal composition that can be extended via plugins
 */
export function RnsApp(): React.ReactElement {
  return (
    <RootProvider>
      <MinimalUI />
    </RootProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: '#999999',
    marginTop: 8,
  },
});
`;
  } else {
    return `/**
 * FILE: packages/@rns/runtime/index.js
 * PURPOSE: Runtime composition layer that wires CORE into the app
 * OWNERSHIP: CORE
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { initCore } from './core-init';

/**
 * Minimal root composition provider (stable for future plugin integration)
 * Plugins can extend this via registries/hooks without modifying CORE
 */
function RootProvider({ children }) {
  // Initialize CORE exactly once when provider mounts
  useEffect(() => {
    initCore();
  }, []);

  return React.createElement(React.Fragment, null, children);
}

/**
 * Minimal UI component (not blank, renders basic status)
 * No navigation/i18n/query/auth required - all optional via plugins
 */
function MinimalUI() {
  return React.createElement(
    View,
    { style: styles.container },
    React.createElement(
      View,
      { style: styles.content },
      React.createElement(Text, { style: styles.title }, 'React Native CLI'),
      React.createElement(Text, { style: styles.subtitle }, 'CORE runtime initialized'),
      React.createElement(Text, { style: styles.hint }, 'Ready for plugin integration')
    )
  );
}

/**
 * Runtime app component - bootable without plugins
 * Provides minimal composition that can be extended via plugins
 */
export function RnsApp() {
  return React.createElement(
    RootProvider,
    null,
    React.createElement(MinimalUI)
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: '#999999',
    marginTop: 8,
  },
});
`;
  }
}

