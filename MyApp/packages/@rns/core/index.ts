/**
 * FILE: packages/@rns/core/index.ts
 * PURPOSE: CORE contracts and safe defaults (plugin-free)
 * OWNERSHIP: CORE
 * 
 * PLUGIN-FREE GUARANTEE:
 * - Zero dependencies (no package.json deps)
 * - Pure contracts + safe defaults (noop/memory fallbacks)
 * - Plugins integrate by implementing contracts, NOT by modifying CORE
 */

export * from './contracts';
export * from './config';
export * from './native';
export * from './i18n';
export * from './theme';

