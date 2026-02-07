import type { XcelPaymentResult } from '../core/PaymentConfig';
import { log } from './XcelLogger';
import { extractReference } from './URLParser';

/**
 * Inspect a URL and return a payment result if the URL indicates a terminal
 * payment state, or `null` if the payment flow should continue.
 */
export function detectResult(url: string): XcelPaymentResult | null {
  let status: string | null = null;

  try {
    const parsed = new URL(url);
    status = parsed.searchParams.get('status');
  } catch {
    return null;
  }

  if (!status) return null;

  const normalized = status.toLowerCase();

  switch (normalized) {
    case 'success': {
      const reference = extractReference(url);
      log(`Payment success – reference: ${reference}`);
      return { status: 'success', reference };
    }
    case 'pending':
      log('Payment pending');
      return { status: 'pending' };
    case 'failed': {
      let reason: string | undefined;
      try {
        reason = new URL(url).searchParams.get('reason') ?? undefined;
      } catch {
        // ignore
      }
      log(`Payment failed – reason: ${reason ?? 'unknown'}`);
      return { status: 'failed', reason };
    }
    case 'cancel':
    case 'canceled':
    case 'cancelled':
      log('Payment cancelled');
      return { status: 'cancelled' };
    default:
      return null;
  }
}
