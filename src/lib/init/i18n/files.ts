/**
 * FILE: src/lib/init/i18n/files.ts
 * PURPOSE: I18n file generation and removal
 * OWNERSHIP: CLI
 */

import { join } from 'path';
import { unlinkSync } from 'fs';
import { pathExists, ensureDir, readTextFile, writeTextFile } from '../../fs';
import { USER_SRC_DIR } from '../../constants';
import { resolvePackSourcePath } from '../../pack-locations';
import { AVAILABLE_LOCALES } from '../utils';
import type { InitInputs } from '../types';

/**
 * Removes I18n files when I18n is not selected (Section 28)
 * The base template includes I18n files, so we need to remove the generated i18n.ts if I18n is not selected
 */
export function removeI18nFilesIfNotSelected(appRoot: string): void {
  const i18nDir = join(appRoot, 'packages', '@rns', 'core', 'i18n');
  const i18nTsPath = join(i18nDir, 'i18n.ts');
  
  // Remove generated i18n.ts if it exists
  // Template files have .template extension or {{IMPORTS}} placeholders
  // Generated files have actual imports
  if (pathExists(i18nTsPath)) {
    const content = readTextFile(i18nTsPath);
    // Check if it's a template (has placeholders) or generated (has actual imports)
    const isTemplate = content.includes('{{IMPORTS}}') || content.includes('{{LANGUAGE_ENUM}}') || content.includes('{{RESOURCES}}');
    if (!isTemplate) {
      // This is a generated file, remove it
      try {
        unlinkSync(i18nTsPath);
      } catch (e) {
        // Ignore errors if file doesn't exist or can't be deleted
      }
    }
  }
  
  // Also remove i18next-parser.config.cjs if it exists (generated file, not template)
  const parserConfigPath = join(i18nDir, 'i18next-parser.config.cjs');
  if (pathExists(parserConfigPath)) {
    const parserContent = readTextFile(parserConfigPath);
    // Only remove if it's a generated file (not a template - templates have .template extension)
    const isTemplate = parserConfigPath.includes('.template') || parserContent.includes('{{');
    if (!isTemplate) {
      try {
        unlinkSync(parserConfigPath);
      } catch (e) {
        // Ignore errors
      }
    }
  }
}

/**
 * Section 28: Generates I18n files based on selected locales (CORE).
 * Creates locale JSON files in User Zone (src/core/i18n/locales/) and generates i18n.ts with dynamic imports.
 */
export function generateI18nFiles(appRoot: string, inputs: InitInputs): void {
  // User Zone: where users edit locale files (src/core/i18n/locales/)
  const userLocaleDir = join(appRoot, USER_SRC_DIR, 'core', 'i18n', 'locales');
  
  // System Zone: I18n infrastructure (packages/@rns/core/i18n/)
  const i18nDir = join(appRoot, 'packages', '@rns', 'core', 'i18n');
  
  // Ensure directories exist
  ensureDir(userLocaleDir);
  ensureDir(i18nDir);
  
  // Get locale names mapping
  const localeNames: Record<string, string> = {};
  AVAILABLE_LOCALES.forEach(locale => {
    localeNames[locale.code] = locale.name;
  });
  
  // Generate locale JSON files for each selected locale
  // Use resolvePackSourcePath to get template directory
  const basePackPath = resolvePackSourcePath('core', 'base');
  const templateLocalePath = join(basePackPath, 'packages', '@rns', 'core', 'i18n', 'locales', '_template.json');
  const enLocalePath = join(basePackPath, 'packages', '@rns', 'core', 'i18n', 'locales', 'en.json');
  
  for (const locale of inputs.locales) {
    // Generate locale JSON files in User Zone (src/core/i18n/locales/)
    const localeFilePath = join(userLocaleDir, `${locale}.json`);
    
    // Use English template for English, template for others
    if (locale === 'en' && pathExists(enLocalePath)) {
      const enContent = readTextFile(enLocalePath);
      writeTextFile(localeFilePath, enContent);
    } else if (pathExists(templateLocalePath)) {
      const templateContent = readTextFile(templateLocalePath);
      writeTextFile(localeFilePath, templateContent);
    } else {
      // Fallback: create minimal locale file
      const minimalContent = JSON.stringify({
        app: { title: 'My App' },
        home: { title: 'Home' },
        settings: { title: 'Settings' },
      }, null, 2);
      writeTextFile(localeFilePath, minimalContent);
    }
  }
  
  // Generate i18n.ts with dynamic imports
  const imports: string[] = [];
  const languageEnum: string[] = [];
  const resources: string[] = [];
  
  for (const locale of inputs.locales) {
    const localeName = localeNames[locale] || locale;
    const enumKey = locale === 'en' ? 'english' : 
                   locale === 'ru' ? 'russian' :
                   locale === 'de' ? 'germany' :
                   locale.toLowerCase().replace(/[^a-z]/g, '');
    
    // Import from User Zone using @/ alias which maps to src/ (configured in babel.config.js)
    // From packages/@rns/core/i18n/i18n.ts -> @/core/i18n/locales/*.json
    imports.push(`import ${locale} from '@/core/i18n/locales/${locale}.json';`);
    languageEnum.push(`  ${enumKey} = '${locale}',`);
    resources.push(`  [LanguageKey.${enumKey}]: {\n    translation: ${locale},\n  },`);
  }
  
  const i18nContent = `/**
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
${imports.join('\n')}

export enum LanguageKey {
${languageEnum.join('\n')}
}

export const resources = {
${resources.join('\n')}
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
`;
  
  writeTextFile(join(i18nDir, 'i18n.ts'), i18nContent);
  
  // Generate i18next-parser.config.cjs
  // Parser outputs to User Zone (src/core/i18n/locales/) matching flat structure
  const parserConfigContent = `/**
 * FILE: packages/@rns/core/i18n/i18next-parser.config.cjs
 * PURPOSE: I18next parser configuration (CORE).
 * OWNERSHIP: CORE
 * 
 * This file is generated during init based on selected locales.
 * DO NOT EDIT MANUALLY - regenerate via CLI if locales change.
 */

module.exports = {
  locales: ${JSON.stringify(inputs.locales)},
  output: 'src/core/i18n/locales/$LOCALE.json',
  defaultNamespace: 'translation',
  namespaceSeparator: ':',
  keySeparator: '.',
  keepRemoved: false,
  lexers: {
    tsx: ['JsxLexer'],
    ts: ['JsxLexer']
  }
};
`;
  
  writeTextFile(join(i18nDir, 'i18next-parser.config.cjs'), parserConfigContent);
}
