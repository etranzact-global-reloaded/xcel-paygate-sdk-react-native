import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation } from 'react-native-webview';
import {
  defaultPaymentConfig,
  getPaymentURL,
  type PaymentConfig,
  type XcelPaymentResult,
} from '../core/PaymentConfig';
import { detectResult } from '../utils/RedirectHandler';
import { log } from '../utils/XcelLogger';
import { setLoggingEnabled } from '../utils/XcelLogger';

export interface XcelPaygateViewProps {
  /** Payment code obtained from your backend. */
  paymentCode: string;
  /** Optional configuration for the payment UI. */
  config?: PaymentConfig;
  /** Called when the payment reaches a terminal state. */
  onResult: (result: XcelPaymentResult) => void;
}

/**
 * A self-contained payment component.
 *
 * Drop this into a React Navigation modal, a `<Modal>` wrapper, or render it
 * as a full-screen view. It loads the PayGate checkout in a WebView,
 * intercepts redirect URLs to detect the payment outcome, and invokes
 * `onResult` when the flow completes.
 */
export function XcelPaygateView({
  paymentCode,
  config,
  onResult,
}: XcelPaygateViewProps) {
  const mergedConfig = { ...defaultPaymentConfig, ...config };
  const paymentURL = getPaymentURL(paymentCode);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const hasEmittedResult = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Enable logging based on config
  if (mergedConfig.enableLogging) {
    setLoggingEnabled(true);
  }

  log(`Loading payment URL for code: ${paymentCode}`);

  const emitResult = useCallback(
    (result: XcelPaymentResult) => {
      if (hasEmittedResult.current) return;
      hasEmittedResult.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      onResult(result);
    },
    [onResult],
  );

  const handleClose = useCallback(() => {
    emitResult({ status: 'cancelled' });
  }, [emitResult]);

  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      const { url } = navState;
      if (!url) return;
      const result = detectResult(url);
      if (result) {
        emitResult(result);
      }
    },
    [emitResult],
  );

  const handleShouldStartLoad = useCallback(
    (event: { url: string }): boolean => {
      const result = detectResult(event.url);
      if (result) {
        emitResult(result);
        return false; // block the redirect
      }
      return true;
    },
    [emitResult],
  );

  const handleLoadStart = useCallback(() => {
    setLoading(true);
    // Start 30-second timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      log('Payment timed out after 30 seconds', 'ERROR');
      emitResult({ status: 'failed', reason: 'Payment timed out' });
    }, 30_000);
  }, [emitResult]);

  const handleLoadEnd = useCallback(() => {
    setLoading(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const handleLoadProgress = useCallback(
    ({ nativeEvent }: { nativeEvent: { progress: number } }) => {
      setProgress(nativeEvent.progress);
    },
    [],
  );

  const handleError = useCallback(() => {
    log('WebView failed to load', 'ERROR');
    setLoading(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View
        style={[
          styles.topBar,
          { backgroundColor: mergedConfig.backgroundColor },
        ]}
      >
        <Text
          style={[styles.title, { color: mergedConfig.foregroundColor }]}
          numberOfLines={1}
        >
          {mergedConfig.title}
        </Text>
        <TouchableOpacity
          onPress={handleClose}
          style={styles.closeButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={[styles.closeText, { color: mergedConfig.foregroundColor }]}>
            ✕
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      {loading && (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.round(progress * 100)}%`,
                backgroundColor: mergedConfig.backgroundColor,
              },
            ]}
          />
        </View>
      )}

      {/* WebView */}
      <WebView
        source={{ uri: paymentURL }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onLoadProgress={handleLoadProgress}
        onError={handleError}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={mergedConfig.backgroundColor} />
            <Text style={styles.loadingText}>Loading payment…</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
  },
  closeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  progressTrack: {
    height: 2,
    backgroundColor: '#E5E5EA',
  },
  progressFill: {
    height: 2,
  },
  webview: {
    flex: 1,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
});
