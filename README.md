# XCEL PayGate SDK for React Native

A comprehensive React Native SDK for integrating XCEL PayGate payment gateway into your mobile applications. Supports both Checkout URL and XCEL Wallet payment flows.

## Features

- ✅ **Checkout URL Integration** - Generate payment links and redirect customers to hosted checkout
- ✅ **XCEL Wallet Payments** - Direct wallet-to-wallet transactions
- ✅ **Merchant Products** - Fetch and manage merchant products (e.g., electricity prepaid/postpaid)
- ✅ **TypeScript Support** - Full type definitions included
- ✅ **React Hooks** - Easy-to-use hooks for payment flows
- ✅ **Payment Polling** - Automatic payment status checking
- ✅ **Transaction Management** - Get merchant details, fees, and transaction status

## Installation

```bash
npm install
# or
yarn install
```

## Quick Start

### 1. Setup Configuration

Get your credentials from the [XCEL Business Portal](https://business.xcelapp.com/):

```typescript
import { XcelPayGateClient } from "./src";

const config = {
  merchantId: "YOUR_MERCHANT_ID",
  publicKey: "YOUR_PUBLIC_KEY",
};
```

### 2. Using Checkout URL (Recommended)

The simplest integration method - generate a payment link and redirect users to XCEL's hosted checkout:

```typescript
import { useCheckout } from "./src";

function PaymentScreen() {
  const { initiatePayment, paymentLink, paymentCode } = useCheckout(config);

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
import { usePaymentPolling } from "./src";

const { result, isPolling } = usePaymentPolling(config, paymentCode, {
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

## Advanced Usage

### XCEL Wallet Integration

For direct wallet-to-wallet payments:

```typescript
import { useXcelWallet } from "./src";

function WalletPayment() {
  const { verifyAccount, createTransaction, checkPaymentStatus } =
    useXcelWallet(config);

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
import { XcelPayGateClient } from "./src";

const config = {
  merchantId: "YOUR_MERCHANT_ID",
  publicKey: "YOUR_PUBLIC_KEY",
};

const client = new XcelPayGateClient(config);

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

## Demo Application

Run the included demo app to see the integration in action:

```bash
# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

Navigate to the "Payment" tab to test the integration.

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

- **Test Merchant ID:** `YOUR_TEST_MERCHANT_ID`
- **Test Paygate URL:** `https://paygate.xcelapp.com/pay/YOUR_TEST_MERCHANT_ID`

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
