/**
 * FILE: packages/@rns/core/i18n/useI18n.ts
 * PURPOSE: Enhanced hook for I18n with language switching capabilities (CORE).
 * OWNERSHIP: CORE
 * 
 * Provides both translation function and language switching utilities.
 * Use this hook when you need to switch languages programmatically.
 */

import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { i18n, LanguageKey } from './i18n';

/**
 * Enhanced hook for I18n that provides translation and language switching.
 * 
 * @returns { t, currentLanguage, changeLanguage, availableLanguages }
 * - t: Translation function (same as useT())
 * - currentLanguage: Current active language code
 * - changeLanguage: Function to switch language programmatically
 * - availableLanguages: Array of available locale codes
 * 
 * @example
 * ```typescript
 * function LanguageSelector() {
 *   const { t, currentLanguage, changeLanguage, availableLanguages } = useI18n();
 *   
 *   return (
 *     <View>
 *       {availableLanguages.map(locale => (
 *         <Button
 *           key={locale}
 *           title={locale}
 *           onPress={() => changeLanguage(locale)}
 *           selected={locale === currentLanguage}
 *         />
 *       ))}
 *     </View>
 *   );
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Switch language in business logic
 * function MyService() {
 *   const { changeLanguage } = useI18n();
 *   
 *   const switchToRussian = () => {
 *     changeLanguage(LanguageKey.russian);
 *   };
 * }
 * ```
 */
export function useI18n() {
  const { t } = useTranslation();
  
  // Get current language from i18n instance
  const currentLanguage = i18n.language || 'en';
  
  // Get available languages from LanguageKey enum
  const availableLanguages = useMemo(() => {
    return Object.values(LanguageKey) as string[];
  }, []);
  
  /**
   * Change language programmatically.
   * Can be called from business logic, services, or UI components.
   * 
   * @param locale - Language code (e.g., 'en', 'ru', 'de') or LanguageKey enum value
   */
  const changeLanguage = (locale: string) => {
    i18n.changeLanguage(locale);
  };
  
  return {
    t,
    currentLanguage,
    changeLanguage,
    availableLanguages,
  };
}
