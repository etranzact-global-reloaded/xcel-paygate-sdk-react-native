# XCEL PayGate SDK

Official React Native SDK for integrating XCEL PayGate payment solutions into your mobile applications.

## Features

### Core SDK (Always Available)
- ✅ **Payment Link Generation** - Create payment links via API
- ✅ **Transaction Status** - Check payment status by code
- ✅ **XCEL Wallet Payments** - Direct wallet-to-wallet transactions
- ✅ **Merchant Products** - Fetch and manage merchant products
- ✅ **TypeScript Support** - Full type definitions included
- ✅ **React Hooks** - Easy-to-use hooks for payment flows
- ✅ **Provider Pattern** - Configure once, use everywhere

### Optional Helpers (Use If Needed)
- 🔧 **Payment Completion Hook** - Auto-handle WebView navigation
- 🔧 **Receipt Generation** - Format transaction data as receipts
- 🔧 **URL Parsing Utilities** - Extract payment data from redirect URLs
- 🔧 **Payment Polling** - Automatic payment status checking

> **Note:** The WebView interaction and payment completion handling are **completely optional**. Use them if they fit your use case, or build your own solution!

## Installation

```bash
npm install @xcelapp/paygate-sdk
# or
yarn add @xcelapp/paygate-sdk
```

## Live Example

Want to see the SDK in action? Check out the `example` branch:

```bash
git clone https://github.com/xcelapp/paygate-sdk
cd paygate-sdk
git checkout example
npm install
npm start
```

This runs a full Expo app demonstrating:
- ✅ Payment link generation
- ✅ WebView integration
- ✅ Receipt display
- ✅ Provider pattern usage
- ✅ All SDK features

See [DEVELOPMENT.md](DEVELOPMENT.md) for details.

## Quick Start

### 1. Wrap Your App with Provider (Recommended)

Get your credentials from the [XCEL Business Portal](https://business.xcelapp.com/) and wrap your app:

```typescript
import { XcelPayGateProvider } from '@xcelapp/paygate-sdk';

function App() {
  return (
    <XcelPayGateProvider
      config={{
        merchantId: process.env.EXPO_PUBLIC_XCEL_MERCHANT_ID,
        publicKey: process.env.EXPO_PUBLIC_XCEL_PUBLIC_KEY,
      }}
    >
      <YourApp />
    </XcelPayGateProvider>
  );
}
```

### 2. Use Hooks Anywhere in Your App

Now you can use hooks without passing config every time:

```typescript
import { useCheckout } from '@xcelapp/paygate-sdk';

function PaymentScreen() {
  // No need to pass config - it's provided by the Provider!
  const { initiatePayment, paymentLink, paymentCode, loading } = useCheckout();

  const handlePay = async () => {
    const response = await initiatePayment({
      amount: "10.00",
      currency: "GHS",
      client_transaction_id: `txn-${Date.now()}`,
      customer_email: "customer@example.com",
      customer_phone: "233244000000",
      description: "Payment for Order #123",
      channel: "MOBILE",
      redirect_url: "https://your-app.com/redirect",
      webhook_url: "https://your-app.com/webhook",
      metadata: { order_id: "123" },
    });

    // Open the payment link
    Linking.openURL(paymentLink);
  };

  return <Button onPress={handlePay} title="Pay Now" />;
}
```

### 3. Monitor Payment Status

Automatically poll for payment status updates:

```typescript
import { usePaymentPolling } from '@xcelapp/paygate-sdk';

const { result, isPolling } = usePaymentPolling(paymentCode, {
  enabled: true,
  maxAttempts: 24,
  intervalMs: 5000,
  onSuccess: (result) => {
    console.log("Payment completed!", result);
  },
  onStatusChange: (transaction) => {
    console.log("Status:", transaction.status);
  },
});
```

## Usage Patterns

The SDK supports two usage patterns:

### Pattern 1: Provider Pattern (Recommended)

Configure once at the app level:

```typescript
// App.tsx
import { XcelPayGateProvider } from '@xcelapp/paygate-sdk';

export default function App() {
  return (
    <XcelPayGateProvider config={{ merchantId: '...', publicKey: '...' }}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Payment" component={PaymentScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </XcelPayGateProvider>
  );
}

// PaymentScreen.tsx
import { useCheckout } from '@xcelapp/paygate-sdk';

function PaymentScreen() {
  const { initiatePayment, loading } = useCheckout();
  // Use anywhere without passing config!
}
```

### Pattern 2: Standalone (Without Provider)

Pass config directly to hooks when needed:

```typescript
import { useCheckout } from '@xcelapp/paygate-sdk';

function PaymentScreen() {
  const config = {
    merchantId: 'YOUR_MERCHANT_ID',
    publicKey: 'YOUR_PUBLIC_KEY',
  };

  const { initiatePayment, loading } = useCheckout(config);
  // Config passed directly
}
```

## Payment Completion & Receipt Handling (Optional)

**Note:** This section is completely **optional**. The core SDK only handles payment initiation and status checking. How you handle the WebView, completion callbacks, and receipts is entirely up to your use case.

### Quick Decision Guide:

| Approach | Best For | SDK Provides | You Handle |
|----------|----------|--------------|------------|
| **Option 1: Minimal** | Custom backend integration | Payment link generation | Everything after WebView opens |
| **Option 2: SDK Helpers** | Quick setup, no backend | Link + completion + receipt | Just UI rendering |
| **Option 3: Mix & Match** | Partial automation | Link + parsing utilities | Custom flow logic |

Choose based on your needs:

---

### Option 1: Minimal Approach (No SDK Helpers)

Handle everything yourself - SDK just generates the payment link:

```typescript
import { useCheckout } from '@xcelapp/paygate-sdk';
import { WebView } from 'react-native-webview';

function PaymentScreen() {
  const { initiatePayment, paymentLink } = useCheckout();
  const [showWebView, setShowWebView] = useState(false);

  const handlePay = async () => {
    await initiatePayment({
      amount: '5000',
      currency: 'XAF',
      // ... other fields
      redirect_url: 'myapp://payment-complete', // Your own deep link
      webhook_url: 'https://yourapi.com/webhook', // Your backend handles this
    });

    setShowWebView(true);
  };

  if (showWebView && paymentLink) {
    return (
      <WebView
        source={{ uri: paymentLink }}
        onNavigationStateChange={(navState) => {
          // Handle however you want
          if (navState.url.includes('payment-complete')) {
            // Your custom logic here
            setShowWebView(false);
            navigation.navigate('ThankYou');
          }
        }}
      />
    );
  }

  return <Button title="Pay Now" onPress={handlePay} />;
}

// Your backend webhook receives the actual payment status
// You poll your own backend or use push notifications
```

**When to use:**
- You have your own backend handling webhooks
- You want full control over the UI/UX
- You're using your own deep linking strategy
- You don't need receipt generation in the app

---

### Option 2: Using SDK Helpers (Quick Setup)

Let the SDK handle URL parsing and receipt generation:

### Using the Payment Completion Hook

The `usePaymentCompletion` hook automatically handles:
- WebView navigation monitoring
- Payment URL parsing
- Receipt generation
- Success/failure callbacks

```typescript
import { usePaymentCompletion } from '@xcelapp/paygate-sdk';
import { WebView } from 'react-native-webview';

function PaymentWebView({ paymentLink }: { paymentLink: string }) {
  const {
    handleNavigationStateChange,
    receipt,
    isLoading,
    error,
  } = usePaymentCompletion({
    onSuccess: (receipt) => {
      console.log('Payment successful!', receipt);
      // Navigate to receipt screen
      navigation.navigate('Receipt', { receipt });
    },
    onFailure: (error, data) => {
      console.error('Payment failed:', error);
      Alert.alert('Payment Failed', error.message);
    },
    onCancel: () => {
      console.log('Payment cancelled');
      navigation.goBack();
    },
    merchantName: 'ACME Corp',
    autoFetchReceipt: true, // Automatically fetch full transaction details
  });

  return (
    <View style={{ flex: 1 }}>
      <WebView
        source={{ uri: paymentLink }}
        onNavigationStateChange={handleNavigationStateChange}
      />
      {isLoading && <ActivityIndicator />}
    </View>
  );
}
```

### Displaying Payment Receipts

Create a receipt screen to show payment details:

```typescript
import { PaymentReceiptData } from '@xcelapp/paygate-sdk';

function ReceiptScreen({ route }: { route: { params: { receipt: PaymentReceiptData } } }) {
  const { receipt } = route.params;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment Receipt</Text>
        <Text style={styles.status}>{receipt.status}</Text>
      </View>

      <View style={styles.section}>
        <ReceiptRow label="Merchant" value={receipt.merchantName} />
        <ReceiptRow label="Transaction ID" value={receipt.transactionId} />
        <ReceiptRow label="Payment Code" value={receipt.paymentCode} />
        <ReceiptRow label="Amount" value={`${receipt.currency} ${receipt.amount}`} />
        {receipt.fees && <ReceiptRow label="Fees" value={receipt.fees} />}
        {receipt.totalAmount && <ReceiptRow label="Total" value={receipt.totalAmount} />}
        <ReceiptRow label="Date" value={new Date(receipt.timestamp).toLocaleString()} />
        {receipt.customerEmail && <ReceiptRow label="Email" value={receipt.customerEmail} />}
        {receipt.customerPhone && <ReceiptRow label="Phone" value={receipt.customerPhone} />}
      </View>

      <Button title="Download Receipt" onPress={() => downloadReceipt(receipt)} />
      <Button title="Share Receipt" onPress={() => shareReceipt(receipt)} />
    </ScrollView>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}:</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}
```

### Manual URL Parsing

For custom flows or deep linking:

```typescript
import { parsePaymentCompletionUrl, isPaymentSuccessUrl } from '@xcelapp/paygate-sdk';

// Handle deep link
Linking.addEventListener('url', ({ url }) => {
  if (url.includes('payment')) {
    const data = parsePaymentCompletionUrl(url);

    if (data && isPaymentSuccessUrl(url)) {
      // Payment successful
      console.log('Payment Code:', data.paymentCode);
      console.log('Amount:', data.amount);
      navigation.navigate('Success', { paymentCode: data.paymentCode });
    }
  }
});
```

### Fetching Receipt Manually

You can fetch a receipt at any time using the payment code:

```typescript
function OrderDetailsScreen({ paymentCode }: { paymentCode: string }) {
  const { fetchReceipt, receipt, isLoading } = usePaymentCompletion({
    merchantName: 'ACME Corp',
  });

  useEffect(() => {
    fetchReceipt(paymentCode);
  }, [paymentCode]);

  if (isLoading) return <ActivityIndicator />;
  if (!receipt) return <Text>No receipt found</Text>;

  return <ReceiptView receipt={receipt} />;
}
```

---

### Option 3: Mix & Match (Use Utilities Only)

Use SDK utilities but build your own flow:

```typescript
import { parsePaymentCompletionUrl, isPaymentSuccessUrl } from '@xcelapp/paygate-sdk';

function PaymentWebView({ paymentLink }) {
  const handleNavigation = (navState) => {
    const data = parsePaymentCompletionUrl(navState.url);

    if (data) {
      // Use SDK utilities to parse, but handle your own way
      if (isPaymentSuccessUrl(navState.url)) {
        // Your custom success logic
        console.log('Payment succeeded:', data.paymentCode);
        yourCustomSuccessHandler(data);
      } else if (data.status === 'FAILED') {
        // Your custom failure logic
        yourCustomErrorHandler(data);
      }
    }
  };

  return <WebView source={{ uri: paymentLink }} onNavigationStateChange={handleNavigation} />;
}
```

**When to use:**
- You want URL parsing help but custom UI
- You're integrating with existing navigation flow
- You need some automation but not full control

---

### Complete Payment Flow Example (Option 2)

Here's a full example using SDK helpers for payment initiation, WebView, and receipt:

```typescript
// 1. Payment Initiation Screen
function PaymentScreen() {
  const { initiatePayment, loading, paymentLink } = useCheckout();
  const navigation = useNavigation();

  const handlePay = async () => {
    const response = await initiatePayment({
      amount: '5000',
      currency: 'XAF',
      client_transaction_id: `ORDER-${Date.now()}`,
      customer_email: 'user@example.com',
      customer_phone: '237233429972',
      description: 'Product purchase',
      channel: 'WEB',
      redirect_url: 'myapp://payment/success',
      webhook_url: 'https://api.myapp.com/webhook',
    });

    // Navigate to WebView with payment link
    navigation.navigate('PaymentWebView', {
      paymentLink: response.data.payment_link,
      paymentCode: response.data.payment_code,
    });
  };

  return <Button title="Pay Now" onPress={handlePay} disabled={loading} />;
}

// 2. Payment WebView Screen
function PaymentWebViewScreen({ route }: any) {
  const { paymentLink } = route.params;
  const navigation = useNavigation();

  const { handleNavigationStateChange, receipt } = usePaymentCompletion({
    onSuccess: (receipt) => {
      // Navigate to receipt screen
      navigation.replace('Receipt', { receipt });
    },
    onFailure: (error) => {
      Alert.alert('Payment Failed', error.message);
      navigation.goBack();
    },
    merchantName: 'My Store',
  });

  return (
    <WebView
      source={{ uri: paymentLink }}
      onNavigationStateChange={handleNavigationStateChange}
    />
  );
}

// 3. Receipt Screen
function ReceiptScreen({ route }: any) {
  const { receipt } = route.params;

  return (
    <View>
      <Text>✓ Payment Successful!</Text>
      <Text>Transaction: {receipt.transactionId}</Text>
      <Text>Amount: {receipt.currency} {receipt.amount}</Text>
      {/* Display full receipt details */}
    </View>
  );
}
```

## Advanced Usage

### XCEL Wallet Integration

For direct wallet-to-wallet payments:

```typescript
import { useXcelWallet } from '@xcelapp/paygate-sdk';

function WalletPayment() {
  // Works with Provider or pass config directly
  const { verifyAccount, createTransaction, checkPaymentStatus } = useXcelWallet();

  // 1. Verify customer's XCEL account
  const account = await verifyAccount("GH", "233542023469");

  // 2. Create transaction
  const transaction = await createTransaction(
    merchantId,
    payerWalletNo,
    posWalletNo,
    referenceId,
    amount,
    fees,
    products,
    merchantFees
  );

  // 3. Poll for payment completion
  const status = await checkPaymentStatus(merchantId, referenceId);
}
```

### Custom Transaction Options

Customize the checkout experience with additional options:

```typescript
await initiatePayment({
  amount: "50.00",
  currency: "GHS",
  // ... other required fields
  customTxn: {
    editAmt: true,
    minAmt: 5.0,
    maxAmt: 1500.5,
    borderTheme: "#9c27b0",
    receiptSxMsg: "Thank you for your payment!",
    receiptFeedbackPhone: "233241234567",
    receiptFeedbackEmail: "support@example.com",
    payLinkExpiryInDays: 15,
    payLinkCanPayMultipleTimes: false,
    displayPicture: "https://example.com/logo.png",
    xtraCustomerInput: [
      {
        label: "Order Number",
        placeHolder: "Enter order number",
        type: "input",
        required: true,
      },
    ],
  },
});
```

### Fetching Merchant Details and Products

Get merchant information and available products:

```typescript
import { XcelPayGateClient } from '@xcelapp/paygate-sdk';

const client = new XcelPayGateClient({
  merchantId: "YOUR_MERCHANT_ID",
  publicKey: "YOUR_PUBLIC_KEY",
});

// Get merchant details
const merchantDetails = await client.getMerchantDetails();
console.log("Merchant Name:", merchantDetails.data.data.reg_name);
console.log("Currency:", merchantDetails.data.data.currency.currency_code);

// Get merchant products
const productsResponse = await client.getMerchantProducts();
console.log("Products:", productsResponse.data.data);

// Example products for ENEO (Electricity Company):
// 1. ENEO PREPAID ELECTRICITY - product_id: 6RgglQWWO
// 2. ENEO POSTPAID ELECTRICITY - product_id: yhS_kA5lqP

// Find specific product (e.g., electricity prepaid)
const electricityProduct = productsResponse.data.data.find((p) =>
  p.name.toLowerCase().includes("prepaid")
);

console.log("Selected Product:", electricityProduct.name);
console.log("Product ID:", electricityProduct.product_id);
```

### Multiple Products

Process payments with multiple products:

```typescript
await initiatePayment({
  amount: "100.00",
  products: [
    { product_id: "PROD_001", amount: "50" },
    { product_id: "PROD_002", amount: "50" },
  ],
  currency: "XAF",
  // ... other fields
});
```

### Complete Payment Flow with Products

```typescript
// 1. Fetch merchant products
const productsResponse = await client.getMerchantProducts();
const selectedProduct = productsResponse.data.data[0]; // Select first product

// 2. Generate payment with product
const paymentResponse = await client.generatePaymentLink({
  amount: "1000",
  products: [
    {
      product_id: selectedProduct.product_id,
      amount: "1000",
    },
  ],
  currency: "XAF",
  client_transaction_id: `TXN-${Date.now()}`,
  customer_email: "customer@example.com",
  customer_phone: "237233429972",
  description: `Payment for ${selectedProduct.name}`,
  channel: "WEB",
  metadata: {
    product_name: selectedProduct.name,
    product_id: selectedProduct.product_id,
  },
  webhook_url: "https://merchant.example.com/webhook",
  redirect_url: "https://merchant.example.com/success",
});

// 3. Use the payment link
console.log("Payment Link:", paymentResponse.data.payment_link);
```

## Payment Flow

### Checkout URL Flow

1. **Generate Payment Link** - Call `initiatePayment()` with payment details
2. **Redirect Customer** - Open the returned `paymentLink` in browser
3. **Customer Pays** - Customer completes payment on XCEL's hosted page
4. **Monitor Status** - Use `usePaymentPolling` to track payment status
5. **Handle Result** - Process success/failure callbacks

### XCEL Wallet Flow

1. **Verify Account** - Verify customer's XCEL wallet account
2. **Generate Dynamic Link** - Create OTP for transaction
3. **Create Transaction** - Initialize the payment transaction
4. **Poll Status** - Check transaction status at intervals (5s, 15s, 10s)
5. **Confirm Payment** - Verify `paid: true` in transaction response

## Testing

Test the integration using the provided test credentials:

- **Test Merchant ID:** `0pf9ztq7q`
- **Test Paygate URL:** `https://paygate.xcelapp.com/pay/0pf9ztq7q`

## Best Practices

1. **Always use HTTPS** - Secure your redirect and webhook URLs
2. **Validate Payment Codes** - Check payment codes in callbacks
3. **Store Transaction IDs** - Keep records for reconciliation
4. **Handle Expiry** - Payment links expire after 24 hours by default
5. **Test Thoroughly** - Use test credentials before going live
6. **Monitor Webhooks** - Implement webhook handlers for reliable status updates

## Support

- **Documentation:** [XCEL API Docs](https://api.xcelapp.com/docs)
- **Business Portal:** [business.xcelapp.com](https://business.xcelapp.com)

## License

MIT
