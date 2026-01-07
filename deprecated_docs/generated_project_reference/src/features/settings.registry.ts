import { ROUTES } from '@/app/navigation/routes';
import type { NavScreen } from './nav.types';
import { featureFlags } from './flags';

import SettingsScreen from '@/features/settings/screens/SettingsScreen';
import LanguageScreen from '@/features/settings/screens/LanguageScreen';
import ThemeScreen from '@/features/settings/screens/ThemeScreen';

export function getEnabledSettingsScreens(): NavScreen[] {
  const screens: NavScreen[] = [
    { name: ROUTES.SETTINGS_ROOT, component: SettingsScreen, order: 10 },
    { name: ROUTES.SETTINGS_LANGUAGE, component: LanguageScreen, order: 20 },
    { name: ROUTES.SETTINGS_THEME, component: ThemeScreen, order: 30 },
  ];

  // пример: если когда-то будет OAuth/Maps — добавишь сюда по флагу
  if (featureFlags.OAUTH) {
    // screens.push({ name: ROUTES.SETTINGS_OAUTH, component: OAuthSettingsScreen, order: 40 });
  }

  return screens.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
