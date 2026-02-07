/**
 * Result of a payment transaction.
 */
export type XcelPaymentResult =
  | { status: 'success'; reference: string }
  | { status: 'pending' }
  | { status: 'failed'; reason?: string }
  | { status: 'cancelled' };

/**
 * Configuration for the payment UI.
 */
export interface PaymentConfig {
  /** Text displayed on the top bar */
  title: string;
  /** Background color of the top bar (CSS color string) */
  backgroundColor?: string;
  /** Title text color (CSS color string) */
  foregroundColor?: string;
  /** Enable debug logging */
  enableLogging?: boolean;
}

/** Default payment configuration. */
export const defaultPaymentConfig: PaymentConfig = {
  title: 'Pay with Xcel PayGate',
  backgroundColor: '#007AFF',
  foregroundColor: '#FFFFFF',
  enableLogging: false,
};

const BASE_PAYMENT_URL = 'https://paygate.xcelapp.com/v1/main/xcel';

/** Build the full payment URL for a given payment code. */
export function getPaymentURL(code: string): string {
  return `${BASE_PAYMENT_URL}?code=${encodeURIComponent(code)}`;
}
