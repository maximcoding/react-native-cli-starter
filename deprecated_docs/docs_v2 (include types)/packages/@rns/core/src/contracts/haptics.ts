export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export interface HapticInterface {
  trigger(type: HapticType): Promise<void>;
}
