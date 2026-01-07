export interface CacheEntry<T> {
  value: T;
  expiresAt?: string; // ISO
}

export interface CacheInterface {
  get<T>(key: string): Promise<CacheEntry<T> | null>;
  set<T>(key: string, entry: CacheEntry<T>): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}
