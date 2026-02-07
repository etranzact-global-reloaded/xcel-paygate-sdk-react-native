// Core
export {
  type PaymentConfig,
  type XcelPaymentResult,
  defaultPaymentConfig,
  getPaymentURL,
} from './core/PaymentConfig';

// Main entry point
export { startPayment, type StartPaymentOptions } from './XcelPaygate';

// View
export { XcelPaygateView, type XcelPaygateViewProps } from './views/XcelPaygateView';

// Utilities
export { detectResult } from './utils/RedirectHandler';
export { extractReference } from './utils/URLParser';
export { log, setLoggingEnabled, type LogLevel } from './utils/XcelLogger';
