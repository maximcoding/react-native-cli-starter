export interface SharePayload {
  title?: string;
  message?: string;
  url?: string;
}

export interface ShareInterface {
  open(payload: SharePayload): Promise<void>;
}
