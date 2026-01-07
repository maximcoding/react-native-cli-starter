export interface PaymentChargeInput {
  amountMinor: number; // cents
  currency: string; // ISO 4217
  description?: string;
}

export interface PaymentChargeResult {
  id: string;
  status: 'succeeded' | 'failed' | 'pending';
}

export interface PaymentInterface {
  charge(input: PaymentChargeInput): Promise<PaymentChargeResult>;
}
