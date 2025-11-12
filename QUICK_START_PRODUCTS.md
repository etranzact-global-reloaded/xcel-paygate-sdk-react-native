# Quick Start: Using Products with XCEL PayGate SDK

## TL;DR

```typescript
import { XcelPayGateClient } from "./src";

const client = new XcelPayGateClient({
  merchantId: "yFhi7ApMr",
  publicKey: "XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205",
});

// Get products
const { data } = await client.getMerchantProducts();
const products = data.data; // Array of MerchantProduct

// Use product in payment
const payment = await client.generatePaymentLink({
  amount: "1000",
  products: [{ product_id: products[0].product_id, amount: "1000" }],
  currency: "XAF",
  client_transaction_id: `TXN-${Date.now()}`,
  customer_email: "customer@example.com",
  customer_phone: "237233429972",
  description: "Payment",
  channel: "WEB",
  redirect_url: "https://your-app.com/success",
});

// Use payment link
console.log(payment.data.payment_link);
```

## Available Products (ENEO Example)

| Product Name              | Product ID   | Type     | Status   |
| ------------------------- | ------------ | -------- | -------- |
| ENEO PREPAID ELECTRICITY  | `6RgglQWWO`  | Prepaid  | ✓ Active |
| ENEO POSTPAID ELECTRICITY | `yhS_kA5lqP` | Postpaid | ✓ Active |

## Product Object Structure

```typescript
{
  product_id: "6RgglQWWO",           // ← Use this in payment
  name: "ENEO PREPAID ELECTRICITY",  // ← Display this
  active: { status: true },          // ← Check before using
  web: true,                         // ← Verify for web payments
  payment_code: "237020000039132",
  wallet: "2379999292428",
  // ... more fields
}
```

## Payment Payload

```json
{
  "amount": "1000",
  "products": [
    {
      "product_id": "6RgglQWWO",    ← Required
      "amount": "1000"               ← Required
    }
  ],
  "currency": "XAF",
  "client_transaction_id": "TXN-...",
  "customer_email": "...",
  "customer_phone": "...",
  "description": "...",
  "channel": "WEB",
  "redirect_url": "...",
  "webhook_url": "..."
}
```

## Testing

```bash
# Run complete flow test
node test-complete-flow.js

# Expected result:
✅ Merchant Details Retrieved Successfully!
✅ Found 2 Products!
🎯 Selected Product: ENEO PREPAID ELECTRICITY
✅ Payment Link Generated Successfully!
🔗 https://paygate.xcelapp.com/v1/main/xcel?code=PMT...
```

## React Native Usage

```tsx
import { useEffect, useState } from "react";
import { XcelPayGateClient } from "./src";

function PaymentScreen() {
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const client = new XcelPayGateClient({
      merchantId: "yFhi7ApMr",
      publicKey: "XCLPUBK_LIVE-...",
    });

    client.getMerchantProducts().then((res) => {
      setProducts(res.data.data);
      setSelectedId(res.data.data[0]?.product_id);
    });
  }, []);

  const handlePay = async () => {
    const client = new XcelPayGateClient({
      /* config */
    });
    const payment = await client.generatePaymentLink({
      amount: "1000",
      products: [{ product_id: selectedId, amount: "1000" }],
      // ... other required fields
    });

    // Open payment link
    Linking.openURL(payment.data.payment_link);
  };

  return (
    <View>
      {products.map((p) => (
        <TouchableOpacity
          key={p.product_id}
          onPress={() => setSelectedId(p.product_id)}
        >
          <Text>{p.name}</Text>
          {selectedId === p.product_id && <Text>✓</Text>}
        </TouchableOpacity>
      ))}
      <Button title="Pay" onPress={handlePay} />
    </View>
  );
}
```

## Common Filters

```typescript
// Get only active products
const active = products.filter((p) => p.active.status);

// Get only web-enabled products
const webEnabled = products.filter((p) => p.web);

// Get prepaid products
const prepaid = products.filter((p) =>
  p.name.toLowerCase().includes("prepaid")
);

// Get postpaid products
const postpaid = products.filter((p) =>
  p.name.toLowerCase().includes("postpaid")
);
```

## Error Handling

```typescript
try {
  const { data } = await client.getMerchantProducts();

  if (!data.data || data.data.length === 0) {
    console.log("No products available");
    return;
  }

  const activeProducts = data.data.filter((p) => p.active.status && p.web);

  if (activeProducts.length === 0) {
    console.log("No active products available");
    return;
  }

  // Use activeProducts[0]
} catch (error) {
  console.error("Failed to fetch products:", error.message);
}
```

## Need Help?

- 📚 Full Guide: [PRODUCT_INTEGRATION_GUIDE.md](./PRODUCT_INTEGRATION_GUIDE.md)
- 📝 Implementation: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- ✅ Complete Summary: [FINAL_SUMMARY.md](./FINAL_SUMMARY.md)
- 📖 SDK Docs: [README.md](./README.md)

## Quick Commands

```bash
# Start demo app
npm start

# Run tests
node test-complete-flow.js

# Check products
node inspect-merchant-details.js
```

---

**That's it!** You're ready to integrate products into your payment flow. 🚀
