export interface BiometricPromptOptions {
  title?: string;
  subtitle?: string;
  description?: string;
  cancelText?: string;
}

export interface BiometricInterface {
  isSupported(): Promise<boolean>;
  authenticate(options?: BiometricPromptOptions): Promise<boolean>;
}
