/**
 * FILE: packages/@rns/core/native/device-info.ts
 * LAYER: CORE native utilities
 * OWNERSHIP: CORE
 * ---------------------------------------------------------------------
 * PURPOSE:
 *   Provide platform detection utilities (Android/iOS).
 *   Plugin-free, uses React Native Platform API.
 *
 * BLUEPRINT REFERENCE: docs/ReactNativeCLITemplate/src/core/native/device-info.ts
 * ---------------------------------------------------------------------
 */

import { Platform } from 'react-native';

export const deviceInfo = {
  isAndroid: Platform.OS === 'android',
  isIOS: Platform.OS === 'ios',
  platform: Platform.OS,
};


