export type RnsTarget = 'expo' | 'bare';
export type AppPlatform = 'ios' | 'android' | 'web';

export type ExpoRuntime = 'expo-go' | 'dev-client' | 'standalone';

export type PackageManager = 'pnpm' | 'npm' | 'yarn';
export type Language = 'ts' | 'js';

export type ISODateString = string;

export interface VersionInfo {
  version: string;
}

export interface CliMeta {
  version: string;
  createdAt: ISODateString;
  lastModified: ISODateString;
}
