# XCEL PayGate SDK for React Native

Accept mobile money and card payments in your React Native app with just a few lines of code.

[![npm version](https://badge.fury.io/js/xcel-paygate-sdk.svg)](https://www.npmjs.com/package/xcel-paygate-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why Choose XCEL PayGate?

- ✅ **5-Minute Setup** - Start accepting payments in minutes, not days
- 💰 **Multiple Payment Methods** - Mobile Money, Cards, Bank Transfers
- 🌍 **Pan-African Coverage** - Cameroon, Ghana, Kenya, Nigeria, and more
- 🔒 **Secure & Reliable** - Bank-grade security built-in
- 📱 **Zero Native Code** - Pure JavaScript/TypeScript, works with Expo
- 🎨 **Pre-Built UI** - Beautiful payment forms ready to use

## Installation

```bash
npm install xcel-paygate-sdk react-native-webview
```

That's it! No native code linking required.

## Getting Your API Keys

Before you start, you'll need API credentials:

1. Go to [XCEL Business Dashboard](https://business.xcelapp.com/)
2. Sign up for a free account
3. Copy your **Merchant ID** and **Public Key**

Keep these safe - you'll need them in the next step!

## Quick Start - Copy & Paste Ready

### Step 1: Create Your Environment File

Create a `.env` file in your project root:

```env
EXPO_PUBLIC_XCEL_MERCHANT_ID=your_merchant_id_here
EXPO_PUBLIC_XCEL_PUBLIC_KEY=your_public_key_here
```

### Step 2: Add the Payment Component

Copy this code into your payment screen:

```tsx
import { XcelPaymentFlow } from 'xcel-paygate-sdk';
import { View } from 'react-native';

export default function PaymentScreen() {
  return (
    <View style={{ flex: 1 }}>
      <XcelPaymentFlow
        config={{
          merchantId: process.env.EXPO_PUBLIC_XCEL_MERCHANT_ID,
          publicKey: process.env.EXPO_PUBLIC_XCEL_PUBLIC_KEY,
        }}
        onPaymentComplete={(result) => {
          if (result.status === 'SUCCESS') {
            alert('Payment successful! 🎉');
            // Navigate to success screen
          } else {
            alert('Payment failed. Please try again.');
          }
        }}
      />
    </View>
  );
}
```

That's it! You now have a fully functional payment screen.

## What You Get Out of the Box

When you use `XcelPaymentFlow`, you automatically get:

- ✅ A complete payment form with validation
- ✅ Automatic payment link generation
- ✅ Secure payment webview
- ✅ Real-time payment status checking
- ✅ Success/failure handling
- ✅ Loading states and error messages

## How It Works

```
1. Customer fills payment form
   ↓
2. SDK generates secure payment link
   ↓
3. Customer completes payment
   ↓
4. SDK checks payment status
   ↓
5. Your app gets success/failure callback
```

## Customizing the Payment Amount

### Pre-fill the Amount

```tsx
<XcelPaymentFlow
  config={config}
  screenProps={{
    defaultValues: {
      amount: '5000',        // Pre-fill amount
      description: 'Order #123',
    },
  }}
  onPaymentComplete={(result) => {
    console.log('Payment complete!', result);
  }}
/>
```

### Make Amount Read-Only

```tsx
<XcelPaymentFlow
  config={config}
  screenProps={{
    defaultValues: { amount: '5000' },
    readOnly: {
      amount: true,  // User cannot change amount
    },
  }}
  onPaymentComplete={(result) => {
    console.log('Payment complete!', result);
  }}
/>
```

## Checking Payment Status

### Automatic Status Checking (Recommended)

The SDK automatically checks payment status for you:

```tsx
import { usePaymentPolling } from 'xcel-paygate-sdk';

function PaymentTracker({ paymentCode }) {
  const { result, isPolling } = usePaymentPolling(
    {
      merchantId: process.env.EXPO_PUBLIC_XCEL_MERCHANT_ID,
      publicKey: process.env.EXPO_PUBLIC_XCEL_PUBLIC_KEY,
    },
    paymentCode,
    {
      enabled: true,
      onSuccess: (result) => {
        alert('Payment successful! 🎉');
      },
      onFailure: (result) => {
        alert('Payment failed ❌');
      },
    }
  );

  if (isPolling) {
    return <Text>Checking payment status...</Text>;
  }

  return <Text>Status: {result?.transaction.status}</Text>;
}
```

### Manual Status Check

```tsx
import { useCheckout } from 'xcel-paygate-sdk';

function MyComponent() {
  const { checkStatus } = useCheckout(config);

  const handleCheckPayment = async (paymentCode) => {
    const result = await checkStatus(paymentCode);

    if (result.transaction.paid) {
      alert('Payment successful!');
    }
  };

  return (
    <Button
      title="Check Payment Status"
      onPress={() => handleCheckPayment('PMT123456')}
    />
  );
}
```

## Working with Products (Electricity, Water Bills, etc.)

Some merchants offer specific products like electricity tokens or water bills.

### Fetch Available Products

```tsx
import { XcelPayGateClient } from 'xcel-paygate-sdk';
import { useEffect, useState } from 'react';

function ElectricityPayment() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const client = new XcelPayGateClient({
      merchantId: process.env.EXPO_PUBLIC_XCEL_MERCHANT_ID,
      publicKey: process.env.EXPO_PUBLIC_XCEL_PUBLIC_KEY,
    });

    // Fetch available products
    client.getMerchantProducts()
      .then(response => setProducts(response.data.data))
      .catch(error => console.error(error));
  }, []);

  return (
    <View>
      {products.map(product => (
        <Text key={product.product_id}>{product.name}</Text>
      ))}
    </View>
  );
}
```

### Pay with a Specific Product

```tsx
import { useCheckout } from 'xcel-paygate-sdk';

function PayElectricityBill() {
  const { initiatePayment } = useCheckout(config);

  const handlePay = async () => {
    await initiatePayment({
      amount: '5000',
      currency: 'XAF',
      products: [
        {
          product_id: 'your_product_id',  // From getMerchantProducts()
          amount: '5000',
        },
      ],
      customer_email: 'customer@example.com',
      customer_phone: '237123456789',
      description: 'Electricity bill payment',
      channel: 'WEB',
    });
  };

  return <Button title="Pay Electricity Bill" onPress={handlePay} />;
}
```

## Advanced: Using Individual Components

For complete control over the UI:

### Payment Form Only

```tsx
import { XcelPaymentScreen } from 'xcel-paygate-sdk';

function CustomPayment() {
  return (
    <XcelPaymentScreen
      config={config}
      onPaymentLinkGenerated={(paymentLink, paymentCode) => {
        // You handle what to do with the payment link
        console.log('Payment link:', paymentLink);
        // Maybe navigate to your custom webview
      }}
      defaultValues={{
        amount: '1000',
        email: 'customer@example.com',
      }}
    />
  );
}
```

### Payment WebView Only

```tsx
import { XcelPaymentWebView } from 'xcel-paygate-sdk';

function PaymentWebViewScreen({ route }) {
  const { paymentLink, paymentCode } = route.params;

  return (
    <XcelPaymentWebView
      paymentLink={paymentLink}
      paymentCode={paymentCode}
      config={config}
      onSuccess={(result) => {
        alert('Payment successful!');
      }}
      onFailure={(error) => {
        alert('Payment failed');
      }}
    />
  );
}
```

## Getting Payment Receipts

After a successful payment, get detailed receipt information:

```tsx
import { usePaymentCompletion } from 'xcel-paygate-sdk';

function ReceiptScreen({ paymentCode }) {
  const { receipt, loading } = usePaymentCompletion(config, paymentCode);

  if (loading) {
    return <Text>Loading receipt...</Text>;
  }

  return (
    <View>
      <Text>Receipt ID: {receipt.receiptId}</Text>
      <Text>Amount: {receipt.amount} {receipt.currency}</Text>
      <Text>Status: {receipt.status}</Text>
      <Text>Payment Method: {receipt.paymentMethod}</Text>
      <Text>Date: {new Date(receipt.timestamp).toLocaleString()}</Text>
      <Text>Reference: {receipt.transactionId}</Text>
    </View>
  );
}
```

## Using with Provider Pattern (For Multiple Screens)

If you have multiple payment screens, use the Provider to avoid repeating config:

### Step 1: Wrap Your App

```tsx
// app/_layout.tsx
import { XcelPayGateProvider } from 'xcel-paygate-sdk';

export default function RootLayout() {
  return (
    <XcelPayGateProvider
      config={{
        merchantId: process.env.EXPO_PUBLIC_XCEL_MERCHANT_ID,
        publicKey: process.env.EXPO_PUBLIC_XCEL_PUBLIC_KEY,
      }}
    >
      {/* Your app screens */}
    </XcelPayGateProvider>
  );
}
```

### Step 2: Use Without Config

```tsx
// app/payment.tsx
import { XcelPaymentFlow } from 'xcel-paygate-sdk';

export default function Payment() {
  // No need to pass config - it uses Provider!
  return (
    <XcelPaymentFlow
      onPaymentComplete={(result) => {
        console.log('Done!', result);
      }}
    />
  );
}
```

## Webhooks (For Production Apps)

For real-time payment notifications, set up webhooks on your server:

```typescript
// Your server (Node.js/Express example)
app.post('/webhook', (req, res) => {
  const { transaction_id, status, amount } = req.body;

  if (status === 'SUCCESS') {
    // Update your database
    // Send confirmation email
    // Fulfill the order
  }

  res.status(200).send('OK');
});
```

Then configure webhook URL when making payments:

```tsx
await initiatePayment({
  amount: '1000',
  currency: 'XAF',
  // ... other fields
  webhook_url: 'https://your-server.com/webhook',
  redirect_url: 'https://your-app.com/success',
});
```

## Supported Countries & Currencies

| Country    | Currency | Code |
|------------|----------|------|
| Cameroon   | XAF      | CMR  |
| Ghana      | GHS      | GHA  |
| Kenya      | KES      | KEN  |
| Nigeria    | NGN      | NGA  |

## Payment Methods Available

- 📱 Mobile Money (MTN, Orange, Moov, Airtel, etc.)
- 💳 Visa & Mastercard
- 🏦 Bank Transfers
- 💰 XCEL Wallet

## TypeScript Support

Full TypeScript support included:

```tsx
import type {
  XcelPayGateConfig,
  TransactionData,
  PaymentRequest,
  PaymentResult,
  PaymentStatus,
} from 'xcel-paygate-sdk';

const config: XcelPayGateConfig = {
  merchantId: 'YOUR_MERCHANT_ID',
  publicKey: 'YOUR_PUBLIC_KEY',
};
```

## Requirements

- React Native >= 0.60.0
- React >= 16.8.0
- `react-native-webview` (auto-installed)

## Troubleshooting

### Payment not completing?

Make sure you're checking the payment status. Payments can take a few seconds to process.

### Can't see the payment form?

Check that you've installed `react-native-webview`:

```bash
npm install react-native-webview
```

### Environment variables not working?

Make sure your `.env` file is in the project root and variables start with `EXPO_PUBLIC_`.

## Support

Need help? We're here for you:

- 📧 Email: support@xcelapp.com
- 📚 Documentation: [GitHub](https://github.com/etranzact-global-reloaded/xcel-paygate-sdk-react-native)
- 🐛 Report Issues: [GitHub Issues](https://github.com/etranzact-global-reloaded/xcel-paygate-sdk-react-native/issues)

## License

MIT © XCEL

---

**Made with ❤️ @ eTranzact Global**
