/**
 * FILE: src/lib/init/app-generation/app-tsx.ts
 * PURPOSE: App.tsx content generation (TypeScript)
 * OWNERSHIP: CLI
 */

import type { InitInputs } from '../types';

/**
 * Generates App.tsx content with all providers and navigation visible
 */
export function generateAppTsxContent(inputs: InitInputs): string {
  const hasTheming = inputs.selectedOptions?.theming === true;
  const hasReactNavigation = inputs.selectedOptions?.reactNavigation === true;
  const hasExpoRouter = inputs.selectedOptions?.expoRouter === true && inputs.target === 'expo';
  
  // Base imports
  let imports = `import React, { useEffect } from 'react';
import { initCore } from '@rns/runtime/core-init';
`;
  
  // Only include gesture handler and safe area provider if React Navigation is enabled
  if (hasReactNavigation) {
    imports += `import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
`;
  }
  
  imports += `// @rns-marker:imports:start
// Plugin imports will be injected here
// @rns-marker:imports:end
`;

  // Conditional imports
  if (hasTheming) {
    imports += `import { ThemeProvider } from '@rns/core/theme';
`;
  }
  
  if (hasReactNavigation) {
    imports += `import { RnsNavigationRoot } from '@rns/navigation';
`;
  }
  
  if (hasExpoRouter) {
    imports += `import { Stack } from 'expo-router';
`;
  }

  // Generate component based on target
  if (inputs.target === 'expo' && hasExpoRouter) {
    // Expo Router uses RootLayout in app/_layout.tsx for layout
    // App.tsx is not used by Expo Router, but we create it for consistency
    // The actual layout is in app/_layout.tsx
    return `${imports}
/**
 * App entrypoint for Expo Router.
 * Note: Expo Router uses app/_layout.tsx for the root layout.
 * This file is kept for consistency but is not used by Expo Router.
 */
export default function App() {
  // Expo Router uses app/_layout.tsx instead
  return null;
}
`;
  } else if (hasReactNavigation) {
    // React Navigation (both Expo and Bare)
    let providers = '';
    if (hasTheming) {
      providers = `        <ThemeProvider>
          <RnsNavigationRoot />
        </ThemeProvider>`;
    } else {
      providers = `        <RnsNavigationRoot />`;
    }
    
    return `${imports}
/**
 * App entrypoint with all providers and navigation directly visible.
 * This follows standard React Native patterns and is fully editable.
 * Plugin providers can be injected at @rns-marker:providers:start/end
 */
export default function App() {
  useEffect(() => {
    initCore();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* @rns-marker:providers:start */}
        {/* Plugin providers will wrap children here */}
        {/* @rns-marker:providers:end */}
${providers}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
`;
  } else {
    // Fallback: minimal structure without navigation
    let content = '';
    if (hasTheming) {
      content = `        <ThemeProvider>
          {/* Your app content here */}
        </ThemeProvider>`;
    } else {
      content = `        {/* Your app content here */}`;
    }
    
    // Wrap with providers only if React Navigation is enabled
    let wrapper = '';
    if (hasReactNavigation) {
      wrapper = `    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* @rns-marker:providers:start */}
        {/* Plugin providers will wrap children here */}
        {/* @rns-marker:providers:end */}
${content}
      </SafeAreaProvider>
    </GestureHandlerRootView>`;
    } else {
      wrapper = `    {/* @rns-marker:providers:start */}
      {/* Plugin providers will wrap children here */}
      {/* @rns-marker:providers:end */}
${content}`;
    }
    
    return `${imports}
/**
 * App entrypoint with all providers directly visible.
 * This follows standard React Native patterns and is fully editable.
 * Plugin providers can be injected at @rns-marker:providers:start/end
 */
export default function App() {
  useEffect(() => {
    initCore();
  }, []);

  return (
${wrapper}
  );
}
`;
  }
}
