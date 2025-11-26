# XCEL PayGate SDK - UI Components Usage Guide

**Drop-in React Native components for instant payment integration**

---

## Overview

The SDK now includes 3 pre-built UI components that you can drop into your app:

1. **XcelPaymentScreen** - Complete payment form with UI
2. **XcelPaymentWebView** - Payment completion WebView handler
3. **XcelPaymentFlow** - All-in-one component (form + WebView + receipt)

---

## Installation

```bash
# Install the SDK
npm install @xcelapp/paygate-sdk

# Install required peer dependency
npm install react-native-webview
```

---

## Quick Start - Option 1: All-In-One Component

**The easiest way! Just drop in one component and you're done.**

```tsx
import { XcelPaymentFlow } from '@xcelapp/paygate-sdk';

export default function PaymentScreen() {
  return (
    <XcelPaymentFlow
      config={{
        merchantId: 'yFhi7ApMr',
        publicKey: 'XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205',
      }}
      onPaymentComplete={(result) => {
        if (result.status === 'SUCCESS') {
          console.log('Payment successful!', result);
          // Navigate to success screen
        } else {
          console.log('Payment failed', result);
          // Show error
        }
      }}
    />
  );
}
```

That's it! This component handles:
- ✅ Payment form UI
- ✅ WebView navigation
- ✅ Payment status detection
- ✅ Success/failure callbacks

---

## Option 2: Individual Components (More Control)

### Step 1: Create Payment Screen

```tsx
// app/payment.tsx
import { XcelPaymentScreen } from '@xcelapp/paygate-sdk';
import { useRouter } from 'expo-router';

export default function PaymentScreen() {
  const router = useRouter();

  return (
    <XcelPaymentScreen
      config={{
        merchantId: 'yFhi7ApMr',
        publicKey: 'XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205',
      }}
      onPaymentLinkGenerated={(paymentLink, paymentCode) => {
        // Navigate to WebView
        router.push({
          pathname: '/payment-webview',
          params: { paymentLink, paymentCode },
        });
      }}
      defaultValues={{
        amount: '1000',
        email: 'customer@example.com',
        phone: '237233429972',
      }}
    />
  );
}
```

### Step 2: Create WebView Screen

```tsx
// app/payment-webview.tsx
import { XcelPaymentWebView } from '@xcelapp/paygate-sdk';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function PaymentWebViewScreen() {
  const { paymentLink, paymentCode } = useLocalSearchParams();
  const router = useRouter();

  return (
    <XcelPaymentWebView
      paymentLink={paymentLink as string}
      paymentCode={paymentCode as string}
      onSuccess={(result) => {
        console.log('Payment successful!', result);
        router.replace({
          pathname: '/receipt',
          params: { status: 'success', ...result },
        });
      }}
      onFailure={(result) => {
        console.log('Payment failed', result);
        router.replace({
          pathname: '/receipt',
          params: { status: 'failed', ...result },
        });
      }}
      onCancel={() => {
        router.back();
      }}
    />
  );
}
```

---

## Component Props Reference

### XcelPaymentFlow

All-in-one payment flow component.

```tsx
<XcelPaymentFlow
  // Required
  config={{ merchantId, publicKey }}

  // Callbacks
  onPaymentComplete={(result) => {}}
  onCancel={() => {}}

  // Customization
  screenProps={{
    defaultValues: { amount: '1000' },
    buttonText: 'Pay Now',
  }}
  renderReceipt={(result) => <YourReceiptComponent result={result} />}
  useModal={true}  // Show WebView in modal
/>
```

**Props:**
- `config` - SDK configuration (merchantId, publicKey)
- `onPaymentComplete` - Called when payment succeeds/fails
- `onCancel` - Called when user cancels
- `screenProps` - Pass-through props to XcelPaymentScreen
- `renderReceipt` - Custom receipt component
- `useModal` - Show WebView in modal (default: true)

---

### XcelPaymentScreen

Payment form with full UI.

```tsx
<XcelPaymentScreen
  // Configuration
  config={{ merchantId, publicKey }}

  // Pre-filled values
  defaultValues={{
    amount: '1000',
    email: 'customer@example.com',
    phone: '237233429972',
    description: 'Payment for services',
  }}

  // Callbacks
  onPaymentLinkGenerated={(link, code) => {
    console.log('Payment link:', link);
  }}
  onPaymentComplete={(transaction) => {}}
  onError={(error) => {}}

  // Customization
  buttonText="Pay Now"
  currency="XAF"
  showStatusButton={true}
  enablePolling={false}
  minimalMode={false}

  // Payment config
  paymentConfig={{
    products: [{ product_id: 'PROD-123', amount: '1000' }],
    redirect_url: 'myapp://payment/success',
    webhook_url: 'https://yourapi.com/webhook',
  }}

  // Custom styles
  styles={{
    container: { backgroundColor: '#f5f5f5' },
    button: { backgroundColor: '#00A86B' },
    buttonText: { color: '#fff' },
    input: { borderRadius: 12 },
  }}
/>
```

**Props:**
- `config` - SDK configuration (optional if using Provider)
- `defaultValues` - Pre-fill form fields
- `onPaymentLinkGenerated` - Called when payment link is created
- `onPaymentComplete` - Called when transaction completes
- `onError` - Error callback
- `buttonText` - Custom button text
- `currency` - Payment currency (default: XAF)
- `showStatusButton` - Show "Check Status" button
- `enablePolling` - Auto-poll payment status
- `minimalMode` - Hide form, show only button
- `paymentConfig` - Additional payment request params
- `styles` - Custom styles object

---

### XcelPaymentWebView

WebView with automatic payment detection.

```tsx
<XcelPaymentWebView
  // Required
  paymentLink="https://pay.xcelapp.com/payment/ABC123"
  paymentCode="ABC123"

  // Payment details
  amount="1000"
  currency="XAF"
  description="Payment for services"

  // Callbacks
  onSuccess={(result) => {
    console.log('Success!', result);
  }}
  onFailure={(result) => {
    console.log('Failed', result);
  }}
  onPending={(result) => {
    console.log('Pending', result);
  }}
  onCancel={() => {
    console.log('Cancelled');
  }}

  // Customization
  showBackButton={true}
  successTimeout={15000}  // 15 seconds

  // Custom renders
  renderHeader={() => <YourHeader />}
  renderLoading={() => <YourLoader />}

  // Custom styles
  styles={{
    container: { flex: 1 },
    header: { backgroundColor: '#00A86B' },
    backButton: { padding: 10 },
    backButtonText: { color: '#fff' },
    webview: { flex: 1 },
  }}
/>
```

**Props:**
- `paymentLink` - Payment URL (required)
- `paymentCode` - Payment tracking code
- `amount`, `currency`, `description` - Payment details
- `onSuccess` - Called on successful payment
- `onFailure` - Called on failed payment
- `onPending` - Called on pending payment
- `onCancel` - Called when user cancels
- `showBackButton` - Show back button
- `successTimeout` - Wait time before auto-redirect (ms)
- `renderHeader` - Custom header component
- `renderLoading` - Custom loading component
- `styles` - Custom styles object

**Payment Result Object:**
```typescript
{
  status: 'SUCCESS' | 'FAILED' | 'PENDING',
  paymentCode: string,
  transactionId: string,
  url: string,
  bodyText: string,
}
```

---

## Usage Patterns

### Pattern 1: Standalone Config

Pass config directly to each component.

```tsx
const config = {
  merchantId: 'yFhi7ApMr',
  publicKey: 'XCLPUBK_LIVE-...',
};

<XcelPaymentScreen config={config} />
```

### Pattern 2: With Provider

Set config once at app root, components auto-use it.

```tsx
// app/_layout.tsx
import { XcelPayGateProvider } from '@xcelapp/paygate-sdk';

export default function RootLayout() {
  return (
    <XcelPayGateProvider
      config={{
        merchantId: 'yFhi7ApMr',
        publicKey: 'XCLPUBK_LIVE-...',
      }}
    >
      {/* Your app */}
    </XcelPayGateProvider>
  );
}

// app/payment.tsx
// No config needed - uses Provider context!
<XcelPaymentScreen />
```

---

## Complete Examples

### Example 1: Expo Router App

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router';
import { XcelPayGateProvider } from '@xcelapp/paygate-sdk';

export default function RootLayout() {
  return (
    <XcelPayGateProvider
      config={{
        merchantId: process.env.EXPO_PUBLIC_XCEL_MERCHANT_ID,
        publicKey: process.env.EXPO_PUBLIC_XCEL_PUBLIC_KEY,
      }}
    >
      <Stack>
        <Stack.Screen name="index" />
        <Stack.Screen name="payment-webview" options={{ presentation: 'modal' }} />
        <Stack.Screen name="receipt" />
      </Stack>
    </XcelPayGateProvider>
  );
}

// app/index.tsx
import { XcelPaymentScreen } from '@xcelapp/paygate-sdk';
import { useRouter } from 'expo-router';

export default function Home() {
  const router = useRouter();

  return (
    <XcelPaymentScreen
      onPaymentLinkGenerated={(link, code) => {
        router.push({
          pathname: '/payment-webview',
          params: { paymentLink: link, paymentCode: code },
        });
      }}
      defaultValues={{
        amount: '5000',
        email: 'customer@example.com',
      }}
    />
  );
}

// app/payment-webview.tsx
import { XcelPaymentWebView } from '@xcelapp/paygate-sdk';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function PaymentWebView() {
  const { paymentLink, paymentCode } = useLocalSearchParams();
  const router = useRouter();

  return (
    <XcelPaymentWebView
      paymentLink={paymentLink}
      paymentCode={paymentCode}
      onSuccess={(result) => {
        router.replace({
          pathname: '/receipt',
          params: { status: 'success', code: result.paymentCode },
        });
      }}
      onFailure={(result) => {
        router.replace({
          pathname: '/receipt',
          params: { status: 'failed', code: result.paymentCode },
        });
      }}
    />
  );
}

// app/receipt.tsx
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function Receipt() {
  const { status, code } = useLocalSearchParams();

  return (
    <View>
      <Text>Payment {status}</Text>
      <Text>Code: {code}</Text>
    </View>
  );
}
```

### Example 2: React Navigation App

```tsx
// App.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { XcelPayGateProvider } from '@xcelapp/paygate-sdk';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <XcelPayGateProvider
      config={{
        merchantId: 'yFhi7ApMr',
        publicKey: 'XCLPUBK_LIVE-...',
      }}
    >
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="WebView" component={WebViewScreen} />
          <Stack.Screen name="Receipt" component={ReceiptScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </XcelPayGateProvider>
  );
}

// PaymentScreen.tsx
import { XcelPaymentScreen } from '@xcelapp/paygate-sdk';

function PaymentScreen({ navigation }) {
  return (
    <XcelPaymentScreen
      onPaymentLinkGenerated={(link, code) => {
        navigation.navigate('WebView', { paymentLink: link, paymentCode: code });
      }}
    />
  );
}

// WebViewScreen.tsx
import { XcelPaymentWebView } from '@xcelapp/paygate-sdk';

function WebViewScreen({ route, navigation }) {
  const { paymentLink, paymentCode } = route.params;

  return (
    <XcelPaymentWebView
      paymentLink={paymentLink}
      paymentCode={paymentCode}
      onSuccess={(result) => {
        navigation.replace('Receipt', { status: 'success', result });
      }}
      onFailure={(result) => {
        navigation.replace('Receipt', { status: 'failed', result });
      }}
    />
  );
}
```

### Example 3: Single Screen (All-In-One)

```tsx
import { XcelPaymentFlow } from '@xcelapp/paygate-sdk';
import { Alert } from 'react-native';

export default function App() {
  return (
    <XcelPaymentFlow
      config={{
        merchantId: 'yFhi7ApMr',
        publicKey: 'XCLPUBK_LIVE-...',
      }}
      onPaymentComplete={(result) => {
        if (result.status === 'SUCCESS') {
          Alert.alert('Success', 'Payment completed!');
        } else {
          Alert.alert('Failed', 'Payment was not successful');
        }
      }}
      screenProps={{
        defaultValues: {
          amount: '2500',
          email: 'customer@example.com',
        },
        buttonText: 'Pay 2,500 XAF',
        currency: 'XAF',
      }}
    />
  );
}
```

---

## Customization Examples

### Custom Styling

```tsx
<XcelPaymentScreen
  styles={{
    container: {
      backgroundColor: '#f9f9f9',
    },
    button: {
      backgroundColor: '#00A86B',
      borderRadius: 12,
      paddingVertical: 18,
    },
    buttonText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    input: {
      borderRadius: 8,
      borderWidth: 2,
      borderColor: '#00A86B',
      backgroundColor: '#fff',
    },
  }}
/>
```

### Pre-filled Form

```tsx
<XcelPaymentScreen
  defaultValues={{
    amount: '5000',
    email: 'john.doe@example.com',
    phone: '237233429972',
    description: 'Electricity bill payment',
  }}
  paymentConfig={{
    products: [
      { product_id: 'ENEO_PREPAID', amount: '5000' }
    ],
    metadata: {
      customer_id: 'CUST12345',
      meter_number: '123456789',
    },
  }}
/>
```

### Custom Receipt

```tsx
<XcelPaymentFlow
  renderReceipt={(result) => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
        {result.status === 'SUCCESS' ? '✓ Success!' : '✗ Failed'}
      </Text>
      <Text>Payment Code: {result.paymentCode}</Text>
      <Text>Transaction: {result.transactionId}</Text>
    </View>
  )}
/>
```

---

## Migration from Custom Implementation

If you're currently using custom implementation, migrating is easy:

### Before (Custom):

```tsx
// Your current payment screen
export default function PaymentScreen() {
  const [amount, setAmount] = useState('');
  const { initiatePayment, loading } = useCheckout(config);

  const handlePay = async () => {
    const result = await initiatePayment({ amount, currency: 'XAF' });
    // Navigate to WebView...
  };

  return (
    <View>
      <TextInput value={amount} onChangeText={setAmount} />
      <Button onPress={handlePay} />
    </View>
  );
}
```

### After (With Components):

```tsx
// Using pre-built component
import { XcelPaymentScreen } from '@xcelapp/paygate-sdk';

export default function PaymentScreen() {
  return (
    <XcelPaymentScreen
      config={config}
      onPaymentLinkGenerated={(link, code) => {
        // Navigate to WebView...
      }}
    />
  );
}
```

Or even simpler:

```tsx
import { XcelPaymentFlow } from '@xcelapp/paygate-sdk';

export default function PaymentScreen() {
  return (
    <XcelPaymentFlow
      config={config}
      onPaymentComplete={(result) => {
        console.log('Done!', result);
      }}
    />
  );
}
```

---

## Benefits

✅ **5-minute integration** - Copy-paste and you're done
✅ **Fully customizable** - Custom styles, colors, callbacks
✅ **Type-safe** - Full TypeScript support
✅ **Battle-tested** - Production-ready UI
✅ **Responsive** - Works on all screen sizes
✅ **Accessible** - Follows RN accessibility guidelines
✅ **Automatic detection** - WebView monitors payment status
✅ **Error handling** - Built-in error states and messages

---

## Support

Need help? Check:
- [Integration Reference](./INTEGRATION_REFERENCE.md) - Full API docs
- [README](./README.md) - Getting started guide
- Example app in `/app` directory

---

**Last Updated:** November 13, 2025
