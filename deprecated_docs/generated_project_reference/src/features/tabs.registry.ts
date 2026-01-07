import { ROUTES } from '@/app/navigation/routes';
import type { NavScreen } from './nav.types';
import { featureFlags } from './flags';

import HomeScreen from '@/features/home/screens/HomeScreen';
import SettingsStack from '@/app/navigation/stacks/settings-stack';

export function getEnabledTabScreens(): NavScreen[] {
  const tabs: NavScreen[] = [];

  // Home tab (always for now)
  tabs.push({ name: ROUTES.TAB_HOME, component: HomeScreen, order: 10 });

  // Settings tab (example feature flag)
  if (featureFlags.USERS || true) {
    tabs.push({
      name: ROUTES.TAB_SETTINGS,
      component: SettingsStack,
      order: 20,
    });
  }

  return tabs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

