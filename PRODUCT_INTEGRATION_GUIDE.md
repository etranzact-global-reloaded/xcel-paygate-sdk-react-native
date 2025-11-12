# Product Integration Guide

## Overview

This guide explains how to integrate merchant products (like electricity prepaid/postpaid) into payment requests.

## Product Endpoint

```
GET https://api.xcelapp.com/xas/v1/products/{merchantId}
```

### Authentication Requirements

The products endpoint requires proper authentication. The specific x-headers needed are:

- `x-merchant-id`: Your merchant ID
- `x-public-key`: Your public key
- Additional headers may be required depending on your merchant configuration

**Note**: If you receive "401 Unauthorized - All x-headers must be supplied", contact XCEL support to verify your API credentials have access to the products endpoint.

## Expected Product Structure

Based on the ENEO merchant (electricity company), products should follow this structure:

```typescript
interface MerchantProduct {
  _id: string;
  product_id: string; // e.g., "X2aCXu0Md"
  product_name: string; // e.g., "Electricity Prepaid" or "Electricity Postpaid"
  product_description: string; // Description of the product
  product_category: string; // e.g., "Utilities", "Electricity"
  product_price: number; // Base price (may be 0 for variable pricing)
  merchant_id: string; // e.g., "yFhi7ApMr"
  created_at: string; // ISO date
  updated_at: string; // ISO date
  active: boolean; // Whether product is currently active
}
```

### Example Products Response

```json
{
  "status": true,
  "data": [
    {
      "_id": "product123",
      "product_id": "X2aCXu0Md",
      "product_name": "Electricity Prepaid",
      "product_description": "Prepaid electricity bill payment",
      "product_category": "Utilities",
      "product_price": 0,
      "merchant_id": "yFhi7ApMr",
      "created_at": "2021-04-20T15:06:14.966Z",
      "updated_at": "2025-10-17T13:59:52.819Z",
      "active": true
    },
    {
      "_id": "product456",
      "product_id": "Y3bDYv1Ne",
      "product_name": "Electricity Postpaid",
      "product_description": "Postpaid electricity bill payment",
      "product_category": "Utilities",
      "product_price": 0,
      "merchant_id": "yFhi7ApMr",
      "created_at": "2021-04-20T15:06:14.966Z",
      "updated_at": "2025-10-17T13:59:52.819Z",
      "active": true
    }
  ],
  "message": "Products retrieved successfully"
}
```

## Payment Payload with Products

### Single Product Payment

When paying for a specific product (e.g., electricity prepaid), include it in the `products` array:

```json
{
  "amount": "1000",
  "products": [
    {
      "product_id": "X2aCXu0Md",
      "amount": "1000"
    }
  ],
  "currency": "XAF",
  "client_transaction_id": "TXN-1697544123456",
  "customer_email": "customer@example.com",
  "customer_phone": "237233429972",
  "description": "Payment for electricity prepaid",
  "channel": "WEB",
  "metadata": {
    "cart_id": "CART123456",
    "promo_code": "WELCOME10",
    "product_name": "Electricity Prepaid"
  },
  "webhook_url": "https://merchant.example.com/webhook",
  "redirect_url": "https://merchant.example.com/success"
}
```

### Multiple Products Payment

For payments involving multiple products:

```json
{
  "amount": "2500",
  "products": [
    {
      "product_id": "X2aCXu0Md",
      "amount": "1000"
    },
    {
      "product_id": "Y3bDYv1Ne",
      "amount": "1500"
    }
  ],
  "currency": "XAF",
  "client_transaction_id": "TXN-1697544123457",
  "customer_email": "customer@example.com",
  "customer_phone": "237233429972",
  "description": "Payment for multiple services",
  "channel": "WEB",
  "metadata": {
    "cart_id": "CART123457"
  },
  "webhook_url": "https://merchant.example.com/webhook",
  "redirect_url": "https://merchant.example.com/success"
}
```

## Implementation Steps

### Step 1: Fetch Merchant Details

```typescript
import { XcelPayGateClient } from "./src";

const client = new XcelPayGateClient({
  merchantId: "yFhi7ApMr",
  publicKey: "XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205",
});

// Get merchant details to verify currency and other info
const merchantDetails = await client.getMerchantDetails();
console.log("Merchant:", merchantDetails.data.data.reg_name);
console.log("Currency:", merchantDetails.data.data.currency.currency_code);
```

### Step 2: Fetch Products (if accessible)

```typescript
try {
  const productsResponse = await client.getMerchantProducts();

  if (productsResponse.data && productsResponse.data.length > 0) {
    console.log("Available Products:");
    productsResponse.data.forEach((product) => {
      console.log(`- ${product.product_name} (${product.product_id})`);
    });

    // Filter for electricity products
    const electricityProducts = productsResponse.data.filter(
      (p) =>
        p.product_category.toLowerCase().includes("electricity") ||
        p.product_name.toLowerCase().includes("electricity")
    );

    console.log("\nElectricity Products:", electricityProducts);
  }
} catch (error) {
  console.error("Could not fetch products:", error.message);
  // Handle case where products endpoint is not accessible
  // You may need to hardcode product IDs or get them from your backend
}
```

### Step 3: Generate Payment with Product

```typescript
const paymentResponse = await client.generatePaymentLink({
  amount: "1000",
  products: [
    {
      product_id: "X2aCXu0Md", // Electricity Prepaid product ID
      amount: "1000",
    },
  ],
  currency: "XAF",
  client_transaction_id: `TXN-${Date.now()}`,
  customer_email: "customer@example.com",
  customer_phone: "237233429972",
  description: "Payment for electricity prepaid",
  channel: "WEB",
  metadata: {
    product_type: "electricity_prepaid",
  },
  webhook_url: "https://your-backend.com/webhook",
  redirect_url: "https://your-app.com/payment-success",
});

console.log("Payment Link:", paymentResponse.data.payment_link);
console.log("Payment Code:", paymentResponse.data.payment_code);
```

## Handling Product IDs

If the products endpoint is not accessible with your current credentials, you have several options:

### Option 1: Request Product IDs from XCEL

Contact XCEL support to get a list of product IDs for your merchant account.

### Option 2: Hardcode Known Product IDs

If you know the product IDs, you can hardcode them:

```typescript
const PRODUCT_IDS = {
  ELECTRICITY_PREPAID: "X2aCXu0Md",
  ELECTRICITY_POSTPAID: "Y3bDYv1Ne",
  // Add other products as needed
};

// Use in payment
const paymentResponse = await client.generatePaymentLink({
  amount: "1000",
  products: [
    {
      product_id: PRODUCT_IDS.ELECTRICITY_PREPAID,
      amount: "1000",
    },
  ],
  // ... other fields
});
```

### Option 3: Fetch from Your Backend

Create an endpoint in your backend that securely fetches and caches product data:

```typescript
// Your backend endpoint
GET / api / merchant / products;

// Frontend code
const products = await fetch(
  "https://your-backend.com/api/merchant/products"
).then((res) => res.json());
```

## Testing

### Test Without Products

The payment link generation should work with or without products:

```typescript
// Payment without specific product
const response = await client.generatePaymentLink({
  amount: "1000",
  currency: "XAF",
  client_transaction_id: `TXN-${Date.now()}`,
  customer_email: "customer@example.com",
  customer_phone: "237233429972",
  description: "General payment",
  channel: "WEB",
  redirect_url: "https://your-app.com/success",
});
```

### Test With Products

```typescript
// Payment with product
const response = await client.generatePaymentLink({
  amount: "1000",
  products: [{ product_id: "X2aCXu0Md", amount: "1000" }],
  currency: "XAF",
  client_transaction_id: `TXN-${Date.now()}`,
  customer_email: "customer@example.com",
  customer_phone: "237233429972",
  description: "Electricity prepaid payment",
  channel: "WEB",
  redirect_url: "https://your-app.com/success",
});
```

## Troubleshooting

### 401 Unauthorized when fetching products

- Verify your public key has the correct permissions
- Contact XCEL support to enable product API access
- Check if you need additional x-headers

### Products array not being sent correctly

- Ensure `product_id` and `amount` are both strings
- Verify the product ID is valid for your merchant
- Check that the total amount matches the sum of product amounts

### Currency mismatch

- Always use the merchant's currency (check `merchantDetails.data.data.currency.currency_code`)
- For ENEO (Cameroon), use `XAF`

## Summary

1. ✅ Fetch merchant details to get currency and merchant info
2. ✅ Attempt to fetch products (handle gracefully if not accessible)
3. ✅ Include product_id in the products array when generating payment
4. ✅ Log all requests/responses for debugging
5. ✅ Handle both product and non-product payments

## Contact Support

If you encounter issues accessing the products endpoint, contact XCEL support at:

- Support Email: support@xcelapp.com
- Documentation: https://api.xcelapp.com/docs
