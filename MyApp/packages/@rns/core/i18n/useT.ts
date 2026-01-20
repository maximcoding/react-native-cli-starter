/**
 * FILE: packages/@rns/core/i18n/useT.ts
 * PURPOSE: Hook wrapper for react-i18next useTranslation (CORE).
 * OWNERSHIP: CORE
 */

import { useTranslation } from 'react-i18next';

export function useT() {
  const { t } = useTranslation();
  return t;
}
