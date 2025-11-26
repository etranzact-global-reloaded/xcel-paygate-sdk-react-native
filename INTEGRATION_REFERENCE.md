# XCEL PayGate SDK - Integration Reference

**Complete documentation of endpoints, credentials, and integration process**

---

## Table of Contents

1. [Credentials & Configuration](#credentials--configuration)
2. [API Endpoints](#api-endpoints)
3. [Integration Patterns](#integration-patterns)
4. [Payment Flow](#payment-flow)
5. [Code Examples](#code-examples)
6. [Testing & Debugging](#testing--debugging)

---

## Credentials & Configuration

### Environment Variables

Located in `.env` file:

```bash
# Merchant ID (required)
EXPO_PUBLIC_XCEL_MERCHANT_ID=yFhi7ApMr

# Public Key (required) - LIVE or TEST key
EXPO_PUBLIC_XCEL_PUBLIC_KEY=XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205

# Optional: Override base URL for testing
EXPO_PUBLIC_XCEL_BASE_URL=https://api.xcelapp.com
```

### Configuration Setup

**Method 1: Using `getXcelConfig()` (Standalone)**
```typescript
import { getXcelConfig } from '@/src/config';

const config = getXcelConfig();
// Returns: { merchantId, publicKey, baseUrl? }
```

**Method 2: Using Provider Pattern**
```typescript
import { XcelPayGateProvider } from '@/src';

<XcelPayGateProvider
  config={{
    merchantId: process.env.EXPO_PUBLIC_XCEL_MERCHANT_ID || '',
    publicKey: process.env.EXPO_PUBLIC_XCEL_PUBLIC_KEY || '',
    baseUrl: process.env.EXPO_PUBLIC_XCEL_BASE_URL, // Optional
  }}
>
  {/* Your app */}
</XcelPayGateProvider>
```

---

## API Endpoints

### Base URL
```
Production: https://api.xcelapp.com
```

### 1. Get Merchant Details

**Endpoint:** `GET /v1/merchant/{merchantId}`

**Headers:**
```
Authorization: Bearer {publicKey}
Content-Type: application/json
```

**Response:**
```typescript
{
  status: "success",
  data: {
    data: {
      merchant_id: "yFhi7ApMr",
      reg_name: "Your Business Name",
      email: "business@example.com",
      phone: "237233429972",
      // ... other merchant details
    }
  }
}
```

**Implementation:**
```typescript
const client = new XcelPayGateClient(config);
const merchantDetails = await client.getMerchantDetails();
```

---

### 2. Get Merchant Products

**Endpoint:** `GET /v1/merchant/{merchantId}/products`

**Headers:**
```
Authorization: Bearer {publicKey}
Content-Type: application/json
```

**Response:**
```typescript
{
  status: "success",
  data: {
    data: [
      {
        product_id: "prod_123",
        name: "PREPAID ELECTRICITY",
        payment_code: "ENEO_PREPAID",
        active: {
          status: true,
          web: true,
          mobile: true
        },
        category: "UTILITY",
        // ... other product details
      }
    ]
  }
}
```

**Implementation:**
```typescript
const productsResponse = await client.getMerchantProducts();
const products = productsResponse.data.data;
```

---

### 3. Generate Payment Link

**Endpoint:** `POST /v1/merchant/{merchantId}/generate-payment-link`

**Headers:**
```
Authorization: Bearer {publicKey}
Content-Type: application/json
```

**Request Body:**
```typescript
{
  amount: "1000",              // Required: Amount in XAF
  currency: "XAF",             // Required: Currency code
  client_transaction_id: "TXN-1731456789000", // Required: Unique transaction ID
  customer_email: "customer@example.com",     // Optional
  customer_phone: "237233429972",             // Optional (Cameroon format)
  description: "Payment for electricity bill", // Optional
  channel: "WEB",              // Required: WEB | MOBILE | USSD
  products: [                  // Optional: Product array
    {
      product_id: "prod_123",
      amount: "1000"
    }
  ],
  metadata: {                  // Optional: Custom metadata
    cart_id: "CART1731456789000",
    product_id: "prod_123"
  },
  redirect_url: "https://business.xcelapp.com/#/auth", // Required
  webhook_url: "https://merchant.example.com/webhook"  // Optional
}
```

**Response:**
```typescript
{
  status: "success",
  data: {
    payment_link: "https://pay.xcelapp.com/payment/ABC123XYZ456",
    payment_code: "ABC123XYZ456",
    transaction_id: "txn_1234567890",
    expires_at: "2025-11-13T10:30:00Z"
  }
}
```

**Implementation:**
```typescript
const { initiatePayment } = useCheckout(config);

const response = await initiatePayment({
  amount: "1000",
  currency: "XAF",
  client_transaction_id: `TXN-${Date.now()}`,
  customer_email: "customer@example.com",
  customer_phone: "237233429972",
  description: "Payment for electricity bill",
  channel: "WEB",
  products: [{ product_id: "prod_123", amount: "1000" }],
  metadata: { cart_id: `CART${Date.now()}` },
  redirect_url: "https://business.xcelapp.com/#/auth",
  webhook_url: "https://merchant.example.com/webhook"
});

const paymentLink = response.data.payment_link;
const paymentCode = response.data.payment_code;
```

---

### 4. Check Transaction Status

**Endpoint:** `GET /v1/merchant/{merchantId}/transaction/{paymentCode}`

**Headers:**
```
Authorization: Bearer {publicKey}
Content-Type: application/json
```

**Response:**
```typescript
{
  status: "success",
  data: {
    transaction_id: "txn_1234567890",
    payment_code: "ABC123XYZ456",
    status: "SUCCESS" | "PENDING" | "FAILED" | "PROCESSING",
    amount: 1000,
    currency: "XAF",
    customer_email: "customer@example.com",
    customer_phone: "237233429972",
    description: "Payment for electricity bill",
    products: [...],
    metadata: {...},
    createdAt: "2025-11-13T09:00:00Z",
    updatedAt: "2025-11-13T09:05:00Z"
  }
}
```

**Implementation:**
```typescript
const { checkStatus } = useCheckout(config);

const transaction = await checkStatus(paymentCode);
console.log(transaction.status); // SUCCESS, PENDING, FAILED, PROCESSING
```

---

### 5. Get Wallet Balance

**Endpoint:** `GET /v1/merchant/{merchantId}/wallet/balance`

**Headers:**
```
Authorization: Bearer {publicKey}
Content-Type: application/json
```

**Response:**
```typescript
{
  status: "success",
  data: {
    balance: 50000,
    currency: "XAF",
    available_balance: 45000,
    pending_balance: 5000,
    last_updated: "2025-11-13T09:00:00Z"
  }
}
```

**Implementation:**
```typescript
const { wallet } = useXcelPayGate(config);
const balance = await wallet.getBalance();
```

---

## Integration Patterns

### Pattern 1: Standalone (No Provider)

**File:** `app/index.tsx`

```typescript
import { getXcelConfig } from '@/src/config';
import { useCheckout, usePaymentPolling } from '@/src/hooks/use-xcel-paygate';

export default function PaymentScreen() {
  const config = getXcelConfig();

  const { initiatePayment, checkStatus, loading, error, paymentLink, paymentCode }
    = useCheckout(config);

  const { result, isPolling } = usePaymentPolling(config, paymentCode, {
    enabled: false,
    maxAttempts: 24,
    intervalMs: 5000,
  });

  // Use hooks normally...
}
```

**Pros:**
- Simple and direct
- No wrapper needed
- Good for single payment screen

**Cons:**
- Need to pass config to each hook
- Repeated config loading

---

### Pattern 2: Provider Pattern

**File:** `app/_layout.tsx`

```typescript
import { XcelPayGateProvider } from '@/src';

export default function RootLayout() {
  return (
    <XcelPayGateProvider
      config={{
        merchantId: process.env.EXPO_PUBLIC_XCEL_MERCHANT_ID || '',
        publicKey: process.env.EXPO_PUBLIC_XCEL_PUBLIC_KEY || '',
      }}
    >
      {/* Your app screens */}
    </XcelPayGateProvider>
  );
}
```

**File:** `app/index.tsx`

```typescript
// No config needed - hooks use context
import { useCheckout } from '@/src/hooks/use-xcel-paygate';

export default function PaymentScreen() {
  const { initiatePayment, checkStatus } = useCheckout();
  // Config is automatically provided by context
}
```

**Pros:**
- Config set once at app root
- Cleaner hook usage
- Good for multiple payment screens

**Cons:**
- Additional wrapper component
- Slightly more complex setup

---

## Payment Flow

### Complete Payment Flow Diagram

```
1. User enters payment details
   ↓
2. Call initiatePayment() → Generate Payment Link
   ↓
3. Navigate to WebView with payment link
   ↓
4. User completes payment on XCEL platform
   ↓
5. XCEL redirects back to your app
   ↓
6. Parse URL parameters for payment status
   ↓
7. Call checkStatus() to verify transaction
   ↓
8. Show receipt/success screen
```

### Step-by-Step Implementation

#### Step 1: Initiate Payment

```typescript
const handleInitiatePayment = async () => {
  try {
    const response = await initiatePayment({
      amount: "1000",
      currency: "XAF",
      client_transaction_id: `TXN-${Date.now()}`,
      customer_email: email,
      customer_phone: phone,
      description: description,
      channel: "WEB",
      products: [{ product_id: selectedProductId, amount: "1000" }],
      metadata: { cart_id: `CART${Date.now()}` },
      redirect_url: "https://business.xcelapp.com/#/auth",
      webhook_url: "https://merchant.example.com/webhook",
    });

    const paymentLink = response.data.payment_link;
    const paymentCode = response.data.payment_code;

    // Navigate to WebView
    router.push({
      pathname: "/payment-webview",
      params: { paymentLink, paymentCode, amount, currency: "XAF" }
    });
  } catch (error) {
    console.error("Payment Error:", error);
  }
};
```

#### Step 2: Display Payment WebView

**File:** `app/payment-webview.tsx`

```typescript
import { WebView } from 'react-native-webview';

export default function PaymentWebView() {
  const { paymentLink, paymentCode } = useLocalSearchParams();

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const { url } = navState;

    // Check for success/failure in URL
    if (url.includes('success') || url.includes('completed')) {
      // Payment successful
      router.replace({
        pathname: '/payment-receipt',
        params: { paymentCode, status: 'SUCCESS' }
      });
    } else if (url.includes('failed') || url.includes('cancel')) {
      // Payment failed
      router.replace({
        pathname: '/payment-receipt',
        params: { paymentCode, status: 'FAILED' }
      });
    }
  };

  return (
    <WebView
      source={{ uri: paymentLink }}
      onNavigationStateChange={handleNavigationStateChange}
    />
  );
}
```

#### Step 3: Verify Transaction Status

```typescript
const handleCheckStatus = async () => {
  try {
    const transaction = await checkStatus(paymentCode);

    if (transaction.status === 'SUCCESS') {
      console.log('Payment successful!');
      // Show receipt
    } else if (transaction.status === 'FAILED') {
      console.log('Payment failed');
      // Show error
    } else {
      console.log('Payment still pending');
      // Show pending state
    }
  } catch (error) {
    console.error("Status check error:", error);
  }
};
```

---

## Code Examples

### Complete Payment Screen Example

```typescript
import { useState } from 'react';
import { View, TextInput, Pressable, Text } from 'react-native';
import { useCheckout } from '@/src/hooks/use-xcel-paygate';
import { getXcelConfig } from '@/src/config';

export default function PaymentScreen() {
  const config = getXcelConfig();
  const [amount, setAmount] = useState("1000");
  const [email, setEmail] = useState("customer@example.com");
  const [phone, setPhone] = useState("237233429972");

  const { initiatePayment, loading, error } = useCheckout(config);

  const handlePay = async () => {
    const response = await initiatePayment({
      amount,
      currency: "XAF",
      client_transaction_id: `TXN-${Date.now()}`,
      customer_email: email,
      customer_phone: phone,
      channel: "WEB",
      redirect_url: "https://business.xcelapp.com/#/auth",
    });

    // Navigate to WebView with payment link
    const paymentLink = response.data.payment_link;
    // ... navigation logic
  };

  return (
    <View>
      <TextInput value={amount} onChangeText={setAmount} placeholder="Amount" />
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" />
      <TextInput value={phone} onChangeText={setPhone} placeholder="Phone" />

      <Pressable onPress={handlePay} disabled={loading}>
        <Text>{loading ? 'Processing...' : 'Pay Now'}</Text>
      </Pressable>

      {error && <Text>Error: {error.message}</Text>}
    </View>
  );
}
```

### Payment Polling Example

```typescript
const { result, isPolling } = usePaymentPolling(config, paymentCode, {
  enabled: true,           // Start polling automatically
  maxAttempts: 24,        // Poll 24 times max
  intervalMs: 5000,       // Poll every 5 seconds
});

useEffect(() => {
  if (result?.status === 'SUCCESS') {
    console.log('Payment confirmed via polling!');
    // Show success screen
  }
}, [result]);
```

### Merchant Products Example

```typescript
import { XcelPayGateClient } from '@/src/api/client';

const client = new XcelPayGateClient(config);

// Fetch products
const productsResponse = await client.getMerchantProducts();
const products = productsResponse.data.data;

// Filter active web products
const activeProducts = products.filter(p => p.active.status && p.web);

// Use in payment
const selectedProduct = activeProducts[0];
await initiatePayment({
  amount: "1000",
  products: [
    {
      product_id: selectedProduct.product_id,
      amount: "1000"
    }
  ],
  // ... other params
});
```

---

## Testing & Debugging

### Enable Debug Logging

The SDK includes console logs for debugging. Look for these log groups:

```
=== Fetching Merchant Details ===
=== Fetching Merchant Products ===
=== Initiating Payment ===
=== Checking Transaction Status ===
```

### Test Credentials

**Current Test Credentials:**
- Merchant ID: `yFhi7ApMr`
- Public Key: `XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205`

**Get your own credentials:**
Visit [https://business.xcelapp.com/](https://business.xcelapp.com/)

### Common Issues & Solutions

#### Issue 1: "Missing required environment variables"

**Solution:**
```bash
# Ensure .env file exists with:
EXPO_PUBLIC_XCEL_MERCHANT_ID=yFhi7ApMr
EXPO_PUBLIC_XCEL_PUBLIC_KEY=XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205
```

#### Issue 2: "Unauthorized" error

**Solution:**
- Check that public key is correct
- Verify merchantId matches the key
- Ensure Authorization header format: `Bearer {publicKey}`

#### Issue 3: Payment link not loading

**Solution:**
- Verify redirect_url is valid
- Check that amount is a string, not number
- Ensure client_transaction_id is unique

#### Issue 4: Transaction status always PENDING

**Solution:**
- Wait for payment completion on XCEL platform
- Check webhook_url is accessible (if provided)
- Use polling or manual status check

### Testing Payment Flow

1. **Start dev server:**
```bash
npm run ios  # or npm run android
```

2. **Test payment:**
- Enter test amount (e.g., 1000 XAF)
- Enter email and phone
- Click "Generate Payment Link"
- Complete payment on XCEL platform

3. **Verify transaction:**
- Check console logs for payment_code
- Use "Check Status Manually" button
- Verify transaction status

### Network Debugging

Monitor API calls in console:

```
=== API Request ===
URL: https://api.xcelapp.com/v1/merchant/yFhi7ApMr/generate-payment-link
Method: POST
Headers: { Authorization: "Bearer XCLPUBK_..." }

=== API Response ===
Status: 200
Data: { payment_link: "...", payment_code: "..." }
```

---

## Payment Status Reference

| Status | Description | Next Action |
|--------|-------------|-------------|
| `PENDING` | Payment not yet completed | Wait or poll status |
| `PROCESSING` | Payment being processed | Wait for final status |
| `SUCCESS` | Payment successful | Show receipt |
| `FAILED` | Payment failed | Show error, allow retry |

---

## URL Formats

### Payment Link Format
```
https://pay.xcelapp.com/payment/{paymentCode}
```

### Redirect URL Formats

**Success:**
```
https://business.xcelapp.com/#/auth?payment_code=ABC123&status=SUCCESS
```

**Failed:**
```
https://business.xcelapp.com/#/auth?payment_code=ABC123&status=FAILED
```

### Webhook Payload

When payment completes, XCEL sends POST to your webhook_url:

```typescript
{
  event: "payment.success" | "payment.failed",
  transaction_id: "txn_1234567890",
  payment_code: "ABC123XYZ456",
  status: "SUCCESS" | "FAILED",
  amount: 1000,
  currency: "XAF",
  customer_email: "customer@example.com",
  customer_phone: "237233429972",
  metadata: {...},
  paid_at: "2025-11-13T09:05:00Z"
}
```

---

## SDK Exports Reference

### Main Exports

```typescript
// API Client
export { XcelPayGateClient } from './api/client';

// Services
export { CheckoutService } from './services/checkout';
export { XcelWalletService } from './services/xcel-wallet';

// Hooks
export {
  useXcelPayGate,
  useCheckout,
  usePaymentPolling,
  useXcelWallet,
} from './hooks/use-xcel-paygate';

// Config
export { XCEL_CONFIG, getXcelConfig } from './config';

// Context (for Provider pattern)
export { XcelPayGateProvider, useXcelPayGateContext } from './context/xcel-paygate-context';

// Utilities
export {
  formatPaymentDate,
  formatCurrency,
  parsePaymentCompletionUrl,
  formatTransactionReceipt,
  isPaymentSuccessUrl,
  isPaymentFailureUrl,
} from './utils/payment-completion';

// Types
export type {
  XcelPayGateConfig,
  PaymentRequest,
  TransactionData,
  PaymentStatus,
  PaymentReceiptData,
  MerchantProduct,
  WebhookPayload,
} from './types';
```

---

## Support & Resources

- **Business Dashboard:** [https://business.xcelapp.com/](https://business.xcelapp.com/)
- **API Documentation:** Contact XCEL support
- **SDK Issues:** Check logs and error messages
- **Integration Help:** Refer to this document

---

**Last Updated:** November 13, 2025
**SDK Version:** 1.0.0
**Author:** XCEL PayGate Team
