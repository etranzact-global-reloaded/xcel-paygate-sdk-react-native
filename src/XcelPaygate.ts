import type { PaymentConfig, XcelPaymentResult } from './core/PaymentConfig';

/**
 * Configuration for {@link startPayment}.
 *
 * This mirrors the Swift SDK's `XcelPaygate.startPayment()` API surface.
 * In React Native the caller is responsible for presenting the
 * `<XcelPaygateView>` in a Modal (or React Navigation modal screen).
 *
 * Use {@link startPayment} as a convenience wrapper that returns a Promise,
 * or render `<XcelPaygateView>` directly for full control.
 */
export interface StartPaymentOptions {
  /** Payment code obtained from your backend. */
  paymentCode: string;
  /** Optional UI configuration. */
  config?: PaymentConfig;
}

/**
 * A simple imperative helper that mirrors the Swift SDK's
 * `XcelPaygate.startPayment()`.
 *
 * Because React Native doesn't have a native "present modal" primitive that
 * can be called imperatively from anywhere, this helper simply returns the
 * props you should forward to `<XcelPaygateView>` along with a Promise that
 * resolves when the payment completes.
 *
 * ### Usage
 *
 * ```tsx
 * const { props, result } = startPayment({
 *   paymentCode: 'PMXXXXXXXXXX',
 * });
 *
 * // Render <XcelPaygateView {...props} /> inside your own <Modal>
 * // `result` resolves when the user completes or cancels the payment.
 * const outcome = await result;
 * ```
 */
export function startPayment(options: StartPaymentOptions): {
  props: {
    paymentCode: string;
    config?: PaymentConfig;
    onResult: (result: XcelPaymentResult) => void;
  };
  result: Promise<XcelPaymentResult>;
} {
  let resolve: (result: XcelPaymentResult) => void;
  const resultPromise = new Promise<XcelPaymentResult>((r) => {
    resolve = r;
  });

  return {
    props: {
      paymentCode: options.paymentCode,
      config: options.config,
      onResult: (result) => resolve!(result),
    },
    result: resultPromise,
  };
}
