import { useState, useCallback, useRef, useEffect } from 'react';
import { XcelPayGateClient } from '../api/client';
import { CheckoutService } from '../services/checkout';
import { XcelWalletService } from '../services/xcel-wallet';
import { useXcelPayGateContext } from '../context/XcelPayGateProvider';
import type {
  XcelPayGateConfig,
  GeneratePaymentLinkRequest,
  PaymentResult,
  TransactionData,
} from '../types';

/**
 * useXcelPayGate - Low-level hook to get XCEL PayGate services
 *
 * Can be used with:
 * 1. Config passed directly (standalone usage)
 * 2. No config (uses XcelPayGateProvider context)
 */
export function useXcelPayGate(config?: XcelPayGateConfig) {
  // Always call the hook unconditionally, then decide whether to use it
  const context = useXcelPayGateContext();

  const clientRef = useRef<XcelPayGateClient | null>(null);
  const checkoutServiceRef = useRef<CheckoutService | null>(null);
  const walletServiceRef = useRef<XcelWalletService | null>(null);

  // If using context (no config provided), return context services
  if (!config && context) {
    return {
      client: context.client,
      checkout: context.checkout,
      wallet: context.wallet,
    };
  }

  // Otherwise, create services from provided config
  if (!clientRef.current && config) {
    clientRef.current = new XcelPayGateClient(config);
    checkoutServiceRef.current = new CheckoutService(clientRef.current);
    walletServiceRef.current = new XcelWalletService(clientRef.current);
  }

  return {
    client: clientRef.current!,
    checkout: checkoutServiceRef.current!,
    wallet: walletServiceRef.current!,
  };
}

/**
 * useCheckout - Hook for payment checkout operations
 *
 * @param config - Optional config. If not provided, uses XcelPayGateProvider context
 *
 * @example
 * ```tsx
 * // With Provider
 * const { initiatePayment, loading } = useCheckout();
 *
 * // Standalone
 * const { initiatePayment, loading } = useCheckout({ merchantId, publicKey });
 * ```
 */
export function useCheckout(config?: XcelPayGateConfig) {
  const { checkout, client } = useXcelPayGate(config);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [paymentCode, setPaymentCode] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<TransactionData | null>(null);

  const initiatePayment = useCallback(
    async (request: GeneratePaymentLinkRequest) => {
      if (!checkout) {
        throw new Error('Checkout service not initialized');
      }

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
      if (!checkout) {
        throw new Error('Checkout service not initialized');
      }

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

/**
 * usePaymentPolling - Hook for automatic payment status polling
 *
 * @param configOrPaymentCode - Config object (standalone) or payment code (with Provider)
 * @param paymentCodeOrOptions - Payment code (standalone) or options (with Provider)
 * @param optionsOrUndefined - Options (standalone) or undefined (with Provider)
 *
 * @example
 * ```tsx
 * // With Provider
 * const { result, isPolling } = usePaymentPolling(paymentCode, { enabled: true });
 *
 * // Standalone
 * const { result, isPolling } = usePaymentPolling(config, paymentCode, { enabled: true });
 * ```
 */
export function usePaymentPolling(
  configOrPaymentCode: XcelPayGateConfig | string | null,
  paymentCodeOrOptions?: string | null | {
    enabled?: boolean;
    maxAttempts?: number;
    intervalMs?: number;
    onSuccess?: (result: PaymentResult) => void;
    onError?: (error: Error) => void;
    onStatusChange?: (transaction: TransactionData) => void;
  },
  optionsOrUndefined?: {
    enabled?: boolean;
    maxAttempts?: number;
    intervalMs?: number;
    onSuccess?: (result: PaymentResult) => void;
    onError?: (error: Error) => void;
    onStatusChange?: (transaction: TransactionData) => void;
  }
) {
  // Determine if we're using Provider pattern or standalone
  const isProviderPattern = typeof configOrPaymentCode === 'string' || configOrPaymentCode === null;

  const config = isProviderPattern ? undefined : configOrPaymentCode as XcelPayGateConfig;
  const paymentCode = isProviderPattern
    ? configOrPaymentCode as string | null
    : paymentCodeOrOptions as string | null;
  const options = isProviderPattern
    ? (paymentCodeOrOptions as any) || {}
    : optionsOrUndefined || {};

  const { checkout } = useXcelPayGate(config);
  const { enabled = false, maxAttempts, intervalMs, onSuccess, onError, onStatusChange } = options;

  const [result, setResult] = useState<PaymentResult | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !paymentCode || pollingRef.current || !checkout) {
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

/**
 * useXcelWallet - Hook for XCEL Wallet operations
 *
 * @param config - Optional config. If not provided, uses XcelPayGateProvider context
 *
 * @example
 * ```tsx
 * // With Provider
 * const { verifyAccount, createTransaction } = useXcelWallet();
 *
 * // Standalone
 * const { verifyAccount, createTransaction } = useXcelWallet({ merchantId, publicKey });
 * ```
 */
export function useXcelWallet(config?: XcelPayGateConfig) {
  const { wallet } = useXcelPayGate(config);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const verifyAccount = useCallback(
    async (countryCode: string, phoneNumber: string) => {
      if (!wallet) {
        throw new Error('Wallet service not initialized');
      }

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
      if (!wallet) {
        throw new Error('Wallet service not initialized');
      }

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
      if (!wallet) {
        throw new Error('Wallet service not initialized');
      }

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
