/**
 * FILE: packages/@rns/navigation/screens.tsx
 * PURPOSE: Minimal placeholder screens for CORE navigation presets.
 * OWNERSHIP: CORE
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

export function HomeScreen(props: { onOpenInfo?: () => void }): React.ReactElement {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.subtitle}>Bare init navigation is enabled</Text>
      {props.onOpenInfo ? (
        <Pressable onPress={props.onOpenInfo} style={styles.button}>
          <Text style={styles.buttonText}>Open modal</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function SettingsScreen(): React.ReactElement {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Placeholder screen</Text>
    </View>
  );
}

export function InfoModalScreen(props: { onClose?: () => void }): React.ReactElement {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Info (Modal)</Text>
      <Text style={styles.subtitle}>This is a modal route</Text>
      {props.onClose ? (
        <Pressable onPress={props.onClose} style={styles.button}>
          <Text style={styles.buttonText}>Close</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#111111',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

