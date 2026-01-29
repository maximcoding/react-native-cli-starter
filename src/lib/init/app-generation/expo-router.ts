/**
 * FILE: src/lib/init/app-generation/expo-router.ts
 * PURPOSE: Expo Router configuration
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { pathExists, ensureDir, writeTextFile } from '../../fs';
import type { InitInputs } from '../types';

/**
 * Configures Expo Router integration (Section 29)
 * Sets up Expo Router structure and navigation
 */
export function configureExpoRouter(appRoot: string, inputs: InitInputs): void {
  if (!inputs.selectedOptions.expoRouter || inputs.target !== 'expo') {
    return;
  }
  
  // Expo Router requires app/ directory structure
  const appDir = join(appRoot, 'app');
  if (!pathExists(appDir)) {
    ensureDir(appDir);
    
    // Create _layout.tsx for Expo Router with providers directly visible
    const layoutPath = join(appDir, '_layout.tsx');
    if (!pathExists(layoutPath)) {
      const hasTheming = inputs.selectedOptions?.theming === true;
      
      let layoutImports = `import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { initCore } from '@rns/runtime/core-init';
// @rns-marker:imports:start
// Plugin imports will be injected here
// @rns-marker:imports:end
`;
      
      if (hasTheming) {
        layoutImports += `import { ThemeProvider } from '@rns/core/theme';
`;
      }
      
      let layoutProviders = '';
      if (hasTheming) {
        layoutProviders = `        <ThemeProvider>
          <Stack>
            <Stack.Screen name="index" options={{ title: 'Home' }} />
          </Stack>
        </ThemeProvider>`;
      } else {
        layoutProviders = `        <Stack>
          <Stack.Screen name="index" options={{ title: 'Home' }} />
        </Stack>`;
      }
      
      const layoutContent = inputs.language === 'ts'
        ? `${layoutImports}
/**
 * Root layout for Expo Router with all providers directly visible.
 * This follows standard React Native patterns and is fully editable.
 * Plugin providers can be injected at @rns-marker:providers:start/end
 */
export default function RootLayout() {
  useEffect(() => {
    initCore();
  }, []);

  return (
    <SafeAreaProvider>
      {/* @rns-marker:providers:start */}
      {/* Plugin providers will wrap children here */}
      {/* @rns-marker:providers:end */}
${layoutProviders}
    </SafeAreaProvider>
  );
}
`
        : `${layoutImports}
/**
 * Root layout for Expo Router with all providers directly visible.
 * This follows standard React Native patterns and is fully editable.
 * Plugin providers can be injected at @rns-marker:providers:start/end
 */
export default function RootLayout() {
  useEffect(() => {
    initCore();
  }, []);

  return (
    <SafeAreaProvider>
      {/* @rns-marker:providers:start */}
      {/* Plugin providers will wrap children here */}
      {/* @rns-marker:providers:end */}
${layoutProviders}
    </SafeAreaProvider>
  );
}
`;
      writeTextFile(layoutPath, layoutContent);
    }
    
    // Create index.tsx
    const indexPath = join(appDir, 'index.tsx');
    if (!pathExists(indexPath)) {
      const indexContent = inputs.language === 'ts'
        ? `import { View, Text } from 'react-native';

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Welcome to Expo Router</Text>
    </View>
  );
}
`
        : `import { View, Text } from 'react-native';

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Welcome to Expo Router</Text>
    </View>
  );
}
`;
      writeTextFile(indexPath, indexContent);
    }
  }
}
