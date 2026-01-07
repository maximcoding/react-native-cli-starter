// src/app/features/flags.ts
export const featureFlags = {
  ROOT_ONBOARDING: true,
  ROOT_AUTH: true,
  ROOT_APP: true,

  // заготовки (потом добавишь)
  USERS: true,
  OAUTH: false,
  MAPS: false,
  REALTIME_WS: false,
  AI: false,
} as const;
