import React, { createContext, useContext, useMemo, useRef, ReactNode } from 'react';
import { XcelPayGateClient } from '../api/client';
import { CheckoutService } from '../services/checkout';
import { XcelWalletService } from '../services/xcel-wallet';
import type { XcelPayGateConfig } from '../types';

interface XcelPayGateContextValue {
  client: XcelPayGateClient;
  checkout: CheckoutService;
  wallet: XcelWalletService;
  config: XcelPayGateConfig;
}

const XcelPayGateContext = createContext<XcelPayGateContextValue | null>(null);

export interface XcelPayGateProviderProps {
  config: XcelPayGateConfig;
  children: ReactNode;
}

/**
 * XcelPayGateProvider - Provides XCEL PayGate configuration and services to your app
 *
 * @example
 * ```tsx
 * import { XcelPayGateProvider } from '@xcelapp/paygate-sdk';
 *
 * function App() {
 *   return (
 *     <XcelPayGateProvider
 *       config={{
 *         merchantId: 'YOUR_MERCHANT_ID',
 *         publicKey: 'YOUR_PUBLIC_KEY',
 *       }}
 *     >
 *       <YourApp />
 *     </XcelPayGateProvider>
 *   );
 * }
 * ```
 */
export function XcelPayGateProvider({ config, children }: XcelPayGateProviderProps) {
  // Use refs to ensure services are only created once
  const clientRef = useRef<XcelPayGateClient | null>(null);
  const checkoutRef = useRef<CheckoutService | null>(null);
  const walletRef = useRef<XcelWalletService | null>(null);

  if (!clientRef.current) {
    clientRef.current = new XcelPayGateClient(config);
    checkoutRef.current = new CheckoutService(clientRef.current);
    walletRef.current = new XcelWalletService(clientRef.current);
  }

  const value = useMemo(
    () => ({
      client: clientRef.current!,
      checkout: checkoutRef.current!,
      wallet: walletRef.current!,
      config,
    }),
    [config]
  );

  return (
    <XcelPayGateContext.Provider value={value}>
      {children}
    </XcelPayGateContext.Provider>
  );
}

/**
 * useXcelPayGateContext - Access XCEL PayGate services from anywhere in your app
 *
 * @throws {Error} If used outside of XcelPayGateProvider
 *
 * @example
 * ```tsx
 * import { useXcelPayGateContext } from '@xcelapp/paygate-sdk';
 *
 * function PaymentScreen() {
 *   const { client, checkout, wallet } = useXcelPayGateContext();
 *
 *   // Use the services...
 * }
 * ```
 */
export function useXcelPayGateContext(): XcelPayGateContextValue {
  const context = useContext(XcelPayGateContext);

  if (!context) {
    throw new Error(
      'useXcelPayGateContext must be used within XcelPayGateProvider. ' +
      'Wrap your app with <XcelPayGateProvider> or pass config directly to hooks.'
    );
  }

  return context;
}
