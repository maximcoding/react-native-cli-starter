/**
 * Runtime configuration access (env variables + secrets).
 * Implementation can be dotenv, Expo Constants, remote config, etc.
 */
export interface ConfigInterface {
  getString(key: string): string | undefined;
  getNumber(key: string): number | undefined;
  getBoolean(key: string): boolean | undefined;

  /** Throws if missing/invalid. Use for required configuration. */
  requireString(key: string): string;
}
