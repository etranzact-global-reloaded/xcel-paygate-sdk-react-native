/**
 * XcelPaymentWebView - WebView Payment Handler Component
 *
 * Handles payment flow in a WebView with automatic status detection.
 * Drop this component in your navigation stack and it handles everything!
 *
 * @example
 * ```tsx
 * import { XcelPaymentWebView } from '@xcelapp/paygate-sdk';
 *
 * export default function PaymentWebViewScreen({ route }) {
 *   const { paymentLink, paymentCode } = route.params;
 *
 *   return (
 *     <XcelPaymentWebView
 *       paymentLink={paymentLink}
 *       paymentCode={paymentCode}
 *       onSuccess={(result) => {
 *         console.log('Payment successful!', result);
 *         navigation.navigate('Receipt', { result });
 *       }}
 *       onFailure={(result) => {
 *         console.log('Payment failed', result);
 *         navigation.goBack();
 *       }}
 *     />
 *   );
 * }
 * ```
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ActivityIndicator,
  View,
  Pressable,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native';

export interface PaymentResult {
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  paymentCode?: string;
  transactionId?: string;
  url?: string;
  bodyText?: string;
}

export interface XcelPaymentWebViewProps {
  /** Payment link URL */
  paymentLink: string;

  /** Payment code for tracking */
  paymentCode?: string;

  /** Additional payment details */
  amount?: string;
  currency?: string;
  description?: string;

  /** Called when payment succeeds */
  onSuccess?: (result: PaymentResult) => void;

  /** Called when payment fails */
  onFailure?: (result: PaymentResult) => void;

  /** Called when payment is pending */
  onPending?: (result: PaymentResult) => void;

  /** Called when user closes/cancels */
  onCancel?: () => void;

  /** Custom header component */
  renderHeader?: () => React.ReactNode;

  /** Custom loading component */
  renderLoading?: () => React.ReactNode;

  /** Custom styles */
  styles?: {
    container?: ViewStyle;
    header?: ViewStyle;
    backButton?: ViewStyle;
    backButtonText?: TextStyle;
    webview?: ViewStyle;
    [key: string]: ViewStyle | TextStyle | undefined;
  };

  /** Success detection timeout (ms) */
  successTimeout?: number;

  /** Show back button */
  showBackButton?: boolean;
}

export function XcelPaymentWebView({
  paymentLink,
  paymentCode,
  amount,
  currency,
  description,
  onSuccess,
  onFailure,
  onPending,
  onCancel,
  renderHeader,
  renderLoading,
  styles: customStyles = {},
  successTimeout = 15000,
  showBackButton = true,
}: XcelPaymentWebViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasNavigatedRef = useRef(false);

  // Note: WebView is imported dynamically to avoid requiring it as a dependency
  // Users must install react-native-webview separately
  const [WebView, setWebView] = useState<any>(null);

  useEffect(() => {
    // Dynamically import WebView
    import('react-native-webview')
      .then((module) => {
        setWebView(() => module.WebView);
      })
      .catch((error) => {
        console.error(
          'Error: react-native-webview is required. Install it with: npm install react-native-webview'
        );
        console.error(error);
      });
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  const handlePaymentResult = useCallback(
    (result: PaymentResult) => {
      if (hasNavigatedRef.current) {
        return; // Prevent duplicate calls
      }

      hasNavigatedRef.current = true;
      setIsVerifying(false);

      // Clear any pending timers
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }

      const fullResult: PaymentResult = {
        ...result,
        paymentCode: result.paymentCode || paymentCode,
      };

      console.log('Payment result:', fullResult);

      switch (result.status) {
        case 'SUCCESS':
          onSuccess?.(fullResult);
          break;
        case 'FAILED':
          onFailure?.(fullResult);
          break;
        case 'PENDING':
          onPending?.(fullResult);
          break;
      }
    },
    [paymentCode, onSuccess, onFailure, onPending]
  );

  const handleWebViewMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        console.log('WebView message:', data);

        switch (data.type) {
          case 'payment_success':
            // Set timer before auto-navigating
            if (successTimerRef.current) {
              clearTimeout(successTimerRef.current);
            }
            successTimerRef.current = setTimeout(() => {
              handlePaymentResult({
                status: 'SUCCESS',
                transactionId: data.url,
                url: data.url,
                bodyText: data.bodyText,
              });
            }, successTimeout);
            break;

          case 'payment_failed':
            handlePaymentResult({
              status: 'FAILED',
              transactionId: data.url,
              url: data.url,
              bodyText: data.bodyText,
            });
            break;

          case 'payment_pending':
            handlePaymentResult({
              status: 'PENDING',
              transactionId: data.url,
              url: data.url,
              bodyText: data.bodyText,
            });
            break;

          case 'close_clicked':
            if (successTimerRef.current) {
              clearTimeout(successTimerRef.current);
            }
            onCancel?.();
            break;

          case 'dom_check':
            // Check for success/failure in DOM
            if (data.bodyText) {
              const text = data.bodyText.toLowerCase();
              if (
                text.includes('payment successful') ||
                text.includes('transaction successful')
              ) {
                handleWebViewMessage({
                  nativeEvent: {
                    data: JSON.stringify({ type: 'payment_success', url: data.url }),
                  },
                });
              } else if (
                text.includes('payment failed') ||
                text.includes('transaction failed')
              ) {
                handlePaymentResult({
                  status: 'FAILED',
                  url: data.url,
                  bodyText: data.bodyText,
                });
              } else if (text.includes('payment pending')) {
                handlePaymentResult({
                  status: 'PENDING',
                  url: data.url,
                  bodyText: data.bodyText,
                });
              }
            }
            break;
        }
      } catch (error) {
        console.error('Error parsing WebView message:', error);
      }
    },
    [handlePaymentResult, successTimeout, onCancel]
  );

  const handleNavigationStateChange = useCallback(
    (navState: any) => {
      const url = navState.url.toLowerCase();

      // Check URL for success/failure indicators
      if (url.includes('success') || url.includes('completed')) {
        handleWebViewMessage({
          nativeEvent: {
            data: JSON.stringify({ type: 'payment_success', url: navState.url }),
          },
        });
      } else if (url.includes('failed') || url.includes('cancel')) {
        handlePaymentResult({
          status: 'FAILED',
          url: navState.url,
        });
      }
    },
    [handleWebViewMessage, handlePaymentResult]
  );

  const handleBack = () => {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
    }
    onCancel?.();
  };

  if (!WebView) {
    return (
      <View style={[styles.container, customStyles.container]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading WebView...</Text>
        </View>
      </View>
    );
  }

  if (!paymentLink) {
    return (
      <View style={[styles.container, customStyles.container]}>
        <Text style={styles.errorText}>No payment link provided</Text>
        {showBackButton && (
          <Pressable
            style={[styles.backButton, customStyles.backButton]}
            onPress={handleBack}
          >
            <Text style={[styles.backButtonText, customStyles.backButtonText]}>
              Go Back
            </Text>
          </Pressable>
        )}
      </View>
    );
  }

  // JavaScript to inject into WebView for payment detection
  const injectedJavaScript = `
    (function() {
      console.log('XCEL PayGate WebView injection started');

      function monitorCloseButton() {
        const buttons = document.querySelectorAll('button, a, div');
        buttons.forEach(btn => {
          const text = btn.textContent?.toLowerCase() || '';
          if (text.includes('close') || text.includes('cancel') || text.includes('back')) {
            btn.addEventListener('click', () => {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'close_clicked',
                url: window.location.href
              }));
            });
          }
        });
      }

      function checkPaymentStatus() {
        const bodyText = document.body?.innerText?.toLowerCase() || '';
        const title = document.title?.toLowerCase() || '';
        const successKeywords = ['payment successful', 'transaction successful', 'payment completed'];
        const failureKeywords = ['payment failed', 'transaction failed', 'payment cancelled'];
        const pendingKeywords = ['payment pending', 'processing'];

        const hasSuccess = successKeywords.some(kw => bodyText.includes(kw) || title.includes(kw));
        const hasFailure = failureKeywords.some(kw => bodyText.includes(kw) || title.includes(kw));
        const hasPending = pendingKeywords.some(kw => bodyText.includes(kw) || title.includes(kw));

        if (hasSuccess) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'payment_success',
            url: window.location.href,
            bodyText: bodyText.substring(0, 500)
          }));
        } else if (hasFailure) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'payment_failed',
            url: window.location.href,
            bodyText: bodyText.substring(0, 500)
          }));
        } else if (hasPending) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'payment_pending',
            url: window.location.href,
            bodyText: bodyText.substring(0, 500)
          }));
        } else {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'dom_check',
            url: window.location.href,
            bodyText: bodyText.substring(0, 500),
            title: title
          }));
        }
      }

      const observer = new MutationObserver(() => {
        monitorCloseButton();
        checkPaymentStatus();
      });

      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
        monitorCloseButton();
        checkPaymentStatus();
      }

      window.addEventListener('load', () => {
        setTimeout(() => {
          monitorCloseButton();
          checkPaymentStatus();
        }, 1000);
      });

      true;
    })();
  `;

  return (
    <View style={[styles.container, customStyles.container]}>
      {renderHeader ? (
        renderHeader()
      ) : (
        <View style={[styles.header, customStyles.header]}>
          {showBackButton && (
            <Pressable
              style={[styles.backButton, customStyles.backButton]}
              onPress={handleBack}
            >
              <Text style={[styles.backButtonText, customStyles.backButtonText]}>
                ← Back
              </Text>
            </Pressable>
          )}
          <Text style={styles.headerTitle}>Complete Payment</Text>
        </View>
      )}

      <WebView
        source={{ uri: paymentLink }}
        style={[styles.webview, customStyles.webview]}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        injectedJavaScript={injectedJavaScript}
        onMessage={handleWebViewMessage}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        renderLoading={() =>
          renderLoading ? (
            renderLoading()
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading payment page...</Text>
            </View>
          )
        }
        onError={(syntheticEvent: any) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error:', nativeEvent);
        }}
      />

      {isVerifying && (
        <View style={styles.verifyingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.verifyingText}>Verifying payment...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    color: '#000',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#c62828',
    textAlign: 'center',
    marginTop: 100,
  },
  verifyingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
});
