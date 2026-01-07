export interface PushToken {
  value: string;
  platform: 'ios' | 'android' | 'web';
}

export interface NotificationInterface {
  registerForPush(): Promise<PushToken>;
}
