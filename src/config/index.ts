import type { XcelPayGateConfig } from "../types";

// Configure your merchant credentials using environment variables
// Get these from: https://business.xcelapp.com/
// Copy .env.example to .env and fill in your credentials
export const XCEL_CONFIG: XcelPayGateConfig = {
  merchantId: process.env.EXPO_PUBLIC_XCEL_MERCHANT_ID || "",
  publicKey: process.env.EXPO_PUBLIC_XCEL_PUBLIC_KEY || "",
  // Optional: Override base URL for testing
  baseUrl: process.env.EXPO_PUBLIC_XCEL_BASE_URL,
};

// Export a function to get config (useful for dynamic configuration)
export const getXcelConfig = (): XcelPayGateConfig => {
  if (!XCEL_CONFIG.merchantId || !XCEL_CONFIG.publicKey) {
    throw new Error(
      "XCEL PayGate: Missing required environment variables. " +
      "Please set EXPO_PUBLIC_XCEL_MERCHANT_ID and EXPO_PUBLIC_XCEL_PUBLIC_KEY in your .env file."
    );
  }
  return XCEL_CONFIG;
};
