import { XcelPayGateClient } from '../api/client';
import type {
  GeneratePaymentLinkRequest,
  GeneratePaymentLinkResponse,
  PaymentResult,
  TransactionData,
  WebhookPayload,
  PaymentReceiptData,
} from '../types';
import { transactionToReceipt, webhookToReceipt } from '../utils/payment-helpers';

export class CheckoutService {
  constructor(private client: XcelPayGateClient) {}

  async initiateCheckout(request: GeneratePaymentLinkRequest): Promise<GeneratePaymentLinkResponse> {
    return this.client.generatePaymentLink(request);
  }

  async getPaymentUrl(paymentCode: string): Promise<string> {
    return this.client.getFullPaymentUrl(paymentCode);
  }

  /**
   * Verify webhook signature (if implemented by Xcel)
   * This is a placeholder - implement based on Xcel's webhook signature verification
   */
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // TODO: Implement webhook signature verification based on Xcel's documentation
    // This is typically done using HMAC-SHA256 or similar
    console.warn('Webhook signature verification not implemented');
    return true;
  }

  /**
   * Parse webhook payload and validate
   */
  parseWebhookPayload(payload: any): WebhookPayload | null {
    try {
      // Validate required fields
      if (
        !payload.transaction_id ||
        !payload.payment_code ||
        !payload.status ||
        typeof payload.amount !== 'number'
      ) {
        console.error('Invalid webhook payload - missing required fields');
        return null;
      }

      return {
        transaction_id: payload.transaction_id,
        client_transaction_id: payload.client_transaction_id,
        payment_code: payload.payment_code,
        status: payload.status,
        amount: payload.amount,
        currency: payload.currency || 'XAF',
        customer_email: payload.customer_email,
        customer_phone: payload.customer_phone,
        description: payload.description,
        payment_method: payload.payment_method,
        paid_at: payload.paid_at,
        metadata: payload.metadata,
        products: payload.products,
      };
    } catch (error) {
      console.error('Error parsing webhook payload:', error);
      return null;
    }
  }

  /**
   * Convert webhook payload to receipt data
   */
  webhookToReceiptData(webhook: WebhookPayload): PaymentReceiptData {
    return webhookToReceipt(webhook);
  }

  /**
   * Verify transaction and get receipt data
   */
  async verifyAndGetReceipt(paymentCode: string): Promise<PaymentReceiptData | null> {
    try {
      const transaction = await this.checkTransactionStatus(paymentCode);
      return transactionToReceipt(transaction);
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return null;
    }
  }

  async pollTransactionStatus(
    paymentCode: string,
    options: {
      maxAttempts?: number;
      intervalMs?: number;
      onStatusChange?: (transaction: TransactionData) => void;
    } = {}
  ): Promise<PaymentResult> {
    const { maxAttempts = 24, intervalMs = 5000, onStatusChange } = options;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await this.client.getTransactionData(paymentCode);

        if (onStatusChange) {
          onStatusChange(response.data);
        }

        const { status, transaction_id, payment_code } = response.data;

        if (status === 'SUCCESS') {
          return {
            status: 'SUCCESS',
            transaction_id,
            payment_code,
            message: 'Payment completed successfully',
            data: response.data,
          };
        }

        if (status === 'FAILED') {
          return {
            status: 'FAILED',
            transaction_id,
            payment_code,
            message: 'Payment failed',
            data: response.data,
          };
        }

        const now = new Date().getTime();
        const expiresAt = new Date(response.data.expires_at).getTime();

        if (now >= expiresAt) {
          return {
            status: 'EXPIRED',
            transaction_id,
            payment_code,
            message: 'Payment link has expired',
            data: response.data,
          };
        }

        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          return {
            status: 'FAILED',
            message: error instanceof Error ? error.message : 'Failed to check payment status',
          };
        }
      }
    }

    return {
      status: 'PENDING',
      message: 'Payment status check timed out',
    };
  }

  async checkTransactionStatus(paymentCode: string): Promise<TransactionData> {
    const response = await this.client.getTransactionData(paymentCode);
    return response.data;
  }
}
