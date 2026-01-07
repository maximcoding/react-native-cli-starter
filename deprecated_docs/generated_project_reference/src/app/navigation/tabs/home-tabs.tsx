import React, { useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useTheme } from '@/core/theme';
import { useT } from '@/core/i18n/useT';
import { createHomeScreenOptions } from '@/app/navigation';
import { getEnabledTabScreens } from '@/features/tabs.registry.ts';


const Tab = createBottomTabNavigator();

export default function HomeTabs() {
  const { theme } = useTheme();
  const t = useT();

  const screenOptions = useMemo(
    () => createHomeScreenOptions(theme, t),
    [theme, t],
  );

  const tabs = getEnabledTabScreens();

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      {tabs.map(s => (
        <Tab.Screen key={s.name} name={s.name as any} component={s.component} />
      ))}
    </Tab.Navigator>
  );
}
