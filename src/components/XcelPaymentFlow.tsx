/**
 * XcelPaymentFlow - Complete Payment Flow Component
 *
 * All-in-one component that handles:
 * - Payment form UI
 * - WebView navigation
 * - Payment completion
 * - Receipt display
 *
 * Just drop this in your app and you're done!
 *
 * @example
 * ```tsx
 * import { XcelPaymentFlow } from '@xcelapp/paygate-sdk';
 *
 * export default function App() {
 *   return (
 *     <XcelPaymentFlow
 *       config={{
 *         merchantId: 'your-merchant-id',
 *         publicKey: 'your-public-key',
 *       }}
 *       onPaymentComplete={(result) => {
 *         console.log('Payment done!', result);
 *       }}
 *     />
 *   );
 * }
 * ```
 */

import React, { useState } from 'react';
import { View, StyleSheet, Modal, SafeAreaView } from 'react-native';
import { XcelPaymentScreen, XcelPaymentScreenProps } from './XcelPaymentScreen';
import { XcelPaymentWebView, PaymentResult } from './XcelPaymentWebView';
import type { XcelPayGateConfig } from '../types';

export interface XcelPaymentFlowProps {
  /** SDK Configuration */
  config?: XcelPayGateConfig;

  /** Called when payment completes (success/fail) */
  onPaymentComplete?: (result: PaymentResult) => void;

  /** Called when payment is cancelled */
  onCancel?: () => void;

  /** Pass through props to XcelPaymentScreen */
  screenProps?: Partial<XcelPaymentScreenProps>;

  /** Show receipt screen (implement your own or use default) */
  renderReceipt?: (result: PaymentResult) => React.ReactNode;

  /** Use modal for WebView (default: true) */
  useModal?: boolean;
}

export function XcelPaymentFlow({
  config,
  onPaymentComplete,
  onCancel,
  screenProps = {},
  renderReceipt,
  useModal = true,
}: XcelPaymentFlowProps) {
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [paymentCode, setPaymentCode] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  const handlePaymentLinkGenerated = (link: string, code: string) => {
    setPaymentLink(link);
    setPaymentCode(code);
    setShowWebView(true);
  };

  const handleSuccess = (result: PaymentResult) => {
    setPaymentResult(result);
    setShowWebView(false);
    onPaymentComplete?.(result);
  };

  const handleFailure = (result: PaymentResult) => {
    setPaymentResult(result);
    setShowWebView(false);
    onPaymentComplete?.(result);
  };

  const handlePending = (result: PaymentResult) => {
    setPaymentResult(result);
    setShowWebView(false);
    onPaymentComplete?.(result);
  };

  const handleCancelWebView = () => {
    setShowWebView(false);
    onCancel?.();
  };

  // Show receipt if available
  if (paymentResult && renderReceipt) {
    return <>{renderReceipt(paymentResult)}</>;
  }

  const webViewContent = paymentLink && (
    <XcelPaymentWebView
      paymentLink={paymentLink}
      paymentCode={paymentCode || undefined}
      onSuccess={handleSuccess}
      onFailure={handleFailure}
      onPending={handlePending}
      onCancel={handleCancelWebView}
    />
  );

  return (
    <View style={styles.container}>
      {/* Payment Form */}
      <XcelPaymentScreen
        config={config}
        onPaymentLinkGenerated={handlePaymentLinkGenerated}
        {...screenProps}
      />

      {/* WebView Modal or Inline */}
      {showWebView && (
        useModal ? (
          <Modal
            visible={showWebView}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={handleCancelWebView}
          >
            <SafeAreaView style={styles.modalContainer}>
              {webViewContent}
            </SafeAreaView>
          </Modal>
        ) : (
          webViewContent
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
