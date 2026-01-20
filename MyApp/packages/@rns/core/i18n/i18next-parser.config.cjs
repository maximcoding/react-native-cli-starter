/**
 * FILE: packages/@rns/core/i18n/i18next-parser.config.cjs
 * PURPOSE: I18next parser configuration (CORE).
 * OWNERSHIP: CORE
 * 
 * This file is generated during init based on selected locales.
 * DO NOT EDIT MANUALLY - regenerate via CLI if locales change.
 */

module.exports = {
  locales: ["en","ru"],
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
