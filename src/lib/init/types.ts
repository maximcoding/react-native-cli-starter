/**
 * FILE: src/lib/init/types.ts
 * PURPOSE: Type definitions for init pipeline
 * OWNERSHIP: CLI
 */

import { RuntimeContext } from '../runtime';

export interface InitOptions {
  projectName?: string;
  destination?: string;
  target?: 'expo' | 'bare';
  language?: 'ts' | 'js';
  packageManager?: 'npm' | 'pnpm' | 'yarn';
  reactNativeVersion?: string;
  platforms?: string[];
  locales?: string[];
  context: RuntimeContext;
}

export interface InitInputs {
  projectName: string;
  destination: string;
  target: 'expo' | 'bare';
  language: 'ts' | 'js';
  packageManager: 'npm' | 'pnpm' | 'yarn';
  reactNativeVersion?: string; // Only for Bare
  /**
   * Bare init navigation preset (CORE).
   * Note: Expo navigation selection can be added later as a separate TODO section.
   */
  navigationPreset?: 'stack-only' | 'tabs-only' | 'stack-tabs' | 'stack-tabs-modals' | 'drawer';
  /**
   * Selected locales for I18n (CORE).
   * Only populated if i18n option is selected in selectedOptions.
   */
  locales: string[];
  /**
   * Selected project feature options (section 29, 30).
   */
  selectedOptions: {
    // Common options (available for both Expo and Bare)
    i18n: boolean;
    theming: boolean;
    reactNavigation: boolean;
    styling: 'nativewind' | 'unistyles' | 'tamagui' | 'restyle' | 'stylesheet';
    reactNativeScreens?: boolean; // Optional (currently auto-included with React Navigation)
    reactNativePaper?: boolean; // Material Design component library
    reactNativeElements?: boolean; // Component library (React Native Elements)
    uiKitten?: boolean; // Component library (UI Kitten)
    styledComponents?: boolean; // CSS-in-JS styling library
    reactNativeWeb?: boolean; // Web support for React Native apps
    
    // State management options (section 31)
    state?: {
      zustand?: boolean; // Zustand - lightweight
      xstate?: boolean; // XState - state machines
      mobx?: boolean; // MobX - reactive state
    };
    
    // Data fetching options (section 32)
    dataFetching?: {
      reactQuery?: boolean; // TanStack Query / React Query
      apollo?: boolean; // Apollo Client
      swr?: boolean; // SWR
    };
    
    // Network transport options (section 33)
    transport?: {
      axios?: boolean; // Axios - HTTP client
      websocket?: boolean; // WebSocket client with reconnection
      firebase?: boolean; // Firebase SDK
    };
    
    // Auth options (section 34)
    auth?: {
      firebase?: boolean; // Firebase Authentication
      cognito?: boolean; // AWS Cognito
      auth0?: boolean; // Auth0
      customJwt?: boolean; // Custom JWT
    };
    
    // AWS services options (section 35)
    aws?: {
      amplify?: boolean; // AWS Amplify
      appsync?: boolean; // AWS AppSync
      dynamodb?: boolean; // AWS DynamoDB
      s3?: boolean; // AWS S3
    };
    
    // Storage options (section 36)
    storage?: {
      mmkv?: boolean; // MMKV - fast key-value
      sqlite?: boolean; // SQLite database
      secure?: boolean; // Secure storage - keychain/keystore
      filesystem?: boolean; // File system access
    };
    
    // Firebase Products options (section 37)
    firebase?: {
      firestore?: boolean; // Cloud Firestore
      realtimeDatabase?: boolean; // Realtime Database
      storage?: boolean; // Cloud Storage
      remoteConfig?: boolean; // Remote Config
    };
    
    // Offline-first options (section 38)
    offline?: {
      netinfo?: boolean; // Network info detection
      outbox?: boolean; // Offline queue/outbox pattern
      sync?: boolean; // Sync manager
    };
    
    // Notifications options (section 39)
    notifications?: {
      expo?: boolean; // Expo Notifications (Expo target only)
      fcm?: boolean; // Firebase Cloud Messaging
      onesignal?: boolean; // OneSignal
    };
    
    // Maps/Location options (section 40)
    maps?: {
      location?: boolean; // Geolocation
      mapbox?: boolean; // Mapbox
      google?: boolean; // Google Maps
    };
    
    // Camera/Media options (section 41)
    media?: {
      camera?: boolean; // Camera access (Expo)
      visionCamera?: boolean; // Vision Camera (Bare only)
      picker?: boolean; // Image/Media picker
    };
    
    // Payments options (section 42)
    payments?: {
      stripe?: boolean; // Stripe
    };
    
    // IAP options (section 43) - single slot
    iap?: {
      revenuecat?: boolean; // RevenueCat
      adapty?: boolean; // Adapty
      appStore?: boolean; // App Store IAP
      playBilling?: boolean; // Google Play Billing
    };
    
    // Analytics/Observability options (section 44)
    analytics?: {
      firebase?: boolean; // Firebase Analytics
      amplitude?: boolean; // Amplitude
      sentry?: boolean; // Sentry
      bugsnag?: boolean; // Bugsnag
    };
    
    // Search options (section 45)
    search?: {
      algolia?: boolean; // Algolia
      localIndex?: boolean; // Local search index
    };
    
    // OTA Updates options (section 46) - single slot
    ota?: {
      expoUpdates?: boolean; // Expo Updates (Expo target only)
      codePush?: boolean; // CodePush
    };
    
    // Background Tasks options (section 47)
    background?: {
      tasks?: boolean; // Background tasks
      geofencing?: boolean; // Geofencing
      fetch?: boolean; // Background fetch
    };
    
    // Privacy & Consent options (section 48)
    privacy?: {
      att?: boolean; // App Tracking Transparency
      consent?: boolean; // Consent management
      gdpr?: boolean; // GDPR compliance
    };
    
    // Device/Hardware options (section 49)
    device?: {
      biometrics?: boolean; // Biometrics
      bluetooth?: boolean; // Bluetooth
    };
    
    // Testing options (section 50)
    testing?: {
      detox?: boolean; // Detox E2E testing
    };
    
    // Expo-specific options (only available when target is Expo)
    expoRouter?: boolean; // Currently implemented
    expoLinking?: boolean; // URL handling and deep linking
    expoStatusBar?: boolean; // Status bar customization
    expoSystemUI?: boolean; // System UI customization
    expoWebBrowser?: boolean; // Open links in browser
    expoDevClient?: boolean; // Custom development client for native modules
    expoVectorIcons?: boolean; // Vector icon library (Ionicons, MaterialIcons, etc.)
    expoImage?: boolean; // Optimized image component with caching
    expoLinearGradient?: boolean; // Linear gradient component
    expoHaptics?: boolean; // Haptic feedback (vibrations)
    expoDevice?: boolean; // Device information utilities
    
    // Bare-specific options (only available when target is Bare)
    reactNativeKeychain?: boolean; // Secure keychain/keystore storage
    reactNativeFS?: boolean; // Native file system access
    reactNativePermissions?: boolean; // Unified permissions API for native modules
    reactNativeFastImage?: boolean; // Optimized image loading with native caching
    nativeModulesSupport?: boolean; // Provider SDKs and native configuration support
    
    // Deprecated/removed options (kept for backward compatibility)
    authentication?: 'firebase' | 'supabase' | null; // Use plugin system instead
  };
  coreToggles: {
    alias: boolean;
    svg: boolean;
    fonts: boolean;
    env: boolean;
  };
  plugins: string[]; // Plugin IDs to apply after init
  installCoreDependencies: boolean; // Whether to install CORE dependencies during init
}
