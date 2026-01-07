src
├─ app
│  ├─ bootstrap
│  │  └─ init.ts
│  ├─ components
│  │  ├─ Button.tsx
│  │  ├─ IconSvg.tsx
│  │  ├─ OfflineBanner.tsx
│  │  └─ Text.tsx
│  ├─ hooks
│  │  └─ useOnlineStatus.ts
│  ├─ navigation
│  │  ├─ helpers
│  │  │  ├─ navigation-helpers.ts
│  │  │  └─ use-back-handler.ts
│  │  ├─ modals
│  │  │  ├─ global-modal.tsx
│  │  │  └─ half-sheet.tsx
│  │  ├─ options
│  │  │  ├─ navigation.presets.ts
│  │  │  ├─ navigation.tokens.ts
│  │  │  ├─ navigation.ts
│  │  │  └─ tabOptions.tsx
│  │  ├─ root
│  │  │  └─ root-navigator.tsx
│  │  ├─ stacks
│  │  │  ├─ auth-stack.tsx
│  │  │  ├─ home-stack.tsx
│  │  │  ├─ onboarding-stack.tsx
│  │  │  └─ settings-stack.tsx
│  │  ├─ tabs
│  │  │  └─ home-tabs.tsx
│  │  ├─ types
│  │  │  ├─ auth-types.ts
│  │  │  ├─ home-types.ts
│  │  │  ├─ onboarding-types.ts
│  │  │  ├─ root-types.ts
│  │  │  ├─ settings-types.ts
│  │  │  └─ tab-types.ts
│  │  ├─ index.ts
│  │  └─ routes.ts
│  ├─ services
│  │  └─ index.ts
│  └─ state
│     ├─ session.store.ts
│     ├─ settings.store.ts
│     ├─ storeFactory.ts
│     ├─ ui.store.ts
│     └─ zustand-mmkv.ts
├─ core
│  ├─ config
│  │  ├─ app-config.ts
│  │  ├─ constants.ts
│  │  ├─ env.ts
│  │  └─ feature-flags.ts
│  ├─ i18n
│  │  ├─ generate-i18n-types.cjs
│  │  ├─ i18n.ts
│  │  ├─ i18next-parser.config.cjs
│  │  ├─ index.ts
│  │  ├─ useT.ts
│  │  └─ locales
│  │     ├─ de.json
│  │     ├─ en.json
│  │     └─ ru.json
│  ├─ native
│  │  ├─ device-info.ts
│  │  ├─ haptics.ts
│  │  └─ permissions.ts
│  ├─ session
│  │  ├─ bootstrap.ts
│  │  ├─ logout.ts
│  │  ├─ session-bridge.ts
│  │  └─ useBootstrapRoute.ts
│  ├─ theme
│  │  ├─ ThemeContext.tsx
│  │  ├─ ThemeProvider.tsx
│  │  ├─ dark.ts
│  │  ├─ index.ts
│  │  ├─ light.ts
│  │  └─ tokens
│  │     ├─ elevation.ts
│  │     ├─ fonts.ts
│  │     ├─ radius.ts
│  │     ├─ spacing.ts
│  │     └─ typography.ts
│  ├─ ui
│  │  └─ toast.ts
│  └─ utils
├─ features
│  ├─ auth
│  │  ├─ api
│  │  │  └─ keys.ts
│  │  ├─ hooks
│  │  │  ├─ useAuthSessionQuery.ts
│  │  │  ├─ useLoginMutation.ts
│  │  │  └─ useLogout.ts
│  │  ├─ screens
│  │  │  └─ AuthScreen.tsx
│  │  └─ services
│  │     └─ auth
│  │        ├─ auth.mappers.ts
│  │        ├─ auth.schemas.ts
│  │        └─ auth.service.ts
│  ├─ home
│  │  └─ screens
│  │     └─ HomeScreen.tsx
│  ├─ settings
│  │  └─ screens
│  │     ├─ LanguageScreen.tsx
│  │     ├─ OnboardingScreen.tsx
│  │     └─ ThemeScreen.tsx
│  ├─ user
│  │  ├─ api
│  │  │  └─ keys.ts
│  │  ├─ hooks
│  │  │  ├─ useMeQuery.ts
│  │  │  └─ useUpdateProfile.ts
│  │  └─ services
│  │     └─ user
│  │        ├─ user.mappers.ts
│  │        ├─ user.schemas.ts
│  │        └─ user.service.ts
│  ├─ flags.ts
│  ├─ nav.types.ts
│  ├─ registry.ts
│  ├─ settings.registry.ts
│  └─ tabs.registry.ts
├─ infra
│  ├─ analytics
│  ├─ error
│  │  └─ normalize-error.ts
│  ├─ http
│  │  ├─ api.ts
│  │  ├─ axios.instance.ts
│  │  └─ interceptors
│  │     ├─ auth.interceptor.ts
│  │     ├─ error.interceptor.ts
│  │     └─ logging.interceptor.ts
│  ├─ logging
│  ├─ network
│  │  └─ netinfo.ts
│  ├─ offline
│  │  ├─ offline-queue.ts
│  │  └─ sync-engine.ts
│  ├─ query
│  │  ├─ client
│  │  │  ├─ client.ts
│  │  │  ├─ provider.tsx
│  │  │  └─ query-client.ts
│  │  ├─ helpers
│  │  │  └─ invalidate-by-tags.ts
│  │  ├─ index.ts
│  │  ├─ keys
│  │  │  └─ factory.ts
│  │  ├─ netmode
│  │  │  └─ network-mode.ts
│  │  ├─ persistence
│  │  │  ├─ limits.ts
│  │  │  └─ mmkv-persister.ts
│  │  ├─ policy
│  │  │  ├─ freshness.ts
│  │  │  └─ retry.ts
│  │  └─ tags.ts
│  ├─ storage
│  │  ├─ cache-engine.ts
│  │  └─ mmkv.ts
│  └─ transport
│     ├─ adapters
│     │  ├─ firebase.adapter.ts
│     │  ├─ graphql.adapter.ts
│     │  ├─ mock.adapter.ts
│     │  ├─ rest.adapter.ts
│     │  └─ websocket.adapter.ts
│     ├─ operations.ts
│     ├─ transport.ts
│     └─ transport.types.ts
└─ types
└─ globals.d.ts