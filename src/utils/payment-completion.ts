import type { TransactionData } from '../types';

export interface PaymentCompletionData {
  paymentCode: string;
  transactionId: string;
  amount: string;
  currency: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'CANCELLED';
  customerEmail?: string;
  customerPhone?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface PaymentReceiptData {
  receiptId: string;
  merchantName: string;
  transactionId: string;
  paymentCode: string;
  amount: string;
  currency: string;
  fees?: string;
  totalAmount?: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentMethod?: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  referenceNumber?: string;
  description?: string;
}

/**
 * Parse URL query parameters to extract payment completion data
 *
 * This is useful for handling redirect URLs after payment
 *
 * @example
 * ```typescript
 * // URL: https://yourapp.com/payment-success?payment_code=ABC123&status=SUCCESS
 * const data = parsePaymentCompletionUrl(url);
 * console.log(data.paymentCode); // "ABC123"
 * console.log(data.status); // "SUCCESS"
 * ```
 */
export function parsePaymentCompletionUrl(url: string): Partial<PaymentCompletionData> | null {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);

    const paymentCode = params.get('payment_code') || params.get('code');
    const status = params.get('status') || params.get('payment_status');
    const transactionId = params.get('transaction_id') || params.get('txn_id');

    if (!paymentCode && !transactionId) {
      return null;
    }

    return {
      paymentCode: paymentCode || undefined,
      transactionId: transactionId || undefined,
      amount: params.get('amount') || undefined,
      currency: params.get('currency') || undefined,
      status: (status?.toUpperCase() as any) || 'PENDING',
      timestamp: params.get('timestamp') || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error parsing payment completion URL:', error);
    return null;
  }
}

/**
 * Format transaction data into a receipt object
 *
 * @example
 * ```typescript
 * const receipt = formatTransactionReceipt(transaction, 'ACME Corp');
 * console.log(receipt.receiptId);
 * console.log(receipt.merchantName);
 * ```
 */
export function formatTransactionReceipt(
  transaction: TransactionData,
  merchantName?: string
): PaymentReceiptData {
  return {
    receiptId: transaction.transaction_id || transaction.payment_code,
    merchantName: merchantName || 'Merchant',
    transactionId: transaction.transaction_id,
    paymentCode: transaction.payment_code,
    amount: transaction.amount.toString(),
    currency: transaction.currency,
    customerEmail: transaction.customer_email,
    customerPhone: transaction.customer_phone,
    timestamp: transaction.createdAt || new Date().toISOString(),
    status: transaction.status as any,
    description: transaction.description,
  };
}

/**
 * Check if a payment URL indicates successful completion
 *
 * @example
 * ```typescript
 * if (isPaymentSuccessUrl(url)) {
 *   // Show success screen
 * }
 * ```
 */
export function isPaymentSuccessUrl(url: string): boolean {
  const data = parsePaymentCompletionUrl(url);
  return data?.status === 'SUCCESS';
}

/**
 * Check if a payment URL indicates failure
 *
 * @example
 * ```typescript
 * if (isPaymentFailureUrl(url)) {
 *   // Show error screen
 * }
 * ```
 */
export function isPaymentFailureUrl(url: string): boolean {
  const data = parsePaymentCompletionUrl(url);
  return data?.status === 'FAILED';
}

/**
 * Extract payment code from various URL formats
 *
 * @example
 * ```typescript
 * const code = extractPaymentCode('https://app.com/success?code=ABC123');
 * console.log(code); // "ABC123"
 * ```
 */
export function extractPaymentCode(url: string): string | null {
  const data = parsePaymentCompletionUrl(url);
  return data?.paymentCode || null;
}
