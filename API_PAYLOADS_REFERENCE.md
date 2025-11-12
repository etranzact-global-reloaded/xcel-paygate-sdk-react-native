# XCEL PayGate API - Complete Payloads & Webhooks Reference

**Version:** 1.0.0
**Last Updated:** October 21, 2025
**Base URL:** `https://api.xcelapp.com`
**PayGate URL:** `https://paygate.xcelapp.com`

---

## Table of Contents

1. [Authentication Headers](#authentication-headers)
2. [Generate Payment Link](#generate-payment-link)
3. [Get Transaction Data](#get-transaction-data)
4. [Get Merchant Details](#get-merchant-details)
5. [Get Merchant Products](#get-merchant-products)
6. [Get Merchant Fees](#get-merchant-fees)
7. [Verify XCEL Account](#verify-xcel-account)
8. [Create XCEL Transaction](#create-xcel-transaction)
9. [Get Transaction Status](#get-transaction-status)
10. [Webhook Payloads](#webhook-payloads)
11. [Error Responses](#error-responses)
12. [Status Codes](#status-codes)

---

## Authentication Headers

All API requests require these headers:

```json
{
  "Content-Type": "application/json",
  "x-merchant-id": "YOUR_MERCHANT_ID",
  "x-public-key": "YOUR_PUBLIC_KEY"
}
```

**Example:**
```json
{
  "Content-Type": "application/json",
  "x-merchant-id": "yFhi7ApMr",
  "x-public-key": "XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205"
}
```

---

## Generate Payment Link

### Endpoint
```
POST /transactions-service/paygate/generate-payment-link
```

### Request Headers
```json
{
  "Content-Type": "application/json",
  "x-merchant-id": "yFhi7ApMr",
  "x-public-key": "XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205"
}
```

### Request Payload (Basic)

```json
{
  "amount": "1000",
  "currency": "XAF",
  "client_transaction_id": "TXN-1729585466123",
  "customer_email": "customer@example.com",
  "customer_phone": "237233429972",
  "description": "Payment for electricity bill",
  "channel": "MOBILE",
  "redirect_url": "https://yourapp.com/payment/success",
  "webhook_url": "https://yourapp.com/api/webhooks/xcel"
}
```

### Request Payload (With Products)

```json
{
  "amount": "1000",
  "currency": "XAF",
  "client_transaction_id": "TXN-1729585466123",
  "customer_email": "customer@example.com",
  "customer_phone": "237233429972",
  "description": "Payment for ENEO Prepaid Electricity",
  "channel": "MOBILE",
  "metadata": {
    "order_id": "ORD-2025-001",
    "customer_name": "John Doe",
    "meter_number": "12345678",
    "product_type": "electricity"
  },
  "redirect_url": "https://yourapp.com/payment/success",
  "webhook_url": "https://yourapp.com/api/webhooks/xcel",
  "products": [
    {
      "product_id": "6RgglQWWO",
      "amount": "1000"
    }
  ]
}
```

### Request Payload (With Multiple Products)

```json
{
  "amount": "2500",
  "currency": "XAF",
  "client_transaction_id": "TXN-1729585466123",
  "customer_email": "customer@example.com",
  "customer_phone": "237233429972",
  "description": "Payment for multiple utilities",
  "channel": "MOBILE",
  "metadata": {
    "order_id": "ORD-2025-001",
    "customer_name": "John Doe"
  },
  "redirect_url": "https://yourapp.com/payment/success",
  "webhook_url": "https://yourapp.com/api/webhooks/xcel",
  "products": [
    {
      "product_id": "6RgglQWWO",
      "amount": "1000"
    },
    {
      "product_id": "yhS_kA5lqP",
      "amount": "1500"
    }
  ]
}
```

### Request Payload (With Custom Transaction Options)

```json
{
  "amount": "1000",
  "currency": "XAF",
  "client_transaction_id": "TXN-1729585466123",
  "customer_email": "customer@example.com",
  "customer_phone": "237233429972",
  "description": "Custom electricity payment",
  "channel": "WEB",
  "redirect_url": "https://yourapp.com/payment/success",
  "webhook_url": "https://yourapp.com/api/webhooks/xcel",
  "products": [
    {
      "product_id": "6RgglQWWO",
      "amount": "1000"
    }
  ],
  "customTxn": {
    "editAmt": true,
    "minAmt": 100,
    "maxAmt": 50000,
    "borderTheme": "#9c27b0",
    "receiptSxMsg": "Thank you for your payment! Your tokens will be sent shortly.",
    "receiptFeedbackPhone": "237233429972",
    "receiptFeedbackEmail": "support@yourcompany.com",
    "payLinkExpiryInDays": 7,
    "payLinkCanPayMultipleTimes": false,
    "displayPicture": "https://yourapp.com/logo.png",
    "xtraCustomerInput": [
      {
        "label": "Meter Number",
        "placeHolder": "Enter your meter number",
        "type": "input",
        "required": true
      },
      {
        "label": "Property Type",
        "placeHolder": "Select property type",
        "type": "select",
        "options": [
          { "k": "residential", "v": "Residential" },
          { "k": "commercial", "v": "Commercial" }
        ],
        "required": true
      }
    ]
  }
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | string | Yes | Payment amount as string |
| `currency` | string | Yes | Currency code (XAF, GHS, NGN, USD, etc.) |
| `client_transaction_id` | string | Yes | Unique transaction ID from your system |
| `customer_email` | string | Yes | Customer's email address |
| `customer_phone` | string | Yes | Customer's phone with country code |
| `description` | string | Yes | Payment description |
| `channel` | string | Yes | Payment channel: "WEB" or "MOBILE" |
| `redirect_url` | string | Yes | URL to redirect after payment |
| `webhook_url` | string | No | URL to receive webhook notifications |
| `metadata` | object | No | Custom metadata (key-value pairs) |
| `products` | array | No | Array of products being purchased |
| `customTxn` | object | No | Custom transaction options |

### Success Response

```json
{
  "status": "SUCCESS",
  "status_reason": "Payment link generated successfully",
  "data": {
    "transaction_id": "67160d0a2a49e8e7e3cc73d1",
    "client_transaction_id": "TXN-1729585466123",
    "payment_code": "NIWL1NZZ",
    "payment_link": "https://paygate.xcelapp.com/pay/yFhi7ApMr?code=NIWL1NZZ",
    "amount": 1000,
    "metadata": {
      "order_id": "ORD-2025-001",
      "customer_name": "John Doe",
      "meter_number": "12345678",
      "product_type": "electricity"
    },
    "currency": "XAF",
    "public_key": "XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205",
    "expires_at": "2025-10-22T11:17:46.133Z"
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Response status: "SUCCESS" or "FAILED" |
| `status_reason` | string | Human-readable status message |
| `data.transaction_id` | string | Unique transaction ID from XCEL |
| `data.client_transaction_id` | string | Your transaction ID (echo) |
| `data.payment_code` | string | Short payment code (use to check status) |
| `data.payment_link` | string | Full payment URL to open in browser/WebView |
| `data.amount` | number | Payment amount as number |
| `data.currency` | string | Currency code |
| `data.public_key` | string | Your public key (echo) |
| `data.expires_at` | string | ISO 8601 expiry timestamp (default: 24 hours) |

### Error Response

```json
{
  "status": "FAILED",
  "status_reason": "Invalid merchant credentials",
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "The provided merchant ID or public key is invalid"
  }
}
```

### cURL Example

```bash
curl -X POST https://api.xcelapp.com/transactions-service/paygate/generate-payment-link \
  -H "Content-Type: application/json" \
  -H "x-merchant-id: yFhi7ApMr" \
  -H "x-public-key: XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205" \
  -d '{
    "amount": "1000",
    "currency": "XAF",
    "client_transaction_id": "TXN-1729585466123",
    "customer_email": "customer@example.com",
    "customer_phone": "237233429972",
    "description": "Payment for electricity bill",
    "channel": "MOBILE",
    "redirect_url": "https://yourapp.com/payment/success",
    "webhook_url": "https://yourapp.com/api/webhooks/xcel",
    "products": [
      {
        "product_id": "6RgglQWWO",
        "amount": "1000"
      }
    ]
  }'
```

---

## Get Transaction Data

### Endpoint
```
GET /transactions-service/paygate/get-transaction-data/{payment_code}
```

### Request Headers
```json
{
  "Content-Type": "application/json",
  "x-merchant-id": "yFhi7ApMr",
  "x-public-key": "XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205"
}
```

### Request Parameters

| Parameter | Type | Location | Description |
|-----------|------|----------|-------------|
| `payment_code` | string | Path | Payment code from generate-payment-link response |

### Example Request
```
GET /transactions-service/paygate/get-transaction-data/NIWL1NZZ
```

### Success Response (Pending)

```json
{
  "status": "SUCCESS",
  "status_reason": "Transaction data retrieved successfully",
  "data": {
    "_id": "67160d0a2a49e8e7e3cc73d1",
    "transaction_id": "67160d0a2a49e8e7e3cc73d1",
    "payment_code": "NIWL1NZZ",
    "merchant_id": "yFhi7ApMr",
    "expires_at": "2025-10-22T11:17:46.133Z",
    "amount": 1000,
    "products": [
      {
        "product_id": "6RgglQWWO",
        "amount": "1000"
      }
    ],
    "currency": "XAF",
    "country_code": "237",
    "client_transaction_id": "TXN-1729585466123",
    "customer_email": "customer@example.com",
    "customer_phone": "237233429972",
    "description": "Payment for electricity bill",
    "status": "PENDING",
    "channel": "MOBILE",
    "redirect_url": "https://yourapp.com/payment/success",
    "public_key": "XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205",
    "webhook_url": "https://yourapp.com/api/webhooks/xcel",
    "createdAt": "2025-10-21T11:17:46.133Z",
    "updatedAt": "2025-10-21T11:17:46.133Z"
  }
}
```

### Success Response (Completed)

```json
{
  "status": "SUCCESS",
  "status_reason": "Transaction data retrieved successfully",
  "data": {
    "_id": "67160d0a2a49e8e7e3cc73d1",
    "transaction_id": "67160d0a2a49e8e7e3cc73d1",
    "payment_code": "NIWL1NZZ",
    "merchant_id": "yFhi7ApMr",
    "expires_at": "2025-10-22T11:17:46.133Z",
    "amount": 1000,
    "products": [
      {
        "product_id": "6RgglQWWO",
        "amount": "1000"
      }
    ],
    "currency": "XAF",
    "country_code": "237",
    "client_transaction_id": "TXN-1729585466123",
    "customer_email": "customer@example.com",
    "customer_phone": "237233429972",
    "description": "Payment for electricity bill",
    "status": "SUCCESS",
    "channel": "MOBILE",
    "redirect_url": "https://yourapp.com/payment/success",
    "public_key": "XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205",
    "webhook_url": "https://yourapp.com/api/webhooks/xcel",
    "payment_method": "MOBILE_MONEY",
    "payment_reference": "MM-67160d0a2a49e8e7e3cc73d1",
    "paid_at": "2025-10-21T11:25:30.456Z",
    "createdAt": "2025-10-21T11:17:46.133Z",
    "updatedAt": "2025-10-21T11:25:30.456Z"
  }
}
```

### Transaction Status Values

| Status | Description |
|--------|-------------|
| `PENDING` | Payment link created, awaiting payment |
| `SUCCESS` | Payment completed successfully |
| `FAILED` | Payment failed or was cancelled |
| `EXPIRED` | Payment link expired (default: 24 hours) |
| `PROCESSING` | Payment is being processed |

### cURL Example

```bash
curl -X GET https://api.xcelapp.com/transactions-service/paygate/get-transaction-data/NIWL1NZZ \
  -H "Content-Type: application/json" \
  -H "x-merchant-id: yFhi7ApMr" \
  -H "x-public-key: XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205"
```

---

## Get Merchant Details

### Endpoint
```
GET /business-api/merchant/details/{merchant_id}
```

### Request Headers
```json
{
  "Content-Type": "application/json",
  "x-merchant-id": "yFhi7ApMr",
  "x-public-key": "XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205"
}
```

### Example Request
```
GET /business-api/merchant/details/yFhi7ApMr
```

### Success Response

```json
{
  "status": true,
  "meta": {},
  "data": {
    "data": {
      "_id": "5f8a9b1c2d3e4f5a6b7c8d9e",
      "merchant_id": "yFhi7ApMr",
      "inc_no": "RC123456",
      "country_code": "237",
      "reg_name": "ENEO Cameroon",
      "reg_address": "123 Main Street, Douala",
      "street_name": "Main Street",
      "town": "Douala",
      "state": "Littoral",
      "zip_code": "00237",
      "ent_type": "Limited Company",
      "nature": "Electricity Distribution",
      "remote": false,
      "trans_type": "B2C",
      "volume": "HIGH",
      "value": "HIGH",
      "merchant_default_wallet": "237699000000",
      "date": "2020-10-17T00:00:00.000Z",
      "org_no": "ORG-001",
      "bank": {
        "country_code": "237",
        "bank_code": "10001",
        "sort_code": "10001",
        "account_no": "1234567890",
        "bank_name": "Standard Chartered Bank"
      },
      "currency": {
        "country": "Cameroon",
        "calling_code": "237",
        "currency_code": "XAF",
        "numeric_code": "950",
        "iso_code_2": "CM",
        "iso_code_3": "CMR",
        "currency_sign": "FCFA"
      },
      "director": {
        "name": "John Director",
        "phone": "237233000000",
        "email": "director@eneo.cm",
        "idCard": "ID123456",
        "proofOfAddress": "ADDRESS123"
      },
      "utility": {
        "utility": true,
        "type": "ELECTRICITY"
      },
      "activate": true,
      "closed": false,
      "payment_options": [
        "MOBILE_MONEY",
        "CARD",
        "XCEL_WALLET",
        "BANK_TRANSFER"
      ],
      "payment_option_fees": []
    }
  }
}
```

### cURL Example

```bash
curl -X GET https://api.xcelapp.com/business-api/merchant/details/yFhi7ApMr \
  -H "Content-Type: application/json" \
  -H "x-merchant-id: yFhi7ApMr" \
  -H "x-public-key: XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205"
```

---

## Get Merchant Products

### Endpoint
```
GET /business-api/merchant/products/{merchant_id}
```

### Request Headers
```json
{
  "Content-Type": "application/json",
  "x-merchant-id": "yFhi7ApMr",
  "x-public-key": "XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205"
}
```

### Example Request
```
GET /business-api/merchant/products/yFhi7ApMr
```

### Success Response

```json
{
  "status": true,
  "meta": {},
  "data": {
    "data": [
      {
        "_id": "5f8a9b1c2d3e4f5a6b7c8d9e",
        "product_id": "6RgglQWWO",
        "name": "ENEO PREPAID ELECTRICITY",
        "wallet": "237699000000",
        "card_num": "237699000000",
        "scheme_code": "237",
        "country_code": "237",
        "type_code": "ELECTRICITY",
        "level_code": "PREPAID",
        "organization_no": "ORG-001",
        "payment_code": "ENEO-PREPAID",
        "merchant_id": "yFhi7ApMr",
        "callback": "https://api.eneo.cm/callback",
        "hide": false,
        "pos": true,
        "web": true,
        "active": {
          "status": true,
          "action": "ACTIVATED",
          "user": "admin@eneo.cm",
          "updated_at": "2025-10-21T10:00:00.000Z",
          "created_at": "2025-01-15T10:00:00.000Z"
        },
        "account": {
          "type": "MERCHANT",
          "account_id": "ACC-6RgglQWWO",
          "accountNumber": "1234567890",
          "currency": "XAF",
          "sortCode": "10001",
          "providerExtraInfo": "ENEO Prepaid Account"
        },
        "bank": {
          "country_code": "237",
          "bank_code": "10001",
          "sort_code": "10001",
          "account_no": "1234567890",
          "bank_name": "Standard Chartered Bank"
        },
        "fees": {
          "percentage": 2.5,
          "flat": 0,
          "minimum_cap": 100,
          "maximum_cap": 5000
        },
        "ussd": true,
        "channels": ["WEB", "MOBILE", "USSD", "POS"],
        "product_type": "UTILITY",
        "investmentData": null,
        "charge_customer": true,
        "default_product": false,
        "created_at": "2025-01-15T10:00:00.000Z",
        "updated_at": "2025-10-21T10:00:00.000Z",
        "__v": 0
      },
      {
        "_id": "5f8a9b1c2d3e4f5a6b7c8d9f",
        "product_id": "yhS_kA5lqP",
        "name": "ENEO POSTPAID ELECTRICITY",
        "wallet": "237699000001",
        "card_num": "237699000001",
        "scheme_code": "237",
        "country_code": "237",
        "type_code": "ELECTRICITY",
        "level_code": "POSTPAID",
        "organization_no": "ORG-001",
        "payment_code": "ENEO-POSTPAID",
        "merchant_id": "yFhi7ApMr",
        "callback": "https://api.eneo.cm/callback",
        "hide": false,
        "pos": true,
        "web": true,
        "active": {
          "status": true,
          "action": "ACTIVATED",
          "user": "admin@eneo.cm",
          "updated_at": "2025-10-21T10:00:00.000Z",
          "created_at": "2025-01-15T10:00:00.000Z"
        },
        "account": {
          "type": "MERCHANT",
          "account_id": "ACC-yhS_kA5lqP",
          "accountNumber": "1234567891",
          "currency": "XAF",
          "sortCode": "10001",
          "providerExtraInfo": "ENEO Postpaid Account"
        },
        "bank": {
          "country_code": "237",
          "bank_code": "10001",
          "sort_code": "10001",
          "account_no": "1234567891",
          "bank_name": "Standard Chartered Bank"
        },
        "fees": {
          "percentage": 2.5,
          "flat": 0,
          "minimum_cap": 100,
          "maximum_cap": 5000
        },
        "ussd": true,
        "channels": ["WEB", "MOBILE", "USSD", "POS"],
        "product_type": "UTILITY",
        "investmentData": null,
        "charge_customer": true,
        "default_product": false,
        "created_at": "2025-01-15T10:00:00.000Z",
        "updated_at": "2025-10-21T10:00:00.000Z",
        "__v": 0
      }
    ],
    "merchant_fees": {
      "fees_account": "FEE-ACC-001",
      "fees": {
        "percentage": 2.5,
        "flat": 0,
        "minimum_cap": 100,
        "maximum_cap": 5000
      },
      "_id": "5f8a9b1c2d3e4f5a6b7c8da0",
      "country_code": "237",
      "level": "MERCHANT",
      "type": "STANDARD"
    }
  }
}
```

### Product Fields

| Field | Type | Description |
|-------|------|-------------|
| `product_id` | string | Unique product identifier (use in payment request) |
| `name` | string | Product display name |
| `payment_code` | string | Product payment code |
| `active.status` | boolean | Whether product is active |
| `web` | boolean | Available for web payments |
| `pos` | boolean | Available for POS payments |
| `fees` | object | Fee structure for this product |
| `channels` | array | Available payment channels |

### cURL Example

```bash
curl -X GET https://api.xcelapp.com/business-api/merchant/products/yFhi7ApMr \
  -H "Content-Type: application/json" \
  -H "x-merchant-id: yFhi7ApMr" \
  -H "x-public-key: XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205"
```

---

## Get Merchant Fees

### Endpoint
```
GET /transactions-service/merchant/charge-customer/{merchant_id}
```

### Request Headers
```json
{
  "Content-Type": "application/json",
  "x-merchant-id": "yFhi7ApMr",
  "x-public-key": "XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205"
}
```

### Example Request
```
GET /transactions-service/merchant/charge-customer/yFhi7ApMr
```

### Success Response

```json
{
  "data": {
    "productDetails": [
      {
        "product_id": "6RgglQWWO",
        "name": "ENEO PREPAID ELECTRICITY",
        "amount": "1000",
        "fee": 25,
        "net_amount": 975
      }
    ],
    "totalAmount": 1000
  },
  "message": "Merchant fees calculated successfully",
  "success": true,
  "status": 200
}
```

### cURL Example

```bash
curl -X GET https://api.xcelapp.com/transactions-service/merchant/charge-customer/yFhi7ApMr \
  -H "Content-Type: application/json" \
  -H "x-merchant-id: yFhi7ApMr" \
  -H "x-public-key: XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205"
```

---

## Verify XCEL Account

### Endpoint
```
GET /xas/v1/accounts/users/{country_code}/{phone_number}
```

### Request Headers
```json
{
  "Content-Type": "application/json",
  "x-merchant-id": "yFhi7ApMr",
  "x-public-key": "XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205"
}
```

### Request Parameters

| Parameter | Type | Location | Description |
|-----------|------|----------|-------------|
| `country_code` | string | Path | Country code (e.g., "237" for Cameroon) |
| `phone_number` | string | Path | Phone number without country code |

### Example Request
```
GET /xas/v1/accounts/users/237/233429972
```

### Success Response

```json
{
  "success": true,
  "message": "Account found",
  "data": [
    {
      "_id": "5f8a9b1c2d3e4f5a6b7c8da1",
      "card_num": "237233429972",
      "user_id": "USER-001",
      "identifier": "233429972",
      "scheme_code": "237",
      "account_id": "ACC-237233429972",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "currency": "XAF",
      "currency_symbol": "FCFA",
      "country": "Cameroon"
    }
  ]
}
```

### Account Not Found Response

```json
{
  "success": false,
  "message": "No account found for this phone number",
  "data": []
}
```

### cURL Example

```bash
curl -X GET https://api.xcelapp.com/xas/v1/accounts/users/237/233429972 \
  -H "Content-Type: application/json" \
  -H "x-merchant-id: yFhi7ApMr" \
  -H "x-public-key: XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205"
```

---

## Create XCEL Transaction

### Endpoint
```
POST /xas/v1/pos/create_transaction
```

### Request Headers
```json
{
  "Content-Type": "application/json",
  "x-merchant-id": "yFhi7ApMr",
  "x-public-key": "XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205"
}
```

### Request Payload

```json
{
  "merchant_id": "yFhi7ApMr",
  "payer_wallet_no": "237233429972",
  "pos_wallet_no": "237699000000",
  "pos_scheme_code": "237",
  "description": "Payment for ENEO Prepaid Electricity",
  "international": false,
  "merchant_country_code": "237",
  "payer_country_code": "237",
  "merchant_currency": "XAF",
  "payer_currency": "XAF",
  "trans_type": "XCelPOS",
  "metadata": {
    "order_id": "ORD-2025-001",
    "meter_number": "12345678"
  },
  "reference_id": "REF-1729585466123",
  "amount": "1000",
  "fees": "25",
  "products": [
    {
      "product_id": "6RgglQWWO",
      "amount": "1000",
      "merchant_fees": "25"
    }
  ]
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `merchant_id` | string | Yes | Your merchant ID |
| `payer_wallet_no` | string | Yes | Customer's XCEL wallet number |
| `pos_wallet_no` | string | Yes | Merchant's POS wallet number |
| `pos_scheme_code` | string | Yes | Country code for POS |
| `description` | string | Yes | Transaction description |
| `international` | boolean | Yes | Whether transaction is international |
| `merchant_country_code` | string | Yes | Merchant's country code |
| `payer_country_code` | string | Yes | Payer's country code |
| `merchant_currency` | string | Yes | Merchant's currency |
| `payer_currency` | string | Yes | Payer's currency |
| `trans_type` | string | Yes | Transaction type (e.g., "XCelPOS") |
| `metadata` | object | No | Custom metadata |
| `reference_id` | string | Yes | Unique reference from your system |
| `amount` | string | Yes | Transaction amount |
| `fees` | string | Yes | Transaction fees |
| `products` | array | Yes | Products being purchased |

### Success Response

```json
{
  "success": true,
  "message": "Transaction created successfully",
  "data": {
    "_id": "67160d0a2a49e8e7e3cc73d2",
    "international": false,
    "isMultipleProductPayment": false,
    "fees": true,
    "description": "Payment for ENEO Prepaid Electricity",
    "merchant_id": "yFhi7ApMr",
    "merchant_fees": "25",
    "merchant": true,
    "amount": "1000",
    "destinationAccountId": "ACC-237699000000",
    "external_reference": "REF-1729585466123",
    "src_wallet_no": "237233429972",
    "src_scheme": "237",
    "currency": "XAF",
    "dest_wallet_no": "237699000000",
    "dest_scheme": "237",
    "des_card_num": "237699000000",
    "type": "XCelPOS",
    "des_currency": "XAF",
    "channel_id": "MOBILE",
    "product_id": "6RgglQWWO",
    "products": [
      {
        "product_id": "6RgglQWWO",
        "product_name": "ENEO PREPAID ELECTRICITY",
        "merchant_fees": "25",
        "amount": "1000",
        "des_card_num": "237699000000"
      }
    ],
    "dest_country": "Cameroon",
    "name": "ENEO PREPAID ELECTRICITY",
    "interbank": false,
    "alias": "ENEO",
    "src_country": "Cameroon",
    "dest_person": "ENEO Cameroon",
    "src_person": "John Doe",
    "paid": false,
    "originator_wallet": "237233429972",
    "originator_scheme_code": "237",
    "removed": "false",
    "date": "2025-10-21T11:17:46.133Z"
  }
}
```

### cURL Example

```bash
curl -X POST https://api.xcelapp.com/xas/v1/pos/create_transaction \
  -H "Content-Type: application/json" \
  -H "x-merchant-id: yFhi7ApMr" \
  -H "x-public-key: XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205" \
  -d '{
    "merchant_id": "yFhi7ApMr",
    "payer_wallet_no": "237233429972",
    "pos_wallet_no": "237699000000",
    "pos_scheme_code": "237",
    "description": "Payment for ENEO Prepaid Electricity",
    "international": false,
    "merchant_country_code": "237",
    "payer_country_code": "237",
    "merchant_currency": "XAF",
    "payer_currency": "XAF",
    "trans_type": "XCelPOS",
    "reference_id": "REF-1729585466123",
    "amount": "1000",
    "fees": "25",
    "products": [
      {
        "product_id": "6RgglQWWO",
        "amount": "1000",
        "merchant_fees": "25"
      }
    ]
  }'
```

---

## Get Transaction Status

### Endpoint
```
GET /xas/v1/pos/transaction/{merchant_id}/{external_reference}
```

### Request Headers
```json
{
  "Content-Type": "application/json",
  "x-merchant-id": "yFhi7ApMr",
  "x-public-key": "XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205"
}
```

### Request Parameters

| Parameter | Type | Location | Description |
|-----------|------|----------|-------------|
| `merchant_id` | string | Path | Your merchant ID |
| `external_reference` | string | Path | Reference ID from create transaction |

### Example Request
```
GET /xas/v1/pos/transaction/yFhi7ApMr/REF-1729585466123
```

### Success Response (Unpaid)

```json
{
  "success": true,
  "message": "Transaction found",
  "data": {
    "_id": "67160d0a2a49e8e7e3cc73d2",
    "international": false,
    "isMultipleProductPayment": false,
    "fees": true,
    "description": "Payment for ENEO Prepaid Electricity",
    "merchant_id": "yFhi7ApMr",
    "merchant_fees": "25",
    "merchant": true,
    "amount": "1000",
    "external_reference": "REF-1729585466123",
    "src_wallet_no": "237233429972",
    "currency": "XAF",
    "dest_wallet_no": "237699000000",
    "product_id": "6RgglQWWO",
    "paid": false,
    "date": "2025-10-21T11:17:46.133Z"
  }
}
```

### Success Response (Paid)

```json
{
  "success": true,
  "message": "Transaction found",
  "data": {
    "_id": "67160d0a2a49e8e7e3cc73d2",
    "international": false,
    "isMultipleProductPayment": false,
    "fees": true,
    "description": "Payment for ENEO Prepaid Electricity",
    "merchant_id": "yFhi7ApMr",
    "merchant_fees": "25",
    "merchant": true,
    "amount": "1000",
    "external_reference": "REF-1729585466123",
    "src_wallet_no": "237233429972",
    "currency": "XAF",
    "dest_wallet_no": "237699000000",
    "product_id": "6RgglQWWO",
    "paid": true,
    "payment_date": "2025-10-21T11:25:30.456Z",
    "date": "2025-10-21T11:17:46.133Z"
  }
}
```

### cURL Example

```bash
curl -X GET https://api.xcelapp.com/xas/v1/pos/transaction/yFhi7ApMr/REF-1729585466123 \
  -H "Content-Type: application/json" \
  -H "x-merchant-id: yFhi7ApMr" \
  -H "x-public-key: XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205"
```

---

## Webhook Payloads

**Important Note:** The XCEL PayGate SDK implementation uses **client-side WebView detection** instead of server-side webhooks. The payment status is detected by monitoring the WebView content and URL changes in the React Native app.

However, if you want to implement server-side webhooks for additional verification or background processing, XCEL can send webhook notifications to your `webhook_url` when payment status changes.

### Webhook vs WebView Detection

| Method | Implementation | Use Case |
|--------|---------------|----------|
| **WebView Detection** (Default) | Client-side JavaScript in WebView | Real-time in-app payment status detection |
| **Server Webhooks** (Optional) | Server-side endpoint | Background processing, database updates, order fulfillment |

**The SDK uses WebView detection by default** - no webhook server required!

### Webhook Request Headers (If Implementing Server-Side)

```json
{
  "Content-Type": "application/json",
  "x-xcel-signature": "sha256-hash-of-payload",
  "x-xcel-event": "payment.success"
}
```

### Payment Success Webhook

```json
{
  "event": "payment.success",
  "timestamp": "2025-10-21T11:25:30.456Z",
  "data": {
    "transaction_id": "67160d0a2a49e8e7e3cc73d1",
    "client_transaction_id": "TXN-1729585466123",
    "payment_code": "NIWL1NZZ",
    "status": "SUCCESS",
    "amount": 1000,
    "currency": "XAF",
    "customer_email": "customer@example.com",
    "customer_phone": "237233429972",
    "description": "Payment for electricity bill",
    "payment_method": "MOBILE_MONEY",
    "payment_reference": "MM-67160d0a2a49e8e7e3cc73d1",
    "paid_at": "2025-10-21T11:25:30.456Z",
    "metadata": {
      "order_id": "ORD-2025-001",
      "customer_name": "John Doe",
      "meter_number": "12345678",
      "product_type": "electricity"
    },
    "products": [
      {
        "product_id": "6RgglQWWO",
        "amount": "1000"
      }
    ],
    "merchant_id": "yFhi7ApMr",
    "public_key": "XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205"
  }
}
```

### Payment Failed Webhook

```json
{
  "event": "payment.failed",
  "timestamp": "2025-10-21T11:25:30.456Z",
  "data": {
    "transaction_id": "67160d0a2a49e8e7e3cc73d1",
    "client_transaction_id": "TXN-1729585466123",
    "payment_code": "NIWL1NZZ",
    "status": "FAILED",
    "amount": 1000,
    "currency": "XAF",
    "customer_email": "customer@example.com",
    "customer_phone": "237233429972",
    "description": "Payment for electricity bill",
    "failure_reason": "Insufficient funds",
    "failure_code": "INSUFFICIENT_FUNDS",
    "failed_at": "2025-10-21T11:25:30.456Z",
    "metadata": {
      "order_id": "ORD-2025-001",
      "customer_name": "John Doe"
    },
    "products": [
      {
        "product_id": "6RgglQWWO",
        "amount": "1000"
      }
    ],
    "merchant_id": "yFhi7ApMr",
    "public_key": "XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205"
  }
}
```

### Payment Pending Webhook

```json
{
  "event": "payment.pending",
  "timestamp": "2025-10-21T11:20:00.000Z",
  "data": {
    "transaction_id": "67160d0a2a49e8e7e3cc73d1",
    "client_transaction_id": "TXN-1729585466123",
    "payment_code": "NIWL1NZZ",
    "status": "PENDING",
    "amount": 1000,
    "currency": "XAF",
    "customer_email": "customer@example.com",
    "customer_phone": "237233429972",
    "description": "Payment for electricity bill",
    "pending_reason": "Awaiting customer confirmation",
    "metadata": {
      "order_id": "ORD-2025-001"
    },
    "products": [
      {
        "product_id": "6RgglQWWO",
        "amount": "1000"
      }
    ],
    "merchant_id": "yFhi7ApMr",
    "public_key": "XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205"
  }
}
```

### Webhook Event Types

| Event | Description |
|-------|-------------|
| `payment.success` | Payment completed successfully |
| `payment.failed` | Payment failed or was cancelled |
| `payment.pending` | Payment is pending (awaiting confirmation) |
| `payment.expired` | Payment link expired without completion |

### Webhook Response

Your server should return a 200 OK response:

```json
{
  "success": true,
  "message": "Webhook received"
}
```

### WebView Detection (Default Implementation)

The SDK detects payment status in the WebView without webhooks:

```typescript
// app/payment-webview.tsx
const handleWebViewMessage = (event) => {
  const data = JSON.parse(event.nativeEvent.data);

  switch (data.type) {
    case 'payment_success':
      // Success detected in WebView
      navigateToReceipt('SUCCESS');
      break;
    case 'payment_failed':
      // Failure detected in WebView
      navigateToReceipt('FAILED');
      break;
    case 'payment_pending':
      // Pending detected in WebView
      navigateToReceipt('PENDING');
      break;
  }
};
```

### Server Webhook Handler (Optional - For Background Processing)

If you want server-side webhooks for additional processing:

```javascript
app.post('/api/webhooks/xcel', (req, res) => {
  const signature = req.headers['x-xcel-signature'];
  const event = req.headers['x-xcel-event'];
  const payload = req.body;

  // Verify signature
  const isValid = verifySignature(payload, signature);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process event (for database updates, order fulfillment, etc.)
  switch (event) {
    case 'payment.success':
      // Update database
      await updateOrderInDatabase(payload.data);
      // Send confirmation email
      await sendConfirmationEmail(payload.data);
      break;
    case 'payment.failed':
      // Update order status
      await markOrderAsFailed(payload.data);
      break;
    case 'payment.pending':
      // Log pending payment
      await logPendingPayment(payload.data);
      break;
  }

  // Return success
  res.status(200).json({ success: true, message: 'Webhook received' });
});
```

**Note:** The WebView detection handles user-facing payment status immediately. Server webhooks are optional for background processing.

---

## Error Responses

### Invalid Credentials

```json
{
  "status": "FAILED",
  "status_reason": "Invalid merchant credentials",
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "The provided merchant ID or public key is invalid"
  }
}
```

### Invalid Amount

```json
{
  "status": "FAILED",
  "status_reason": "Invalid amount",
  "error": {
    "code": "INVALID_AMOUNT",
    "message": "Amount must be a positive number"
  }
}
```

### Missing Required Field

```json
{
  "status": "FAILED",
  "status_reason": "Validation error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "customer_email is required",
    "fields": {
      "customer_email": "This field is required"
    }
  }
}
```

### Transaction Not Found

```json
{
  "status": "FAILED",
  "status_reason": "Transaction not found",
  "error": {
    "code": "NOT_FOUND",
    "message": "No transaction found with payment code: INVALID123"
  }
}
```

### Payment Expired

```json
{
  "status": "FAILED",
  "status_reason": "Payment link expired",
  "error": {
    "code": "PAYMENT_EXPIRED",
    "message": "Payment link has expired. Please generate a new one."
  }
}
```

### Rate Limit Exceeded

```json
{
  "status": "FAILED",
  "status_reason": "Rate limit exceeded",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retry_after": 60
  }
}
```

---

## Status Codes

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Invalid or missing credentials |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource not found |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Transaction Status Codes

| Status | Description | Action Required |
|--------|-------------|-----------------|
| `PENDING` | Payment awaiting completion | Poll or wait for webhook |
| `SUCCESS` | Payment completed | Fulfill order |
| `FAILED` | Payment failed | Notify customer, allow retry |
| `EXPIRED` | Payment link expired | Generate new link |
| `PROCESSING` | Payment being processed | Wait for final status |

### Payment Method Codes

| Code | Description |
|------|-------------|
| `MOBILE_MONEY` | Mobile money payment |
| `CARD` | Card payment (Visa/Mastercard) |
| `XCEL_WALLET` | XCEL wallet payment |
| `BANK_TRANSFER` | Bank transfer |

### Currency Codes

| Code | Currency | Countries |
|------|----------|-----------|
| `XAF` | Central African CFA Franc | Cameroon, Chad, Central African Republic, etc. |
| `GHS` | Ghanaian Cedi | Ghana |
| `NGN` | Nigerian Naira | Nigeria |
| `KES` | Kenyan Shilling | Kenya |
| `USD` | US Dollar | International |
| `EUR` | Euro | International |

---

## Testing

### Test Credentials

```json
{
  "merchantId": "0pf9ztq7q",
  "publicKey": "XCLPUBK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

### Test Payment Link

```
https://paygate.xcelapp.com/pay/0pf9ztq7q?code=TEST123
```

### Test Card Numbers

| Card Number | Result |
|-------------|--------|
| 4111111111111111 | Success |
| 4000000000000002 | Card declined |
| 4000000000000069 | Expired card |

### Test Mobile Money Numbers

| Number | Result |
|--------|--------|
| 237233000001 | Success |
| 237233000002 | Insufficient funds |
| 237233000003 | Timeout |

---

## Rate Limits

### Production Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Generate Payment Link | 100 requests | 1 minute |
| Get Transaction Data | 200 requests | 1 minute |
| Get Merchant Products | 50 requests | 1 minute |
| Webhook (incoming) | Unlimited | N/A |

### Headers

Rate limit information is returned in response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1729585466
```

---

## Changelog

### Version 1.0.0 (2025-10-21)
- Initial API documentation
- Payment link generation
- Transaction status checking
- Webhook integration
- Product management
- XCEL wallet integration

---

## Support

- **API Documentation:** https://api.xcelapp.com/docs
- **Business Portal:** https://business.xcelapp.com
- **Support Email:** support@xcelapp.com
- **Developer Forum:** https://developers.xcelapp.com

---

**End of API Payloads Reference**
