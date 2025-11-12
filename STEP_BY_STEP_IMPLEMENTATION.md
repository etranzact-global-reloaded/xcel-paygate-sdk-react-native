# XCEL PayGate SDK - Complete Step-by-Step Implementation Guide

**Every line of code you need, from start to finish**

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Installation & Setup](#step-1-installation--setup)
3. [Step 2: Configuration](#step-2-configuration)
4. [Step 3: Create Payment Screen](#step-3-create-payment-screen)
5. [Step 4: Create WebView Screen](#step-4-create-webview-screen)
6. [Step 5: Create Receipt Screen](#step-5-create-receipt-screen)
7. [Step 6: Add Payment Helpers](#step-6-add-payment-helpers)
8. [Step 7: Test Payment Flow](#step-7-test-payment-flow)
9. [Step 8: Production Deployment](#step-8-production-deployment)

---

## Prerequisites

### Required Credentials

**ENEO Cameroon (Example Merchant):**
```
Merchant ID: yFhi7ApMr
Public Key: XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205
Base URL: https://api.xcelapp.com
PayGate URL: https://paygate.xcelapp.com
```

**Get Your Own Credentials:**
1. Visit: https://business.xcelapp.com/
2. Create merchant account
3. Navigate to Settings → API Keys
4. Copy `Merchant ID` and `Public Key`

### API Endpoints Used

```
POST   https://api.xcelapp.com/transactions-service/paygate/generate-payment-link
GET    https://api.xcelapp.com/transactions-service/paygate/get-transaction-data/{payment_code}
GET    https://api.xcelapp.com/business-api/merchant/details/{merchant_id}
GET    https://api.xcelapp.com/business-api/merchant/products/{merchant_id}
```

---

## Step 1: Installation & Setup

### 1.1 Create Expo Project

```bash
npx create-expo-app@latest xcel-payment-app
cd xcel-payment-app
```

### 1.2 Install Dependencies

```bash
# Core dependencies
npm install react-native-webview expo-router expo-linking

# Optional (for better UI)
npm install @react-native-picker/picker

# For TypeScript support
npm install --save-dev @types/react @types/react-native
```

### 1.3 Project Structure

Create this folder structure:

```
xcel-payment-app/
├── app/
│   ├── index.tsx                    # Main payment screen
│   ├── payment-webview.tsx          # WebView payment screen
│   ├── payment-receipt.tsx          # Receipt screen
│   └── _layout.tsx                  # Root layout
├── src/
│   ├── api/
│   │   └── client.ts                # API client
│   ├── services/
│   │   └── checkout.ts              # Checkout service
│   ├── hooks/
│   │   └── use-xcel-paygate.ts     # React hooks
│   ├── utils/
│   │   └── payment-helpers.ts       # Helper functions
│   ├── types/
│   │   └── index.ts                 # TypeScript types
│   ├── config/
│   │   └── index.ts                 # Configuration
│   └── index.ts                     # Main export
└── package.json
```

---

## Step 2: Configuration

### 2.1 Create `src/config/index.ts`

**Full Code:**

```typescript
export interface XcelPayGateConfig {
  merchantId: string;
  publicKey: string;
  baseUrl?: string;
}

// ENEO Cameroon Merchant Configuration
export const XCEL_CONFIG: XcelPayGateConfig = {
  merchantId: "yFhi7ApMr",
  publicKey: "XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205",
  // Optional: Override base URL
  // baseUrl: 'https://api.xcelapp.com',
};

export const getXcelConfig = (): XcelPayGateConfig => {
  return XCEL_CONFIG;
};

// API Endpoints
export const API_ENDPOINTS = {
  BASE_URL: "https://api.xcelapp.com",
  PAYGATE_URL: "https://paygate.xcelapp.com",
  GENERATE_PAYMENT_LINK: "/transactions-service/paygate/generate-payment-link",
  GET_TRANSACTION_DATA: "/transactions-service/paygate/get-transaction-data",
  MERCHANT_DETAILS: "/business-api/merchant/details",
  MERCHANT_PRODUCTS: "/business-api/merchant/products",
};
```

**Replace with your credentials:**
```typescript
export const XCEL_CONFIG: XcelPayGateConfig = {
  merchantId: "YOUR_MERCHANT_ID",        // Get from business.xcelapp.com
  publicKey: "YOUR_PUBLIC_KEY",          // Get from business.xcelapp.com
};
```

### 2.2 Create `src/types/index.ts`

**Full Code:**

```typescript
export interface XcelPayGateConfig {
  merchantId: string;
  publicKey: string;
  baseUrl?: string;
}

export interface GeneratePaymentLinkRequest {
  amount: string;
  currency: string;
  client_transaction_id: string;
  customer_email: string;
  customer_phone: string;
  description: string;
  channel: 'WEB' | 'MOBILE';
  metadata?: Record<string, any>;
  redirect_url: string;
  webhook_url?: string;
  products?: PaymentProduct[];
}

export interface PaymentProduct {
  product_id: string;
  amount: string;
}

export interface GeneratePaymentLinkResponse {
  status: string;
  status_reason: string;
  data: {
    transaction_id: string;
    client_transaction_id: string;
    payment_code: string;
    payment_link: string;
    amount: number;
    currency: string;
    public_key: string;
    expires_at: string;
    metadata?: Record<string, any>;
  };
}

export interface TransactionData {
  _id: string;
  transaction_id: string;
  payment_code: string;
  merchant_id: string;
  expires_at: string;
  amount: number;
  products: PaymentProduct[];
  currency: string;
  country_code: string;
  client_transaction_id: string;
  customer_email: string;
  customer_phone: string;
  description: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  channel: string;
  redirect_url: string;
  public_key: string;
  webhook_url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionDataResponse {
  status: string;
  status_reason: string;
  data: TransactionData;
}

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'PROCESSING';

export interface PaymentReceiptData {
  transaction_id: string;
  client_transaction_id?: string;
  payment_code: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  customer_email?: string;
  customer_phone?: string;
  description?: string;
  payment_method: string;
  payment_date: string;
  metadata?: Record<string, any>;
  products?: PaymentProduct[];
}

export interface MerchantProduct {
  _id: string;
  product_id: string;
  name: string;
  payment_code: string;
  active: {
    status: boolean;
  };
  web: boolean;
}
```

### 2.3 Create `src/api/client.ts`

**Full Code:**

```typescript
import type {
  GeneratePaymentLinkRequest,
  GeneratePaymentLinkResponse,
  TransactionDataResponse,
  XcelPayGateConfig,
} from '../types';

const DEFAULT_BASE_URL = "https://api.xcelapp.com";
const PAYGATE_BASE_URL = "https://paygate.xcelapp.com";

export class XcelPayGateClient {
  private config: Required<XcelPayGateConfig>;

  constructor(config: XcelPayGateConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || DEFAULT_BASE_URL,
    };
  }

  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "x-merchant-id": this.config.merchantId,
      "x-public-key": this.config.publicKey,
    };
  }

  async generatePaymentLink(
    request: GeneratePaymentLinkRequest
  ): Promise<GeneratePaymentLinkResponse> {
    const headers = this.getHeaders();
    const url = `${this.config.baseUrl}/transactions-service/paygate/generate-payment-link`;

    console.log('🔵 Generate Payment Link Request:');
    console.log('URL:', url);
    console.log('Headers:', JSON.stringify(headers, null, 2));
    console.log('Payload:', JSON.stringify(request, null, 2));

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
    });

    console.log('🔵 Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error Response:', errorText);
      throw new Error(`Failed to generate payment link: ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('✅ Success Response:', JSON.stringify(responseData, null, 2));

    return responseData;
  }

  async getTransactionData(
    paymentCode: string
  ): Promise<TransactionDataResponse> {
    const headers = this.getHeaders();
    const url = `${this.config.baseUrl}/transactions-service/paygate/get-transaction-data/${paymentCode}`;

    console.log('🔵 Get Transaction Data Request:');
    console.log('URL:', url);
    console.log('Payment Code:', paymentCode);

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get transaction data: ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('✅ Transaction Data:', JSON.stringify(responseData, null, 2));

    return responseData;
  }

  async getMerchantProducts(merchantId?: string): Promise<any> {
    const id = merchantId || this.config.merchantId;
    const headers = this.getHeaders();
    const url = `${this.config.baseUrl}/business-api/merchant/products/${id}`;

    console.log('🔵 Get Merchant Products Request:');
    console.log('URL:', url);

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get merchant products: ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('✅ Merchant Products:', JSON.stringify(responseData, null, 2));

    return responseData;
  }

  getCheckoutUrl(merchantId?: string): string {
    const id = merchantId || this.config.merchantId;
    return `${PAYGATE_BASE_URL}/pay/${id}`;
  }

  getFullPaymentUrl(paymentCode: string, merchantId?: string): string {
    const checkoutUrl = this.getCheckoutUrl(merchantId);
    return `${checkoutUrl}?code=${paymentCode}`;
  }
}
```

---

## Step 3: Create Payment Screen

### 3.1 Create `app/index.tsx`

**Full Code with ENEO credentials:**

```typescript
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from 'react-native';
import { XcelPayGateClient } from '../src/api/client';

export default function PaymentScreen() {
  const router = useRouter();

  // XCEL Configuration - ENEO Cameroon
  const config = {
    merchantId: "yFhi7ApMr",
    publicKey: "XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205",
  };

  const client = new XcelPayGateClient(config);

  // Payment form state
  const [amount, setAmount] = useState('1000');
  const [email, setEmail] = useState('customer@example.com');
  const [phone, setPhone] = useState('237233429972'); // Cameroon format
  const [description, setDescription] = useState('Payment for electricity bill');
  const [loading, setLoading] = useState(false);

  // Products state
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Fetch merchant products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await client.getMerchantProducts();
      if (response.data?.data && response.data.data.length > 0) {
        const activeProducts = response.data.data.filter(
          (p: any) => p.active.status && p.web
        );
        setProducts(activeProducts);

        // Auto-select first product
        if (activeProducts.length > 0) {
          setSelectedProductId(activeProducts[0].product_id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleInitiatePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);

    try {
      // Build products array if a product is selected
      const paymentProducts = selectedProductId
        ? [{ product_id: selectedProductId, amount: amount }]
        : [];

      // Generate payment link
      const response = await client.generatePaymentLink({
        amount: amount,
        currency: 'XAF', // Central African CFA Franc (Cameroon)
        client_transaction_id: `TXN-${Date.now()}`,
        customer_email: email,
        customer_phone: phone,
        description: description,
        channel: 'MOBILE',
        metadata: {
          order_id: `ORD-${Date.now()}`,
          product_id: selectedProductId || 'none',
        },
        redirect_url: 'https://business.xcelapp.com/#/auth',
        webhook_url: 'https://your-server.com/webhook', // Optional
        products: paymentProducts,
      });

      console.log('✅ Payment Link Generated:', response.data.payment_link);
      console.log('✅ Payment Code:', response.data.payment_code);

      // Navigate to WebView
      router.push({
        pathname: '/payment-webview',
        params: {
          paymentLink: response.data.payment_link,
          paymentCode: response.data.payment_code,
          amount: amount,
          currency: 'XAF',
          description: description,
        },
      });
    } catch (error) {
      console.error('Payment Error:', error);
      Alert.alert('Error', 'Failed to create payment link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>XCEL PayGate Payment</Text>
        <Text style={styles.subtitle}>ENEO Cameroon - Electricity Payment</Text>

        {/* Product Selection */}
        {loadingProducts ? (
          <View style={styles.loadingSection}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : products.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.label}>Select Product Type</Text>
            {products.map((product) => (
              <Pressable
                key={product.product_id}
                style={[
                  styles.productButton,
                  selectedProductId === product.product_id && styles.productButtonSelected,
                ]}
                onPress={() => setSelectedProductId(product.product_id)}
              >
                <Text
                  style={[
                    styles.productButtonText,
                    selectedProductId === product.product_id && styles.productButtonTextSelected,
                  ]}
                >
                  {product.name}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

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

        {/* Pay Button */}
        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleInitiatePayment}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Processing...' : 'Pay Now'}
          </Text>
        </Pressable>

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>Merchant: ENEO Cameroon</Text>
          <Text style={styles.infoText}>Merchant ID: {config.merchantId}</Text>
          <Text style={styles.infoText}>Currency: XAF (FCFA)</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  loadingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  loadingText: {
    marginLeft: 12,
    color: '#666',
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  productButton: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  productButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  productButtonText: {
    fontSize: 16,
    color: '#333',
  },
  productButtonTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#f9f9f9',
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
  infoSection: {
    marginTop: 24,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
});
```

**Key Points:**
- ✅ Uses real ENEO Cameroon credentials
- ✅ Fetches actual products from API
- ✅ Uses XAF currency (Cameroon)
- ✅ Phone format: 237233429972 (Cameroon country code)
- ✅ Generates unique transaction IDs

---

## Step 4: Create WebView Screen

### 4.1 Create `src/utils/payment-helpers.ts`

**Full Code:**

```typescript
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'PROCESSING';

export function formatCurrency(amount: number, currency: string = 'XAF'): string {
  const currencySymbols: Record<string, string> = {
    XAF: 'FCFA',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };

  const symbol = currencySymbols[currency] || currency;
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (currency === 'XAF') {
    return `${formattedAmount} ${symbol}`;
  }

  return `${symbol} ${formattedAmount}`;
}

export function formatPaymentDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const day = dateObj.getDate();
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();

  let hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12;

  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
  const time = `${hours}:${minutesStr} ${ampm}`;

  return `${month} ${day}, ${year}, ${time}`;
}

export function getStatusColor(status: PaymentStatus): string {
  switch (status) {
    case 'SUCCESS':
      return '#4CAF50'; // Green
    case 'FAILED':
      return '#F44336'; // Red
    case 'PENDING':
    case 'PROCESSING':
      return '#FF9800'; // Orange
    case 'EXPIRED':
      return '#9E9E9E'; // Gray
    default:
      return '#757575';
  }
}

export function isSuccessUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.includes('success') ||
    lowerUrl.includes('callback') ||
    lowerUrl.includes('approved') ||
    lowerUrl.includes('complete')
  );
}

export function isFailureUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.includes('cancel') ||
    lowerUrl.includes('failed') ||
    lowerUrl.includes('error') ||
    lowerUrl.includes('decline')
  );
}

export function hasSuccessText(text: string): boolean {
  const lowerText = text.toLowerCase();
  const successKeywords = [
    'payment successful',
    'transaction successful',
    'payment completed',
    'payment approved',
  ];
  return successKeywords.some((keyword) => lowerText.includes(keyword));
}

export function hasFailureText(text: string): boolean {
  const lowerText = text.toLowerCase();
  const failureKeywords = [
    'payment failed',
    'transaction failed',
    'payment cancelled',
  ];
  return failureKeywords.some((keyword) => lowerText.includes(keyword));
}

export function hasPendingText(text: string): boolean {
  const lowerText = text.toLowerCase();
  const pendingKeywords = ['payment pending', 'processing payment'];
  return pendingKeywords.some((keyword) => lowerText.includes(keyword));
}
```

### 4.2 Create `app/payment-webview.tsx`

**Full Code:**

```typescript
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { StyleSheet, ActivityIndicator, View, Pressable } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from 'react-native';
import {
  isSuccessUrl,
  isFailureUrl,
  hasSuccessText,
  hasFailureText,
  hasPendingText,
  formatPaymentDate,
} from '../src/utils/payment-helpers';

export default function PaymentWebViewScreen() {
  const params = useLocalSearchParams<{
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
    (receiptData: any) => {
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
      const receiptParams: Record<string, string> = {
        transaction_id: receiptData.transaction_id || params.paymentCode || '',
        payment_code: receiptData.payment_code || params.paymentCode || '',
        status: receiptData.status || 'PENDING',
        amount: receiptData.amount?.toString() || params.amount || '0',
        currency: receiptData.currency || params.currency || 'XAF',
        payment_method: receiptData.payment_method || 'XcelPOS',
        payment_date: receiptData.payment_date || formatPaymentDate(new Date()),
      };

      if (receiptData.description || params.description) {
        receiptParams.description = receiptData.description || params.description || '';
      }

      console.log('🔵 Navigating to receipt with params:', receiptParams);
      router.replace({ pathname: '/payment-receipt', params: receiptParams });
    },
    [router, params]
  );

  const handleWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        console.log('🔵 WebView message received:', data.type);

        switch (data.type) {
          case 'payment_success':
            console.log('✅ Payment success detected!');
            // Clear any existing timer
            if (successTimerRef.current) {
              clearTimeout(successTimerRef.current);
            }

            // Set a 15-second timer before auto-navigating to success
            successTimerRef.current = setTimeout(() => {
              console.log('✅ Auto-navigating to success receipt after 15 seconds');
              navigateToReceipt({
                status: 'SUCCESS',
                transaction_id: data.url,
              });
            }, 15000); // 15 seconds
            break;

          case 'payment_failed':
            console.log('❌ Payment failed detected!');
            navigateToReceipt({
              status: 'FAILED',
              transaction_id: data.url,
            });
            break;

          case 'payment_pending':
            console.log('⏳ Payment pending detected!');
            navigateToReceipt({
              status: 'PENDING',
              transaction_id: data.url,
            });
            break;

          case 'close_clicked':
            console.log('❌ Close button clicked - treating as failed');
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
                console.log('✅ Success text detected in DOM');
                handleWebViewMessage({
                  nativeEvent: {
                    data: JSON.stringify({ type: 'payment_success', url: data.url }),
                  },
                } as WebViewMessageEvent);
              } else if (hasFailureText(data.bodyText)) {
                console.log('❌ Failure text detected in DOM');
                navigateToReceipt({
                  status: 'FAILED',
                  transaction_id: data.url,
                });
              } else if (hasPendingText(data.bodyText)) {
                console.log('⏳ Pending text detected in DOM');
                navigateToReceipt({
                  status: 'PENDING',
                  transaction_id: data.url,
                });
              }
            }
            break;

          default:
            console.log('🔵 Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('❌ Error parsing WebView message:', error);
      }
    },
    [navigateToReceipt]
  );

  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      console.log('🔵 Navigation state changed:', navState.url);

      // Check URL for success/failure indicators
      if (isSuccessUrl(navState.url)) {
        console.log('✅ Success URL detected!');
        handleWebViewMessage({
          nativeEvent: { data: JSON.stringify({ type: 'payment_success', url: navState.url }) },
        } as WebViewMessageEvent);
      } else if (isFailureUrl(navState.url)) {
        console.log('❌ Failure URL detected!');
        navigateToReceipt({
          status: 'FAILED',
          transaction_id: navState.url,
        });
      }
    },
    [handleWebViewMessage, navigateToReceipt]
  );

  if (!params.paymentLink) {
    return (
      <View style={styles.container}>
        <Text>No payment link provided</Text>
        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  // JavaScript code to inject into the WebView
  const injectedJavaScript = `
    (function() {
      console.log('🔵 XcelPay WebView JavaScript injection started');

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

      console.log('✅ XcelPay WebView JavaScript injection complete');
      true;
    })();
  `;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Complete Payment</Text>
      </View>

      <WebView
        ref={webViewRef}
        source={{ uri: params.paymentLink }}
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
            <Text style={styles.loadingText}>Loading payment page...</Text>
          </View>
        )}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('❌ WebView error: ', nativeEvent);
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
```

---

## Step 5: Create Receipt Screen

### 5.1 Create `app/payment-receipt.tsx`

**Full Code:**

```typescript
import React from 'react';
import { StyleSheet, View, Pressable, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from 'react-native';
import type { PaymentStatus } from '../src/utils/payment-helpers';
import {
  formatCurrency,
  getStatusColor,
  formatPaymentDate,
} from '../src/utils/payment-helpers';

export default function PaymentReceiptScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  // Parse receipt data from route params
  const receiptData = {
    transaction_id: (params.transaction_id as string) || '',
    payment_code: (params.payment_code as string) || '',
    status: (params.status as PaymentStatus) || 'PENDING',
    amount: parseFloat((params.amount as string) || '0'),
    currency: (params.currency as string) || 'XAF',
    description: params.description as string | undefined,
    payment_method: (params.payment_method as string) || 'XcelPOS',
    payment_date: (params.payment_date as string) || new Date().toISOString(),
  };

  const statusColor = getStatusColor(receiptData.status);

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleDownloadReceipt = () => {
    console.log('Download receipt:', receiptData);
    alert('Receipt download feature coming soon!');
  };

  const renderStatusIcon = () => {
    switch (receiptData.status) {
      case 'SUCCESS':
        return (
          <View style={[styles.statusIcon, { backgroundColor: statusColor }]}>
            <Text style={styles.statusIconText}>✓</Text>
          </View>
        );
      case 'FAILED':
        return (
          <View style={[styles.statusIcon, { backgroundColor: statusColor }]}>
            <Text style={styles.statusIconText}>✕</Text>
          </View>
        );
      case 'PENDING':
      case 'PROCESSING':
        return (
          <View style={[styles.statusIcon, { backgroundColor: statusColor }]}>
            <Text style={styles.statusIconText}>⏱</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.statusIcon, { backgroundColor: statusColor }]}>
            <Text style={styles.statusIconText}>i</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Status Icon */}
          <View style={styles.iconContainer}>{renderStatusIcon()}</View>

          {/* Status Title */}
          <Text style={[styles.statusTitle, { color: statusColor }]}>
            Payment {receiptData.status}
          </Text>

          {/* Status Message */}
          <Text style={styles.statusMessage}>
            Your payment of {formatCurrency(receiptData.amount, receiptData.currency)} was {receiptData.status.toLowerCase()}
          </Text>

          {/* Transaction Details */}
          <View style={styles.divider} />

          <View style={styles.detailsContainer}>
            {/* Transaction Type */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction Type</Text>
              <Text style={styles.detailValue}>{receiptData.payment_method}</Text>
            </View>

            {/* Transaction Reference */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction Reference</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {receiptData.transaction_id || receiptData.payment_code}
              </Text>
            </View>

            {/* Description */}
            {receiptData.description && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue} numberOfLines={2}>
                  {receiptData.description}
                </Text>
              </View>
            )}

            {/* Amount */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={[styles.detailValue, styles.amountText]}>
                {formatCurrency(receiptData.amount, receiptData.currency)}
              </Text>
            </View>

            {/* Status */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={[styles.detailValue, { color: statusColor }]}>
                {receiptData.status}
              </Text>
            </View>

            {/* Date */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatPaymentDate(receiptData.payment_date)}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.button, styles.downloadButton]}
              onPress={handleDownloadReceipt}
            >
              <Text style={styles.downloadButtonText}>Download Receipt</Text>
            </Pressable>

            <Pressable style={[styles.button, styles.closeButton]} onPress={handleClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIconText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  statusMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666666',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 24,
  },
  detailsContainer: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: 32,
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  downloadButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  closeButton: {
    backgroundColor: '#007AFF',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
```

---

## Step 6: Add Payment Helpers

Already created in Step 4.1 above ✅

---

## Step 7: Test Payment Flow

### 7.1 Run the App

```bash
# Start Metro bundler
npx expo start

# Run on iOS
npx expo start --ios

# Run on Android
npx expo start --android
```

### 7.2 Test with Real ENEO Products

**Test Flow:**
1. App opens with product selection
2. Select "ENEO PREPAID ELECTRICITY" or "ENEO POSTPAID ELECTRICITY"
3. Enter amount: `1000` XAF
4. Enter email: `customer@example.com`
5. Enter phone: `237233429972`
6. Click "Pay Now"
7. WebView opens with payment page
8. Complete payment or click close
9. Receipt screen appears with transaction details

**Expected API Call:**
```json
POST https://api.xcelapp.com/transactions-service/paygate/generate-payment-link

Headers:
{
  "Content-Type": "application/json",
  "x-merchant-id": "yFhi7ApMr",
  "x-public-key": "XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205"
}

Body:
{
  "amount": "1000",
  "currency": "XAF",
  "client_transaction_id": "TXN-1729585466123",
  "customer_email": "customer@example.com",
  "customer_phone": "237233429972",
  "description": "Payment for electricity bill",
  "channel": "MOBILE",
  "metadata": {
    "order_id": "ORD-1729585466123",
    "product_id": "6RgglQWWO"
  },
  "redirect_url": "https://business.xcelapp.com/#/auth",
  "products": [
    {
      "product_id": "6RgglQWWO",
      "amount": "1000"
    }
  ]
}
```

**Expected Response:**
```json
{
  "status": "SUCCESS",
  "status_reason": "Payment link generated successfully",
  "data": {
    "transaction_id": "67160d0a2a49e8e7e3cc73d1",
    "client_transaction_id": "TXN-1729585466123",
    "payment_code": "NIWL1NZZ",
    "payment_link": "https://paygate.xcelapp.com/pay/yFhi7ApMr?code=NIWL1NZZ",
    "amount": 1000,
    "currency": "XAF",
    "expires_at": "2025-10-22T11:17:46.133Z"
  }
}
```

### 7.3 Console Logs to Monitor

You should see these logs:

```
🔵 Generate Payment Link Request:
URL: https://api.xcelapp.com/transactions-service/paygate/generate-payment-link

🔵 Response Status: 200

✅ Success Response: {
  "status": "SUCCESS",
  "data": {
    "payment_link": "https://paygate.xcelapp.com/pay/yFhi7ApMr?code=NIWL1NZZ"
  }
}

✅ Payment Link Generated: https://paygate.xcelapp.com/pay/yFhi7ApMr?code=NIWL1NZZ

🔵 XcelPay WebView JavaScript injection started

✅ XcelPay WebView JavaScript injection complete

🔵 WebView message received: dom_check

✅ Payment success detected!

✅ Auto-navigating to success receipt after 15 seconds

🔵 Navigating to receipt with params: {
  "status": "SUCCESS",
  "amount": "1000",
  "currency": "XAF"
}
```

---

## Step 8: Production Deployment

### 8.1 Update Configuration for Production

**Before deploying, update `src/config/index.ts`:**

```typescript
// DON'T hardcode in production!
export const XCEL_CONFIG: XcelPayGateConfig = {
  merchantId: process.env.EXPO_PUBLIC_XCEL_MERCHANT_ID || "yFhi7ApMr",
  publicKey: process.env.EXPO_PUBLIC_XCEL_PUBLIC_KEY || "XCLPUBK_LIVE-...",
};
```

**Create `.env` file:**

```env
EXPO_PUBLIC_XCEL_MERCHANT_ID=yFhi7ApMr
EXPO_PUBLIC_XCEL_PUBLIC_KEY=XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205
```

### 8.2 Build for Production

```bash
# iOS Build
eas build --platform ios --profile production

# Android Build
eas build --platform android --profile production
```

### 8.3 Production Checklist

- [ ] Update merchant credentials
- [ ] Test payment flow end-to-end
- [ ] Test with real products
- [ ] Test success, failure, and pending flows
- [ ] Test close button behavior
- [ ] Test 15-second auto-navigation
- [ ] Verify receipt displays correctly
- [ ] Test different amounts
- [ ] Test different currencies (if applicable)
- [ ] Monitor console logs for errors
- [ ] Test on both iOS and Android

---

## Complete File Summary

**Files Created (8 total):**

1. ✅ `src/config/index.ts` - Configuration with ENEO credentials
2. ✅ `src/types/index.ts` - TypeScript type definitions
3. ✅ `src/api/client.ts` - API client with all endpoints
4. ✅ `src/utils/payment-helpers.ts` - Helper functions
5. ✅ `app/index.tsx` - Main payment screen
6. ✅ `app/payment-webview.tsx` - WebView payment screen
7. ✅ `app/payment-receipt.tsx` - Receipt screen
8. ✅ `package.json` - Dependencies

**API Endpoints Used:**
```
✅ POST /transactions-service/paygate/generate-payment-link
✅ GET /transactions-service/paygate/get-transaction-data/{code}
✅ GET /business-api/merchant/products/{merchant_id}
```

**Credentials Used (ENEO Cameroon):**
```
Merchant ID: yFhi7ApMr
Public Key: XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205
Currency: XAF (Central African CFA Franc)
Products: ENEO PREPAID ELECTRICITY, ENEO POSTPAID ELECTRICITY
```

---

## Need Help?

**Common Issues:**

1. **Payment link not working**
   - Check merchant credentials are correct
   - Verify internet connection
   - Check console logs for API errors

2. **WebView not detecting status**
   - Check injected JavaScript is loading
   - Verify WebView has JavaScript enabled
   - Check console logs for WebView messages

3. **Products not loading**
   - Verify merchant has products configured
   - Check API endpoint is accessible
   - Review console logs for errors

**Support:**
- API Documentation: https://api.xcelapp.com/docs
- Business Portal: https://business.xcelapp.com
- GitHub Issues: [Your Repo]

---

**🎉 Implementation Complete!**

You now have a fully functional XCEL PayGate payment integration with:
- ✅ Real ENEO Cameroon credentials
- ✅ Product selection
- ✅ Payment link generation
- ✅ WebView payment processing
- ✅ Status detection (success/failed/pending)
- ✅ Receipt display
- ✅ All necessary code at every step

**Start Testing:** Run `npx expo start` and try making a payment!
