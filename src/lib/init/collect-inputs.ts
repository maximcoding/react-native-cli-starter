/**
 * FILE: src/lib/init/collect-inputs.ts
 * PURPOSE: Collect init inputs from user
 * OWNERSHIP: CLI
 */

import { join, resolve } from 'path';
import { readdirSync } from 'fs';
import { CliError, ExitCode } from '../errors';
import { promptText, promptSelect, promptMultiSelect, promptConfirm } from '../prompts';
import { pathExists, isDirectory } from '../fs';
import { RuntimeContext } from '../runtime';
import type { InitOptions, InitInputs } from './types';
import {
  DEFAULT_TARGET,
  DEFAULT_LANGUAGE,
  DEFAULT_PACKAGE_MANAGER,
  DEFAULT_RN_VERSION,
  DEFAULT_NAV_PRESET,
  DEFAULT_LOCALES,
  DEFAULT_CORE_TOGGLES,
  AVAILABLE_LOCALES,
} from './utils';

/**
 * Collects init inputs from user (or uses defaults if --yes flag is set)
 */
export async function collectInitInputs(options: InitOptions): Promise<InitInputs> {
  const { context } = options;
  const isNonInteractive = context.flags.yes;

  // 1. Project name
  let projectName = options.projectName;
  if (!projectName) {
    if (isNonInteractive) {
      throw new CliError('Project name is required', ExitCode.VALIDATION_STATE_FAILURE);
    }
    projectName = await promptText('Project name (required)');
    if (!projectName.trim()) {
      throw new CliError('Project name cannot be empty', ExitCode.VALIDATION_STATE_FAILURE);
    }
  }

  // 2. Destination path
  let destination = options.destination;
  if (!destination) {
    const defaultDestination = join(context.resolvedRoot, projectName);
    if (isNonInteractive) {
      destination = defaultDestination;
    } else {
      const answer = await promptText(`Destination path (default: ${defaultDestination})`, defaultDestination);
      destination = answer || defaultDestination;
    }
  }

  // 3. Target: Expo or Bare
  let target: 'expo' | 'bare';
  if (options.target) {
    // Use provided target from command-line flag
    target = options.target;
  } else if (isNonInteractive) {
    target = DEFAULT_TARGET;
  } else {
    target = await promptSelect('Select target', [
      { label: String(DEFAULT_TARGET) === 'expo' ? 'Expo (default)' : 'Expo', value: 'expo' as const },
      { label: String(DEFAULT_TARGET) === 'bare' ? 'Bare React Native (default)' : 'Bare React Native', value: 'bare' as const },
    ], DEFAULT_TARGET);
  }

  // 4. Language: TS or JS
  let language: 'ts' | 'js';
  if (options.language) {
    // Use provided language from command-line flag
    language = options.language;
  } else if (isNonInteractive) {
    language = DEFAULT_LANGUAGE;
  } else {
    language = await promptSelect('Select language', [
      { label: String(DEFAULT_LANGUAGE) === 'ts' ? 'TypeScript (default)' : 'TypeScript', value: 'ts' as const },
      { label: String(DEFAULT_LANGUAGE) === 'js' ? 'JavaScript (default)' : 'JavaScript', value: 'js' as const },
    ], DEFAULT_LANGUAGE);
  }

  // 5. Package manager
  let packageManager: 'npm' | 'pnpm' | 'yarn';
  if (options.packageManager) {
    // Use provided package manager from command-line flag
    packageManager = options.packageManager;
  } else if (isNonInteractive) {
    packageManager = DEFAULT_PACKAGE_MANAGER;
  } else {
    packageManager = await promptSelect('Select package manager', [
      { label: String(DEFAULT_PACKAGE_MANAGER) === 'npm' ? 'npm (default)' : 'npm', value: 'npm' as const },
      { label: String(DEFAULT_PACKAGE_MANAGER) === 'pnpm' ? 'pnpm (default)' : 'pnpm', value: 'pnpm' as const },
      { label: String(DEFAULT_PACKAGE_MANAGER) === 'yarn' ? 'yarn (default)' : 'yarn', value: 'yarn' as const },
    ], DEFAULT_PACKAGE_MANAGER);
  }

  // 6. RN version (only for Bare)
  let reactNativeVersion: string | undefined;
  if (target === 'bare') {
    if (options.reactNativeVersion) {
      // Use provided React Native version from command-line flag
      reactNativeVersion = options.reactNativeVersion;
    } else if (isNonInteractive) {
      reactNativeVersion = DEFAULT_RN_VERSION;
    } else {
      reactNativeVersion = await promptSelect('Select React Native version', [
        { label: String(DEFAULT_RN_VERSION) === 'latest' ? 'Latest stable (default)' : 'Latest stable', value: 'latest' },
        { label: String(DEFAULT_RN_VERSION) === '0.74' ? '0.74.x (default)' : '0.74.x', value: '0.74' },
        { label: String(DEFAULT_RN_VERSION) === '0.73' ? '0.73.x (default)' : '0.73.x', value: '0.73' },
        { label: String(DEFAULT_RN_VERSION) === '0.72' ? '0.72.x (default)' : '0.72.x', value: '0.72' },
      ], DEFAULT_RN_VERSION);
    }
  }

  // 6.1 Multi-option selection (section 29)
  // Users select which features to include in the project
  let selectedOptions: InitInputs['selectedOptions'];
  
  if (isNonInteractive) {
    // Non-interactive defaults
    selectedOptions = {
      i18n: true,
      theming: false,
      reactNavigation: target === 'bare', // Default selected for Bare
      styling: 'stylesheet',
      // Expo-specific options (only for Expo)
      expoRouter: target === 'expo' ? false : undefined,
      // State management (section 31) - not selected by default
      state: undefined,
      // Data fetching (section 32) - not selected by default
      dataFetching: undefined,
      // Network transport (section 33) - not selected by default
      transport: undefined,
      // Auth (section 34) - not selected by default
      auth: undefined,
      // AWS services (section 35) - not selected by default
      aws: undefined,
      // Storage (section 36) - not selected by default
      storage: undefined,
      // Deprecated options (always null/false - use plugin system)
      authentication: null,
    };
  } else {
    // Build option choices based on target (section 30)
    // Common options (available for both targets)
    const commonOptions: Array<{ label: string; value: string; default: boolean }> = [
      { label: 'Internationalization (i18next)', value: 'i18n', default: true },
      { label: 'Theming (light/dark support)', value: 'theming', default: false },
      { label: 'React Navigation', value: 'react-navigation', default: target === 'bare' },
      { label: 'Styling library', value: 'styling', default: false },
      { label: 'React Native Screens', value: 'react-native-screens', default: false },
      { label: 'React Native Paper (Material Design)', value: 'react-native-paper', default: false },
      { label: 'React Native Elements', value: 'react-native-elements', default: false },
      { label: 'UI Kitten', value: 'ui-kitten', default: false },
      { label: 'Styled Components', value: 'styled-components', default: false },
      { label: 'React Native Web', value: 'react-native-web', default: false },
      { label: 'State Management', value: 'state-management', default: false },
      { label: 'Data Fetching', value: 'data-fetching', default: false },
      { label: 'Network Transport', value: 'network-transport', default: false },
      { label: 'Authentication', value: 'authentication', default: false },
      { label: 'AWS Services', value: 'aws-services', default: false },
      { label: 'Storage', value: 'storage', default: false },
      { label: 'Firebase Products', value: 'firebase-products', default: false },
      { label: 'Offline-first', value: 'offline-first', default: false },
      { label: 'Notifications', value: 'notifications', default: false },
      { label: 'Maps / Location', value: 'maps-location', default: false },
      { label: 'Camera / Media', value: 'camera-media', default: false },
      { label: 'Payments', value: 'payments', default: false },
      { label: 'Subscriptions / IAP', value: 'subscriptions-iap', default: false },
      { label: 'Analytics / Observability', value: 'analytics-observability', default: false },
      { label: 'Search', value: 'search', default: false },
      { label: 'OTA Updates', value: 'ota-updates', default: false },
      { label: 'Background Tasks', value: 'background-tasks', default: false },
      { label: 'Privacy & Consent', value: 'privacy-consent', default: false },
      { label: 'Device / Hardware', value: 'device-hardware', default: false },
      { label: 'Testing', value: 'testing', default: false },
    ];
    
    // Expo-specific options (only for Expo target)
    const expoOptions: Array<{ label: string; value: string; default: boolean }> = [];
    if (target === 'expo') {
      expoOptions.push(
        { label: 'Expo Router', value: 'expo-router', default: false },
        { label: 'Expo Linking', value: 'expo-linking', default: false },
        { label: 'Expo Status Bar', value: 'expo-status-bar', default: false },
        { label: 'Expo System UI', value: 'expo-system-ui', default: false },
        { label: 'Expo Web Browser', value: 'expo-web-browser', default: false },
        { label: 'Expo Dev Client', value: 'expo-dev-client', default: false },
        { label: '@expo/vector-icons', value: 'expo-vector-icons', default: false },
        { label: 'Expo Image', value: 'expo-image', default: false },
        { label: 'Expo Linear Gradient', value: 'expo-linear-gradient', default: false },
        { label: 'Expo Haptics', value: 'expo-haptics', default: false },
        { label: 'Expo Device', value: 'expo-device', default: false }
      );
    }
    
    // Bare-specific options (only for Bare target)
    const bareOptions: Array<{ label: string; value: string; default: boolean }> = [];
    if (target === 'bare') {
      bareOptions.push(
        { label: 'React Native Keychain', value: 'react-native-keychain', default: false },
        { label: 'React Native FS', value: 'react-native-fs', default: false },
        { label: 'React Native Permissions', value: 'react-native-permissions', default: false },
        { label: 'React Native Fast Image', value: 'react-native-fast-image', default: false },
        { label: 'Native Modules Support', value: 'native-modules-support', default: false }
      );
    }
    
    // Combine all options (common + target-specific)
    const allOptions = [
      { label: 'Select all (testing only)', value: '__select_all__', default: false },
      ...commonOptions,
      ...expoOptions,
      ...bareOptions,
    ];
    
    let selectedOptionIds = await promptMultiSelect(
      'Select features to include in your project',
      allOptions
    );
    
    // If "Select all (testing only)" was chosen, treat as all real options selected
    if (selectedOptionIds.includes('__select_all__')) {
      selectedOptionIds = allOptions
        .map((o) => o.value)
        .filter((v) => v !== '__select_all__');
    }
    
    // Initialize selectedOptions with defaults
    selectedOptions = {
      // Common options
      i18n: selectedOptionIds.includes('i18n'),
      theming: selectedOptionIds.includes('theming'),
      reactNavigation: selectedOptionIds.includes('react-navigation'),
      reactNativeScreens: selectedOptionIds.includes('react-native-screens'),
      reactNativePaper: selectedOptionIds.includes('react-native-paper'),
      reactNativeElements: selectedOptionIds.includes('react-native-elements'),
      uiKitten: selectedOptionIds.includes('ui-kitten'),
      styledComponents: selectedOptionIds.includes('styled-components'),
      reactNativeWeb: selectedOptionIds.includes('react-native-web'),
      styling: 'stylesheet',
      
      // Expo-specific options (only set if target is Expo)
      expoRouter: target === 'expo' ? selectedOptionIds.includes('expo-router') : undefined,
      expoLinking: target === 'expo' ? selectedOptionIds.includes('expo-linking') : undefined,
      expoStatusBar: target === 'expo' ? selectedOptionIds.includes('expo-status-bar') : undefined,
      expoSystemUI: target === 'expo' ? selectedOptionIds.includes('expo-system-ui') : undefined,
      expoWebBrowser: target === 'expo' ? selectedOptionIds.includes('expo-web-browser') : undefined,
      expoDevClient: target === 'expo' ? selectedOptionIds.includes('expo-dev-client') : undefined,
      expoVectorIcons: target === 'expo' ? selectedOptionIds.includes('expo-vector-icons') : undefined,
      expoImage: target === 'expo' ? selectedOptionIds.includes('expo-image') : undefined,
      expoLinearGradient: target === 'expo' ? selectedOptionIds.includes('expo-linear-gradient') : undefined,
      expoHaptics: target === 'expo' ? selectedOptionIds.includes('expo-haptics') : undefined,
      expoDevice: target === 'expo' ? selectedOptionIds.includes('expo-device') : undefined,
      
      // Bare-specific options (only set if target is Bare)
      reactNativeKeychain: target === 'bare' ? selectedOptionIds.includes('react-native-keychain') : undefined,
      reactNativeFS: target === 'bare' ? selectedOptionIds.includes('react-native-fs') : undefined,
      reactNativePermissions: target === 'bare' ? selectedOptionIds.includes('react-native-permissions') : undefined,
      reactNativeFastImage: target === 'bare' ? selectedOptionIds.includes('react-native-fast-image') : undefined,
      nativeModulesSupport: target === 'bare' ? selectedOptionIds.includes('native-modules-support') : undefined,
      
      // State management (section 31) - initialized if state-management is selected
      state: undefined,
      
      // Data fetching (section 32) - initialized if data-fetching is selected
      dataFetching: undefined,
      
      // Network transport (section 33) - initialized if network-transport is selected
      transport: undefined,
      
      // Auth (section 34) - initialized if authentication is selected
      auth: undefined,
      
      // AWS services (section 35) - initialized if aws-services is selected
      aws: undefined,
      
      // Storage (section 36) - initialized if storage is selected
      storage: undefined,
      
      // Firebase Products (section 37) - initialized if firebase-products is selected
      firebase: undefined,
      
      // Offline-first (section 38) - initialized if offline-first is selected
      offline: undefined,
      
      // Notifications (section 39) - initialized if notifications is selected
      notifications: undefined,
      
      // Maps/Location (section 40) - initialized if maps-location is selected
      maps: undefined,
      
      // Camera/Media (section 41) - initialized if camera-media is selected
      media: undefined,
      
      // Payments (section 42) - initialized if payments is selected
      payments: undefined,
      
      // IAP (section 43) - initialized if subscriptions-iap is selected
      iap: undefined,
      
      // Analytics/Observability (section 44) - initialized if analytics-observability is selected
      analytics: undefined,
      
      // Search (section 45) - initialized if search is selected
      search: undefined,
      
      // OTA Updates (section 46) - initialized if ota-updates is selected
      ota: undefined,
      
      // Background Tasks (section 47) - initialized if background-tasks is selected
      background: undefined,
      
      // Privacy & Consent (section 48) - initialized if privacy-consent is selected
      privacy: undefined,
      
      // Device/Hardware (section 49) - initialized if device-hardware is selected
      device: undefined,
      
      // Testing (section 50) - initialized if testing is selected
      testing: undefined,
      
      // Deprecated options (always null/false - use plugin system)
      authentication: null,
    };
    
    // Handle styling selection
    if (selectedOptionIds.includes('styling')) {
      const stylingChoice = await promptSelect(
        'Select styling library',
        [
          { label: 'NativeWind', value: 'nativewind' as const },
          { label: 'Unistyles', value: 'unistyles' as const },
          { label: 'Tamagui', value: 'tamagui' as const },
          { label: 'Restyle', value: 'restyle' as const },
          { label: 'StyleSheet (default)', value: 'stylesheet' as const },
        ],
        'stylesheet'
      );
      selectedOptions.styling = stylingChoice;
    }
    
    // Section 31: Handle state management selection
    if (selectedOptionIds.includes('state-management')) {
      const stateChoices = [
        { label: 'Zustand (lightweight)', value: 'zustand', default: false },
        { label: 'XState (state machines)', value: 'xstate', default: false },
        { label: 'MobX (reactive state)', value: 'mobx', default: false },
      ];
      
      const selectedStateLibs = await promptMultiSelect(
        'Select state management libraries (multi-select)',
        stateChoices
      );
      
      selectedOptions.state = {
        zustand: selectedStateLibs.includes('zustand'),
        xstate: selectedStateLibs.includes('xstate'),
        mobx: selectedStateLibs.includes('mobx'),
      };
    }
    
    // Section 32: Handle data fetching selection
    if (selectedOptionIds.includes('data-fetching')) {
      const dataFetchingChoices = [
        { label: 'TanStack Query / React Query', value: 'react-query', default: false },
        { label: 'Apollo Client', value: 'apollo', default: false },
        { label: 'SWR', value: 'swr', default: false },
      ];
      
      const selectedDataLibs = await promptMultiSelect(
        'Select data fetching libraries (multi-select)',
        dataFetchingChoices
      );
      
      selectedOptions.dataFetching = {
        reactQuery: selectedDataLibs.includes('react-query'),
        apollo: selectedDataLibs.includes('apollo'),
        swr: selectedDataLibs.includes('swr'),
      };
    }
    
    // Section 33: Handle network transport selection
    if (selectedOptionIds.includes('network-transport')) {
      const transportChoices = [
        { label: 'Axios (HTTP client)', value: 'axios', default: false },
        { label: 'WebSocket (with reconnection)', value: 'websocket', default: false },
        { label: 'Firebase SDK', value: 'firebase', default: false },
      ];
      
      const selectedTransportLibs = await promptMultiSelect(
        'Select network transport libraries (multi-select)',
        transportChoices
      );
      
      selectedOptions.transport = {
        axios: selectedTransportLibs.includes('axios'),
        websocket: selectedTransportLibs.includes('websocket'),
        firebase: selectedTransportLibs.includes('firebase'),
      };
    }
    
    // Section 34: Handle authentication selection
    if (selectedOptionIds.includes('authentication')) {
      const authChoices = [
        { label: 'Firebase Authentication', value: 'firebase', default: false },
        { label: 'AWS Cognito', value: 'cognito', default: false },
        { label: 'Auth0', value: 'auth0', default: false },
        { label: 'Custom JWT', value: 'custom-jwt', default: false },
      ];
      
      const selectedAuthLibs = await promptMultiSelect(
        'Select authentication providers (multi-select)',
        authChoices
      );
      
      selectedOptions.auth = {
        firebase: selectedAuthLibs.includes('firebase'),
        cognito: selectedAuthLibs.includes('cognito'),
        auth0: selectedAuthLibs.includes('auth0'),
        customJwt: selectedAuthLibs.includes('custom-jwt'),
      };
    }
    
    // Section 35: Handle AWS services selection
    if (selectedOptionIds.includes('aws-services')) {
      const awsChoices = [
        { label: 'AWS Amplify', value: 'amplify', default: false },
        { label: 'AWS AppSync', value: 'appsync', default: false },
        { label: 'AWS DynamoDB', value: 'dynamodb', default: false },
        { label: 'AWS S3', value: 's3', default: false },
      ];
      
      const selectedAwsLibs = await promptMultiSelect(
        'Select AWS services (multi-select)',
        awsChoices
      );
      
      selectedOptions.aws = {
        amplify: selectedAwsLibs.includes('amplify'),
        appsync: selectedAwsLibs.includes('appsync'),
        dynamodb: selectedAwsLibs.includes('dynamodb'),
        s3: selectedAwsLibs.includes('s3'),
      };
    }
    
    // Section 36: Handle storage selection
    if (selectedOptionIds.includes('storage')) {
      const storageChoices = [
        { label: 'MMKV (fast key-value)', value: 'mmkv', default: false },
        { label: 'SQLite (database)', value: 'sqlite', default: false },
        { label: 'Secure Storage (keychain/keystore)', value: 'secure', default: false },
        { label: 'File System', value: 'filesystem', default: false },
      ];
      
      const selectedStorageLibs = await promptMultiSelect(
        'Select storage libraries (multi-select)',
        storageChoices
      );
      
      selectedOptions.storage = {
        mmkv: selectedStorageLibs.includes('mmkv'),
        sqlite: selectedStorageLibs.includes('sqlite'),
        secure: selectedStorageLibs.includes('secure'),
        filesystem: selectedStorageLibs.includes('filesystem'),
      };
    }
    
    // Section 37: Handle Firebase Products selection
    if (selectedOptionIds.includes('firebase-products')) {
      const firebaseChoices = [
        { label: 'Cloud Firestore', value: 'firestore', default: false },
        { label: 'Realtime Database', value: 'realtime-database', default: false },
        { label: 'Cloud Storage', value: 'storage', default: false },
        { label: 'Remote Config', value: 'remote-config', default: false },
      ];
      
      const selectedFirebaseLibs = await promptMultiSelect(
        'Select Firebase products (multi-select)',
        firebaseChoices
      );
      
      selectedOptions.firebase = {
        firestore: selectedFirebaseLibs.includes('firestore'),
        realtimeDatabase: selectedFirebaseLibs.includes('realtime-database'),
        storage: selectedFirebaseLibs.includes('storage'),
        remoteConfig: selectedFirebaseLibs.includes('remote-config'),
      };
    }
    
    // Section 38: Handle Offline-first selection
    if (selectedOptionIds.includes('offline-first')) {
      const offlineChoices = [
        { label: 'Network Info (detection)', value: 'netinfo', default: false },
        { label: 'Offline Queue/Outbox Pattern', value: 'outbox', default: false },
        { label: 'Sync Manager', value: 'sync', default: false },
      ];
      
      const selectedOfflineLibs = await promptMultiSelect(
        'Select offline capabilities (multi-select)',
        offlineChoices
      );
      
      selectedOptions.offline = {
        netinfo: selectedOfflineLibs.includes('netinfo'),
        outbox: selectedOfflineLibs.includes('outbox'),
        sync: selectedOfflineLibs.includes('sync'),
      };
    }
    
    // Section 39: Handle Notifications selection (target-aware)
    if (selectedOptionIds.includes('notifications')) {
      const notificationChoices = [
        ...(target === 'expo' ? [{ label: 'Expo Notifications', value: 'expo', default: false }] : []),
        { label: 'Firebase Cloud Messaging (FCM)', value: 'fcm', default: false },
        { label: 'OneSignal', value: 'onesignal', default: false },
      ];
      
      const selectedNotificationLibs = await promptMultiSelect(
        'Select notification providers (multi-select)',
        notificationChoices
      );
      
      selectedOptions.notifications = {
        expo: target === 'expo' ? selectedNotificationLibs.includes('expo') : undefined,
        fcm: selectedNotificationLibs.includes('fcm'),
        onesignal: selectedNotificationLibs.includes('onesignal'),
      };
    }
    
    // Section 40: Handle Maps/Location selection
    if (selectedOptionIds.includes('maps-location')) {
      const mapsChoices = [
        { label: 'Geolocation', value: 'location', default: false },
        { label: 'Google Maps', value: 'google', default: false },
      ];
      
      const selectedMapsLibs = await promptMultiSelect(
        'Select map/location services (multi-select)',
        mapsChoices
      );
      
      selectedOptions.maps = {
        location: selectedMapsLibs.includes('location'),
        google: selectedMapsLibs.includes('google'),
      };
    }
    
    // Section 41: Handle Camera/Media selection (target-aware)
    if (selectedOptionIds.includes('camera-media')) {
      const mediaChoices = [
        { label: 'Camera (basic)', value: 'camera', default: false },
        ...(target === 'bare' ? [{ label: 'Vision Camera (advanced, Bare only)', value: 'vision-camera', default: false }] : []),
        { label: 'Image/Media Picker', value: 'picker', default: false },
      ];
      
      const selectedMediaLibs = await promptMultiSelect(
        'Select media capabilities (multi-select)',
        mediaChoices
      );
      
      selectedOptions.media = {
        camera: selectedMediaLibs.includes('camera'),
        visionCamera: target === 'bare' ? selectedMediaLibs.includes('vision-camera') : undefined,
        picker: selectedMediaLibs.includes('picker'),
      };
    }
    
    // Section 42: Handle Payments selection
    if (selectedOptionIds.includes('payments')) {
      const paymentChoices = [
        { label: 'Stripe', value: 'stripe', default: false },
      ];
      
      const selectedPaymentLibs = await promptMultiSelect(
        'Select payment providers (multi-select)',
        paymentChoices
      );
      
      selectedOptions.payments = {
        stripe: selectedPaymentLibs.includes('stripe'),
      };
    }
    
    // Section 43: Handle IAP selection (single-select)
    if (selectedOptionIds.includes('subscriptions-iap')) {
      const iapChoices = [
        { label: 'RevenueCat', value: 'revenuecat', default: false },
        { label: 'Adapty', value: 'adapty', default: false },
        { label: 'App Store IAP (iOS)', value: 'app-store', default: false },
        { label: 'Google Play Billing (Android)', value: 'play-billing', default: false },
      ];
      
      // Single-select enforced by promptSelect
      const selectedIap = await promptSelect(
        'Select IAP provider (single-select)',
        iapChoices.map(c => ({ label: c.label, value: c.value })),
        iapChoices[0].value
      );
      
      selectedOptions.iap = {
        revenuecat: selectedIap === 'revenuecat',
        adapty: selectedIap === 'adapty',
        appStore: selectedIap === 'app-store',
        playBilling: selectedIap === 'play-billing',
      };
    }
    
    // Section 44: Handle Analytics/Observability selection
    if (selectedOptionIds.includes('analytics-observability')) {
      const analyticsChoices = [
        { label: 'Firebase Analytics', value: 'firebase', default: false },
        { label: 'Amplitude', value: 'amplitude', default: false },
        { label: 'Sentry', value: 'sentry', default: false },
        { label: 'Bugsnag', value: 'bugsnag', default: false },
      ];
      
      const selectedAnalyticsLibs = await promptMultiSelect(
        'Select analytics/observability services (multi-select)',
        analyticsChoices
      );
      
      selectedOptions.analytics = {
        firebase: selectedAnalyticsLibs.includes('firebase'),
        amplitude: selectedAnalyticsLibs.includes('amplitude'),
        sentry: selectedAnalyticsLibs.includes('sentry'),
        bugsnag: selectedAnalyticsLibs.includes('bugsnag'),
      };
    }
    
    // Section 45: Handle Search selection
    if (selectedOptionIds.includes('search')) {
      const searchChoices = [
        { label: 'Algolia', value: 'algolia', default: false },
        { label: 'Local Search Index', value: 'local-index', default: false },
      ];
      
      const selectedSearchLibs = await promptMultiSelect(
        'Select search services (multi-select)',
        searchChoices
      );
      
      selectedOptions.search = {
        algolia: selectedSearchLibs.includes('algolia'),
        localIndex: selectedSearchLibs.includes('local-index'),
      };
    }
    
    // Section 46: Handle OTA Updates selection (single-select, target-aware)
    // Bare: Expo Updates only (CodePush is archived and has broken Android Gradle).
    if (selectedOptionIds.includes('ota-updates')) {
      const otaChoices = [{ label: 'Expo Updates', value: 'expo-updates', default: false }];
      const selectedOta = await promptSelect(
        'Select OTA update provider (single-select)',
        otaChoices.map(c => ({ label: c.label, value: c.value })),
        otaChoices[0].value
      );
      selectedOptions.ota = {
        expoUpdates: selectedOta === 'expo-updates',
        codePush: false,
      };
    }
    
    // Section 47: Handle Background Tasks selection
    if (selectedOptionIds.includes('background-tasks')) {
      const backgroundChoices = [
        { label: 'Background Tasks', value: 'tasks', default: false },
        { label: 'Geofencing', value: 'geofencing', default: false },
        { label: 'Background Fetch', value: 'fetch', default: false },
      ];
      
      const selectedBackgroundLibs = await promptMultiSelect(
        'Select background capabilities (multi-select)',
        backgroundChoices
      );
      
      selectedOptions.background = {
        tasks: selectedBackgroundLibs.includes('tasks'),
        geofencing: selectedBackgroundLibs.includes('geofencing'),
        fetch: selectedBackgroundLibs.includes('fetch'),
      };
    }
    
    // Section 48: Handle Privacy & Consent selection
    if (selectedOptionIds.includes('privacy-consent')) {
      const privacyChoices = [
        { label: 'App Tracking Transparency (ATT)', value: 'att', default: false },
        { label: 'Consent Management', value: 'consent', default: false },
        { label: 'GDPR Compliance', value: 'gdpr', default: false },
      ];
      
      const selectedPrivacyLibs = await promptMultiSelect(
        'Select privacy & consent features (multi-select)',
        privacyChoices
      );
      
      selectedOptions.privacy = {
        att: selectedPrivacyLibs.includes('att'),
        consent: selectedPrivacyLibs.includes('consent'),
        gdpr: selectedPrivacyLibs.includes('gdpr'),
      };
    }
    
    // Section 49: Handle Device/Hardware selection
    if (selectedOptionIds.includes('device-hardware')) {
      const deviceChoices = [
        { label: 'Biometrics', value: 'biometrics', default: false },
        { label: 'Bluetooth', value: 'bluetooth', default: false },
      ];
      
      const selectedDeviceLibs = await promptMultiSelect(
        'Select device/hardware capabilities (multi-select)',
        deviceChoices
      );
      
      selectedOptions.device = {
        biometrics: selectedDeviceLibs.includes('biometrics'),
        bluetooth: selectedDeviceLibs.includes('bluetooth'),
      };
    }
    
    // Section 50: Handle Testing selection
    if (selectedOptionIds.includes('testing')) {
      const testingChoices = [
        { label: 'Detox (E2E testing)', value: 'detox', default: false },
      ];
      
      const selectedTestingLibs = await promptMultiSelect(
        'Select testing tools (multi-select)',
        testingChoices
      );
      
      selectedOptions.testing = {
        detox: selectedTestingLibs.includes('detox'),
      };
    }
  }

  // 6.2 Navigation preset (if React Navigation is selected)
  // Available for both Expo and Bare targets (section 29)
  const navigationPreset: InitInputs['navigationPreset'] | undefined =
    selectedOptions.reactNavigation
      ? isNonInteractive
        ? DEFAULT_NAV_PRESET
        : await promptSelect(
            'Select React Navigation preset',
            [
              { label: String(DEFAULT_NAV_PRESET) === 'stack-only' ? 'Stack only (default)' : 'Stack only', value: 'stack-only' as const },
              { label: String(DEFAULT_NAV_PRESET) === 'tabs-only' ? 'Tabs only (default)' : 'Tabs only', value: 'tabs-only' as const },
              { label: String(DEFAULT_NAV_PRESET) === 'stack-tabs' ? 'Stack + Tabs (default)' : 'Stack + Tabs', value: 'stack-tabs' as const },
              { label: String(DEFAULT_NAV_PRESET) === 'stack-tabs-modals' ? 'Stack + Tabs + Modals (default)' : 'Stack + Tabs + Modals', value: 'stack-tabs-modals' as const },
              { label: String(DEFAULT_NAV_PRESET) === 'drawer' ? 'Drawer (default)' : 'Drawer', value: 'drawer' as const },
            ],
            DEFAULT_NAV_PRESET
          )
      : undefined;

  // 6.3 Locale selection (I18n - only if I18n is selected)
  let locales: string[];
  if (!selectedOptions.i18n) {
    locales = [];
  } else if (options.locales) {
    // Use provided locales from --locales flag
    const providedLocales = options.locales;
    
    // Validate that all provided locale codes exist in AVAILABLE_LOCALES
    const availableCodes = AVAILABLE_LOCALES.map(l => l.code);
    const invalidLocales = providedLocales.filter(code => !availableCodes.includes(code));
    
    if (invalidLocales.length > 0) {
      throw new CliError(
        `Invalid locale code(s): ${invalidLocales.join(', ')}. Available locales: ${availableCodes.join(', ')}`,
        ExitCode.VALIDATION_STATE_FAILURE
      );
    }
    
    // Ensure English is always included if not already selected
    if (!providedLocales.includes('en')) {
      providedLocales.unshift('en');
    }
    
    locales = providedLocales;
  } else if (isNonInteractive) {
    // Use default locales when --yes is used without --locales flag
    locales = DEFAULT_LOCALES;
  } else {
    const localeChoices = AVAILABLE_LOCALES.map(locale => ({
      label: `${locale.name} (${locale.code})`,
      value: locale.code,
      default: locale.code === 'en', // English is default selected
    }));
    
    const selectedLocales = await promptMultiSelect(
      'Select locales for I18n (at least 1 required, default: English)',
      localeChoices
    );
    
    // Validation: At least 1 locale must be selected
    if (!selectedLocales || selectedLocales.length === 0) {
      throw new CliError(
        'At least one locale must be selected for I18n',
        ExitCode.VALIDATION_STATE_FAILURE
      );
    }
    
    // Ensure English is always included if not already selected
    if (!selectedLocales.includes('en')) {
      selectedLocales.unshift('en');
    }
    
    locales = selectedLocales;
  }

  // 7. CORE toggles (always enabled - non-negotiable)
  // All CORE features are always enabled: alias, svg, fonts, env
  const coreToggles = DEFAULT_CORE_TOGGLES;

  // 8. Optional plugins (checkbox list from registry)
  // For now, plugins registry is not yet implemented, so we'll skip this
  // This will be implemented when plugin framework is ready
  const plugins: string[] = [];
  if (!isNonInteractive) {
    const applyPlugins = await promptConfirm(
      'Apply plugins after init? (plugin system not yet implemented) (default: yes)',
      true
    );
    // TODO: Show plugin list when plugin registry is available
  }

  // 9. Install CORE dependencies (default: yes)
  const installCoreDependencies = isNonInteractive
    ? true
    : await promptConfirm('Install CORE dependencies? (default: yes)', true);

  return {
    projectName,
    destination,
    target,
    language,
    packageManager,
    reactNativeVersion,
    navigationPreset,
    locales,
    selectedOptions,
    coreToggles,
    plugins,
    installCoreDependencies,
  };
}

/**
 * Resolves absolute destination path
 */
export function resolveDestination(context: RuntimeContext, destination: string): string {
  if (resolve(destination) === destination) {
    // Already absolute
    return destination;
  }
  // Relative to context root
  return resolve(context.resolvedRoot, destination);
}

/**
 * Preflight check: fails if destination exists and contains user files
 * Allows overwriting if directory is empty or only contains .rns folders (from previous failed init)
 */
export function preflightCheck(destination: string): void {
  if (!pathExists(destination)) {
    return; // Directory doesn't exist, OK to proceed
  }

  if (!isDirectory(destination)) {
    throw new CliError(
      `Destination exists but is not a directory: ${destination}\nPlease remove it or choose a different location.`,
      ExitCode.VALIDATION_STATE_FAILURE
    );
  }

  // Check if directory is empty or only contains .rns folders (from previous failed init)
  const entries = readdirSync(destination);
  
  // Filter out .rns folders and hidden files (like .DS_Store)
  const userFiles = entries.filter((entry: string) => {
    return entry !== '.rns' && !entry.startsWith('.');
  });

  if (userFiles.length > 0) {
    // Directory contains user files - don't overwrite
    throw new CliError(
      `Destination already exists and contains files: ${destination}\n` +
      `Found: ${userFiles.slice(0, 5).join(', ')}${userFiles.length > 5 ? '...' : ''}\n` +
      `Please remove it or choose a different location.`,
      ExitCode.VALIDATION_STATE_FAILURE
    );
  }

  // Directory is empty or only contains .rns folders - safe to proceed
  // (The init process will overwrite/recreate as needed)
}
