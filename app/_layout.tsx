// @ts-nocheck
/**
 * Root Layout - SDK Provider Setup
 *
 * This file shows how to set up the XcelPayGateProvider at the app root level.
 * The Provider makes SDK configuration available to all child components.
 *
 * NOTE: This is a reference example file.
 * TypeScript checking is disabled because Expo dependencies are not installed on the main branch.
 * When you use this code in your own app, remove the @ts-nocheck comment.
 */

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

// Import the SDK Provider
// When using the published package, you would import from '@xcelapp/paygate-sdk'
// For this example, we import from the local SDK source
import { XcelPayGateProvider } from "../src";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  /**
   * IMPORTANT: In a real app, you would:
   * 1. Store credentials in .env file
   * 2. Use process.env.EXPO_PUBLIC_XCEL_MERCHANT_ID and process.env.EXPO_PUBLIC_XCEL_PUBLIC_KEY
   * 3. Never hardcode credentials in your code
   *
   * Example .env file:
   * EXPO_PUBLIC_XCEL_MERCHANT_ID=your_merchant_id
   * EXPO_PUBLIC_XCEL_PUBLIC_KEY=your_public_key
   */

  return (
    <XcelPayGateProvider
      config={{
        // In production, use environment variables:
        merchantId:
          process.env.EXPO_PUBLIC_XCEL_MERCHANT_ID || "YOUR_MERCHANT_ID",
        publicKey: process.env.EXPO_PUBLIC_XCEL_PUBLIC_KEY || "YOUR_PUBLIC_KEY",

        // Optional: Custom base URL (defaults to production API)
        // baseURL: 'https://api.xcelapp.com',
      }}
    >
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen
            name="payment-webview"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="payment-receipt" options={{ title: "Receipt" }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </XcelPayGateProvider>
  );
}
