/**
 * Example: Fetch Merchant Details & Products, then Generate Payment Link
 *
 * This example demonstrates:
 * 1. Fetching merchant details
 * 2. Fetching merchant products (e.g., electricity prepaid/postpaid)
 * 3. Generating a payment link with specific products
 */

import { XcelPayGateClient } from "./src/api/client";
import type { PaymentProduct } from "./src/types";

const config = {
  merchantId: "YOUR_MERCHANT_ID", // ENEO Cameroon merchant
  publicKey: "YOUR_PUBLIC_KEY",
};

async function demonstrateFullFlow() {
  const client = new XcelPayGateClient(config);

  console.log("=== Step 1: Fetch Merchant Details ===\n");
  try {
    const merchantDetails = await client.getMerchantDetails();
    console.log("Merchant Name:", merchantDetails.data.data.reg_name);
    console.log("Merchant ID:", merchantDetails.data.data.merchant_id);
    console.log("Currency:", merchantDetails.data.data.currency.currency_code);
    console.log("Country:", merchantDetails.data.data.currency.country);
    console.log("Merchant Type:", merchantDetails.data.data.nature);
    console.log("\n");
  } catch (error) {
    console.error("Error fetching merchant details:", error);
  }

  console.log("=== Step 2: Fetch Merchant Products ===\n");
  let selectedProductId: string | null = null;

  try {
    const productsResponse = await client.getMerchantProducts();

    if (productsResponse.data?.data && productsResponse.data.data.length > 0) {
      console.log(`Found ${productsResponse.data.data.length} products:\n`);

      productsResponse.data.data.forEach((product, index) => {
        console.log(`Product ${index + 1}:`);
        console.log(`  ID: ${product.product_id}`);
        console.log(`  Name: ${product.name}`);
        console.log(`  Payment Code: ${product.payment_code}`);
        console.log(`  Product Type: ${product.product_type}`);
        console.log(`  Active: ${product.active.status}`);
        console.log(`  Web Enabled: ${product.web}`);
        console.log(`  Wallet: ${product.wallet}`);
        console.log("");

        // Find electricity prepaid or postpaid product
        if (
          product.name.toLowerCase().includes("electricity") ||
          product.name.toLowerCase().includes("prepaid") ||
          product.name.toLowerCase().includes("postpaid")
        ) {
          selectedProductId = product.product_id;
          console.log(
            `✓ Selected Product: ${product.name} (${product.product_id})\n`
          );
        }
      });

      // If no electricity product found, use the first active product
      if (!selectedProductId && productsResponse.data.data.length > 0) {
        const firstActive = productsResponse.data.data.find(
          (p) => p.active.status && p.web
        );
        if (firstActive) {
          selectedProductId = firstActive.product_id;
          console.log(
            `✓ Using first active product: ${firstActive.name} (${firstActive.product_id})\n`
          );
        }
      }
    } else {
      console.log("No products found for this merchant.\n");
    }
  } catch (error) {
    console.error("Error fetching merchant products:", error);
  }

  console.log("=== Step 3: Generate Payment Link with Product ===\n");

  try {
    // Build products array for payment
    const products: PaymentProduct[] = selectedProductId
      ? [
          {
            product_id: selectedProductId,
            amount: "1000", // Amount for this specific product (e.g., 1000 XAF)
          },
        ]
      : [];

    const paymentRequest = {
      amount: "1000", // Total amount
      products, // Include the products array with product_id
      currency: "XAF", // Cameroon uses XAF currency
      client_transaction_id: `TXN-${Date.now()}`,
      customer_email: "customer@example.com",
      customer_phone: "237233429972", // Cameroon phone format
      description: "Payment for electricity bill",
      channel: "WEB" as const,
      metadata: {
        cart_id: "CART123456",
        promo_code: "WELCOME10",
      },
      webhook_url: "https://merchant.example.com/webhook",
      redirect_url: "https://merchant.example.com/payment-success",
    };

    console.log("Payment Request Payload:");
    console.log(JSON.stringify(paymentRequest, null, 2));
    console.log("\n");

    const paymentResponse = await client.generatePaymentLink(paymentRequest);

    console.log("✓ Payment Link Generated Successfully!\n");
    console.log("Transaction ID:", paymentResponse.data.transaction_id);
    console.log("Payment Code:", paymentResponse.data.payment_code);
    console.log("Payment Link:", paymentResponse.data.payment_link);
    console.log("Amount:", paymentResponse.data.amount);
    console.log("Currency:", paymentResponse.data.currency);
    console.log("Expires At:", paymentResponse.data.expires_at);
    console.log("\n");
    console.log("Customer can now use this link to complete payment.");
  } catch (error) {
    console.error("Error generating payment link:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
  }
}

// Run the demonstration
demonstrateFullFlow().catch(console.error);
