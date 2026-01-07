export interface FeedbackInterface {
  toast(message: string): void;
  alert(title: string, message?: string): void;
}
