import type {
  PaymentStatus,
  PaymentReceiptData,
  TransactionData,
  WebhookPayload,
} from '../types';

/**
 * Format date for display on receipt
 * Format: MMM DD, YYYY, HH:MM AM/PM
 */
export function formatPaymentDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const day = dateObj.getDate();
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();

  let hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12

  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
  const time = `${hours}:${minutesStr} ${ampm}`;

  return `${month} ${day}, ${year}, ${time}`;
}

/**
 * Format currency amount with symbol
 */
export function formatCurrency(amount: number, currency: string = 'XAF'): string {
  const currencySymbols: Record<string, string> = {
    XAF: 'FCFA',
    USD: '$',
    EUR: '€',
    GBP: '£',
    NGN: '₦',
    GHS: 'GH₵',
    KES: 'KSh',
  };

  const symbol = currencySymbols[currency] || currency;
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // For XAF, put symbol after amount
  if (currency === 'XAF') {
    return `${formattedAmount} ${symbol}`;
  }

  return `${symbol} ${formattedAmount}`;
}

/**
 * Get status color based on payment status
 */
export function getStatusColor(status: PaymentStatus): string {
  switch (status) {
    case 'SUCCESS':
      return '#4CAF50'; // Green
    case 'FAILED':
      return '#F44336'; // Red
    case 'PENDING':
    case 'PROCESSING':
      return '#FF9800'; // Orange
    case 'EXPIRED':
      return '#9E9E9E'; // Gray
    default:
      return '#757575';
  }
}

/**
 * Get status display text
 */
export function getStatusText(status: PaymentStatus): string {
  switch (status) {
    case 'SUCCESS':
      return 'Success';
    case 'FAILED':
      return 'Failed';
    case 'PENDING':
      return 'Pending';
    case 'PROCESSING':
      return 'Processing';
    case 'EXPIRED':
      return 'Expired';
    default:
      return status;
  }
}

/**
 * Get status message for user
 */
export function getStatusMessage(status: PaymentStatus, amount: number, currency: string): string {
  const formattedAmount = formatCurrency(amount, currency);

  switch (status) {
    case 'SUCCESS':
      return `Your payment of ${formattedAmount} was successful`;
    case 'FAILED':
      return `Your payment of ${formattedAmount} failed`;
    case 'PENDING':
      return `Your payment of ${formattedAmount} is being processed`;
    case 'PROCESSING':
      return `Your payment of ${formattedAmount} is being processed`;
    case 'EXPIRED':
      return `Your payment link of ${formattedAmount} has expired`;
    default:
      return `Payment status: ${status}`;
  }
}

/**
 * Convert TransactionData to PaymentReceiptData
 */
export function transactionToReceipt(transaction: TransactionData): PaymentReceiptData {
  return {
    transaction_id: transaction.transaction_id,
    client_transaction_id: transaction.client_transaction_id,
    payment_code: transaction.payment_code,
    status: transaction.status,
    amount: transaction.amount,
    currency: transaction.currency,
    customer_email: transaction.customer_email,
    customer_phone: transaction.customer_phone,
    description: transaction.description,
    payment_method: 'XcelPOS', // Default payment method
    payment_date: formatPaymentDate(transaction.updatedAt || transaction.createdAt),
    metadata: {},
    products: transaction.products,
  };
}

/**
 * Convert WebhookPayload to PaymentReceiptData
 */
export function webhookToReceipt(webhook: WebhookPayload): PaymentReceiptData {
  return {
    transaction_id: webhook.transaction_id,
    client_transaction_id: webhook.client_transaction_id,
    payment_code: webhook.payment_code,
    status: webhook.status,
    amount: webhook.amount,
    currency: webhook.currency,
    customer_email: webhook.customer_email,
    customer_phone: webhook.customer_phone,
    description: webhook.description,
    payment_method: webhook.payment_method || 'XcelPOS',
    payment_date: formatPaymentDate(webhook.paid_at || new Date()),
    metadata: webhook.metadata,
    products: webhook.products,
  };
}

/**
 * Parse URL parameters to extract transaction data
 */
export function parsePaymentUrlParams(url: string): Partial<PaymentReceiptData> | null {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);

    const transaction_id = params.get('transaction_id') || params.get('reference');
    const payment_code = params.get('payment_code') || params.get('trxref');
    const status = params.get('status');

    if (!transaction_id && !payment_code) {
      return null;
    }

    return {
      transaction_id: transaction_id || '',
      payment_code: payment_code || '',
      status: (status?.toUpperCase() as PaymentStatus) || 'PENDING',
    };
  } catch (error) {
    return null;
  }
}

/**
 * Check if URL indicates payment success
 */
export function isSuccessUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.includes('success') ||
    lowerUrl.includes('callback') ||
    lowerUrl.includes('approved') ||
    lowerUrl.includes('complete')
  );
}

/**
 * Check if URL indicates payment failure
 */
export function isFailureUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.includes('cancel') ||
    lowerUrl.includes('failed') ||
    lowerUrl.includes('error') ||
    lowerUrl.includes('decline')
  );
}

/**
 * Check if text content indicates payment success
 */
export function hasSuccessText(text: string): boolean {
  const lowerText = text.toLowerCase();
  const successKeywords = [
    'payment successful',
    'transaction successful',
    'payment completed',
    'payment approved',
    'transaction completed',
    'payment received',
  ];

  return successKeywords.some((keyword) => lowerText.includes(keyword));
}

/**
 * Check if text content indicates payment failure
 */
export function hasFailureText(text: string): boolean {
  const lowerText = text.toLowerCase();
  const failureKeywords = [
    'payment failed',
    'transaction failed',
    'payment cancelled',
    'payment declined',
    'payment rejected',
  ];

  return failureKeywords.some((keyword) => lowerText.includes(keyword));
}

/**
 * Check if text content indicates payment pending
 */
export function hasPendingText(text: string): boolean {
  const lowerText = text.toLowerCase();
  const pendingKeywords = ['payment pending', 'transaction pending', 'processing payment'];

  return pendingKeywords.some((keyword) => lowerText.includes(keyword));
}
