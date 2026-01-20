import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initCore } from '@rns/runtime/core-init';
// @rns-marker:imports:start
// Plugin imports will be injected here
// @rns-marker:imports:end

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* @rns-marker:providers:start */}
        {/* Plugin providers will wrap children here */}
        {/* @rns-marker:providers:end */}
        {/* Your app content here */}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}


