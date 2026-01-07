// src/app/features/types.ts
import type React from 'react';
import type { RouteName } from '@/app/navigation/routes';

export type RootScreen = {
  name: RouteName; // например ROUTES.ROOT_AUTH
  component: React.ComponentType<any>;
  order?: number; // чтобы контролировать порядок
};

export type AppFeature = {
  id: string;
  enabled: boolean;

  // Root containers (Onboarding/Auth/App)
  rootScreens?: RootScreen[];

  // One-time init hook (optional)
  init?: () => void;
};
