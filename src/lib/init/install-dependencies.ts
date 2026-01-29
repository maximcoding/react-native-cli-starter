/**
 * FILE: src/lib/init/install-dependencies.ts
 * PURPOSE: Install CORE dependencies based on init options
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { pathExists, readJsonFile } from '../fs';
import { execCommand, execPackageManager } from '../exec';
import { extractBlueprintDependencies } from '../blueprint-deps';
import { extractPackageName } from './utils';
import type { InitInputs } from './types';
import { createStepRunner } from '../step-runner';

/** Max packages per install call to avoid ARG_MAX / command-line length limits */
const INSTALL_BATCH_SIZE = 25;

/**
 * Runs package manager install in batches to avoid command-line length limits.
 */
function installDepsInBatches(
  packageManager: InitInputs['packageManager'],
  deps: string[],
  appRoot: string,
  verbose: boolean,
  options: { dev?: boolean; legacyPeerDeps?: boolean }
): void {
  const { dev = false, legacyPeerDeps = packageManager === 'npm' } = options;
  for (let i = 0; i < deps.length; i += INSTALL_BATCH_SIZE) {
    const batch = deps.slice(i, i + INSTALL_BATCH_SIZE);
    const installArgs =
      packageManager === 'yarn'
        ? dev ? ['add', '--dev', ...batch] : ['add', ...batch]
        : packageManager === 'pnpm'
        ? dev ? ['add', '--save-dev', ...batch] : ['add', ...batch]
        : dev
        ? ['install', '--save-dev', ...batch, ...(legacyPeerDeps ? ['--legacy-peer-deps'] : [])]
        : ['install', ...batch, ...(legacyPeerDeps ? ['--legacy-peer-deps'] : [])];
    execPackageManager(packageManager, installArgs, {
      cwd: appRoot,
      stdio: verbose ? 'inherit' : 'pipe',
    });
  }
}

/**
 * Installs CORE dependencies based on enabled toggles (blueprint-based)
 */
export function installCoreDependencies(
  appRoot: string,
  inputs: InitInputs,
  verbose: boolean,
  stepRunner: ReturnType<typeof createStepRunner>
): void {
  stepRunner.start('Install CORE dependencies');
  
  // Extract dependencies from blueprint based on enabled toggles
  const toggleDeps = extractBlueprintDependencies(inputs.coreToggles, inputs.target);
  
  // Install dependencies if any are required
  const depsToInstall: string[] = [];
  const devDepsToInstall: string[] = [];
  const installedPackages = new Set<string>(); // Track installed packages to avoid duplicates
  
  // Collect dependency specs
  for (const [name, version] of Object.entries(toggleDeps.dependencies)) {
    const depSpec = `${name}@${version}`;
    if (!installedPackages.has(name)) {
      depsToInstall.push(depSpec);
      installedPackages.add(name);
    }
  }

  // Section 26: React Navigation dependencies - only if React Navigation is selected
  if (inputs.selectedOptions.reactNavigation) {
    // For Expo projects, use expo install to get SDK-compatible versions
    // For Bare projects, use latest versions
    if (inputs.target === 'expo') {
      // Expo-compatible packages - will be installed via expo install
      const expoNavDeps = [
        '@react-navigation/native',
        '@react-navigation/native-stack',
        '@react-navigation/bottom-tabs',
        '@react-navigation/drawer',
        'react-native-gesture-handler',
        'react-native-safe-area-context',
        'react-native-screens',
        'react-native-reanimated',
        'react-native-svg', // Also needs to match Expo SDK
      ];
      for (const dep of expoNavDeps) {
        if (!installedPackages.has(dep)) {
          depsToInstall.push(dep);
          installedPackages.add(dep);
        }
      }
      // react-native-worklets is a peer dependency of react-native-reanimated
      // Expo will install the correct version automatically via expo install
    } else {
      // Bare React Native - use latest versions
      const navDeps = [
        '@react-navigation/native@latest',
        '@react-navigation/native-stack@latest',
        '@react-navigation/bottom-tabs@latest',
        '@react-navigation/drawer@latest',
        'react-native-gesture-handler@latest',
        'react-native-safe-area-context@latest',
        'react-native-screens@latest',
        'react-native-reanimated@latest',
        'react-native-worklets@^0.7.1', // peer of react-native-reanimated; required by Reanimated Android build.gradle
      ];
      for (const dep of navDeps) {
        const pkgName = extractPackageName(dep);
        if (!installedPackages.has(pkgName)) {
          depsToInstall.push(dep);
          installedPackages.add(pkgName);
        }
      }
    }
  }
  
  // Section 28: I18n dependencies - only if I18n is selected
  if (inputs.selectedOptions.i18n) {
    const i18nDeps = ['i18next@^25.7.1', 'react-i18next@^16.3.5'];
    for (const dep of i18nDeps) {
      const pkgName = extractPackageName(dep);
      if (!installedPackages.has(pkgName)) {
        depsToInstall.push(dep);
        installedPackages.add(pkgName);
      }
    }
    
    devDepsToInstall.push('i18next-parser@^9.3.0');
  }
  
  // Note: Authentication and Analytics dependencies are NOT installed here
  // They should be added via plugin system: rns plugin add auth.firebase, rns plugin add analytics.vexo, etc.
  
  // Section 29: Styling dependencies - only if Styling is selected and not StyleSheet
  if (inputs.selectedOptions.styling && inputs.selectedOptions.styling !== 'stylesheet') {
    if (inputs.selectedOptions.styling === 'nativewind') {
      if (!installedPackages.has('nativewind')) {
        depsToInstall.push('nativewind@latest');
        installedPackages.add('nativewind');
      }
      devDepsToInstall.push('tailwindcss@latest');
    } else if (inputs.selectedOptions.styling === 'unistyles') {
      if (!installedPackages.has('react-native-unistyles')) {
        depsToInstall.push('react-native-unistyles@latest');
        installedPackages.add('react-native-unistyles');
      }
    } else if (inputs.selectedOptions.styling === 'tamagui') {
      const tamaguiDeps = ['@tamagui/core@latest', '@tamagui/config@latest', 'tamagui@latest'];
      for (const dep of tamaguiDeps) {
        const pkgName = extractPackageName(dep);
        if (!installedPackages.has(pkgName)) {
          depsToInstall.push(dep);
          installedPackages.add(pkgName);
        }
      }
    } else if (inputs.selectedOptions.styling === 'restyle') {
      if (!installedPackages.has('@shopify/restyle')) {
        depsToInstall.push('@shopify/restyle@latest');
        installedPackages.add('@shopify/restyle');
      }
    }
  }
  
  // Section 29, 30: Expo-specific dependencies (only if target is Expo)
  if (inputs.target === 'expo') {
    if (inputs.selectedOptions.expoRouter) {
      // Expo Router requires these peer dependencies
      const expoRouterDeps = [
        'expo-router@latest',
        'expo-linking@latest',
        'expo-constants@latest',
        // Required peer dependencies for expo-router
        'react-native-safe-area-context',
        'react-native-screens',
      ];
      for (const dep of expoRouterDeps) {
        const pkgName = extractPackageName(dep);
        if (!installedPackages.has(pkgName)) {
          depsToInstall.push(dep);
          installedPackages.add(pkgName);
        }
      }
    }
    if (inputs.selectedOptions.expoLinking && !installedPackages.has('expo-linking')) {
      depsToInstall.push('expo-linking@latest');
      installedPackages.add('expo-linking');
    }
    if (inputs.selectedOptions.expoStatusBar && !installedPackages.has('expo-status-bar')) {
      depsToInstall.push('expo-status-bar@latest');
      installedPackages.add('expo-status-bar');
    }
    if (inputs.selectedOptions.expoSystemUI && !installedPackages.has('expo-system-ui')) {
      depsToInstall.push('expo-system-ui@latest');
      installedPackages.add('expo-system-ui');
    }
    if (inputs.selectedOptions.expoWebBrowser && !installedPackages.has('expo-web-browser')) {
      depsToInstall.push('expo-web-browser@latest');
      installedPackages.add('expo-web-browser');
    }
    if (inputs.selectedOptions.expoDevClient && !installedPackages.has('expo-dev-client')) {
      depsToInstall.push('expo-dev-client@latest');
      installedPackages.add('expo-dev-client');
    }
    if (inputs.selectedOptions.expoVectorIcons && !installedPackages.has('@expo/vector-icons')) {
      depsToInstall.push('@expo/vector-icons@latest');
      installedPackages.add('@expo/vector-icons');
    }
    if (inputs.selectedOptions.expoImage && !installedPackages.has('expo-image')) {
      depsToInstall.push('expo-image@latest');
      installedPackages.add('expo-image');
    }
    if (inputs.selectedOptions.expoLinearGradient && !installedPackages.has('expo-linear-gradient')) {
      depsToInstall.push('expo-linear-gradient@latest');
      installedPackages.add('expo-linear-gradient');
    }
    if (inputs.selectedOptions.expoHaptics && !installedPackages.has('expo-haptics')) {
      depsToInstall.push('expo-haptics@latest');
      installedPackages.add('expo-haptics');
    }
    if (inputs.selectedOptions.expoDevice && !installedPackages.has('expo-device')) {
      depsToInstall.push('expo-device@latest');
      installedPackages.add('expo-device');
    }
  }
  
  // Section 30: Bare-specific dependencies (only if target is Bare)
  if (inputs.target === 'bare') {
    if (inputs.selectedOptions.reactNativeKeychain && !installedPackages.has('react-native-keychain')) {
      depsToInstall.push('react-native-keychain@latest');
      installedPackages.add('react-native-keychain');
    }
    if (inputs.selectedOptions.reactNativeFS && !installedPackages.has('react-native-fs')) {
      depsToInstall.push('react-native-fs@latest');
      installedPackages.add('react-native-fs');
    }
    if (inputs.selectedOptions.reactNativePermissions && !installedPackages.has('react-native-permissions')) {
      depsToInstall.push('react-native-permissions@latest');
      installedPackages.add('react-native-permissions');
    }
    if (inputs.selectedOptions.reactNativeFastImage && !installedPackages.has('react-native-fast-image')) {
      depsToInstall.push('react-native-fast-image@latest');
      installedPackages.add('react-native-fast-image');
    }
    // Note: Native Modules Support is a conceptual option - no specific package needed
    // It indicates readiness for native module integration
  }
  
  // Section 30: Common dependencies (available for both targets)
  if (inputs.selectedOptions.reactNativeScreens) {
    // Note: react-native-screens is already auto-included with React Navigation
    // This option allows explicit selection even without React Navigation
    // Check if it's not already being installed via React Navigation
    if (!installedPackages.has('react-native-screens')) {
      depsToInstall.push('react-native-screens@latest');
      installedPackages.add('react-native-screens');
    }
  }
  if (inputs.selectedOptions.reactNativePaper && !installedPackages.has('react-native-paper')) {
    depsToInstall.push('react-native-paper@latest');
    installedPackages.add('react-native-paper');
  }
  if (inputs.selectedOptions.reactNativeElements && !installedPackages.has('react-native-elements')) {
    depsToInstall.push('react-native-elements@latest');
    installedPackages.add('react-native-elements');
  }
  if (inputs.selectedOptions.uiKitten) {
    const uiKittenDeps = ['@ui-kitten/components@latest', '@eva-design/eva@latest'];
    for (const dep of uiKittenDeps) {
      const pkgName = extractPackageName(dep);
      if (!installedPackages.has(pkgName)) {
        depsToInstall.push(dep);
        installedPackages.add(pkgName);
      }
    }
  }
  if (inputs.selectedOptions.styledComponents && !installedPackages.has('styled-components')) {
    depsToInstall.push('styled-components@latest');
    installedPackages.add('styled-components');
    devDepsToInstall.push('@types/styled-components-react-native@latest');
  }
  if (inputs.selectedOptions.reactNativeWeb && !installedPackages.has('react-native-web')) {
    depsToInstall.push('react-native-web@latest');
    installedPackages.add('react-native-web');
    devDepsToInstall.push('@types/react-native@latest');
  }
  
  // Section 31: State management dependencies - only if state management is selected
  if (inputs.selectedOptions.state) {
    if (inputs.selectedOptions.state.zustand && !installedPackages.has('zustand')) {
      depsToInstall.push('zustand@^5.0.0');
      installedPackages.add('zustand');
    }
    if (inputs.selectedOptions.state.xstate && !installedPackages.has('xstate')) {
      depsToInstall.push('xstate@latest');
      installedPackages.add('xstate');
    }
    if (inputs.selectedOptions.state.mobx) {
      if (!installedPackages.has('mobx')) {
        depsToInstall.push('mobx@latest');
        installedPackages.add('mobx');
      }
      if (!installedPackages.has('mobx-react-lite')) {
        depsToInstall.push('mobx-react-lite@latest');
        installedPackages.add('mobx-react-lite');
      }
    }
  }
  
  // Section 32: Data fetching dependencies - only if data fetching is selected
  if (inputs.selectedOptions.dataFetching) {
    if (inputs.selectedOptions.dataFetching.reactQuery && !installedPackages.has('@tanstack/react-query')) {
      depsToInstall.push('@tanstack/react-query@latest');
      installedPackages.add('@tanstack/react-query');
    }
    if (inputs.selectedOptions.dataFetching.apollo) {
      if (!installedPackages.has('@apollo/client')) {
        depsToInstall.push('@apollo/client@latest');
        installedPackages.add('@apollo/client');
      }
      if (!installedPackages.has('graphql')) {
        depsToInstall.push('graphql@latest');
        installedPackages.add('graphql');
      }
    }
    if (inputs.selectedOptions.dataFetching.swr && !installedPackages.has('swr')) {
      depsToInstall.push('swr@latest');
      installedPackages.add('swr');
    }
  }
  
  // Section 33: Network transport dependencies - only if network transport is selected
  if (inputs.selectedOptions.transport) {
    if (inputs.selectedOptions.transport.axios && !installedPackages.has('axios')) {
      depsToInstall.push('axios@latest');
      installedPackages.add('axios');
    }
    if (inputs.selectedOptions.transport.websocket && !installedPackages.has('react-native-reconnecting-websocket')) {
      depsToInstall.push('react-native-reconnecting-websocket@latest');
      installedPackages.add('react-native-reconnecting-websocket');
    }
    if (inputs.selectedOptions.transport.firebase && !installedPackages.has('@react-native-firebase/app')) {
      depsToInstall.push('@react-native-firebase/app@latest');
      installedPackages.add('@react-native-firebase/app');
    }
  }
  
  // Section 34: Auth dependencies - only if auth is selected
  if (inputs.selectedOptions.auth) {
    if (inputs.selectedOptions.auth.firebase && !installedPackages.has('@react-native-firebase/auth')) {
      depsToInstall.push('@react-native-firebase/auth@latest');
      installedPackages.add('@react-native-firebase/auth');
    }
    if (inputs.selectedOptions.auth.cognito && !installedPackages.has('amazon-cognito-identity-js')) {
      depsToInstall.push('amazon-cognito-identity-js@latest');
      installedPackages.add('amazon-cognito-identity-js');
    }
    if (inputs.selectedOptions.auth.auth0 && !installedPackages.has('react-native-auth0')) {
      depsToInstall.push('react-native-auth0@latest');
      installedPackages.add('react-native-auth0');
    }
    if (inputs.selectedOptions.auth.customJwt && !installedPackages.has('jwt-decode')) {
      depsToInstall.push('jwt-decode@latest');
      installedPackages.add('jwt-decode');
    }
  }
  
  // Section 35: AWS services dependencies - only if AWS services is selected
  if (inputs.selectedOptions.aws) {
    if (inputs.selectedOptions.aws.amplify && !installedPackages.has('aws-amplify')) {
      depsToInstall.push('aws-amplify@latest');
      installedPackages.add('aws-amplify');
    }
    if (inputs.selectedOptions.aws.appsync) {
      if (!installedPackages.has('@aws-amplify/api')) {
        depsToInstall.push('@aws-amplify/api@latest');
        installedPackages.add('@aws-amplify/api');
      }
      if (!installedPackages.has('@aws-amplify/api-graphql')) {
        depsToInstall.push('@aws-amplify/api-graphql@latest');
        installedPackages.add('@aws-amplify/api-graphql');
      }
    }
    if (inputs.selectedOptions.aws.dynamodb && !installedPackages.has('@aws-sdk/client-dynamodb')) {
      depsToInstall.push('@aws-sdk/client-dynamodb@latest');
      installedPackages.add('@aws-sdk/client-dynamodb');
    }
    if (inputs.selectedOptions.aws.s3 && !installedPackages.has('@aws-sdk/client-s3')) {
      depsToInstall.push('@aws-sdk/client-s3@latest');
      installedPackages.add('@aws-sdk/client-s3');
    }
  }
  
  // Section 36: Storage dependencies - only if storage is selected
  // Note: For Bare target, react-native-keychain and react-native-fs may already be installed
  // as part of Bare-specific options (section 30). The installedPackages Set prevents duplicates.
  if (inputs.selectedOptions.storage) {
    if (inputs.selectedOptions.storage.mmkv && !installedPackages.has('react-native-mmkv')) {
      depsToInstall.push('react-native-mmkv@^4.1.0');
      installedPackages.add('react-native-mmkv');
      // react-native-mmkv 4.1.x requires nitro-modules 0.33.x (PropNameIDCache etc); 0.31.x fails Android build
      if (!installedPackages.has('react-native-nitro-modules')) {
        depsToInstall.push('react-native-nitro-modules@^0.33.2');
        installedPackages.add('react-native-nitro-modules');
      }
    }
    if (inputs.selectedOptions.storage.sqlite && !installedPackages.has('react-native-sqlite-2')) {
      depsToInstall.push('react-native-sqlite-2@latest');
      installedPackages.add('react-native-sqlite-2');
    }
    if (inputs.selectedOptions.storage.secure && !installedPackages.has('react-native-keychain')) {
      // Check if already installed for Bare target (section 30)
      depsToInstall.push('react-native-keychain@latest');
      installedPackages.add('react-native-keychain');
    }
    if (inputs.selectedOptions.storage.filesystem && !installedPackages.has('react-native-fs')) {
      // Check if already installed for Bare target (section 30)
      depsToInstall.push('react-native-fs@latest');
      installedPackages.add('react-native-fs');
    }
  }
  
  // Section 37: Firebase Products dependencies - only if Firebase Products is selected
  if (inputs.selectedOptions.firebase) {
    if (inputs.selectedOptions.firebase.firestore && !installedPackages.has('@react-native-firebase/firestore')) {
      depsToInstall.push('@react-native-firebase/firestore@latest');
      installedPackages.add('@react-native-firebase/firestore');
    }
    if (inputs.selectedOptions.firebase.realtimeDatabase && !installedPackages.has('@react-native-firebase/database')) {
      depsToInstall.push('@react-native-firebase/database@latest');
      installedPackages.add('@react-native-firebase/database');
    }
    if (inputs.selectedOptions.firebase.storage && !installedPackages.has('@react-native-firebase/storage')) {
      depsToInstall.push('@react-native-firebase/storage@latest');
      installedPackages.add('@react-native-firebase/storage');
    }
    if (inputs.selectedOptions.firebase.remoteConfig && !installedPackages.has('@react-native-firebase/remote-config')) {
      depsToInstall.push('@react-native-firebase/remote-config@latest');
      installedPackages.add('@react-native-firebase/remote-config');
    }
  }
  
  // Section 38: Offline-first dependencies - only if Offline-first is selected
  if (inputs.selectedOptions.offline) {
    if (inputs.selectedOptions.offline.netinfo && !installedPackages.has('@react-native-community/netinfo')) {
      depsToInstall.push('@react-native-community/netinfo@latest');
      installedPackages.add('@react-native-community/netinfo');
    }
    if (inputs.selectedOptions.offline.outbox && !installedPackages.has('redux-persist')) {
      depsToInstall.push('redux-persist@latest');
      installedPackages.add('redux-persist');
    }
    if (inputs.selectedOptions.offline.sync && !installedPackages.has('@react-native-async-storage/async-storage')) {
      depsToInstall.push('@react-native-async-storage/async-storage@latest');
      installedPackages.add('@react-native-async-storage/async-storage');
    }
  }
  
  // Section 39: Notifications dependencies - only if Notifications is selected
  if (inputs.selectedOptions.notifications) {
    if (inputs.selectedOptions.notifications.expo && inputs.target === 'expo' && !installedPackages.has('expo-notifications')) {
      depsToInstall.push('expo-notifications@latest');
      installedPackages.add('expo-notifications');
    }
    if (inputs.selectedOptions.notifications.fcm && !installedPackages.has('@react-native-firebase/messaging')) {
      depsToInstall.push('@react-native-firebase/messaging@latest');
      installedPackages.add('@react-native-firebase/messaging');
    }
    if (inputs.selectedOptions.notifications.onesignal && !installedPackages.has('react-native-onesignal')) {
      depsToInstall.push('react-native-onesignal@latest');
      installedPackages.add('react-native-onesignal');
    }
  }
  
  // Section 40: Maps/Location dependencies - only if Maps/Location is selected
  if (inputs.selectedOptions.maps) {
    if (inputs.selectedOptions.maps.location) {
      if (inputs.target === 'expo' && !installedPackages.has('expo-location')) {
        depsToInstall.push('expo-location@latest');
        installedPackages.add('expo-location');
      } else if (inputs.target === 'bare' && !installedPackages.has('@react-native-community/geolocation')) {
        depsToInstall.push('@react-native-community/geolocation@latest');
        installedPackages.add('@react-native-community/geolocation');
      }
    }
    if (inputs.selectedOptions.maps.google && !installedPackages.has('react-native-maps')) {
      depsToInstall.push('react-native-maps@latest');
      installedPackages.add('react-native-maps');
    }
  }
  
  // Section 41: Camera/Media dependencies - only if Camera/Media is selected
  if (inputs.selectedOptions.media) {
    if (inputs.selectedOptions.media.camera) {
      if (inputs.target === 'expo' && !installedPackages.has('expo-camera')) {
        depsToInstall.push('expo-camera@latest');
        installedPackages.add('expo-camera');
      }
    }
    if (inputs.selectedOptions.media.visionCamera && inputs.target === 'bare' && !installedPackages.has('react-native-vision-camera')) {
      depsToInstall.push('react-native-vision-camera@^4.6.3');
      installedPackages.add('react-native-vision-camera');
    }
    if (inputs.selectedOptions.media.picker) {
      if (inputs.target === 'expo' && !installedPackages.has('expo-image-picker')) {
        depsToInstall.push('expo-image-picker@latest');
        installedPackages.add('expo-image-picker');
      } else if (inputs.target === 'bare' && !installedPackages.has('react-native-image-picker')) {
        depsToInstall.push('react-native-image-picker@latest');
        installedPackages.add('react-native-image-picker');
      }
    }
  }
  
  // Section 42: Payments dependencies - only if Payments is selected
  if (inputs.selectedOptions.payments) {
    if (inputs.selectedOptions.payments.stripe && !installedPackages.has('@stripe/stripe-react-native')) {
      depsToInstall.push('@stripe/stripe-react-native@latest');
      installedPackages.add('@stripe/stripe-react-native');
    }
  }
  
  // Section 43: IAP dependencies - only if IAP is selected
  if (inputs.selectedOptions.iap) {
    if (inputs.selectedOptions.iap.revenuecat && !installedPackages.has('react-native-purchases')) {
      depsToInstall.push('react-native-purchases@latest');
      installedPackages.add('react-native-purchases');
    }
    if (inputs.selectedOptions.iap.adapty && !installedPackages.has('react-native-adapty')) {
      depsToInstall.push('react-native-adapty@latest');
      installedPackages.add('react-native-adapty');
    }
    if ((inputs.selectedOptions.iap.appStore || inputs.selectedOptions.iap.playBilling) && !installedPackages.has('react-native-iap')) {
      depsToInstall.push('react-native-iap@latest');
      installedPackages.add('react-native-iap');
    }
  }
  
  // Section 44: Analytics/Observability dependencies - only if Analytics/Observability is selected
  if (inputs.selectedOptions.analytics) {
    if (inputs.selectedOptions.analytics.firebase && !installedPackages.has('@react-native-firebase/analytics')) {
      depsToInstall.push('@react-native-firebase/analytics@latest');
      installedPackages.add('@react-native-firebase/analytics');
    }
    if (inputs.selectedOptions.analytics.amplitude && !installedPackages.has('@amplitude/analytics-react-native')) {
      depsToInstall.push('@amplitude/analytics-react-native@latest');
      installedPackages.add('@amplitude/analytics-react-native');
    }
    if (inputs.selectedOptions.analytics.sentry && !installedPackages.has('@sentry/react-native')) {
      depsToInstall.push('@sentry/react-native@latest');
      installedPackages.add('@sentry/react-native');
    }
    if (inputs.selectedOptions.analytics.bugsnag && !installedPackages.has('@bugsnag/react-native')) {
      depsToInstall.push('@bugsnag/react-native@latest');
      installedPackages.add('@bugsnag/react-native');
    }
  }
  
  // Section 45: Search dependencies - only if Search is selected
  if (inputs.selectedOptions.search) {
    if (inputs.selectedOptions.search.algolia && !installedPackages.has('algoliasearch')) {
      depsToInstall.push('algoliasearch@latest');
      installedPackages.add('algoliasearch');
    }
    if (inputs.selectedOptions.search.localIndex && !installedPackages.has('lunr')) {
      depsToInstall.push('lunr@latest');
      installedPackages.add('lunr');
    }
  }
  
  // Section 46: OTA Updates dependencies - Expo Updates only (CodePush archived, broken Android Gradle)
  if (inputs.selectedOptions.ota?.expoUpdates && !installedPackages.has('expo-updates')) {
    depsToInstall.push('expo-updates@latest');
    installedPackages.add('expo-updates');
  }
  
  // Section 47: Background Tasks dependencies - only if Background Tasks is selected
  if (inputs.selectedOptions.background) {
    if (inputs.selectedOptions.background.tasks && !installedPackages.has('react-native-background-actions')) {
      depsToInstall.push('react-native-background-actions@latest');
      installedPackages.add('react-native-background-actions');
    }
    if (inputs.selectedOptions.background.geofencing && !installedPackages.has('react-native-geolocation-service')) {
      depsToInstall.push('react-native-geolocation-service@latest');
      installedPackages.add('react-native-geolocation-service');
    }
    if (inputs.selectedOptions.background.fetch && !installedPackages.has('react-native-background-fetch')) {
      depsToInstall.push('react-native-background-fetch@latest');
      installedPackages.add('react-native-background-fetch');
    }
  }
  
  // Section 48: Privacy & Consent dependencies - only if Privacy & Consent is selected
  if (inputs.selectedOptions.privacy) {
    if (inputs.selectedOptions.privacy.att && inputs.target === 'bare' && !installedPackages.has('react-native-tracking-transparency')) {
      depsToInstall.push('react-native-tracking-transparency@latest');
      installedPackages.add('react-native-tracking-transparency');
    }
    if ((inputs.selectedOptions.privacy.consent || inputs.selectedOptions.privacy.gdpr) && !installedPackages.has('@react-native-async-storage/async-storage')) {
      depsToInstall.push('@react-native-async-storage/async-storage@latest');
      installedPackages.add('@react-native-async-storage/async-storage');
    }
  }
  
  // Section 49: Device/Hardware dependencies - only if Device/Hardware is selected
  if (inputs.selectedOptions.device) {
    if (inputs.selectedOptions.device.biometrics) {
      if (inputs.target === 'expo' && !installedPackages.has('expo-local-authentication')) {
        depsToInstall.push('expo-local-authentication@latest');
        installedPackages.add('expo-local-authentication');
      } else if (inputs.target === 'bare' && !installedPackages.has('react-native-biometrics')) {
        depsToInstall.push('react-native-biometrics@latest');
        installedPackages.add('react-native-biometrics');
      }
    }
    if (inputs.selectedOptions.device.bluetooth) {
      if (!installedPackages.has('react-native-bluetooth-classic')) {
        depsToInstall.push('react-native-bluetooth-classic@latest');
        installedPackages.add('react-native-bluetooth-classic');
      }
      if (!installedPackages.has('react-native-ble-plx')) {
        depsToInstall.push('react-native-ble-plx@latest');
        installedPackages.add('react-native-ble-plx');
      }
    }
  }
  
  // Section 50: Testing dependencies - only if Testing is selected (dev dependencies)
  if (inputs.selectedOptions.testing) {
    if (inputs.selectedOptions.testing.detox && !installedPackages.has('detox')) {
      devDepsToInstall.push('detox@latest');
      installedPackages.add('detox');
    }
  }
  
  for (const [name, version] of Object.entries(toggleDeps.devDependencies)) {
    devDepsToInstall.push(`${name}@${version}`);
  }
  
  // Install dependencies via package manager
  // For Expo projects, use 'expo install' for Expo-compatible packages to get SDK-matched versions
  // For Bare projects, use regular package manager
  if (depsToInstall.length > 0 || inputs.target === 'expo') {
    if (inputs.target === 'expo') {
      // For Expo projects, we need to install base dependencies (expo, react, react-native) first
      // because 'expo install' requires expo to be installed to determine SDK version.
      // These are already in package.json from create-expo-app, but not installed due to --no-install.
      const packageJsonPath = join(appRoot, 'package.json');
      let needsBaseInstall = false;
      if (pathExists(packageJsonPath)) {
        try {
          const packageJson = readJsonFile<any>(packageJsonPath);
          const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
          // Check if expo is in package.json but might not be installed
          if (deps.expo || deps.react || deps['react-native']) {
            needsBaseInstall = true;
          }
        } catch {
          // If we can't read package.json, continue with normal flow
        }
      }
      
      // Step 1: Install base dependencies from package.json first (expo, react, react-native)
      // This is required because 'expo install' needs expo to be installed to determine SDK version
      if (needsBaseInstall) {
        const installArgs = inputs.packageManager === 'npm'
          ? ['install', '--legacy-peer-deps']
          : ['install'];
        
        execPackageManager(inputs.packageManager, installArgs, {
          cwd: appRoot,
          stdio: verbose ? 'inherit' : 'pipe',
        });
      }
      
      // Separate Expo-compatible packages from others
      const expoCompatiblePackages = [
        '@react-navigation/native',
        '@react-navigation/native-stack',
        '@react-navigation/bottom-tabs',
        '@react-navigation/drawer',
        'react-native-gesture-handler',
        'react-native-safe-area-context',
        'react-native-screens',
        'react-native-reanimated',
        'react-native-svg',
        'expo-router',
        'expo-linking',
        'expo-constants',
        'expo-status-bar',
        'expo-system-ui',
        'expo-web-browser',
        'expo-dev-client',
        '@expo/vector-icons',
        'expo-image',
        'expo-linear-gradient',
        'expo-haptics',
        'expo-device',
      ];
      
      const expoDeps: string[] = [];
      const regularDeps: string[] = [];
      
      for (const dep of depsToInstall) {
        const pkgName = extractPackageName(dep);
        if (expoCompatiblePackages.includes(pkgName)) {
          expoDeps.push(pkgName);
        } else {
          regularDeps.push(dep);
        }
      }
      
      // Step 2: Install Expo-compatible packages via expo install (ensures SDK-compatible versions)
      // Batch to avoid command-line length limits
      if (expoDeps.length > 0) {
        for (let i = 0; i < expoDeps.length; i += INSTALL_BATCH_SIZE) {
          const batch = expoDeps.slice(i, i + INSTALL_BATCH_SIZE);
          execCommand(`npx --yes expo install ${batch.join(' ')}`, {
            cwd: appRoot,
            stdio: verbose ? 'inherit' : 'pipe',
          });
        }
      }
      
      // Step 3: Install other packages via regular package manager (batched)
      if (regularDeps.length > 0) {
        installDepsInBatches(inputs.packageManager, regularDeps, appRoot, verbose, {
          legacyPeerDeps: true,
        });
      }
    } else {
      // Bare React Native - use regular package manager (batched to avoid ARG_MAX)
      if (depsToInstall.length > 0) {
        installDepsInBatches(inputs.packageManager, depsToInstall, appRoot, verbose, {
          legacyPeerDeps: true,
        });
      }
    }
  }
  
  if (devDepsToInstall.length > 0) {
    installDepsInBatches(inputs.packageManager, devDepsToInstall, appRoot, verbose, {
      dev: true,
      legacyPeerDeps: true,
    });
  }
  
  // Install workspace packages (this links packages/@rns/*)
  // Use --legacy-peer-deps for npm to handle peer dependency conflicts
  const workspaceInstallArgs = inputs.packageManager === 'npm'
    ? ['install', '--legacy-peer-deps']
    : ['install'];
  
  execPackageManager(inputs.packageManager, workspaceInstallArgs, {
    cwd: appRoot,
    stdio: verbose ? 'inherit' : 'pipe',
  });
  
  stepRunner.ok('Install CORE dependencies');
}
