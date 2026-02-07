/**
 * Extract a payment reference from a URL.
 *
 * Checks query parameters (`reference`, `tx_ref`, `transaction_ref`, `ref`)
 * then falls back to the last path component. If nothing is found a UUID-like
 * fallback is generated.
 */
export function extractReference(url: string): string {
  try {
    const parsed = new URL(url);

    const refKeys = ['reference', 'tx_ref', 'transaction_ref', 'ref'];
    for (const key of refKeys) {
      const value = parsed.searchParams.get(key);
      if (value) return value;
    }

    const pathSegments = parsed.pathname.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      return pathSegments[pathSegments.length - 1];
    }
  } catch {
    // URL parsing failed – fall through to fallback
  }

  return generateFallbackId();
}

function generateFallbackId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
