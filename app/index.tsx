// @ts-nocheck
/**
 * XCEL PayGate SDK - Usage Example
 *
 * This example demonstrates how to use the @xcelapp/paygate-sdk package
 * in a React Native application with Expo.
 *
 * Features shown:
 * - Provider pattern setup
 * - Payment link generation
 * - Product selection
 * - WebView integration
 * - Payment status monitoring
 *
 * NOTE: This is a reference example file.
 * TypeScript checking is disabled because Expo dependencies are not installed on the main branch.
 * When you use this code in your own app, remove the @ts-nocheck comment.
 */

import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

// Import SDK hooks
// When using the published package, you would import from '@xcelapp/paygate-sdk'
// For this example, we import from the local SDK source
import { useCheckout, usePaymentPolling } from "../src";

export default function PaymentScreen() {
  const router = useRouter();

  // Form state
  const [amount, setAmount] = useState("1000");
  const [email, setEmail] = useState("customer@example.com");
  const [phone, setPhone] = useState("237233429972");
  const [description, setDescription] = useState("Payment for services");

  // SDK Hook - handles payment operations
  // Config is provided by XcelPayGateProvider in _layout.tsx
  const {
    initiatePayment,
    checkStatus,
    loading,
    error,
    paymentLink,
    paymentCode,
    transaction,
  } = useCheckout();

  // Optional: Auto-poll payment status
  const { result: pollingResult, isPolling } = usePaymentPolling(paymentCode, {
    enabled: false, // Disabled - we'll check status via WebView instead
    maxAttempts: 24,
    intervalMs: 5000,
  });

  /**
   * Handle payment initiation
   * This generates a payment link that can be opened in a WebView
   */
  const handlePay = async () => {
    try {
      const response = await initiatePayment({
        amount,
        currency: "XAF", // Cameroon Franc
        client_transaction_id: `TXN-${Date.now()}`,
        customer_email: email,
        customer_phone: phone,
        description,
        channel: "WEB",

        // Optional: Add products
        products: [
          {
            product_id: "PROD-123",
            amount: amount,
          },
        ],

        // Optional: Redirect and webhook URLs
        redirect_url: "myapp://payment/success",
        webhook_url: "https://yourapi.com/webhook",

        // Optional: Custom metadata
        metadata: {
          order_id: `ORDER-${Date.now()}`,
          customer_name: "John Doe",
        },
      });

      console.log("✓ Payment Link Generated:", response.data.payment_link);
      console.log("✓ Payment Code:", response.data.payment_code);

      // Navigate to WebView with payment link
      router.push({
        pathname: "/payment-webview",
        params: {
          paymentLink: response.data.payment_link,
          paymentCode: response.data.payment_code,
          amount: amount,
          currency: "XAF",
          description: description,
        },
      });
    } catch (err) {
      console.error("Payment Error:", err);
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to create payment"
      );
    }
  };

  /**
   * Manually check payment status
   * Useful for debugging or custom flows
   */
  const handleCheckStatus = async () => {
    if (!paymentCode) {
      Alert.alert("Error", "No payment code available");
      return;
    }

    try {
      const txn = await checkStatus();
      Alert.alert(
        "Payment Status",
        `Status: ${txn.status}\nAmount: ${txn.amount} ${txn.currency}`
      );
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to check status"
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>XCEL PayGate SDK Example</Text>
        <Text style={styles.subtitle}>Payment Integration Demo</Text>

        {/* Payment Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>

          <Text style={styles.label}>Amount (XAF)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="1000"
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Customer Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="customer@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Customer Phone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="237233429972"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Payment description"
          />
        </View>

        {/* Generate Payment Button */}
        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handlePay}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Generate Payment Link</Text>
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
            <Pressable
              style={styles.secondaryButton}
              onPress={handleCheckStatus}
            >
              <Text style={styles.secondaryButtonText}>
                Check Status Manually
              </Text>
            </Pressable>

            {/* Open Payment Page */}
            {paymentLink && (
              <Pressable
                style={styles.secondaryButton}
                onPress={() =>
                  router.push({
                    pathname: "/payment-webview",
                    params: {
                      paymentLink,
                      paymentCode,
                      amount,
                      currency: "XAF",
                      description,
                    },
                  })
                }
              >
                <Text style={styles.secondaryButtonText}>
                  Open Payment Page
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

        {/* SDK Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How This Works:</Text>
          <Text style={styles.infoText}>1. Fill in payment details above</Text>
          <Text style={styles.infoText}>
            2. Click &quot;Generate Payment Link&quot;
          </Text>
          <Text style={styles.infoText}>
            3. SDK creates a secure payment link
          </Text>
          <Text style={styles.infoText}>
            4. Open link in WebView for customer to pay
          </Text>
          <Text style={styles.infoText}>5. Monitor status or use webhooks</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    color: "#000",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: "center",
    color: "#666",
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#000",
  },
  label: {
    marginBottom: 8,
    fontWeight: "600",
    color: "#333",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  resultSection: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#e8f5e9",
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#2e7d32",
  },
  resultRow: {
    marginBottom: 12,
  },
  resultLabel: {
    fontWeight: "600",
    marginBottom: 4,
    color: "#333",
  },
  resultValue: {
    fontSize: 14,
    color: "#000",
  },
  statusText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  pollingText: {
    marginTop: 12,
    fontStyle: "italic",
    color: "#666",
  },
  errorBox: {
    backgroundColor: "#ffebee",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#c62828",
    fontWeight: "500",
  },
  infoSection: {
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#e3f2fd",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#1565c0",
  },
  infoText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 6,
    paddingLeft: 8,
  },
});
