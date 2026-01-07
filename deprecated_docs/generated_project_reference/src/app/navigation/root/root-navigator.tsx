/**
 * FILE: root-navigator.tsx
 * LAYER: navigation/root
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ROUTES } from '@/app/navigation/routes';
import { RootStackParamList } from '@/app/navigation';
import { useBootstrapRoute } from '@/core/session/useBootstrapRoute';
import { getEnabledRootScreens } from '@/features/registry.ts';

const Stack = createNativeStackNavigator<RootStackParamList>();

function pickInitialRouteName(
  boot: 'ROOT_APP' | 'ROOT_AUTH' | 'ROOT_ONBOARDING',
  enabledRootNames: Set<string>,
) {
  // boot приходит такими же строками, как ROUTES.*, так что маппинг не нужен
  if (enabledRootNames.has(boot)) return boot;

  // fallback при выключенной фиче
  if (enabledRootNames.has(ROUTES.ROOT_APP)) return ROUTES.ROOT_APP;
  if (enabledRootNames.has(ROUTES.ROOT_AUTH)) return ROUTES.ROOT_AUTH;
  if (enabledRootNames.has(ROUTES.ROOT_ONBOARDING))
    return ROUTES.ROOT_ONBOARDING;

  // на всякий случай
  return ROUTES.ROOT_APP;
}

export default function RootNavigator() {
  const boot = useBootstrapRoute();
  const rootScreens = getEnabledRootScreens();

  // TODO: заменить на Splash screen
  if (!boot) return null;

  const enabledNames = new Set(rootScreens.map(s => s.name));
  const initialRouteName = pickInitialRouteName(boot, enabledNames);

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName as any}
      screenOptions={{ headerShown: false }}
    >
      {rootScreens.map(s => (
        <Stack.Screen
          key={s.name}
          name={s.name as any}
          component={s.component}
        />
      ))}
    </Stack.Navigator>
  );
}
