// ============================================================================
// CORE SDK - Always Available
// ============================================================================

// Core Client
export { XcelPayGateClient } from './api/client';

// Services
export { CheckoutService } from './services/checkout';
export { XcelWalletService } from './services/xcel-wallet';

// Provider Pattern (Recommended for React Native apps)
export {
  XcelPayGateProvider,
  useXcelPayGateContext,
} from './context/XcelPayGateProvider';
export type { XcelPayGateProviderProps } from './context/XcelPayGateProvider';

// Core Hooks
export {
  useXcelPayGate,
  useCheckout,
  usePaymentPolling,
  useXcelWallet,
} from './hooks/use-xcel-paygate';

// Core Types
export * from './types';

// ============================================================================
// OPTIONAL HELPERS - Use If Needed
// These are completely optional. The core SDK works without them.
// Use these if you want automated WebView handling and receipt generation.
// ============================================================================

// Payment Completion Hook (Optional - for WebView automation)
export { usePaymentCompletion } from './hooks/use-payment-completion';
export type { PaymentCompletionOptions } from './hooks/use-payment-completion';

// Utilities (Optional - for manual URL parsing and receipt formatting)
export {
  parsePaymentCompletionUrl,
  formatTransactionReceipt,
  isPaymentSuccessUrl,
  isPaymentFailureUrl,
  extractPaymentCode,
} from './utils/payment-completion';
export type {
  PaymentCompletionData,
  PaymentReceiptData,
} from './utils/payment-completion';
