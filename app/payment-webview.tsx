import React, { useRef, useState, useEffect, useCallback } from 'react';
import { StyleSheet, ActivityIndicator, View, Pressable } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { WebViewMessageData, PaymentReceiptData } from '@/src/types';
import {
  isSuccessUrl,
  isFailureUrl,
  hasSuccessText,
  hasFailureText,
  hasPendingText,
  formatPaymentDate,
} from '@/src/utils/payment-helpers';

export default function PaymentWebViewScreen() {
  const { paymentLink, paymentCode, amount, currency, description } =
    useLocalSearchParams<{
      paymentLink: string;
      paymentCode?: string;
      amount?: string;
      currency?: string;
      description?: string;
    }>();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const successTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasNavigatedRef = useRef(false);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  const navigateToReceipt = useCallback(
    (receiptData: Partial<PaymentReceiptData>) => {
      if (hasNavigatedRef.current) {
        return; // Prevent duplicate navigation
      }

      hasNavigatedRef.current = true;
      setIsVerifying(false);

      // Clear any pending timers
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }

      // Build query params for receipt screen
      const params: Record<string, string> = {
        transaction_id: receiptData.transaction_id || paymentCode || '',
        payment_code: receiptData.payment_code || paymentCode || '',
        status: receiptData.status || 'PENDING',
        amount: receiptData.amount?.toString() || amount || '0',
        currency: receiptData.currency || currency || 'XAF',
        payment_method: receiptData.payment_method || 'XcelPOS',
        payment_date: receiptData.payment_date || formatPaymentDate(new Date()),
      };

      if (receiptData.customer_email) {
        params.customer_email = receiptData.customer_email;
      }
      if (receiptData.customer_phone) {
        params.customer_phone = receiptData.customer_phone;
      }
      if (receiptData.description || description) {
        params.description = receiptData.description || description || '';
      }
      if (receiptData.metadata) {
        params.metadata = JSON.stringify(receiptData.metadata);
      }
      if (receiptData.products) {
        params.products = JSON.stringify(receiptData.products);
      }

      console.log('Navigating to receipt with params:', params);
      router.replace({ pathname: '/payment-receipt', params });
    },
    [router, paymentCode, amount, currency, description]
  );

  const handleWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data: WebViewMessageData = JSON.parse(event.nativeEvent.data);
        console.log('WebView message received:', data);

        switch (data.type) {
          case 'payment_success':
            console.log('Payment success detected!');
            // Clear any existing timer
            if (successTimerRef.current) {
              clearTimeout(successTimerRef.current);
            }

            // Set a 15-second timer before auto-navigating to success
            successTimerRef.current = setTimeout(() => {
              console.log('Auto-navigating to success receipt after 15 seconds');
              navigateToReceipt({
                status: 'SUCCESS',
                transaction_id: data.url,
              });
            }, 15000); // 15 seconds
            break;

          case 'payment_failed':
            console.log('Payment failed detected!');
            navigateToReceipt({
              status: 'FAILED',
              transaction_id: data.url,
            });
            break;

          case 'payment_pending':
            console.log('Payment pending detected!');
            navigateToReceipt({
              status: 'PENDING',
              transaction_id: data.url,
            });
            break;

          case 'close_clicked':
            console.log('Close button clicked - treating as failed');
            // If close is clicked, clear success timer and navigate to failed
            if (successTimerRef.current) {
              clearTimeout(successTimerRef.current);
            }
            navigateToReceipt({
              status: 'FAILED',
              transaction_id: data.url,
            });
            break;

          case 'dom_check':
            // Check for success/failure indicators in the DOM
            if (data.bodyText) {
              if (hasSuccessText(data.bodyText)) {
                console.log('Success text detected in DOM');
                // Trigger payment success flow
                handleWebViewMessage({
                  nativeEvent: {
                    data: JSON.stringify({ type: 'payment_success', url: data.url }),
                  },
                } as WebViewMessageEvent);
              } else if (hasFailureText(data.bodyText)) {
                console.log('Failure text detected in DOM');
                navigateToReceipt({
                  status: 'FAILED',
                  transaction_id: data.url,
                });
              } else if (hasPendingText(data.bodyText)) {
                console.log('Pending text detected in DOM');
                navigateToReceipt({
                  status: 'PENDING',
                  transaction_id: data.url,
                });
              }
            }
            break;

          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing WebView message:', error);
      }
    },
    [navigateToReceipt]
  );

  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      console.log('Navigation state changed:', navState.url);

      // Check URL for success/failure indicators
      if (isSuccessUrl(navState.url)) {
        console.log('Success URL detected!');
        handleWebViewMessage({
          nativeEvent: { data: JSON.stringify({ type: 'payment_success', url: navState.url }) },
        } as WebViewMessageEvent);
      } else if (isFailureUrl(navState.url)) {
        console.log('Failure URL detected!');
        navigateToReceipt({
          status: 'FAILED',
          transaction_id: navState.url,
        });
      }
    },
    [handleWebViewMessage, navigateToReceipt]
  );

  if (!paymentLink) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>No payment link provided</ThemedText>
        <Pressable style={styles.button} onPress={() => router.back()}>
          <ThemedText style={styles.buttonText}>Go Back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  // JavaScript code to inject into the WebView
  const injectedJavaScript = `
    (function() {
      console.log('XcelPay WebView JavaScript injection started');

      // Monitor for close button clicks
      function monitorCloseButton() {
        const closeButtons = document.querySelectorAll('button, a, div');
        closeButtons.forEach(btn => {
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

      // Check DOM for payment status indicators
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
          // Send DOM check message for debugging
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'dom_check',
            url: window.location.href,
            bodyText: bodyText.substring(0, 500),
            title: title
          }));
        }
      }

      // Monitor DOM changes
      const observer = new MutationObserver(() => {
        monitorCloseButton();
        checkPaymentStatus();
      });

      // Start observing
      if (document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        monitorCloseButton();
        checkPaymentStatus();
      }

      // Also check on page load
      window.addEventListener('load', () => {
        setTimeout(() => {
          monitorCloseButton();
          checkPaymentStatus();
        }, 1000);
      });

      console.log('XcelPay WebView JavaScript injection complete');
      true;
    })();
  `;

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ThemedText style={styles.backButtonText}>← Back</ThemedText>
        </Pressable>
        <ThemedText type="defaultSemiBold" style={styles.headerTitle}>
          Complete Payment
        </ThemedText>
      </ThemedView>

      <WebView
        ref={webViewRef}
        source={{ uri: paymentLink }}
        style={styles.webview}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        injectedJavaScript={injectedJavaScript}
        onMessage={handleWebViewMessage}
        onNavigationStateChange={handleNavigationStateChange}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <ThemedText style={styles.loadingText}>Loading payment page...</ThemedText>
          </View>
        )}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
        }}
      />

      {isVerifying && (
        <View style={styles.verifyingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={styles.verifyingText}>Verifying payment...</ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    flex: 1,
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
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    margin: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
