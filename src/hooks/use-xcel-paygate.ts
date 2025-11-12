import { useState, useCallback, useRef, useEffect } from 'react';
import { XcelPayGateClient } from '../api/client';
import { CheckoutService } from '../services/checkout';
import { XcelWalletService } from '../services/xcel-wallet';
import type {
  XcelPayGateConfig,
  GeneratePaymentLinkRequest,
  PaymentResult,
  TransactionData,
} from '../types';

export function useXcelPayGate(config: XcelPayGateConfig) {
  const clientRef = useRef<XcelPayGateClient>();
  const checkoutServiceRef = useRef<CheckoutService>();
  const walletServiceRef = useRef<XcelWalletService>();

  if (!clientRef.current) {
    clientRef.current = new XcelPayGateClient(config);
    checkoutServiceRef.current = new CheckoutService(clientRef.current);
    walletServiceRef.current = new XcelWalletService(clientRef.current);
  }

  return {
    client: clientRef.current,
    checkout: checkoutServiceRef.current,
    wallet: walletServiceRef.current,
  };
}

export function useCheckout(config: XcelPayGateConfig) {
  const { checkout, client } = useXcelPayGate(config);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [paymentCode, setPaymentCode] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<TransactionData | null>(null);

  const initiatePayment = useCallback(
    async (request: GeneratePaymentLinkRequest) => {
      setLoading(true);
      setError(null);

      try {
        const response = await checkout.initiateCheckout(request);
        const fullUrl = client.getFullPaymentUrl(response.data.payment_code);

        setPaymentLink(fullUrl);
        setPaymentCode(response.data.payment_code);

        return response;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to initiate payment');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [checkout, client]
  );

  const checkStatus = useCallback(
    async (code?: string) => {
      const targetCode = code || paymentCode;

      if (!targetCode) {
        throw new Error('No payment code provided');
      }

      setLoading(true);
      setError(null);

      try {
        const data = await checkout.checkTransactionStatus(targetCode);
        setTransaction(data);
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to check transaction status');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [checkout, paymentCode]
  );

  const reset = useCallback(() => {
    setPaymentLink(null);
    setPaymentCode(null);
    setTransaction(null);
    setError(null);
  }, []);

  return {
    initiatePayment,
    checkStatus,
    reset,
    loading,
    error,
    paymentLink,
    paymentCode,
    transaction,
  };
}

export function usePaymentPolling(
  config: XcelPayGateConfig,
  paymentCode: string | null,
  options: {
    enabled?: boolean;
    maxAttempts?: number;
    intervalMs?: number;
    onSuccess?: (result: PaymentResult) => void;
    onError?: (error: Error) => void;
    onStatusChange?: (transaction: TransactionData) => void;
  } = {}
) {
  const { checkout } = useXcelPayGate(config);
  const { enabled = false, maxAttempts, intervalMs, onSuccess, onError, onStatusChange } = options;

  const [result, setResult] = useState<PaymentResult | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !paymentCode || pollingRef.current) {
      return;
    }

    pollingRef.current = true;
    setIsPolling(true);

    checkout
      .pollTransactionStatus(paymentCode, {
        maxAttempts,
        intervalMs,
        onStatusChange,
      })
      .then((paymentResult) => {
        setResult(paymentResult);

        if (paymentResult.status === 'SUCCESS' && onSuccess) {
          onSuccess(paymentResult);
        }
      })
      .catch((err) => {
        const error = err instanceof Error ? err : new Error('Polling failed');

        if (onError) {
          onError(error);
        }
      })
      .finally(() => {
        setIsPolling(false);
        pollingRef.current = false;
      });

    return () => {
      pollingRef.current = false;
    };
  }, [enabled, paymentCode, checkout, maxAttempts, intervalMs, onSuccess, onError, onStatusChange]);

  return {
    result,
    isPolling,
  };
}

export function useXcelWallet(config: XcelPayGateConfig) {
  const { wallet } = useXcelPayGate(config);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const verifyAccount = useCallback(
    async (countryCode: string, phoneNumber: string) => {
      setLoading(true);
      setError(null);

      try {
        const account = await wallet.verifyAccount(countryCode, phoneNumber);
        return account;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to verify account');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [wallet]
  );

  const createTransaction = useCallback(
    async (
      merchantId: string,
      payerWalletNo: string,
      posWalletNo: string,
      referenceId: string,
      amount: string,
      fees: string,
      products: any[],
      merchantFees: Record<string, string>,
      options?: any
    ) => {
      setLoading(true);
      setError(null);

      try {
        const transaction = await wallet.createTransaction(
          merchantId,
          payerWalletNo,
          posWalletNo,
          referenceId,
          amount,
          fees,
          products,
          merchantFees,
          options
        );

        return transaction;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to create transaction');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [wallet]
  );

  const checkPaymentStatus = useCallback(
    async (merchantId: string, externalReference: string) => {
      setLoading(true);
      setError(null);

      try {
        const transaction = await wallet.checkPaymentStatus(merchantId, externalReference);
        return transaction;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to check payment status');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [wallet]
  );

  return {
    verifyAccount,
    createTransaction,
    checkPaymentStatus,
    loading,
    error,
  };
}
