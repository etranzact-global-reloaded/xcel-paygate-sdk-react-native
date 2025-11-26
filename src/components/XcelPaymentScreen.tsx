/**
 * XcelPaymentScreen - Complete Payment UI Component
 *
 * Drop-in payment screen with full UI and logic.
 * Just import and use - handles everything!
 *
 * @example
 * ```tsx
 * import { XcelPaymentScreen } from '@xcelapp/paygate-sdk';
 *
 * export default function PaymentPage() {
 *   return (
 *     <XcelPaymentScreen
 *       config={{
 *         merchantId: 'your-merchant-id',
 *         publicKey: 'your-public-key',
 *       }}
 *       onPaymentComplete={(result) => {
 *         console.log('Payment complete:', result);
 *       }}
 *     />
 *   );
 * }
 * ```
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useCheckout, usePaymentPolling } from '../hooks/use-xcel-paygate';
import type { XcelPayGateConfig, PaymentRequest, TransactionData } from '../types';

export interface XcelPaymentScreenProps {
  /** SDK Configuration */
  config?: XcelPayGateConfig;

  /** Optional: Custom styles */
  styles?: {
    container?: ViewStyle;
    button?: ViewStyle;
    buttonText?: TextStyle;
    input?: ViewStyle;
    [key: string]: ViewStyle | TextStyle | undefined;
  };

  /** Optional: Pre-filled form values */
  defaultValues?: {
    amount?: string;
    email?: string;
    phone?: string;
    description?: string;
  };

  /** Optional: Customize payment request */
  paymentConfig?: Partial<Omit<PaymentRequest, 'amount' | 'currency'>>;

  /** Called when payment link is generated */
  onPaymentLinkGenerated?: (paymentLink: string, paymentCode: string) => void;

  /** Called when payment is complete (success/fail) */
  onPaymentComplete?: (transaction: TransactionData) => void;

  /** Called on error */
  onError?: (error: Error) => void;

  /** Show status check button */
  showStatusButton?: boolean;

  /** Enable auto-polling */
  enablePolling?: boolean;

  /** Custom button text */
  buttonText?: string;

  /** Currency (default: XAF) */
  currency?: string;

  /** Hide form, only show button */
  minimalMode?: boolean;
}

export function XcelPaymentScreen({
  config,
  styles: customStyles = {},
  defaultValues = {},
  paymentConfig = {},
  onPaymentLinkGenerated,
  onPaymentComplete,
  onError,
  showStatusButton = true,
  enablePolling = false,
  buttonText = 'Generate Payment Link',
  currency = 'XAF',
  minimalMode = false,
}: XcelPaymentScreenProps) {
  // Form state
  const [amount, setAmount] = useState(defaultValues.amount || '1000');
  const [email, setEmail] = useState(defaultValues.email || '');
  const [phone, setPhone] = useState(defaultValues.phone || '');
  const [description, setDescription] = useState(defaultValues.description || '');

  // SDK Hook
  const {
    initiatePayment,
    checkStatus,
    loading,
    error,
    paymentLink,
    paymentCode,
    transaction,
  } = useCheckout(config || undefined);

  // Optional polling - only if enabled
  const pollingEnabled = enablePolling && !!paymentCode;
  const pollingResult = pollingEnabled
    ? usePaymentPolling(config || null, paymentCode, {
        enabled: true,
        maxAttempts: 24,
        intervalMs: 5000,
      })
    : { result: null, isPolling: false };

  const { result, isPolling } = pollingResult;

  // Handle payment initiation
  const handlePay = async () => {
    try {
      const response = await initiatePayment({
        amount,
        currency,
        client_transaction_id: `TXN-${Date.now()}`,
        customer_email: email,
        customer_phone: phone,
        description: description,
        channel: 'WEB',
        redirect_url: 'https://business.xcelapp.com/#/auth',
        ...paymentConfig,
      });

      const link = response.data.payment_link;
      const code = response.data.payment_code;

      console.log('✓ Payment Link Generated:', link);
      console.log('✓ Payment Code:', code);

      onPaymentLinkGenerated?.(link, code);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Payment failed');
      console.error('Payment Error:', errorObj);
      onError?.(errorObj);
      Alert.alert('Error', errorObj.message);
    }
  };

  // Handle status check
  const handleCheckStatus = async () => {
    if (!paymentCode) {
      Alert.alert('Error', 'No payment code available');
      return;
    }

    try {
      const txn = await checkStatus();
      Alert.alert(
        'Payment Status',
        `Status: ${txn.status}\nAmount: ${txn.amount} ${txn.currency}`
      );

      if (onPaymentComplete && (txn.status === 'SUCCESS' || txn.status === 'FAILED')) {
        onPaymentComplete(txn);
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Status check failed');
      onError?.(errorObj);
      Alert.alert('Error', errorObj.message);
    }
  };

  // Handle polling result - result is PaymentResult, not TransactionData
  // We don't call onPaymentComplete here since it expects TransactionData
  // User should use check status manually if using polling

  // Minimal mode - just show payment link if available
  if (minimalMode && paymentLink) {
    return (
      <View style={[styles.container, customStyles.container]}>
        <Text style={styles.title}>Payment Link Ready</Text>
        <Text style={styles.paymentLink}>{paymentLink}</Text>
        <Text style={styles.label}>Payment Code: {paymentCode}</Text>
        {showStatusButton && (
          <Pressable
            style={[styles.secondaryButton, customStyles.button]}
            onPress={handleCheckStatus}
          >
            <Text style={[styles.secondaryButtonText, customStyles.buttonText]}>
              Check Status
            </Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, customStyles.container]}>
      <View style={styles.content}>
        <Text style={styles.title}>XCEL PayGate</Text>
        <Text style={styles.subtitle}>Secure Payment Processing</Text>

        {/* Payment Form */}
        {!minimalMode && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Details</Text>

            <Text style={styles.label}>Amount ({currency})</Text>
            <TextInput
              style={[styles.input, customStyles.input]}
              value={amount}
              onChangeText={setAmount}
              placeholder="1000"
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Customer Email (Optional)</Text>
            <TextInput
              style={[styles.input, customStyles.input]}
              value={email}
              onChangeText={setEmail}
              placeholder="customer@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Customer Phone (Optional)</Text>
            <TextInput
              style={[styles.input, customStyles.input]}
              value={phone}
              onChangeText={setPhone}
              placeholder="237233429972"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, customStyles.input]}
              value={description}
              onChangeText={setDescription}
              placeholder="Payment description"
            />
          </View>
        )}

        {/* Generate Payment Button */}
        <Pressable
          style={[
            styles.button,
            customStyles.button,
            loading && styles.buttonDisabled,
          ]}
          onPress={handlePay}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.buttonText, customStyles.buttonText]}>
              {buttonText}
            </Text>
          )}
        </Pressable>

        {/* Payment Result Section */}
        {paymentCode && (
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>✓ Payment Created</Text>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Payment Code:</Text>
              <Text style={styles.resultValue}>{paymentCode}</Text>
            </View>

            {paymentLink && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Payment Link:</Text>
                <Text style={[styles.resultValue, styles.linkText]} numberOfLines={1}>
                  {paymentLink}
                </Text>
              </View>
            )}

            {transaction && (
              <>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Status:</Text>
                  <Text style={[styles.resultValue, styles.statusText]}>
                    {transaction.status}
                  </Text>
                </View>

                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Transaction ID:</Text>
                  <Text style={styles.resultValue}>
                    {transaction.transaction_id}
                  </Text>
                </View>
              </>
            )}

            {isPolling && (
              <Text style={styles.pollingText}>Checking payment status...</Text>
            )}

            {/* Manual Status Check */}
            {showStatusButton && (
              <Pressable
                style={[styles.secondaryButton, customStyles.button]}
                onPress={handleCheckStatus}
              >
                <Text style={[styles.secondaryButtonText, customStyles.buttonText]}>
                  Check Status Manually
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error.message}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: '#666',
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000',
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  resultSection: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#e8f5e9',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2e7d32',
  },
  resultRow: {
    marginBottom: 12,
  },
  resultLabel: {
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  resultValue: {
    fontSize: 14,
    color: '#000',
  },
  linkText: {
    fontSize: 12,
    color: '#007AFF',
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  pollingText: {
    marginTop: 12,
    fontStyle: 'italic',
    color: '#666',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#c62828',
    fontWeight: '500',
  },
  paymentLink: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
});
