import { useState, useCallback } from 'react';
import { useCheckout } from './use-xcel-paygate';
import {
  parsePaymentCompletionUrl,
  formatTransactionReceipt,
  isPaymentSuccessUrl,
  isPaymentFailureUrl,
  type PaymentCompletionData,
  type PaymentReceiptData,
} from '../utils/payment-completion';
import type { XcelPayGateConfig } from '../types';

export interface PaymentCompletionOptions {
  /** Callback when payment is successful */
  onSuccess?: (receipt: PaymentReceiptData) => void;
  /** Callback when payment fails */
  onFailure?: (error: Error, data?: Partial<PaymentCompletionData>) => void;
  /** Callback when payment is cancelled */
  onCancel?: () => void;
  /** Merchant name for receipt */
  merchantName?: string;
  /** Auto-fetch transaction details on success */
  autoFetchReceipt?: boolean;
}

/**
 * Hook for handling payment completion and generating receipts
 *
 * Use this hook to:
 * 1. Monitor WebView navigation and detect payment completion
 * 2. Parse payment URLs and extract completion data
 * 3. Fetch transaction details and generate receipts
 * 4. Handle success/failure callbacks
 *
 * @example
 * ```tsx
 * function PaymentWebView({ paymentLink }: { paymentLink: string }) {
 *   const {
 *     handleNavigationStateChange,
 *     receipt,
 *     isLoading,
 *     error,
 *   } = usePaymentCompletion({
 *     onSuccess: (receipt) => {
 *       console.log('Payment successful!', receipt);
 *       navigation.navigate('Receipt', { receipt });
 *     },
 *     onFailure: (error) => {
 *       console.error('Payment failed:', error);
 *       Alert.alert('Payment Failed', error.message);
 *     },
 *     merchantName: 'ACME Corp',
 *   });
 *
 *   return (
 *     <WebView
 *       source={{ uri: paymentLink }}
 *       onNavigationStateChange={handleNavigationStateChange}
 *     />
 *   );
 * }
 * ```
 */
export function usePaymentCompletion(
  config?: XcelPayGateConfig,
  options: PaymentCompletionOptions = {}
) {
  const {
    onSuccess,
    onFailure,
    onCancel,
    merchantName,
    autoFetchReceipt = true,
  } = options;

  const { checkStatus } = useCheckout(config);

  const [receipt, setReceipt] = useState<PaymentReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [completionData, setCompletionData] = useState<Partial<PaymentCompletionData> | null>(null);

  /**
   * Handle WebView navigation state changes
   * Call this from WebView's onNavigationStateChange
   */
  const handleNavigationStateChange = useCallback(
    async (navState: { url: string; canGoBack: boolean; canGoForward: boolean }) => {
      const { url } = navState;

      // Check if this is a payment completion URL
      const data = parsePaymentCompletionUrl(url);
      if (!data) {
        return;
      }

      setCompletionData(data);
      setIsLoading(true);
      setError(null);

      try {
        // Handle cancellation
        if (data.status === 'CANCELLED') {
          onCancel?.();
          setIsLoading(false);
          return;
        }

        // Handle failure
        if (data.status === 'FAILED' || isPaymentFailureUrl(url)) {
          const error = new Error('Payment failed');
          setError(error);
          onFailure?.(error, data);
          setIsLoading(false);
          return;
        }

        // Handle success - fetch full transaction details if enabled
        if (data.status === 'SUCCESS' || isPaymentSuccessUrl(url)) {
          if (autoFetchReceipt && data.paymentCode) {
            try {
              const transaction = await checkStatus(data.paymentCode);
              const receiptData = formatTransactionReceipt(transaction, merchantName);
              setReceipt(receiptData);
              onSuccess?.(receiptData);
            } catch (err) {
              const error = err instanceof Error ? err : new Error('Failed to fetch receipt');
              setError(error);
              onFailure?.(error, data);
            }
          } else {
            // Create basic receipt from URL data
            const basicReceipt: PaymentReceiptData = {
              receiptId: data.transactionId || data.paymentCode || '',
              merchantName: merchantName || 'Merchant',
              transactionId: data.transactionId || '',
              paymentCode: data.paymentCode || '',
              amount: data.amount || '0',
              currency: data.currency || '',
              timestamp: data.timestamp || new Date().toISOString(),
              status: data.status || 'SUCCESS',
            };
            setReceipt(basicReceipt);
            onSuccess?.(basicReceipt);
          }
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Payment completion error');
        setError(error);
        onFailure?.(error, data);
      } finally {
        setIsLoading(false);
      }
    },
    [checkStatus, onSuccess, onFailure, onCancel, merchantName, autoFetchReceipt]
  );

  /**
   * Manually process a payment completion URL
   * Useful for handling deep links or custom flows
   */
  const processCompletionUrl = useCallback(
    async (url: string) => {
      await handleNavigationStateChange({
        url,
        canGoBack: false,
        canGoForward: false,
      });
    },
    [handleNavigationStateChange]
  );

  /**
   * Manually fetch receipt by payment code
   */
  const fetchReceipt = useCallback(
    async (paymentCode: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const transaction = await checkStatus(paymentCode);
        const receiptData = formatTransactionReceipt(transaction, merchantName);
        setReceipt(receiptData);
        return receiptData;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch receipt');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [checkStatus, merchantName]
  );

  /**
   * Reset the completion state
   */
  const reset = useCallback(() => {
    setReceipt(null);
    setError(null);
    setCompletionData(null);
    setIsLoading(false);
  }, []);

  return {
    /** Handle WebView navigation changes */
    handleNavigationStateChange,
    /** Process a payment completion URL manually */
    processCompletionUrl,
    /** Fetch receipt by payment code */
    fetchReceipt,
    /** Reset state */
    reset,
    /** Generated receipt data */
    receipt,
    /** Loading state */
    isLoading,
    /** Error state */
    error,
    /** Raw completion data from URL */
    completionData,
  };
}
