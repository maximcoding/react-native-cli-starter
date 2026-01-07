export interface AnalyticsInterface {
  track(event: string, props?: Record<string, unknown>): Promise<void>;
  identify(userId: string, traits?: Record<string, unknown>): Promise<void>;
  screen(name: string, props?: Record<string, unknown>): Promise<void>;
}
