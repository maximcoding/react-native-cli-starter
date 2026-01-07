export type ConnectivityState = 'online' | 'offline' | 'unknown';

export interface ConnectivityInterface {
  getState(): Promise<ConnectivityState>;
  subscribe(listener: (state: ConnectivityState) => void): () => void;
}
