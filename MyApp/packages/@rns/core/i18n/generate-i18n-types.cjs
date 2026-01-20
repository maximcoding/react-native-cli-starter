/**
 * FILE: packages/@rns/core/i18n/generate-i18n-types.cjs
 * PURPOSE: Generate TypeScript types from I18n locale JSON files (CORE).
 * OWNERSHIP: CORE
 * 
 * Reads locale JSON files from User Zone (src/core/i18n/locales/).
 */

const fs = require('fs');
const path = require('path');

// Read locale files from User Zone (src/core/i18n/locales/)
// Relative path from packages/@rns/core/i18n/ to src/core/i18n/locales/
const localesDir = path.join(__dirname, '..', '..', '..', '..', 'src', 'core', 'i18n', 'locales');
const namespaces = {};
const languages = fs.readdirSync(localesDir);

// Handle flat locale structure: locales/*.json
// Each locale file (en.json, ru.json, etc.) contains translations for the 'translation' namespace
for (const lang of languages) {
  if (lang.endsWith('.json')) {
    const localeFilePath = path.join(localesDir, lang);
    const stat = fs.statSync(localeFilePath);
    
    if (stat.isFile()) {
      const json = require(localeFilePath);
      // All locale files use 'translation' as the default namespace
      namespaces['translation'] = namespaces['translation'] || {};
      // Merge translations from all locales (type generation needs all keys)
      namespaces['translation'] = { ...namespaces['translation'], ...json };
    }
  }
}

function toTS(obj, indent = 2) {
  const spacing = ' '.repeat(indent);
  return Object.entries(obj)
    .map(([k, v]) => {
      if (typeof v === 'string') return `${spacing}${JSON.stringify(k)}: string;`;
      return `${spacing}${JSON.stringify(k)}: {\n${toTS(v, indent + 2)}\n${spacing}};`
    })
    .join('\n');
}

let dts = `// AUTO-GENERATED — DO NOT EDIT

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
`;

for (const [ns, obj] of Object.entries(namespaces)) {
  dts += `      '${ns}': {\n${toTS(obj, 8)}\n      };\n`;
}

dts += `
    };
  }
}
`;

fs.writeFileSync(path.join(__dirname, 'i18n-types.d.ts'), dts);
console.log('i18n types generated.');
