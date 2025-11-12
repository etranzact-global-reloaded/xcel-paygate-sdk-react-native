# SDK Usage Examples

This folder contains complete example code demonstrating how to use the XCEL PayGate SDK in your React Native application.

## Complete Setup

To use the SDK in your app, you need to:

### 1. **Install the SDK**

```bash
npm install @xcelapp/paygate-sdk
# or
yarn add @xcelapp/paygate-sdk
```

### 2. **Create `.env` file with your credentials**

Get your credentials from [XCEL Business Portal](https://business.xcelapp.com/):

```env
# .env
EXPO_PUBLIC_XCEL_MERCHANT_ID=your_merchant_id_here
EXPO_PUBLIC_XCEL_PUBLIC_KEY=your_public_key_here
```

**Important:** Add `.env` to your `.gitignore` to keep credentials secure!

### 3. **Wrap your app with the Provider** ([_layout.tsx](_layout.tsx))

Set up the SDK Provider at your app root:

```typescript
import { XcelPayGateProvider } from '@xcelapp/paygate-sdk';

export default function RootLayout() {
  return (
    <XcelPayGateProvider
      config={{
        merchantId: process.env.EXPO_PUBLIC_XCEL_MERCHANT_ID!,
        publicKey: process.env.EXPO_PUBLIC_XCEL_PUBLIC_KEY!,
      }}
    >
      {/* Your app navigation and screens */}
      <Stack>
        <Stack.Screen name="payment" component={PaymentScreen} />
        <Stack.Screen name="payment-webview" component={PaymentWebView} />
      </Stack>
    </XcelPayGateProvider>
  );
}
```

### 4. **Use SDK hooks in your screens**

Once the Provider is set up, you can use SDK hooks anywhere in your app without passing config every time!

---

## What's Included

### 1. **Provider Setup** ([_layout.tsx](_layout.tsx))

Shows how to:
- Import `XcelPayGateProvider`
- Configure with merchant credentials
- Wrap your entire app
- Use environment variables for security

**Key Code:**
```typescript
import { XcelPayGateProvider } from '@xcelapp/paygate-sdk';

<XcelPayGateProvider
  config={{
    merchantId: process.env.EXPO_PUBLIC_XCEL_MERCHANT_ID,
    publicKey: process.env.EXPO_PUBLIC_XCEL_PUBLIC_KEY,
  }}
>
  <YourApp />
</XcelPayGateProvider>
```

---

### 2. **Payment Initiation** ([index.tsx](index.tsx))

Shows how to:
- Use `useCheckout()` hook (no config needed - comes from Provider!)
- Generate payment links
- Handle payment form inputs
- Navigate to WebView with payment link
- Check payment status

**Key Code:**
```typescript
import { useCheckout, usePaymentPolling } from '@xcelapp/paygate-sdk';

function PaymentScreen() {
  // No config needed - automatically uses Provider config!
  const { initiatePayment, loading, paymentLink, paymentCode } = useCheckout();

  const handlePay = async () => {
    const response = await initiatePayment({
      amount: '1000',
      currency: 'XAF',
      customer_email: 'user@example.com',
      customer_phone: '237233429972',
      description: 'Payment for services',
      channel: 'WEB',
      // ... other fields
    });

    // Navigate to WebView
    navigation.navigate('PaymentWebView', {
      paymentLink: response.data.payment_link,
      paymentCode: response.data.payment_code,
    });
  };

  return <Button title="Pay Now" onPress={handlePay} />;
}
```

---

### 3. **WebView Integration** ([payment-webview.tsx](payment-webview.tsx))

Shows how to:
- Display payment link in WebView
- Use `usePaymentCompletion()` hook (optional)
- Handle success/failure callbacks
- Auto-generate receipts

**Key Code:**
```typescript
import { usePaymentCompletion } from '@xcelapp/paygate-sdk';
import { WebView } from 'react-native-webview';

function PaymentWebView({ route }) {
  const { paymentLink } = route.params;

  const { handleNavigationStateChange, receipt } = usePaymentCompletion({
    onSuccess: (receipt) => {
      // Navigate to receipt screen
      navigation.navigate('Receipt', { receipt });
    },
    onFailure: (error) => {
      Alert.alert('Payment Failed', error.message);
    },
    merchantName: 'Your Store Name',
  });

  return (
    <WebView
      source={{ uri: paymentLink }}
      onNavigationStateChange={handleNavigationStateChange}
    />
  );
}
```

---

### 4. **Receipt Display** ([payment-receipt.tsx](payment-receipt.tsx))

Shows how to:
- Display payment receipts
- Format transaction data
- Show payment details

**Key Code:**
```typescript
import { PaymentReceiptData } from '@xcelapp/paygate-sdk';

function ReceiptScreen({ route }: { route: { params: { receipt: PaymentReceiptData } } }) {
  const { receipt } = route.params;

  return (
    <View>
      <Text>Transaction ID: {receipt.transactionId}</Text>
      <Text>Amount: {receipt.amount} {receipt.currency}</Text>
      <Text>Status: {receipt.status}</Text>
    </View>
  );
}
```

---

## Usage in Your Own App

These files show **complete working patterns** for the SDK. To use in your app:

### Step 1: Install the SDK
```bash
npm install @xcelapp/paygate-sdk
```

### Step 2: Copy the patterns from these examples

Look at each file to see the implementation:
- `_layout.tsx` → Provider setup at app root
- `index.tsx` → Payment form and link generation
- `payment-webview.tsx` → WebView and payment completion
- `payment-receipt.tsx` → Receipt display

### Step 3: Replace import paths

The example files use local imports for development:
```typescript
// Example files use:
import { useCheckout } from '../src';

// In your app, use the package:
import { useCheckout } from '@xcelapp/paygate-sdk';
```

### Step 4: Add your credentials

Create a `.env` file:
```env
EXPO_PUBLIC_XCEL_MERCHANT_ID=your_merchant_id
EXPO_PUBLIC_XCEL_PUBLIC_KEY=your_public_key
```

---

## Complete Flow

Here's how the complete payment flow works:

1. **App starts** → `_layout.tsx` wraps app with `XcelPayGateProvider`
2. **User enters payment details** → `index.tsx` collects amount, email, phone
3. **Generate payment link** → `useCheckout().initiatePayment()` creates payment
4. **Open WebView** → Navigate to `payment-webview.tsx` with payment link
5. **Customer pays** → Customer completes payment in WebView
6. **Payment complete** → `usePaymentCompletion()` detects completion
7. **Show receipt** → Navigate to `payment-receipt.tsx` with receipt data

---

## Key Benefits of Provider Pattern

✅ **Configure once** - Set credentials at app root
✅ **Use everywhere** - No need to pass config to every hook
✅ **Secure** - Credentials stored in `.env` file
✅ **Clean code** - Components don't manage config
✅ **Easy testing** - Swap Provider config for test environment

---

## Environment Variables

Always use environment variables for credentials:

```typescript
// ✅ GOOD - Uses environment variables
<XcelPayGateProvider
  config={{
    merchantId: process.env.EXPO_PUBLIC_XCEL_MERCHANT_ID!,
    publicKey: process.env.EXPO_PUBLIC_XCEL_PUBLIC_KEY!,
  }}
>

// ❌ BAD - Hardcoded credentials
<XcelPayGateProvider
  config={{
    merchantId: "abc123",
    publicKey: "XCLPUBK_LIVE-xxx",
  }}
>
```

Create `.env`:
```env
EXPO_PUBLIC_XCEL_MERCHANT_ID=your_merchant_id
EXPO_PUBLIC_XCEL_PUBLIC_KEY=your_public_key
```

Add to `.gitignore`:
```gitignore
.env
.env.local
```

---

## Need Help?

- **SDK Documentation:** See main [README.md](../README.md)
- **Development Guide:** See [DEVELOPMENT.md](../DEVELOPMENT.md)
- **API Documentation:** [XCEL API Docs](https://api.xcelapp.com/docs)
- **Business Portal:** [business.xcelapp.com](https://business.xcelapp.com)
