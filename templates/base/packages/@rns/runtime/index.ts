/**
 * FILE: packages/@rns/runtime/index.ts
 * PURPOSE: Runtime composition layer that wires CORE into the app
 * OWNERSHIP: CORE
 * 
 * PLUGIN-FREE GUARANTEE:
 * - Only imports React Native core (react, react-native)
 * - No navigation, i18n, query, auth dependencies
 * - MinimalUI renders without any plugins
 * - Plugins integrate via RootProvider composition/extensions, NOT direct modification
 * 
 * PLUGIN INTEGRATION PATTERN:
 * - Plugins should extend RootProvider via HOC/wrapper components
 * - Plugins register via runtime registries (not direct imports in CORE)
 * - Plugins can replace MinimalUI but must maintain RnsApp export contract
 */

import React, { useEffect } from 'react';
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

