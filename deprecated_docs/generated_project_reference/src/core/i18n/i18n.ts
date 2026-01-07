import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager, NativeModules } from 'react-native';

// ---- IMPORT JSON ----
import en from './locales/en.json';
import ru from './locales/ru.json';
import de from './locales/de.json';

export enum LanguageKey {
  english = 'en',
  russian = 'ru',
  germany = 'de',
}

export const resources = {
  [LanguageKey.english]: {
    translation: en, // nested json
  },
  [LanguageKey.russian]: {
    translation: ru,
  },
  [LanguageKey.germany]: {
    translation: de,
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
