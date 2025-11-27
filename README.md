# XCEL PayGate SDK

Official React Native SDK for XCEL PayGate payment integration. Accept mobile money and card payments in your React Native apps with just a few lines of code.

[![npm version](https://badge.fury.io/js/@xcelapp%2Fpaygate-sdk.svg)](https://www.npmjs.com/package/@xcelapp/paygate-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

✅ **Easy Integration** - Get started in 5 minutes with drop-in UI components
✅ **Multiple Payment Methods** - Mobile Money, Cards, and more
✅ **TypeScript Support** - Full type safety out of the box
✅ **Customizable UI** - Pre-built components that match your brand
✅ **Zero Native Code** - Pure JavaScript/TypeScript SDK
✅ **Production Ready** - Built-in error handling and loading states

## Supported Countries

🇨🇲 Cameroon | 🇬🇭 Ghana | 🇰🇪 Kenya | 🇳🇬 Nigeria | And more across Africa

## Installation

```bash
npm install @xcelapp/paygate-sdk react-native-webview
```

or with yarn:

```bash
yarn add @xcelapp/paygate-sdk react-native-webview
```

## Quick Start

### Option 1: All-in-One Component (Easiest)

The quickest way to get started. This component handles everything:

```tsx
import { XcelPaymentFlow } from '@xcelapp/paygate-sdk';

export default function PaymentScreen() {
  return (
    <XcelPaymentFlow
      config={{
        merchantId: 'YOUR_MERCHANT_ID',
        publicKey: 'YOUR_PUBLIC_KEY',
      }}
      onPaymentComplete={(result) => {
        if (result.status === 'SUCCESS') {
          console.log('Payment successful!', result);
        } else {
          console.log('Payment failed', result);
        }
      }}
    />
  );
}
```

### Option 2: Individual Components (More Control)

For more control over the payment flow:

```tsx
import { XcelPaymentScreen } from '@xcelapp/paygate-sdk';
import { useRouter } from 'expo-router';

export default function PaymentScreen() {
  const router = useRouter();

  return (
    <XcelPaymentScreen
      config={{
        merchantId: 'YOUR_MERCHANT_ID',
        publicKey: 'YOUR_PUBLIC_KEY',
      }}
      onPaymentLinkGenerated={(paymentLink, paymentCode) => {
        router.push({
          pathname: '/payment-webview',
          params: { paymentLink, paymentCode },
        });
      }}
      defaultValues={{
        amount: '1000',
        email: 'customer@example.com',
      }}
    />
  );
}
```

### Option 3: Hooks Only (Maximum Control)

Use just the hooks for complete control over UI:

```tsx
import { useCheckout } from '@xcelapp/paygate-sdk';

export default function PaymentScreen() {
  const { initiatePayment, loading } = useCheckout({
    merchantId: 'YOUR_MERCHANT_ID',
    publicKey: 'YOUR_PUBLIC_KEY',
  });

  const handlePay = async () => {
    const result = await initiatePayment({
      amount: '1000',
      currency: 'XAF',
      customer_email: 'customer@example.com',
      channel: 'WEB',
      redirect_url: 'https://yourapp.com/callback',
    });

    console.log('Payment link:', result.data.payment_link);
  };

  return (
    <Button title="Pay Now" onPress={handlePay} disabled={loading} />
  );
}
```

## Get Your API Credentials

1. Visit [XCEL Business Dashboard](https://business.xcelapp.com/)
2. Sign up or log in
3. Get your **Merchant ID** and **Public Key** from the dashboard

## Configuration

### Using Provider Pattern (Recommended for multiple screens)

Wrap your app with the provider to share config across all screens:

```tsx
// app/_layout.tsx
import { XcelPayGateProvider } from '@xcelapp/paygate-sdk';

export default function RootLayout() {
  return (
    <XcelPayGateProvider
      config={{
        merchantId: process.env.EXPO_PUBLIC_XCEL_MERCHANT_ID,
        publicKey: process.env.EXPO_PUBLIC_XCEL_PUBLIC_KEY,
      }}
    >
      {/* Your app */}
    </XcelPayGateProvider>
  );
}

// app/payment.tsx
// No config needed - components use Provider context automatically!
import { XcelPaymentScreen } from '@xcelapp/paygate-sdk';

export default function Payment() {
  return <XcelPaymentScreen />;
}
```

### Environment Variables

Create a `.env` file:

```env
EXPO_PUBLIC_XCEL_MERCHANT_ID=your_merchant_id
EXPO_PUBLIC_XCEL_PUBLIC_KEY=your_public_key
```

## Documentation

- 📖 [Complete API Reference](./INTEGRATION_REFERENCE.md) - All endpoints and types
- 🎨 [Component Usage Guide](./COMPONENT_USAGE.md) - UI components documentation
- 🚀 [Quick Start Examples](./COMPONENT_USAGE.md#complete-examples)

## Requirements

- React Native >= 0.60.0
- React >= 16.8.0
- react-native-webview (for UI components)

## TypeScript Support

The SDK is written in TypeScript and includes full type definitions:

```tsx
import type {
  XcelPayGateConfig,
  TransactionData,
  PaymentRequest,
  PaymentResult,
} from '@xcelapp/paygate-sdk';
```

## Supported Payment Methods

- 📱 Mobile Money (MTN, Orange, Moov, etc.)
- 💳 Card Payments (Visa, Mastercard)
- 🏦 Bank Transfers
- 💰 XCEL Wallet

## Support

- 📧 Email: support@xcelapp.com
- 🐛 Issues: [GitHub Issues](https://github.com/xcelapp/xcel-paygate-sdk/issues)
- 📚 Docs: [GitHub Repository](https://github.com/xcelapp/xcel-paygate-sdk)

## License

MIT © XCEL

## Changelog

### 1.0.0 (2025-01-13)

- Initial release
- Drop-in UI components
- TypeScript support
- Provider pattern
- Comprehensive documentation

---

**Made with ❤️ by XCEL**
