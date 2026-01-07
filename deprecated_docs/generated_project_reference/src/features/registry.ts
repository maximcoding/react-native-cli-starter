// src/app/features/registry.ts
import { featureFlags } from './flags';
import type { AppFeature, RootScreen } from './types';

import { ROUTES } from '@/app/navigation/routes';
import AuthStack from '@/app/navigation/stacks/auth-stack';
import OnboardingStack from '@/app/navigation/stacks/onboarding-stack';
import HomeTabs from '@/app/navigation/tabs/home-tabs';

export const appFeatures: AppFeature[] = [
  {
    id: 'root-onboarding',
    enabled: featureFlags.ROOT_ONBOARDING,
    rootScreens: [
      { name: ROUTES.ROOT_ONBOARDING, component: OnboardingStack, order: 10 },
    ],
  },
  {
    id: 'root-auth',
    enabled: featureFlags.ROOT_AUTH,
    rootScreens: [{ name: ROUTES.ROOT_AUTH, component: AuthStack, order: 20 }],
  },
  {
    id: 'root-app',
    enabled: featureFlags.ROOT_APP,
    rootScreens: [{ name: ROUTES.ROOT_APP, component: HomeTabs, order: 30 }],
  },
];

export function getEnabledRootScreens(): RootScreen[] {
  return appFeatures
    .filter(f => f.enabled)
    .flatMap(f => f.rootScreens ?? [])
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

// optional: если хочешь чтобы фичи делали init() на старте
let didInit = false;
export function runFeatureInitsOnce() {
  if (didInit) return;
  didInit = true;

  for (const f of appFeatures) {
    if (f.enabled && f.init) f.init();
  }
}
