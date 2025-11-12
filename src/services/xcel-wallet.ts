import { XcelPayGateClient } from '../api/client';
import type {
  XcelAccount,
  GenerateDynamicLinkRequest,
  CreateXcelTransactionRequest,
  PaymentResult,
  XcelTransaction,
  PaymentProduct,
} from '../types';

export class XcelWalletService {
  constructor(private client: XcelPayGateClient) {}

  async verifyAccount(countryCode: string, phoneNumber: string): Promise<XcelAccount | null> {
    const response = await this.client.verifyXcelAccount(countryCode, phoneNumber);

    if (response.success && response.data && response.data.length > 0) {
      return response.data[0];
    }

    return null;
  }

  async generateDynamicLink(
    configPreset: string,
    payerAccountId: string,
    payeeAccountId: string,
    amount: number
  ): Promise<string> {
    const request: GenerateDynamicLinkRequest = {
      config_preset: configPreset,
      transaction_params: {
        src_amount: amount,
        des_amount: amount,
        payerId: payerAccountId,
        payeeId: payeeAccountId,
      },
    };

    const response = await this.client.generateDynamicLink(request);

    if (!response.status) {
      throw new Error(response.message || 'Failed to generate dynamic link');
    }

    return response.otp_sid;
  }

  async createTransaction(
    merchantId: string,
    payerWalletNo: string,
    posWalletNo: string,
    referenceId: string,
    amount: string,
    fees: string,
    products: PaymentProduct[],
    merchantFees: Record<string, string>,
    options: {
      description?: string;
      posSchemeCode?: string;
      merchantCountryCode?: string;
      payerCountryCode?: string;
      merchantCurrency?: string;
      payerCurrency?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<XcelTransaction> {
    const {
      description = 'XCEL WEB payment',
      posSchemeCode = '233',
      merchantCountryCode = '233',
      payerCountryCode = '233',
      merchantCurrency = 'GHS',
      payerCurrency = 'GHS',
      metadata = {},
    } = options;

    const request: CreateXcelTransactionRequest = {
      merchant_id: merchantId,
      payer_wallet_no: payerWalletNo,
      pos_wallet_no: posWalletNo,
      pos_scheme_code: posSchemeCode,
      description,
      international: false,
      merchant_country_code: merchantCountryCode,
      payer_country_code: payerCountryCode,
      merchant_currency: merchantCurrency,
      payer_currency: payerCurrency,
      trans_type: 'XCelPOS',
      metadata,
      reference_id: referenceId,
      amount,
      fees,
      products: products.map((p) => ({
        product_id: p.product_id,
        amount: p.amount,
        merchant_fees: merchantFees[p.product_id] || '0',
      })),
    };

    const response = await this.client.createXcelTransaction(request);

    if (!response.success) {
      throw new Error(response.message || 'Failed to create transaction');
    }

    return response.data;
  }

  async pollPaymentStatus(
    merchantId: string,
    externalReference: string,
    options: {
      timeoutMs?: number;
      onStatusChange?: (transaction: XcelTransaction) => void;
    } = {}
  ): Promise<PaymentResult> {
    const { timeoutMs = 120000, onStatusChange } = options;
    const startTime = Date.now();

    const intervals = [5000, 15000, 10000];
    let intervalIndex = 0;

    while (Date.now() - startTime < timeoutMs) {
      try {
        const response = await this.client.getXcelTransactionStatus(merchantId, externalReference);

        if (onStatusChange) {
          onStatusChange(response.data);
        }

        if (response.data.paid) {
          return {
            status: 'SUCCESS',
            transaction_id: response.data._id,
            message: 'Payment completed successfully',
            data: response.data,
          };
        }

        const waitTime = intervals[Math.min(intervalIndex, intervals.length - 1)];
        intervalIndex++;

        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } catch (error) {
        if (Date.now() - startTime >= timeoutMs) {
          return {
            status: 'FAILED',
            message: error instanceof Error ? error.message : 'Failed to check payment status',
          };
        }

        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    return {
      status: 'PENDING',
      message: 'Payment verification timed out',
    };
  }

  async checkPaymentStatus(
    merchantId: string,
    externalReference: string
  ): Promise<XcelTransaction> {
    const response = await this.client.getXcelTransactionStatus(merchantId, externalReference);

    if (!response.success) {
      throw new Error(response.message || 'Failed to get payment status');
    }

    return response.data;
  }
}
