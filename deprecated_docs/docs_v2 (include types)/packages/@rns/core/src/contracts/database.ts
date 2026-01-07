export interface DatabaseInterface {
  open(): Promise<void>;
  close(): Promise<void>;
  /** Up to adapter; for SQLite might be migrations. */
  migrate(): Promise<void>;
}
