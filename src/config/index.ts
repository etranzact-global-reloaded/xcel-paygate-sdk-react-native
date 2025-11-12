import type { XcelPayGateConfig } from "../types";

// Configure your merchant credentials here
// Get these from: https://business.xcelapp.com/
export const XCEL_CONFIG: XcelPayGateConfig = {
  merchantId: "yFhi7ApMr", // ENEO Cameroon merchant
  publicKey: "XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205",
  // Optional: Override base URL for testing
  // baseUrl: 'https://api.xcelapp.com',
};

// Export a function to get config (useful for dynamic configuration)
export const getXcelConfig = (): XcelPayGateConfig => {
  // You can add logic here to fetch from env variables or secure storage
  // Example: return { merchantId: process.env.MERCHANT_ID, ... }
  return XCEL_CONFIG;
};
