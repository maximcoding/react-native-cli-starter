import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SettingsStackParamList } from '@/app/navigation/types/settings-types';
import { getEnabledSettingsScreens } from '@/features/settings.registry.ts';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export default function SettingsStack() {
  const screens = getEnabledSettingsScreens();

  return (
    <Stack.Navigator>
      {screens.map(s => (
        <Stack.Screen
          key={s.name}
          name={s.name as any}
          component={s.component}
        />
      ))}
    </Stack.Navigator>
  );
}
