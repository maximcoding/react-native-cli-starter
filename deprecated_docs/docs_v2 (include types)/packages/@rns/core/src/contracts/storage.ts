export interface StorageInterface {
  /** Fast key/value storage. Some adapters may be sync underneath, but keep async for portability. */
  getString(key: string): Promise<string | null>;
  setString(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}
