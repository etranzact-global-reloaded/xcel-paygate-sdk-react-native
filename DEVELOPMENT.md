# Development Guide

This document explains how to work on the SDK and run the example app.

## Project Structure

```
xcel-paygate-sdk/
├── src/                    # SDK source code
│   ├── api/               # API client
│   ├── context/           # React Context (Provider)
│   ├── hooks/             # React hooks
│   ├── services/          # Service classes
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
│
├── app/                    # Example Expo app (for development)
│   ├── index.tsx          # Main payment screen example
│   ├── payment-webview.tsx # WebView example
│   └── payment-receipt.tsx # Receipt display example
│
├── dist/                   # Built SDK (generated)
└── example/                # Branch with full Expo example
```

## Setup for Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the SDK

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

### 3. Run the Example App

The `app/` folder contains a working Expo app that demonstrates all SDK features.

**Note:** The example app is only available on the `example` branch. The `main` branch contains just the SDK.

#### Switch to Example Branch

```bash
git checkout example
npm install
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## What the Example App Demonstrates

### 1. **Payment Initiation** (`app/index.tsx`)
- Using `XcelPayGateProvider` to configure SDK
- Using `useCheckout()` hook
- Generating payment links
- Fetching merchant products
- Product selection UI

### 2. **WebView Integration** (`app/payment-webview.tsx`)
- Displaying payment in WebView
- Using `usePaymentCompletion()` hook
- Handling navigation state changes
- Detecting payment success/failure

### 3. **Receipt Display** (`app/payment-receipt.tsx`)
- Showing payment receipt
- Using `PaymentReceiptData` type
- Receipt formatting and styling

## Branch Strategy

- **`main`** - Clean SDK only (what gets published to npm)
- **`example`** - Full Expo app with all dependencies for testing

## Development Workflow

### Making Changes to the SDK

1. Make changes in `src/`
2. Build the SDK: `npm run build`
3. Test in example app:
   ```bash
   git stash  # Save current changes
   git checkout example
   git stash pop  # Apply changes
   npm start  # Test changes
   ```

### Testing Before Release

```bash
# Typecheck
npm run typecheck

# Build
npm run build

# Switch to example and test
git checkout example
npm start
```

## Available Scripts

### SDK Scripts (main branch)

```bash
npm run build      # Compile TypeScript
npm run typecheck  # Check types without building
npm run lint       # Lint the code
npm run prepare    # Auto-runs before npm publish
```

### Example App Scripts (example branch)

```bash
npm start          # Start Expo dev server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on web
```

## Example App Configuration

The example app uses `.env` for credentials:

```env
EXPO_PUBLIC_XCEL_MERCHANT_ID=your_merchant_id
EXPO_PUBLIC_XCEL_PUBLIC_KEY=your_public_key
```

See `.env.example` for the template.

## Quick Test Without Expo

You can test SDK functionality without the example app:

```typescript
// Create a test file: test-sdk.ts
import { XcelPayGateClient } from './src';

const client = new XcelPayGateClient({
  merchantId: 'test',
  publicKey: 'test',
});

// Test SDK methods
client.getMerchantDetails().then(console.log);
```

Run with:
```bash
npm run build
node -e "$(cat test-sdk.ts)"
```

## Publishing Checklist

Before publishing to npm:

- [ ] All tests pass on `example` branch
- [ ] TypeScript builds without errors
- [ ] README is up to date
- [ ] Version bumped in `package.json`
- [ ] Changelog updated
- [ ] Git tag created

```bash
git checkout main
npm version patch  # or minor/major
npm run build
npm publish
git push --tags
```

## Troubleshooting

### Build Errors

```bash
# Clean build
rm -rf dist/
npm run build
```

### Example App Not Working

```bash
# Make sure you're on example branch
git checkout example

# Clean install
rm -rf node_modules/
npm install

# Clear Expo cache
npx expo start --clear
```

### TypeScript Errors

```bash
# Check what's wrong
npm run typecheck

# Common fix: regenerate types
npm run build
```

## Getting Help

- SDK Issues: Check the main README.md
- Example App Issues: Check this file
- Questions: Open an issue on GitHub
