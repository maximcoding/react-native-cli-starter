export type ColorScheme = 'light' | 'dark';

export interface ThemeInterface {
  getColorScheme(): ColorScheme;
  setColorScheme(scheme: ColorScheme): void;
}
