import type React from 'react';
import type { RouteName } from '@/app/navigation/routes';

export type NavScreen = {
  name: RouteName;
  component: React.ComponentType<any>;
  order?: number;
};
