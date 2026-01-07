export interface RealtimeMessage<T = unknown> {
  channel: string;
  event: string;
  payload: T;
}

export interface RealtimeInterface {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribe(channel: string, handler: (msg: RealtimeMessage) => void): () => void;
  publish(channel: string, event: string, payload?: unknown): Promise<void>;
}
