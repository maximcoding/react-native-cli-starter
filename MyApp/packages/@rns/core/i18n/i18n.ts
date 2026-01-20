/**
 * FILE: packages/@rns/core/i18n/i18n.ts
 * PURPOSE: I18n initialization (CORE).
 * OWNERSHIP: CORE
 * 
 * This file is generated during init based on selected locales.
 * DO NOT EDIT MANUALLY - regenerate via CLI if locales change.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager, NativeModules } from 'react-native';

// ---- IMPORT JSON ----
import en from '@/core/i18n/locales/en.json';
import ru from '@/core/i18n/locales/ru.json';

export enum LanguageKey {
  english = 'en',
  russian = 'ru',
}

export const resources = {
  [LanguageKey.english]: {
    translation: en,
  },
  [LanguageKey.russian]: {
    translation: ru,
  },
};

const deviceSettings = NativeModules?.SettingsManager?.settings;
const currentLocale =
  deviceSettings?.AppleLocale ||
  deviceSettings?.AppleLanguages?.[0] ||
  NativeModules?.I18nManager?.localeIdentifier;

if (currentLocale) {
  I18nManager.allowRTL(true);
}

const fallbackLng = LanguageKey.english;

i18n.use(initReactI18next).init({
  lng: fallbackLng,
  fallbackLng,
  resources,
  defaultNS: 'translation',
  interpolation: {
    escapeValue: false,
  },
});

export { i18n, fallbackLng, currentLocale };
export default i18n;
