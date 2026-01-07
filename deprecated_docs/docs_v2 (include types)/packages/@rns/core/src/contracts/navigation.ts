export type NavigationTarget =
  | { kind: 'path'; value: string }
  | { kind: 'screen'; value: string; params?: Record<string, unknown> };

export interface NavigationInterface {
  push(target: NavigationTarget): void;
  replace(target: NavigationTarget): void;
  back(): void;
  reset(target: NavigationTarget): void;
}
