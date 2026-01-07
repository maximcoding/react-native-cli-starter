export interface DeepLinkInterface {
  getInitialUrl(): Promise<string | null>;
  subscribe(handler: (url: string) => void): () => void;
}
