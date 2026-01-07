export interface TranslationInterface {
  t(key: string, params?: Record<string, unknown>): string;
  getLocale(): string;
  setLocale(locale: string): void;
}
