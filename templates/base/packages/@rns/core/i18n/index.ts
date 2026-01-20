/**
 * FILE: packages/@rns/core/i18n/index.ts
 * PURPOSE: I18n exports (CORE).
 * OWNERSHIP: CORE
 */

import i18n from './i18n';
// Ensure i18n instance is initialized on import
void i18n;

export { useT } from './useT';
export { useI18n } from './useI18n';
export { i18n, fallbackLng, currentLocale, LanguageKey, resources } from './i18n';
export { default } from './i18n';

/**
 * USAGE EXAMPLES:
 * 
 * 1. Translation only (simple):
 *    import { useT } from '@rns/core/i18n';
 *    const t = useT();
 *    <Text>{t('home.title')}</Text>
 * 
 * 2. Translation + language switching (enhanced):
 *    import { useI18n } from '@rns/core/i18n';
 *    const { t, currentLanguage, changeLanguage } = useI18n();
 *    changeLanguage('ru'); // Switch to Russian
 * 
 * 3. Language switching outside React components:
 *    import { i18n, LanguageKey } from '@rns/core/i18n';
 *    i18n.changeLanguage(LanguageKey.russian);
 */
