/**
 * FILE: src/hooks/useT.ts
 * PURPOSE: Convenience re-export for i18n translation hook (User Zone).
 * OWNERSHIP: USER
 * 
 * This is a convenience re-export from System Zone (@rns/core/i18n).
 * The source of truth is in packages/@rns/core/i18n/useT.ts (CLI-managed).
 * 
 * You can import from either location:
 * - import { useT } from '@/hooks/useT';  (convenience, discoverable)
 * - import { useT } from '@rns/core/i18n'; (direct, System Zone)
 * 
 * To customize: replace this re-export with your own implementation.
 * 
 * @example
 * import { useT } from '@/hooks/useT';
 * const t = useT();
 * <Text>{t('home.title')}</Text>
 */
export { useT } from '@rns/core/i18n';
