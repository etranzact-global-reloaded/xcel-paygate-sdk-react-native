# XCEL PayGate SDK - Complete Technical Integration Guide

**Version:** 1.0.0
**Last Updated:** October 21, 2025
**Author:** XCEL PayGate Team

---

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Getting Started](#getting-started)
4. [Core Components](#core-components)
5. [API Reference](#api-reference)
6. [Payment Flows](#payment-flows)
7. [WebView Integration](#webview-integration)
8. [WebView Payment Status Detection](#webview-payment-status-detection)
9. [Type Definitions](#type-definitions)
10. [Utilities](#utilities)
11. [Complete Examples](#complete-examples)
12. [Best Practices](#best-practices)
13. [Troubleshooting](#troubleshooting)
14. [Production Checklist](#production-checklist)

---

## Introduction

The XCEL PayGate SDK is a comprehensive React Native solution for integrating XCEL payment gateway into your mobile applications. It supports:

- **Checkout URL Integration**: Hosted payment pages
- **XCEL Wallet Payments**: Direct wallet-to-wallet transactions
- **WebView Payment Flow**: In-app payment processing with status detection
- **Webhook Integration**: Real-time payment status updates
- **TypeScript Support**: Full type safety

### Key Features

✅ Multiple payment methods (Mobile Money, Cards, XCEL Wallet)
✅ Product-based payments (Electricity, Water, etc.)
✅ Automatic payment status detection
✅ Receipt generation with transaction details
✅ Customizable payment experience
✅ Comprehensive error handling
✅ React Hooks for easy integration

---

## Architecture Overview

### Component Hierarchy

```
┌─────────────────────────────────────────────┐
│         Your React Native App               │
└─────────────┬───────────────────────────────┘
              │
┌─────────────▼───────────────────────────────┐
│         XCEL PayGate SDK                    │
│                                              │
│  ┌──────────────┐  ┌──────────────┐        │
│  │   Hooks      │  │   Services   │        │
│  │              │  │              │        │
│  │ useCheckout  │  │  Checkout    │        │
│  │ usePolling   │  │  XcelWallet  │        │
│  │ useWallet    │  │              │        │
│  └──────┬───────┘  └──────┬───────┘        │
│         │                 │                 │
│         └────────┬────────┘                 │
│                  │                          │
│         ┌────────▼────────┐                 │
│         │  API Client     │                 │
│         │  (HTTP Layer)   │                 │
│         └────────┬────────┘                 │
└──────────────────┼──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         XCEL API Endpoints                  │
│                                              │
│  • Generate Payment Link                    │
│  • Get Transaction Status                   │
│  • Merchant Details/Products                │
│  • Wallet Verification                      │
│  • Create Transaction                       │
└─────────────────────────────────────────────┘
```

### File Structure

```
xcel-paygate-sdk/
├── src/
│   ├── api/
│   │   └── client.ts              # HTTP client for XCEL API
│   ├── services/
│   │   ├── checkout.ts            # Checkout URL service
│   │   └── xcel-wallet.ts         # Wallet payment service
│   ├── hooks/
│   │   └── use-xcel-paygate.ts    # React hooks
│   ├── utils/
│   │   └── payment-helpers.ts     # Utility functions
│   ├── types/
│   │   └── index.ts               # TypeScript definitions
│   ├── config/
│   │   └── index.ts               # Configuration
│   └── index.ts                   # Main export
├── app/
│   ├── index.tsx                  # Demo app home
│   ├── payment-webview.tsx        # WebView payment screen
│   └── payment-receipt.tsx        # Payment receipt screen
└── components/                     # Reusable UI components
```

---

## Getting Started

### Prerequisites

- React Native 0.70+
- Expo SDK 47+ (if using Expo)
- Node.js 16+
- XCEL Merchant Account

### Installation

#### Step 1: Install Dependencies

```bash
npm install react-native-webview expo-router expo-linking
# or
yarn add react-native-webview expo-router expo-linking
```

#### Step 2: Get Your Credentials

1. Create merchant account at [business.xcelapp.com](https://business.xcelapp.com/)
2. Navigate to Settings → API Keys
3. Copy your `merchantId` and `publicKey`

#### Step 3: Configure SDK

Create or update `src/config/index.ts`:

```typescript
import type { XcelPayGateConfig } from "../types";

export const XCEL_CONFIG: XcelPayGateConfig = {
  merchantId: "YOUR_MERCHANT_ID",        // e.g., "yFhi7ApMr"
  publicKey: "YOUR_PUBLIC_KEY",          // e.g., "XCLPUBK_LIVE-..."
  // Optional: Override base URL for testing
  // baseUrl: 'https://api.xcelapp.com',
};

export const getXcelConfig = (): XcelPayGateConfig => {
  return XCEL_CONFIG;
};
```

**Security Note:** In production, load credentials from secure storage or environment variables:

```typescript
import Constants from 'expo-constants';

export const getXcelConfig = (): XcelPayGateConfig => {
  return {
    merchantId: Constants.expoConfig?.extra?.xcelMerchantId || '',
    publicKey: Constants.expoConfig?.extra?.xcelPublicKey || '',
  };
};
```

---

## Core Components

### 1. XcelPayGateClient

The main HTTP client for communicating with XCEL API.

**Location:** `src/api/client.ts`

#### Initialize Client

```typescript
import { XcelPayGateClient } from '@/src/api/client';

const config = {
  merchantId: "YOUR_MERCHANT_ID",
  publicKey: "YOUR_PUBLIC_KEY",
};

const client = new XcelPayGateClient(config);
```

#### Available Methods

##### Generate Payment Link

```typescript
const response = await client.generatePaymentLink({
  amount: "1000",
  currency: "XAF",
  client_transaction_id: `TXN-${Date.now()}`,
  customer_email: "customer@example.com",
  customer_phone: "237233429972",
  description: "Payment for electricity bill",
  channel: "MOBILE",
  redirect_url: "https://yourapp.com/payment/success",
  webhook_url: "https://yourapp.com/api/webhooks/xcel",
  metadata: {
    order_id: "ORD123",
    customer_name: "John Doe",
  },
  products: [
    {
      product_id: "6RgglQWWO",
      amount: "1000",
    }
  ],
});

console.log('Payment Link:', response.data.payment_link);
console.log('Payment Code:', response.data.payment_code);
console.log('Transaction ID:', response.data.transaction_id);
```

**Response:**
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
    "public_key": "XCLPUBK_LIVE-...",
    "expires_at": "2025-10-22T11:17:46.133Z"
  }
}
```

##### Get Transaction Status

```typescript
const transaction = await client.getTransactionData("NIWL1NZZ");

console.log('Status:', transaction.data.status);
console.log('Amount:', transaction.data.amount);
console.log('Currency:', transaction.data.currency);
```

**Response:**
```json
{
  "status": "SUCCESS",
  "status_reason": "Transaction data retrieved successfully",
  "data": {
    "_id": "67160d0a2a49e8e7e3cc73d1",
    "transaction_id": "67160d0a2a49e8e7e3cc73d1",
    "payment_code": "NIWL1NZZ",
    "merchant_id": "yFhi7ApMr",
    "amount": 1000,
    "currency": "XAF",
    "status": "PENDING",
    "customer_email": "customer@example.com",
    "customer_phone": "237233429972",
    "description": "Payment for electricity bill",
    "expires_at": "2025-10-22T11:17:46.133Z",
    "createdAt": "2025-10-21T11:17:46.133Z",
    "updatedAt": "2025-10-21T11:17:46.133Z"
  }
}
```

##### Get Merchant Details

```typescript
const merchantDetails = await client.getMerchantDetails();

console.log('Merchant Name:', merchantDetails.data.data.reg_name);
console.log('Country:', merchantDetails.data.data.country_code);
console.log('Currency:', merchantDetails.data.data.currency.currency_code);
```

##### Get Merchant Products

```typescript
const productsResponse = await client.getMerchantProducts();

const products = productsResponse.data.data;
products.forEach(product => {
  console.log('Product:', product.name);
  console.log('Product ID:', product.product_id);
  console.log('Payment Code:', product.payment_code);
  console.log('Active:', product.active.status);
  console.log('---');
});
```

##### Verify XCEL Account

```typescript
const accountResponse = await client.verifyXcelAccount("237", "233429972");

if (accountResponse.success && accountResponse.data.length > 0) {
  const account = accountResponse.data[0];
  console.log('Account ID:', account.account_id);
  console.log('User:', `${account.first_name} ${account.last_name}`);
  console.log('Email:', account.email);
}
```

### 2. CheckoutService

High-level service for checkout URL flow.

**Location:** `src/services/checkout.ts`

```typescript
import { CheckoutService } from '@/src/services/checkout';

const checkoutService = new CheckoutService(client);
```

#### Methods

##### Initiate Checkout

```typescript
const response = await checkoutService.initiateCheckout({
  amount: "1000",
  currency: "XAF",
  client_transaction_id: `TXN-${Date.now()}`,
  customer_email: "customer@example.com",
  customer_phone: "237233429972",
  description: "Payment for electricity",
  channel: "MOBILE",
  redirect_url: "https://yourapp.com/success",
  webhook_url: "https://yourapp.com/webhook",
});
```

##### Poll Transaction Status

```typescript
const result = await checkoutService.pollTransactionStatus("NIWL1NZZ", {
  maxAttempts: 24,           // Check 24 times
  intervalMs: 5000,          // Every 5 seconds
  onStatusChange: (txn) => {
    console.log('Current status:', txn.status);
  },
});

if (result.status === 'SUCCESS') {
  console.log('Payment successful!', result.data);
}
```

##### Check Transaction Status (One-Time)

```typescript
const transaction = await checkoutService.checkTransactionStatus("NIWL1NZZ");
console.log('Status:', transaction.status);
```

##### Parse Webhook Payload

```typescript
const webhookPayload = checkoutService.parseWebhookPayload(req.body);

if (webhookPayload) {
  console.log('Transaction ID:', webhookPayload.transaction_id);
  console.log('Status:', webhookPayload.status);
  console.log('Amount:', webhookPayload.amount);
}
```

##### Get Receipt Data

```typescript
const receiptData = await checkoutService.verifyAndGetReceipt("NIWL1NZZ");

if (receiptData) {
  console.log('Amount:', receiptData.amount);
  console.log('Status:', receiptData.status);
  console.log('Payment Date:', receiptData.payment_date);
}
```

### 3. XcelWalletService

Service for direct wallet-to-wallet payments.

**Location:** `src/services/xcel-wallet.ts`

```typescript
import { XcelWalletService } from '@/src/services/xcel-wallet';

const walletService = new XcelWalletService(client);
```

#### Methods

##### Verify Account

```typescript
const account = await walletService.verifyAccount("237", "233429972");

if (account) {
  console.log('Wallet Number:', account.card_num);
  console.log('Account ID:', account.account_id);
}
```

##### Generate Dynamic Link

```typescript
const otpSid = await walletService.generateDynamicLink(
  "config_preset_id",
  "payer_account_id",
  "payee_account_id",
  1000
);

console.log('OTP SID:', otpSid);
```

##### Create Transaction

```typescript
const transaction = await walletService.createTransaction(
  "yFhi7ApMr",              // merchantId
  "237233429972",           // payerWalletNo
  "237233000000",           // posWalletNo
  `REF-${Date.now()}`,      // referenceId
  "1000",                   // amount
  "10",                     // fees
  [                         // products
    { product_id: "6RgglQWWO", amount: "1000" }
  ],
  { "6RgglQWWO": "10" },    // merchantFees
  {                         // options
    description: "Payment for electricity",
    merchantCountryCode: "237",
    payerCountryCode: "237",
    merchantCurrency: "XAF",
    payerCurrency: "XAF",
  }
);

console.log('Transaction ID:', transaction._id);
console.log('Paid:', transaction.paid);
```

##### Poll Payment Status

```typescript
const result = await walletService.pollPaymentStatus(
  "yFhi7ApMr",
  "REF-1234567890",
  {
    timeoutMs: 120000,     // 2 minutes
    onStatusChange: (txn) => {
      console.log('Paid:', txn.paid);
    },
  }
);

if (result.status === 'SUCCESS') {
  console.log('Payment completed!');
}
```

---

## API Reference

### Hooks

#### useCheckout

Complete payment checkout flow hook.

```typescript
import { useCheckout } from '@/src/hooks/use-xcel-paygate';

const {
  initiatePayment,
  checkStatus,
  reset,
  loading,
  error,
  paymentLink,
  paymentCode,
  transaction,
} = useCheckout(config);
```

**Parameters:**
- `config: XcelPayGateConfig` - SDK configuration

**Returns:**
- `initiatePayment(request)` - Generate payment link
- `checkStatus(code?)` - Check transaction status
- `reset()` - Reset hook state
- `loading: boolean` - Loading state
- `error: Error | null` - Error state
- `paymentLink: string | null` - Generated payment URL
- `paymentCode: string | null` - Payment code
- `transaction: TransactionData | null` - Transaction details

**Example:**
```typescript
const { initiatePayment, paymentLink } = useCheckout(config);

const handlePay = async () => {
  try {
    const response = await initiatePayment({
      amount: "1000",
      currency: "XAF",
      client_transaction_id: `TXN-${Date.now()}`,
      customer_email: "customer@example.com",
      customer_phone: "237233429972",
      description: "Electricity payment",
      channel: "MOBILE",
      redirect_url: "https://myapp.com/success",
      webhook_url: "https://myapp.com/webhook",
    });

    // Navigate to WebView
    router.push({
      pathname: '/payment-webview',
      params: {
        paymentLink: response.data.payment_link,
        paymentCode: response.data.payment_code,
        amount: "1000",
        currency: "XAF",
      },
    });
  } catch (err) {
    console.error('Payment failed:', err);
  }
};
```

#### usePaymentPolling

Automatic payment status polling.

```typescript
import { usePaymentPolling } from '@/src/hooks/use-xcel-paygate';

const { result, isPolling } = usePaymentPolling(
  config,
  paymentCode,
  {
    enabled: true,
    maxAttempts: 24,
    intervalMs: 5000,
    onSuccess: (result) => {
      console.log('Payment successful!', result);
      navigation.navigate('Success', { result });
    },
    onError: (error) => {
      console.error('Polling error:', error);
    },
    onStatusChange: (transaction) => {
      console.log('Status update:', transaction.status);
    },
  }
);
```

**Parameters:**
- `config: XcelPayGateConfig` - SDK configuration
- `paymentCode: string | null` - Payment code to poll
- `options: PollingOptions` - Polling configuration

**Polling Options:**
```typescript
interface PollingOptions {
  enabled?: boolean;          // Start polling (default: false)
  maxAttempts?: number;       // Max poll attempts (default: 24)
  intervalMs?: number;        // Poll interval (default: 5000)
  onSuccess?: (result) => void;
  onError?: (error) => void;
  onStatusChange?: (txn) => void;
}
```

**Returns:**
- `result: PaymentResult | null` - Final payment result
- `isPolling: boolean` - Polling active state

#### useXcelWallet

Wallet payment operations.

```typescript
import { useXcelWallet } from '@/src/hooks/use-xcel-paygate';

const {
  verifyAccount,
  createTransaction,
  checkPaymentStatus,
  loading,
  error,
} = useXcelWallet(config);
```

**Methods:**

1. **verifyAccount(countryCode, phoneNumber)**
   ```typescript
   const account = await verifyAccount("237", "233429972");
   ```

2. **createTransaction(...params)**
   ```typescript
   const txn = await createTransaction(
     merchantId,
     payerWallet,
     posWallet,
     referenceId,
     amount,
     fees,
     products,
     merchantFees
   );
   ```

3. **checkPaymentStatus(merchantId, referenceId)**
   ```typescript
   const status = await checkPaymentStatus("yFhi7ApMr", "REF-123");
   ```

---

## Payment Flows

### Flow 1: Checkout URL (Recommended)

Complete implementation with WebView and receipt.

```typescript
// 1. Payment Screen (app/index.tsx)
import { useCheckout } from '@/src/hooks/use-xcel-paygate';
import { useRouter } from 'expo-router';

function PaymentScreen() {
  const router = useRouter();
  const { initiatePayment, loading } = useCheckout(config);

  const [amount, setAmount] = useState('1000');
  const [email, setEmail] = useState('customer@example.com');
  const [phone, setPhone] = useState('237233429972');

  const handlePay = async () => {
    try {
      const response = await initiatePayment({
        amount,
        currency: "XAF",
        client_transaction_id: `TXN-${Date.now()}`,
        customer_email: email,
        customer_phone: phone,
        description: "Electricity bill payment",
        channel: "MOBILE",
        redirect_url: "https://yourapp.com/success",
        webhook_url: "https://yourapp.com/api/webhook",
        metadata: {
          user_id: "USER123",
          order_id: `ORD-${Date.now()}`,
        },
      });

      // Navigate to WebView
      router.push({
        pathname: '/payment-webview',
        params: {
          paymentLink: response.data.payment_link,
          paymentCode: response.data.payment_code,
          amount: amount,
          currency: "XAF",
          description: "Electricity bill payment",
        },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate payment');
    }
  };

  return (
    <View>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder="Amount"
        keyboardType="decimal-pad"
      />
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
      />
      <TextInput
        value={phone}
        onChangeText={setPhone}
        placeholder="Phone"
      />
      <Button
        title={loading ? "Processing..." : "Pay Now"}
        onPress={handlePay}
        disabled={loading}
      />
    </View>
  );
}
```

```typescript
// 2. WebView Screen (app/payment-webview.tsx)
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';

function PaymentWebViewScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const hasNavigatedRef = useRef(false);
  const successTimerRef = useRef(null);

  const navigateToReceipt = useCallback((status, transactionId) => {
    if (hasNavigatedRef.current) return;

    hasNavigatedRef.current = true;

    router.replace({
      pathname: '/payment-receipt',
      params: {
        transaction_id: transactionId,
        payment_code: params.paymentCode,
        status: status,
        amount: params.amount,
        currency: params.currency,
        payment_method: 'XcelPOS',
        payment_date: new Date().toISOString(),
      },
    });
  }, [params, router]);

  const handleWebViewMessage = useCallback((event) => {
    const data = JSON.parse(event.nativeEvent.data);

    if (data.type === 'payment_success') {
      // 15-second timer
      successTimerRef.current = setTimeout(() => {
        navigateToReceipt('SUCCESS', data.url);
      }, 15000);
    } else if (data.type === 'close_clicked') {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
      navigateToReceipt('FAILED', data.url);
    }
  }, [navigateToReceipt]);

  return (
    <WebView
      source={{ uri: params.paymentLink }}
      onMessage={handleWebViewMessage}
      injectedJavaScript={injectedJS}
    />
  );
}
```

```typescript
// 3. Receipt Screen (app/payment-receipt.tsx)
import { formatCurrency, getStatusColor } from '@/src/utils/payment-helpers';

function PaymentReceiptScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const receiptData = {
    transaction_id: params.transaction_id,
    status: params.status,
    amount: parseFloat(params.amount),
    currency: params.currency,
    payment_date: params.payment_date,
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        {/* Status Icon */}
        <StatusIcon status={receiptData.status} />

        {/* Title */}
        <Text style={[styles.title, { color: getStatusColor(receiptData.status) }]}>
          Payment {receiptData.status}
        </Text>

        {/* Amount */}
        <Text style={styles.amount}>
          {formatCurrency(receiptData.amount, receiptData.currency)}
        </Text>

        {/* Details */}
        <View style={styles.details}>
          <DetailRow label="Transaction ID" value={receiptData.transaction_id} />
          <DetailRow label="Date" value={receiptData.payment_date} />
          <DetailRow label="Status" value={receiptData.status} />
        </View>

        {/* Actions */}
        <Button title="Download Receipt" onPress={handleDownload} />
        <Button title="Close" onPress={() => router.replace('/')} />
      </View>
    </ScrollView>
  );
}
```

### Flow 2: XCEL Wallet Payment

Direct wallet-to-wallet payment flow.

```typescript
import { useXcelWallet } from '@/src/hooks/use-xcel-paygate';

function WalletPaymentScreen() {
  const { verifyAccount, createTransaction, checkPaymentStatus } = useXcelWallet(config);
  const [step, setStep] = useState(1);

  // Step 1: Verify customer account
  const handleVerify = async () => {
    const account = await verifyAccount("237", phoneNumber);

    if (!account) {
      Alert.alert('Error', 'Account not found');
      return;
    }

    setCustomerAccount(account);
    setStep(2);
  };

  // Step 2: Create transaction
  const handleCreateTransaction = async () => {
    const transaction = await createTransaction(
      config.merchantId,
      customerAccount.card_num,
      merchantWallet,
      `REF-${Date.now()}`,
      amount,
      "10",  // fees
      [{ product_id: selectedProduct.product_id, amount }],
      { [selectedProduct.product_id]: "10" }
    );

    setTransactionRef(transaction.external_reference);
    setStep(3);
  };

  // Step 3: Poll for payment
  const handlePollStatus = async () => {
    const result = await checkPaymentStatus(config.merchantId, transactionRef);

    if (result.paid) {
      Alert.alert('Success', 'Payment completed!');
      navigation.navigate('Receipt', { transaction: result });
    } else {
      setTimeout(handlePollStatus, 5000);
    }
  };

  return (
    <View>
      {step === 1 && <VerifyAccountForm onSubmit={handleVerify} />}
      {step === 2 && <PaymentForm onSubmit={handleCreateTransaction} />}
      {step === 3 && <PollingStatus onCheck={handlePollStatus} />}
    </View>
  );
}
```

### Flow 3: Product-Based Payment

Payment with merchant products (electricity, water, etc.).

```typescript
import { XcelPayGateClient } from '@/src/api/client';
import { useCheckout } from '@/src/hooks/use-xcel-paygate';

function ProductPaymentScreen() {
  const client = new XcelPayGateClient(config);
  const { initiatePayment } = useCheckout(config);

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await client.getMerchantProducts();
      const activeProducts = response.data.data.filter(
        p => p.active.status && p.web
      );
      setProducts(activeProducts);

      // Auto-select first product
      if (activeProducts.length > 0) {
        setSelectedProduct(activeProducts[0]);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const handlePay = async () => {
    if (!selectedProduct) {
      Alert.alert('Error', 'Please select a product');
      return;
    }

    try {
      const response = await initiatePayment({
        amount: amount,
        currency: "XAF",
        client_transaction_id: `TXN-${Date.now()}`,
        customer_email: email,
        customer_phone: phone,
        description: `Payment for ${selectedProduct.name}`,
        channel: "MOBILE",
        redirect_url: "https://yourapp.com/success",
        webhook_url: "https://yourapp.com/webhook",
        products: [
          {
            product_id: selectedProduct.product_id,
            amount: amount,
          }
        ],
        metadata: {
          product_name: selectedProduct.name,
          product_id: selectedProduct.product_id,
          payment_code: selectedProduct.payment_code,
        },
      });

      // Navigate to payment WebView
      router.push({
        pathname: '/payment-webview',
        params: {
          paymentLink: response.data.payment_link,
          paymentCode: response.data.payment_code,
          amount: amount,
          currency: "XAF",
          description: `Payment for ${selectedProduct.name}`,
        },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to create payment');
    }
  };

  return (
    <View>
      {/* Product Selector */}
      <Picker
        selectedValue={selectedProduct?.product_id}
        onValueChange={(itemValue) => {
          const product = products.find(p => p.product_id === itemValue);
          setSelectedProduct(product);
        }}
      >
        {products.map(product => (
          <Picker.Item
            key={product.product_id}
            label={product.name}
            value={product.product_id}
          />
        ))}
      </Picker>

      {/* Payment Form */}
      <TextInput
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Phone"
        value={phone}
        onChangeText={setPhone}
      />

      {/* Pay Button */}
      <Button
        title={`Pay ${amount} XAF for ${selectedProduct?.name || 'Product'}`}
        onPress={handlePay}
      />
    </View>
  );
}
```

---

## WebView Integration

### Injected JavaScript

The WebView monitors payment completion through injected JavaScript:

```javascript
const injectedJavaScript = `
  (function() {
    console.log('XcelPay WebView JavaScript injection started');

    // Monitor for close button clicks
    function monitorCloseButton() {
      const closeButtons = document.querySelectorAll('button, a, div');
      closeButtons.forEach(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        if (text.includes('close') || text.includes('cancel')) {
          btn.addEventListener('click', () => {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'close_clicked',
              url: window.location.href
            }));
          });
        }
      });
    }

    // Check payment status in DOM
    function checkPaymentStatus() {
      const bodyText = document.body?.innerText?.toLowerCase() || '';
      const title = document.title?.toLowerCase() || '';

      const successKeywords = [
        'payment successful',
        'transaction successful',
        'payment completed'
      ];
      const failureKeywords = [
        'payment failed',
        'transaction failed',
        'payment cancelled'
      ];
      const pendingKeywords = [
        'payment pending',
        'processing'
      ];

      const hasSuccess = successKeywords.some(kw =>
        bodyText.includes(kw) || title.includes(kw)
      );
      const hasFailure = failureKeywords.some(kw =>
        bodyText.includes(kw) || title.includes(kw)
      );
      const hasPending = pendingKeywords.some(kw =>
        bodyText.includes(kw) || title.includes(kw)
      );

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

    // Check on page load
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
```

### Message Handling

```typescript
const handleWebViewMessage = useCallback((event: WebViewMessageEvent) => {
  try {
    const data = JSON.parse(event.nativeEvent.data);
    console.log('WebView message:', data);

    switch (data.type) {
      case 'payment_success':
        // Start 15-second timer
        successTimerRef.current = setTimeout(() => {
          navigateToReceipt({
            status: 'SUCCESS',
            transaction_id: data.url,
          });
        }, 15000);
        break;

      case 'payment_failed':
        navigateToReceipt({
          status: 'FAILED',
          transaction_id: data.url,
        });
        break;

      case 'payment_pending':
        navigateToReceipt({
          status: 'PENDING',
          transaction_id: data.url,
        });
        break;

      case 'close_clicked':
        // Clear success timer and navigate to failed
        if (successTimerRef.current) {
          clearTimeout(successTimerRef.current);
        }
        navigateToReceipt({
          status: 'FAILED',
          transaction_id: data.url,
        });
        break;

      case 'dom_check':
        // Check text content for indicators
        if (data.bodyText) {
          if (hasSuccessText(data.bodyText)) {
            handleWebViewMessage({
              nativeEvent: {
                data: JSON.stringify({
                  type: 'payment_success',
                  url: data.url
                })
              }
            });
          } else if (hasFailureText(data.bodyText)) {
            navigateToReceipt({
              status: 'FAILED',
              transaction_id: data.url,
            });
          } else if (hasPendingText(data.bodyText)) {
            navigateToReceipt({
              status: 'PENDING',
              transaction_id: data.url,
            });
          }
        }
        break;
    }
  } catch (error) {
    console.error('Error parsing WebView message:', error);
  }
}, [navigateToReceipt]);
```

### Navigation State Monitoring

```typescript
const handleNavigationStateChange = useCallback((navState: WebViewNavigation) => {
  console.log('Navigation state changed:', navState.url);

  // Check URL for success/failure indicators
  if (isSuccessUrl(navState.url)) {
    console.log('Success URL detected!');
    handleWebViewMessage({
      nativeEvent: {
        data: JSON.stringify({
          type: 'payment_success',
          url: navState.url
        })
      },
    });
  } else if (isFailureUrl(navState.url)) {
    console.log('Failure URL detected!');
    navigateToReceipt({
      status: 'FAILED',
      transaction_id: navState.url,
    });
  }
}, [handleWebViewMessage, navigateToReceipt]);
```

---

## WebView Payment Status Detection

The SDK uses **client-side detection** in the WebView to determine payment status - no server-side webhooks required!

### How It Works

The payment flow detects status through:

1. **URL Monitoring**: Checks for success/failure/cancel URLs
2. **DOM Text Analysis**: Scans page content for status keywords
3. **Close Button Detection**: Tracks when user clicks close/cancel
4. **Auto-Navigation**: 15-second timer for successful payments

### Payment Status Detection Methods

#### Method 1: URL Pattern Matching

```typescript
// Success URLs
if (url.includes('success') ||
    url.includes('callback') ||
    url.includes('approved') ||
    url.includes('complete')) {
  // Navigate to SUCCESS receipt
}

// Failure URLs
if (url.includes('cancel') ||
    url.includes('failed') ||
    url.includes('error') ||
    url.includes('decline')) {
  // Navigate to FAILED receipt
}
```

#### Method 2: DOM Text Analysis

```typescript
// Success text indicators
const successKeywords = [
  'payment successful',
  'transaction successful',
  'payment completed',
  'payment approved'
];

// Failure text indicators
const failureKeywords = [
  'payment failed',
  'transaction failed',
  'payment cancelled',
  'payment declined'
];

// Pending text indicators
const pendingKeywords = [
  'payment pending',
  'processing payment',
  'transaction pending'
];
```

#### Method 3: Close Button Detection

```typescript
// Monitor close button clicks
function monitorCloseButton() {
  const closeButtons = document.querySelectorAll('button, a, div');
  closeButtons.forEach(btn => {
    const text = btn.textContent?.toLowerCase() || '';
    if (text.includes('close') || text.includes('cancel')) {
      btn.addEventListener('click', () => {
        // User closed payment modal
        // Navigate to FAILED receipt
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'close_clicked',
          url: window.location.href
        }));
      });
    }
  });
}
```

### Complete WebView Implementation

```typescript
// app/payment-webview.tsx
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function PaymentWebViewScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const successTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasNavigatedRef = useRef(false);

  const navigateToReceipt = useCallback((status: PaymentStatus) => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;

    // Clear timer
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
    }

    // Navigate to receipt with status
    router.replace({
      pathname: '/payment-receipt',
      params: {
        transaction_id: params.paymentCode || '',
        status: status,
        amount: params.amount || '0',
        currency: params.currency || 'XAF',
        payment_date: new Date().toISOString(),
      },
    });
  }, [params, router]);

  const handleWebViewMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('WebView message:', data.type);

      switch (data.type) {
        case 'payment_success':
          console.log('Payment success detected!');
          // Start 15-second timer
          successTimerRef.current = setTimeout(() => {
            console.log('Auto-navigating to success receipt');
            navigateToReceipt('SUCCESS');
          }, 15000);
          break;

        case 'close_clicked':
          console.log('Close button clicked - treating as failed');
          navigateToReceipt('FAILED');
          break;

        case 'payment_failed':
          console.log('Payment failed detected');
          navigateToReceipt('FAILED');
          break;

        case 'payment_pending':
          console.log('Payment pending detected');
          navigateToReceipt('PENDING');
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  }, [navigateToReceipt]);

  // Injected JavaScript monitors the payment page
  const injectedJavaScript = `
    (function() {
      console.log('Payment monitoring started');

      // Check for payment status indicators
      function checkPaymentStatus() {
        const bodyText = document.body?.innerText?.toLowerCase() || '';
        const title = document.title?.toLowerCase() || '';

        // Success detection
        const successKeywords = [
          'payment successful',
          'transaction successful',
          'payment completed'
        ];
        const hasSuccess = successKeywords.some(kw =>
          bodyText.includes(kw) || title.includes(kw)
        );

        // Failure detection
        const failureKeywords = [
          'payment failed',
          'transaction failed',
          'payment cancelled'
        ];
        const hasFailure = failureKeywords.some(kw =>
          bodyText.includes(kw) || title.includes(kw)
        );

        // Pending detection
        const pendingKeywords = ['payment pending', 'processing'];
        const hasPending = pendingKeywords.some(kw =>
          bodyText.includes(kw) || title.includes(kw)
        );

        // Send status to React Native
        if (hasSuccess) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'payment_success',
            url: window.location.href
          }));
        } else if (hasFailure) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'payment_failed',
            url: window.location.href
          }));
        } else if (hasPending) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'payment_pending',
            url: window.location.href
          }));
        }
      }

      // Monitor close button clicks
      function monitorCloseButton() {
        const buttons = document.querySelectorAll('button, a, div');
        buttons.forEach(btn => {
          const text = btn.textContent?.toLowerCase() || '';
          if (text.includes('close') || text.includes('cancel')) {
            btn.addEventListener('click', () => {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'close_clicked',
                url: window.location.href
              }));
            });
          }
        });
      }

      // Observe DOM changes
      const observer = new MutationObserver(() => {
        checkPaymentStatus();
        monitorCloseButton();
      });

      if (document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        checkPaymentStatus();
        monitorCloseButton();
      }

      // Check on page load
      window.addEventListener('load', () => {
        setTimeout(() => {
          checkPaymentStatus();
          monitorCloseButton();
        }, 1000);
      });

      true;
    })();
  `;

  return (
    <WebView
      source={{ uri: params.paymentLink as string }}
      onMessage={handleWebViewMessage}
      injectedJavaScript={injectedJavaScript}
      javaScriptEnabled={true}
      domStorageEnabled={true}
    />
  );
}
```

### Server-Side Polling (Optional)

If you want server-side verification, you can poll the transaction status:

```typescript
// Poll transaction status from your server
async function pollTransactionStatus(paymentCode: string) {
  const client = new XcelPayGateClient(config);

  for (let i = 0; i < 24; i++) {
    const transaction = await client.getTransactionData(paymentCode);

    if (transaction.data.status === 'SUCCESS') {
      // Update database
      await updateOrder(transaction.data.client_transaction_id, {
        status: 'paid',
        transaction_id: transaction.data.transaction_id,
      });
      break;
    } else if (transaction.data.status === 'FAILED') {
      // Mark as failed
      await updateOrder(transaction.data.client_transaction_id, {
        status: 'failed',
      });
      break;
    }

    // Wait 5 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}
```

### Background Polling (React Native)

```typescript
// Use polling hook for background status checking
const { result, isPolling } = usePaymentPolling(config, paymentCode, {
  enabled: true,
  maxAttempts: 24,
  intervalMs: 5000,
  onSuccess: (result) => {
    console.log('Payment confirmed!', result);
    // Update local state
    setPaymentStatus('SUCCESS');
  },
});
```

---

## Type Definitions

### Core Types

```typescript
// Configuration
export interface XcelPayGateConfig {
  merchantId: string;
  publicKey: string;
  baseUrl?: string;
}

// Payment Request
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
  customTxn?: CustomTransaction;
}

// Payment Product
export interface PaymentProduct {
  product_id: string;
  amount: string;
}

// Transaction Data
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

// Payment Status
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'PROCESSING';

// Payment Result
export interface PaymentResult {
  status: PaymentStatus;
  transaction_id?: string;
  payment_code?: string;
  message: string;
  data?: any;
}

// Webhook Payload
export interface WebhookPayload {
  transaction_id: string;
  client_transaction_id: string;
  payment_code: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  customer_email: string;
  customer_phone: string;
  description: string;
  payment_method?: string;
  paid_at?: string;
  metadata?: Record<string, any>;
  products?: PaymentProduct[];
}

// Receipt Data
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

// Merchant Product
export interface MerchantProduct {
  _id: string;
  product_id: string;
  name: string;
  wallet: string;
  card_num: string;
  scheme_code: string;
  country_code: string;
  type_code: string;
  level_code: string;
  organization_no: string;
  payment_code: string;
  merchant_id: string;
  callback: string;
  hide: boolean;
  pos: boolean;
  web: boolean;
  active: MerchantProductActive;
  account: MerchantProductAccount;
  bank: MerchantBank;
  fees: MerchantProductFees;
  ussd: boolean;
  channels: string[];
  product_type: string;
  charge_customer: boolean;
  default_product: boolean;
  created_at: string;
  updated_at: string;
}

// Custom Transaction Options
export interface CustomTransaction {
  editAmt?: boolean;
  minAmt?: number;
  maxAmt?: number;
  borderTheme?: string;
  receiptSxMsg?: string;
  receiptFeedbackPhone?: string;
  receiptFeedbackEmail?: string;
  payLinkExpiryInDays?: number;
  payLinkCanPayMultipleTimes?: boolean;
  displayPicture?: string;
  xtraCustomerInput?: CustomTransactionInput[];
}

export interface CustomTransactionInput {
  label: string;
  placeHolder: string;
  type: 'input' | 'select';
  options?: Array<{ k: string; v: string }>;
  required: boolean;
}
```

---

## Utilities

### Payment Helpers

**Location:** `src/utils/payment-helpers.ts`

#### Format Currency

```typescript
import { formatCurrency } from '@/src/utils/payment-helpers';

const formatted = formatCurrency(1000, 'XAF');
console.log(formatted); // "1,000.00 FCFA"
```

#### Format Date

```typescript
import { formatPaymentDate } from '@/src/utils/payment-helpers';

const formatted = formatPaymentDate(new Date());
console.log(formatted); // "Oct 21, 2025, 11:17 AM"
```

#### Get Status Color

```typescript
import { getStatusColor } from '@/src/utils/payment-helpers';

const color = getStatusColor('SUCCESS');
console.log(color); // "#4CAF50"
```

#### Get Status Text

```typescript
import { getStatusText } from '@/src/utils/payment-helpers';

const text = getStatusText('SUCCESS');
console.log(text); // "Success"
```

#### Get Status Message

```typescript
import { getStatusMessage } from '@/src/utils/payment-helpers';

const message = getStatusMessage('SUCCESS', 1000, 'XAF');
console.log(message); // "Your payment of 1,000.00 FCFA was successful"
```

#### URL Checking

```typescript
import { isSuccessUrl, isFailureUrl } from '@/src/utils/payment-helpers';

isSuccessUrl('https://paygate.xcelapp.com/success'); // true
isFailureUrl('https://paygate.xcelapp.com/cancel');  // true
```

#### Text Analysis

```typescript
import { hasSuccessText, hasFailureText, hasPendingText } from '@/src/utils/payment-helpers';

hasSuccessText('Payment successful! Thank you.'); // true
hasFailureText('Payment failed. Please try again.'); // true
hasPendingText('Your payment is pending.'); // true
```

#### Data Transformation

```typescript
import { transactionToReceipt, webhookToReceipt } from '@/src/utils/payment-helpers';

// Convert transaction to receipt
const receipt = transactionToReceipt(transactionData);

// Convert webhook to receipt
const receipt2 = webhookToReceipt(webhookPayload);
```

---

## Complete Examples

### Example 1: Simple Payment

```typescript
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { useCheckout } from '@/src/hooks/use-xcel-paygate';
import { useRouter } from 'expo-router';
import { getXcelConfig } from '@/src/config';

export default function SimplePayment() {
  const config = getXcelConfig();
  const router = useRouter();
  const { initiatePayment, loading } = useCheckout(config);

  const [amount, setAmount] = useState('1000');

  const handlePay = async () => {
    try {
      const response = await initiatePayment({
        amount,
        currency: 'XAF',
        client_transaction_id: `TXN-${Date.now()}`,
        customer_email: 'customer@example.com',
        customer_phone: '237233429972',
        description: 'Simple payment',
        channel: 'MOBILE',
        redirect_url: 'https://yourapp.com/success',
      });

      router.push({
        pathname: '/payment-webview',
        params: {
          paymentLink: response.data.payment_link,
          paymentCode: response.data.payment_code,
          amount,
          currency: 'XAF',
        },
      });
    } catch (error) {
      Alert.alert('Error', 'Payment failed');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder="Amount"
        keyboardType="decimal-pad"
        style={{ borderWidth: 1, padding: 10, marginBottom: 20 }}
      />
      <Button
        title={loading ? 'Processing...' : 'Pay Now'}
        onPress={handlePay}
        disabled={loading}
      />
    </View>
  );
}
```

### Example 2: Product Payment with Polling

```typescript
import React, { useState, useEffect } from 'react';
import { View, Button, Picker, Alert } from 'react-native';
import { useCheckout, usePaymentPolling } from '@/src/hooks/use-xcel-paygate';
import { XcelPayGateClient } from '@/src/api/client';
import { getXcelConfig } from '@/src/config';

export default function ProductPayment() {
  const config = getXcelConfig();
  const client = new XcelPayGateClient(config);
  const { initiatePayment, paymentCode } = useCheckout(config);

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [amount, setAmount] = useState('1000');

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const response = await client.getMerchantProducts();
    const active = response.data.data.filter(p => p.active.status && p.web);
    setProducts(active);
    if (active.length > 0) setSelectedProduct(active[0]);
  };

  // Poll payment status
  const { result, isPolling } = usePaymentPolling(config, paymentCode, {
    enabled: !!paymentCode,
    onSuccess: (result) => {
      Alert.alert('Success', 'Payment completed!');
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handlePay = async () => {
    const response = await initiatePayment({
      amount,
      currency: 'XAF',
      client_transaction_id: `TXN-${Date.now()}`,
      customer_email: 'customer@example.com',
      customer_phone: '237233429972',
      description: `Payment for ${selectedProduct.name}`,
      channel: 'MOBILE',
      redirect_url: 'https://yourapp.com/success',
      products: [{
        product_id: selectedProduct.product_id,
        amount,
      }],
    });

    // Payment link will be opened automatically
    // Polling will start automatically
  };

  return (
    <View style={{ padding: 20 }}>
      <Picker
        selectedValue={selectedProduct?.product_id}
        onValueChange={(value) => {
          const product = products.find(p => p.product_id === value);
          setSelectedProduct(product);
        }}
      >
        {products.map(p => (
          <Picker.Item key={p.product_id} label={p.name} value={p.product_id} />
        ))}
      </Picker>

      <Button
        title={isPolling ? 'Checking status...' : 'Pay Now'}
        onPress={handlePay}
        disabled={isPolling}
      />
    </View>
  );
}
```

### Example 3: Wallet Payment

```typescript
import React, { useState } from 'react';
import { View, TextInput, Button, Alert, Text } from 'react-native';
import { useXcelWallet } from '@/src/hooks/use-xcel-paygate';
import { getXcelConfig } from '@/src/config';

export default function WalletPayment() {
  const config = getXcelConfig();
  const { verifyAccount, createTransaction, checkPaymentStatus, loading } = useXcelWallet(config);

  const [phone, setPhone] = useState('233429972');
  const [amount, setAmount] = useState('1000');
  const [account, setAccount] = useState(null);
  const [transactionRef, setTransactionRef] = useState(null);
  const [step, setStep] = useState(1);

  const handleVerify = async () => {
    const acc = await verifyAccount('237', phone);
    if (!acc) {
      Alert.alert('Error', 'Account not found');
      return;
    }
    setAccount(acc);
    setStep(2);
  };

  const handlePay = async () => {
    const txn = await createTransaction(
      config.merchantId,
      account.card_num,
      'MERCHANT_WALLET',
      `REF-${Date.now()}`,
      amount,
      '10',
      [],
      {}
    );

    setTransactionRef(txn.external_reference);
    setStep(3);
    pollStatus();
  };

  const pollStatus = async () => {
    const status = await checkPaymentStatus(config.merchantId, transactionRef);
    if (status.paid) {
      Alert.alert('Success', 'Payment completed!');
    } else {
      setTimeout(pollStatus, 5000);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      {step === 1 && (
        <>
          <Text>Enter Phone Number</Text>
          <TextInput value={phone} onChangeText={setPhone} />
          <Button title="Verify" onPress={handleVerify} disabled={loading} />
        </>
      )}

      {step === 2 && (
        <>
          <Text>Account: {account.first_name} {account.last_name}</Text>
          <TextInput value={amount} onChangeText={setAmount} placeholder="Amount" />
          <Button title="Pay" onPress={handlePay} disabled={loading} />
        </>
      )}

      {step === 3 && (
        <Text>Checking payment status...</Text>
      )}
    </View>
  );
}
```

---

## Best Practices

### 1. Security

**✅ DO:**
- Use HTTPS for all webhook URLs
- Store credentials in environment variables
- Verify webhook signatures
- Validate all user inputs
- Use secure storage for sensitive data

**❌ DON'T:**
- Hardcode API keys in source code
- Expose sensitive data in logs
- Trust client-side payment verification alone
- Store payment details in plain text

### 2. Error Handling

```typescript
const handlePayment = async () => {
  try {
    const response = await initiatePayment(paymentRequest);
    // Success
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        Alert.alert('Session Expired', 'Please try again');
      } else if (error.message.includes('network')) {
        Alert.alert('Network Error', 'Check your connection');
      } else {
        Alert.alert('Error', error.message);
      }
    }
  }
};
```

### 3. Transaction ID Management

```typescript
// Generate unique transaction IDs
const generateTransactionId = () => {
  return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Store transaction IDs for reconciliation
const paymentRequest = {
  client_transaction_id: generateTransactionId(),
  metadata: {
    order_id: orderId,
    user_id: userId,
    timestamp: new Date().toISOString(),
  },
};
```

### 4. Testing

```typescript
// Use test credentials
const config = {
  merchantId: __DEV__ ? 'TEST_MERCHANT_ID' : process.env.XCEL_MERCHANT_ID,
  publicKey: __DEV__ ? 'TEST_PUBLIC_KEY' : process.env.XCEL_PUBLIC_KEY,
};

// Test different scenarios
describe('Payment Flow', () => {
  it('should generate payment link', async () => {
    const response = await client.generatePaymentLink(testRequest);
    expect(response.data.payment_link).toBeDefined();
  });

  it('should handle payment success', async () => {
    // Test success flow
  });

  it('should handle payment failure', async () => {
    // Test failure flow
  });
});
```

### 5. Logging

```typescript
// Structured logging
const logPayment = (event: string, data: any) => {
  console.log(JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data,
  }));
};

logPayment('payment_initiated', {
  amount,
  currency,
  transaction_id,
});
```

---

## Troubleshooting

### Common Issues

#### Issue 1: Payment link not working

**Symptoms:** Payment link opens but shows error

**Solutions:**
1. Verify merchant credentials are correct
2. Check payment link hasn't expired (24 hours default)
3. Ensure amount and currency are valid
4. Verify customer phone/email format

```typescript
// Debug payment link generation
const response = await client.generatePaymentLink(request);
console.log('Payment Link:', response.data.payment_link);
console.log('Expires At:', response.data.expires_at);
```

#### Issue 2: WebView not detecting payment status

**Symptoms:** WebView doesn't navigate to receipt after payment

**Solutions:**
1. Check injected JavaScript is loading
2. Verify WebView has JavaScript enabled
3. Check console logs for WebView messages
4. Ensure success/failure keywords match

```typescript
// Add debug logging
const handleWebViewMessage = (event) => {
  console.log('WebView message:', event.nativeEvent.data);
  // Process message
};
```

#### Issue 3: Webhook not receiving callbacks

**Symptoms:** Server doesn't receive webhook notifications

**Solutions:**
1. Verify webhook URL is publicly accessible
2. Check webhook URL uses HTTPS
3. Test webhook endpoint with curl
4. Review server logs for incoming requests

```bash
# Test webhook endpoint
curl -X POST https://yourapp.com/api/webhooks/xcel \
  -H "Content-Type: application/json" \
  -d '{"transaction_id":"TEST","status":"SUCCESS","amount":1000}'
```

#### Issue 4: Products not loading

**Symptoms:** getMerchantProducts returns empty array

**Solutions:**
1. Verify merchant has products configured
2. Check products are marked as active
3. Ensure products have web:true flag
4. Verify API credentials

```typescript
const response = await client.getMerchantProducts();
console.log('Total products:', response.data.data.length);
console.log('Active products:', response.data.data.filter(p => p.active.status).length);
console.log('Web-enabled:', response.data.data.filter(p => p.web).length);
```

#### Issue 5: Transaction stuck in PENDING

**Symptoms:** Payment status never changes from PENDING

**Solutions:**
1. Check customer completed payment
2. Verify payment wasn't cancelled
3. Check transaction expiry time
4. Contact XCEL support for transaction status

```typescript
// Manual status check
const transaction = await client.getTransactionData(paymentCode);
console.log('Current status:', transaction.data.status);
console.log('Updated at:', transaction.data.updatedAt);
console.log('Expires at:', transaction.data.expires_at);
```

---

## Production Checklist

### Pre-Launch

- [ ] Switch to production credentials
- [ ] Set up webhook endpoint with HTTPS
- [ ] Implement webhook signature verification
- [ ] Add comprehensive error logging
- [ ] Test all payment flows (success, failure, pending)
- [ ] Test with different products
- [ ] Test with different currencies
- [ ] Verify receipt generation
- [ ] Test webhook reliability
- [ ] Set up monitoring and alerts

### Environment Variables

```bash
# .env.production
XCEL_MERCHANT_ID=your_merchant_id
XCEL_PUBLIC_KEY=your_public_key
XCEL_WEBHOOK_SECRET=your_webhook_secret
XCEL_API_URL=https://api.xcelapp.com
```

### Monitoring

```typescript
// Track key metrics
const metrics = {
  payment_initiated: 0,
  payment_success: 0,
  payment_failed: 0,
  payment_pending: 0,
  webhook_received: 0,
  webhook_failed: 0,
};

// Log to analytics service
analytics.track('payment_initiated', {
  amount,
  currency,
  product_id,
});
```

### Backup & Recovery

```typescript
// Store transaction details locally
const storeTransaction = async (transaction) => {
  await AsyncStorage.setItem(
    `txn_${transaction.transaction_id}`,
    JSON.stringify(transaction)
  );
};

// Recover pending transactions
const recoverPendingTransactions = async () => {
  const keys = await AsyncStorage.getAllKeys();
  const txnKeys = keys.filter(k => k.startsWith('txn_'));

  for (const key of txnKeys) {
    const txn = JSON.parse(await AsyncStorage.getItem(key));
    if (txn.status === 'PENDING') {
      await verifyTransaction(txn.payment_code);
    }
  }
};
```

---

## API Endpoints Reference

### Base URLs

- **Production API:** `https://api.xcelapp.com`
- **PayGate URL:** `https://paygate.xcelapp.com`

### Endpoints

#### 1. Generate Payment Link

```
POST /transactions-service/paygate/generate-payment-link
```

**Headers:**
```json
{
  "Content-Type": "application/json",
  "x-merchant-id": "YOUR_MERCHANT_ID",
  "x-public-key": "YOUR_PUBLIC_KEY"
}
```

**Request:**
```json
{
  "amount": "1000",
  "currency": "XAF",
  "client_transaction_id": "TXN-1729585466123",
  "customer_email": "customer@example.com",
  "customer_phone": "237233429972",
  "description": "Payment for electricity",
  "channel": "MOBILE",
  "redirect_url": "https://yourapp.com/success",
  "webhook_url": "https://yourapp.com/webhook",
  "products": [
    {
      "product_id": "6RgglQWWO",
      "amount": "1000"
    }
  ]
}
```

**Response:**
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

#### 2. Get Transaction Data

```
GET /transactions-service/paygate/get-transaction-data/{payment_code}
```

**Headers:** Same as above

**Response:**
```json
{
  "status": "SUCCESS",
  "data": {
    "transaction_id": "67160d0a2a49e8e7e3cc73d1",
    "payment_code": "NIWL1NZZ",
    "status": "PENDING",
    "amount": 1000,
    "currency": "XAF"
  }
}
```

#### 3. Get Merchant Details

```
GET /business-api/merchant/details/{merchant_id}
```

#### 4. Get Merchant Products

```
GET /business-api/merchant/products/{merchant_id}
```

#### 5. Verify XCEL Account

```
GET /xas/v1/accounts/users/{country_code}/{phone_number}
```

#### 6. Create XCEL Transaction

```
POST /xas/v1/pos/create_transaction
```

---

## Support & Resources

- **Documentation:** [XCEL API Docs](https://api.xcelapp.com/docs)
- **Business Portal:** [business.xcelapp.com](https://business.xcelapp.com)
- **GitHub Repository:** [Your SDK Repo]
- **Support Email:** support@xcelapp.com

---

**License:** MIT
**Version:** 1.0.0
**Last Updated:** October 21, 2025
