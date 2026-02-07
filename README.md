# ![](https://docs.xcelapp.com/xcel.svg) XcelPayGate React Native SDK

## Introduction
> With the **XcelPayGate React Native SDK**, we provide a simple and platform-native way to accept payments inside your React Native application. The SDK exposes a clean API and UI component designed to match mobile best practices.
>> Payment links are generated on your server and completed within the SDK using a secure checkout flow powered by a WebView. Once a payment link is generated, your backend returns a `payment_code`, which the SDK uses to load and present the payment interface.

## Get `payment_code`
On successful call of the payment API, you will get a response that contains the `payment_code` in the `data` object. You need to return this `payment_code` back to your mobile app.
#### Response sample
```json
 {
    "status": "PENDING",
    "status_reason": "Payment link generated successfully",
    "data": {
        "transaction_id": "XPG250828UFCXXXX",
        "client_transaction_id": "reference123",
        "payment_code": "PMXXXXXXXXXXX",
        "payment_link": "https://pay.xcelapp.com/checkout?code=PMXXXXXXXXXXX",
        "amount": 50.00,
        "metadata": { "item_key": "value" },
        "currency": "GHS"
    }
}
```
> Note:
>> Do not call the payment API directly on your mobile app because it requires your API key. Your API key should only be used on your server where stronger security measures can be put in place.

## Installation

```bash
npm install xcel-paygate-sdk react-native-webview
```

Requirements<br/>
React Native >= 0.60.0<br/>
React >= 16.8.0

## How to use
### Import the SDK
```tsx
import { XcelPaygateView, startPayment } from 'xcel-paygate-sdk';
```
### Custom Configuration
```tsx
import type { PaymentConfig } from 'xcel-paygate-sdk';

const config: PaymentConfig = {
  title: 'Pay with Xcel',         // the text displayed on the topbar
  backgroundColor: '#007AFF',     // the background color of the topbar
  foregroundColor: '#FFFFFF',      // the title text color
  enableLogging: true,             // (optional) to enable logging. Default is false
};
```

### Basic Example (Component)
```tsx
import React, { useState } from 'react';
import { View, Button, Modal } from 'react-native';
import { XcelPaygateView } from 'xcel-paygate-sdk';

export default function PaymentScreen() {
  const [showPayGate, setShowPayGate] = useState(false);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button
        title="Make Payment"
        onPress={() => {
          // Generate payment link from your backend
          // For testing, we use a static payment code
          setShowPayGate(true);
        }}
      />

      <Modal visible={showPayGate} animationType="slide">
        <XcelPaygateView
          paymentCode="PMXXXXXXXXXX"  // Payment code from your backend
          config={{ title: 'Pay with Xcel' }}
          onResult={(result) => {
            console.log('Payment Result:', result);
            switch (result.status) {
              case 'success':
                console.log('Payment succeeded with reference:', result.reference);
                break;

              case 'pending':
                console.log('Payment pending.');
                break;

              case 'failed':
                console.log('Payment failed with reason:', result.reason ?? 'Unknown');
                break;

              case 'cancelled':
                console.log('Payment was cancelled by the user.');
                break;
            }
            setShowPayGate(false); // dismiss PayGate modal
          }}
        />
      </Modal>
    </View>
  );
}
```

### React Navigation Example
```tsx
import React from 'react';
import { XcelPaygateView } from 'xcel-paygate-sdk';

export default function PayGateScreen({ navigation, route }) {
  const { paymentCode } = route.params;

  return (
    <XcelPaygateView
      paymentCode={paymentCode}
      config={{ title: 'Pay with Xcel' }}
      onResult={(result) => {
        switch (result.status) {
          case 'success':
            console.log('Payment succeeded with reference:', result.reference);
            break;

          case 'pending':
            console.log('Payment pending.');
            break;

          case 'failed':
            console.log('Payment failed with reason:', result.reason ?? 'Unknown');
            break;

          case 'cancelled':
            console.log('Payment was cancelled by the user.');
            break;
        }
        navigation.goBack();
      }}
    />
  );
}
```

### Imperative Helper (`startPayment`)
```tsx
import React, { useState } from 'react';
import { View, Button, Modal } from 'react-native';
import { XcelPaygateView, startPayment } from 'xcel-paygate-sdk';

export default function CheckoutScreen() {
  const [payProps, setPayProps] = useState(null);

  const handlePay = async () => {
    const { props, result } = startPayment({
      paymentCode: 'PMXXXXXXXXXX',
      config: { title: 'Pay with Xcel' },
    });

    setPayProps(props);

    const outcome = await result;
    setPayProps(null);

    switch (outcome.status) {
      case 'success':
        console.log('Payment succeeded with reference:', outcome.reference);
        break;
      case 'pending':
        console.log('Payment pending.');
        break;
      case 'failed':
        console.log('Payment failed:', outcome.reason ?? 'Unknown');
        break;
      case 'cancelled':
        console.log('Payment cancelled.');
        break;
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Make Payment" onPress={handlePay} />

      <Modal visible={!!payProps} animationType="slide">
        {payProps && <XcelPaygateView {...payProps} />}
      </Modal>
    </View>
  );
}
```

### Payment Result
The `onResult` callback receives an `XcelPaymentResult` with the following possible shapes:

| Status | Shape | Description |
|--------|-------|-------------|
| `success` | `{ status: 'success', reference: string }` | Payment completed successfully |
| `pending` | `{ status: 'pending' }` | Payment is being processed |
| `failed` | `{ status: 'failed', reason?: string }` | Payment failed |
| `cancelled` | `{ status: 'cancelled' }` | User cancelled the payment |

<div align="center">
<i>Made with love by eTranzact</i>
</div>
