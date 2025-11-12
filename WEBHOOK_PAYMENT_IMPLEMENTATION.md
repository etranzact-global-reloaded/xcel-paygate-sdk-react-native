# Webhook-Based Payment Status Implementation

This document explains the webhook-based payment status handling system implemented for the XcelPayGate SDK, inspired by the PayStack reference implementation.

## Overview

The payment flow uses **client-side WebView detection** to automatically route to receipt screens based on payment status (SUCCESS, FAILED, PENDING). No server-side webhooks required!

Payment status detection methods:

1. **URL Monitoring**: Detecting success/failure redirect URLs
2. **DOM Analysis**: Scanning page content for status indicators
3. **User Interaction**: Tracking close button clicks
4. **Auto-Navigation**: 15-second timer for automatic success navigation

**Note:** This implementation works entirely in the React Native app using WebView JavaScript injection and does not require a backend webhook server.

## Architecture

### Key Components

#### 1. Payment WebView ([app/payment-webview.tsx](app/payment-webview.tsx))
- Loads XcelPay payment page in WebView
- Injects JavaScript to monitor DOM changes and user interactions
- Detects payment status through multiple methods
- Implements 15-second auto-navigation timer for successful payments
- Routes to appropriate receipt screen based on status

#### 2. Payment Receipt Screen ([app/payment-receipt.tsx](app/payment-receipt.tsx))
- Universal receipt display for all payment statuses
- Shows transaction details with appropriate styling per status
- Includes download and close actions
- Matches the design pattern shown in your reference screenshot

#### 3. Payment Helper Utilities ([src/utils/payment-helpers.ts](src/utils/payment-helpers.ts))
- Date and currency formatting
- Status color and text mapping
- URL and text content analysis
- Data transformation utilities

#### 4. Type Definitions ([src/types/index.ts](src/types/index.ts))
- `PaymentReceiptData`: Receipt screen data structure
- `WebhookPayload`: Webhook callback data structure
- `WebViewMessageData`: WebView-to-React Native message types

#### 5. Checkout Service ([src/services/checkout.ts](src/services/checkout.ts))
- Webhook payload parsing and validation
- Transaction verification methods
- Receipt data conversion utilities

## Payment Flow

### Step 1: Initiate Payment
```typescript
// User fills payment form and clicks "Generate Payment Link"
const response = await initiatePayment({
  amount,
  currency: 'XAF',
  customer_email: email,
  customer_phone: phone,
  description,
  // ...other params
});

// Navigate to WebView with payment details
router.push({
  pathname: '/payment-webview',
  params: {
    paymentLink: response.data.payment_link,
    paymentCode: response.data.payment_code,
    amount: amount,
    currency: 'XAF',
    description: description,
  },
});
```

### Step 2: WebView Monitoring

The WebView injects JavaScript that monitors for:

#### Success Indicators:
- Text content: "payment successful", "transaction successful", "payment completed"
- URL patterns: "success", "callback", "approved", "complete"
- DOM elements with success classes

#### Failure Indicators:
- Text content: "payment failed", "transaction failed", "payment cancelled"
- URL patterns: "cancel", "error", "failed", "decline"
- Close button clicks

#### Pending Indicators:
- Text content: "payment pending", "processing"

### Step 3: Auto-Navigation Logic

#### Success Flow:
1. Success indicator detected
2. 15-second countdown timer starts
3. If user doesn't click "Close" within 15 seconds → auto-navigate to SUCCESS receipt
4. If user clicks "Close" → cancel timer and navigate to FAILED receipt

#### Failure Flow:
- Immediately navigate to FAILED receipt on detection

#### Pending Flow:
- Navigate to PENDING receipt for manual verification

### Step 4: Receipt Display

Receipt screen shows:
- Status icon (checkmark, X, or clock)
- Status message with amount
- Transaction details:
  - Transaction Reference
  - Email
  - Phone
  - Amount
  - Status
  - Date
  - Product list (if applicable)
- Action buttons:
  - Download Receipt
  - Close

## WebView JavaScript Injection

The injected JavaScript performs these tasks:

```javascript
// Monitor close button clicks
function monitorCloseButton() {
  const closeButtons = document.querySelectorAll('button, a, div');
  closeButtons.forEach(btn => {
    const text = btn.textContent?.toLowerCase() || '';
    if (text.includes('close') || text.includes('cancel')) {
      btn.addEventListener('click', () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'close_clicked',
          url: window.location.href
        }));
      });
    }
  });
}

// Check payment status in DOM
function checkPaymentStatus() {
  const bodyText = document.body?.innerText?.toLowerCase() || '';

  const hasSuccess = bodyText.includes('payment successful');
  const hasFailure = bodyText.includes('payment failed');
  const hasPending = bodyText.includes('payment pending');

  // Send appropriate message to React Native
  if (hasSuccess) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'payment_success',
      url: window.location.href,
      bodyText: bodyText.substring(0, 500)
    }));
  }
  // ... similar for failure and pending
}

// Monitor DOM changes with MutationObserver
const observer = new MutationObserver(() => {
  monitorCloseButton();
  checkPaymentStatus();
});
```

## Usage Example

### Basic Implementation

```typescript
import { useCheckout } from '@/src/hooks/use-xcel-paygate';
import { useRouter } from 'expo-router';

const { initiatePayment } = useCheckout(config);
const router = useRouter();

// Initiate payment
const response = await initiatePayment({
  amount: '1000',
  currency: 'XAF',
  customer_email: 'customer@example.com',
  customer_phone: '237233429972',
  description: 'Payment for electricity',
  // ...
});

// Navigate to payment WebView
router.push({
  pathname: '/payment-webview',
  params: {
    paymentLink: response.data.payment_link,
    paymentCode: response.data.payment_code,
    amount: '1000',
    currency: 'XAF',
    description: 'Payment for electricity',
  },
});

// User completes payment in WebView
// Automatically routed to /payment-receipt with status (SUCCESS/FAILED/PENDING)
```

### Webhook Integration (Server-Side)

When XcelPay sends a webhook to your server:

```typescript
import { CheckoutService } from '@/src/services/checkout';

// Parse webhook payload
const webhookPayload = checkoutService.parseWebhookPayload(req.body);

if (!webhookPayload) {
  return res.status(400).json({ error: 'Invalid webhook payload' });
}

// Verify signature (if Xcel provides signature)
const isValid = checkoutService.verifyWebhookSignature(
  JSON.stringify(req.body),
  req.headers['x-xcel-signature'],
  process.env.WEBHOOK_SECRET
);

if (!isValid) {
  return res.status(401).json({ error: 'Invalid signature' });
}

// Process based on status
if (webhookPayload.status === 'SUCCESS') {
  // Update order status in database
  await updateOrder(webhookPayload.client_transaction_id, {
    status: 'paid',
    transaction_id: webhookPayload.transaction_id,
  });

  // Send confirmation email
  await sendConfirmationEmail(webhookPayload.customer_email);
}
```

## Status Color Scheme

- **SUCCESS**: Green (#4CAF50)
- **FAILED**: Red (#F44336)
- **PENDING/PROCESSING**: Orange (#FF9800)
- **EXPIRED**: Gray (#9E9E9E)

## Receipt Data Structure

```typescript
interface PaymentReceiptData {
  transaction_id: string;
  client_transaction_id?: string;
  payment_code: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'PROCESSING';
  amount: number;
  currency: string;
  customer_email?: string;
  customer_phone?: string;
  description?: string;
  payment_method: string;
  payment_date: string;
  metadata?: Record<string, any>;
  products?: PaymentProduct[];
}
```

## Key Features

### 1. Multiple Detection Methods
- URL pattern matching
- DOM text content analysis
- User interaction tracking
- Navigation state monitoring

### 2. Smart Auto-Navigation
- 15-second grace period for successful payments
- Immediate navigation for failures
- User can override with close button

### 3. Comprehensive Receipt
- Status-appropriate styling
- All transaction details
- Product breakdown (if applicable)
- Download/share capability (planned)

### 4. Error Handling
- Prevents duplicate navigation
- Clears timers on unmount
- Handles edge cases gracefully

## Testing Scenarios

### Test Case 1: Successful Payment
1. Generate payment link
2. Complete payment successfully in WebView
3. Verify: Auto-navigate to SUCCESS receipt after 15 seconds
4. Verify: Receipt shows green checkmark and "Success" status

### Test Case 2: User Closes Success Modal
1. Generate payment link
2. Complete payment successfully
3. Click "Close" button in success modal
4. Verify: Immediately navigate to FAILED receipt

### Test Case 3: Failed Payment
1. Generate payment link
2. Initiate payment but let it fail
3. Verify: Immediately navigate to FAILED receipt
4. Verify: Receipt shows red X and "Failed" status

### Test Case 4: Pending Payment
1. Generate payment link
2. Payment enters pending state
3. Verify: Navigate to PENDING receipt
4. Verify: Receipt shows orange clock and "Pending" status

## Future Enhancements

1. **Receipt Download**: Implement PDF generation and sharing
2. **Webhook Signature Verification**: Add HMAC-SHA256 verification when Xcel provides it
3. **Push Notifications**: Notify user of payment status updates
4. **Receipt History**: Store and display past transaction receipts
5. **Custom Timeout**: Make 15-second timer configurable
6. **Retry Mechanism**: Add retry for failed/pending payments

## Security Considerations

1. **Webhook Verification**: Always verify webhook signatures in production
2. **HTTPS Only**: Ensure all webhook endpoints use HTTPS
3. **Idempotency**: Handle duplicate webhook calls gracefully
4. **Data Validation**: Validate all webhook payload data
5. **Rate Limiting**: Implement rate limiting on webhook endpoints

## Troubleshooting

### Issue: Payment success not detected
**Solution**: Check console logs for WebView messages. Verify success text matches keywords in payment-helpers.ts

### Issue: Auto-navigation not working
**Solution**: Ensure 15-second timer isn't being cleared prematurely. Check hasNavigatedRef flag.

### Issue: Receipt data missing
**Solution**: Verify all required params are passed when navigating to payment-webview

### Issue: WebView shows blank screen
**Solution**: Check payment link is valid. Verify javaScriptEnabled and domStorageEnabled are true.

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Verify XcelPay merchant credentials
3. Test with XcelPay sandbox environment first
4. Review XcelPay documentation at https://business.xcelapp.com/

## Conclusion

This implementation provides a robust, user-friendly payment experience with automatic status detection and intelligent routing, closely matching the reference PayStack implementation while being tailored specifically for XcelPayGate SDK.
