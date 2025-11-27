/**
 * Test the complete flow: Fetch merchant details → Fetch products → Generate payment
 */

const MERCHANT_ID = "YOUR_MERCHANT_ID";
const PUBLIC_KEY = "YOUR_PUBLIC_KEY";
const BASE_URL = "https://api.xcelapp.com";

async function testCompleteFlow() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  XCEL PayGate SDK - Complete Payment Flow Test           ║");
  console.log(
    "╚════════════════════════════════════════════════════════════╝\n"
  );

  // Step 1: Fetch Merchant Details
  console.log("📋 STEP 1: Fetching Merchant Details\n");
  console.log("─".repeat(60));

  let merchantData = null;
  try {
    const response = await fetch(
      `${BASE_URL}/business-api/merchant/details/${MERCHANT_ID}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-merchant-id": MERCHANT_ID,
          "x-public-key": PUBLIC_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed: ${response.statusText}`);
    }

    merchantData = await response.json();
    const merchant = merchantData.data.data;

    console.log("✅ Merchant Details Retrieved Successfully!\n");
    console.log(`Merchant Name:    ${merchant.reg_name}`);
    console.log(`Merchant ID:      ${merchant.merchant_id}`);
    console.log(`Nature:           ${merchant.nature}`);
    console.log(
      `Currency:         ${merchant.currency.currency_code} (${merchant.currency.country})`
    );
    console.log(`Default Wallet:   ${merchant.merchant_default_wallet}`);
    console.log(`Active:           ${merchant.activate ? "Yes" : "No"}`);
    console.log("");
  } catch (error) {
    console.error("❌ Error:", error.message);
    return;
  }

  // Step 2: Fetch Products
  console.log("\n📦 STEP 2: Fetching Merchant Products\n");
  console.log("─".repeat(60));

  let selectedProduct = null;
  try {
    const response = await fetch(
      `${BASE_URL}/business-api/merchant/products/${MERCHANT_ID}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-merchant-id": MERCHANT_ID,
          "x-public-key": PUBLIC_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed: ${response.statusText}`);
    }

    const productsData = await response.json();
    const products = productsData.data.data;

    console.log(`✅ Found ${products.length} Products!\n`);

    products.forEach((product, index) => {
      console.log(`Product ${index + 1}: ${product.name}`);
      console.log(`  └─ ID:           ${product.product_id}`);
      console.log(`  └─ Payment Code: ${product.payment_code}`);
      console.log(`  └─ Wallet:       ${product.wallet}`);
      console.log(`  └─ Active:       ${product.active.status ? "✓" : "✗"}`);
      console.log(`  └─ Web Enabled:  ${product.web ? "✓" : "✗"}`);
      console.log("");
    });

    // Select first active web-enabled product (PREPAID)
    selectedProduct = products.find((p) => p.active.status && p.web);

    if (selectedProduct) {
      console.log(`🎯 Selected Product: ${selectedProduct.name}`);
      console.log(`   Product ID: ${selectedProduct.product_id}\n`);
    } else {
      console.log("⚠️  No active web-enabled products found\n");
      return;
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    return;
  }

  // Step 3: Generate Payment Link
  console.log("\n💳 STEP 3: Generating Payment Link with Product\n");
  console.log("─".repeat(60));

  try {
    const paymentPayload = {
      amount: "1000",
      products: [
        {
          product_id: selectedProduct.product_id,
          amount: "1000",
        },
      ],
      currency: merchantData.data.data.currency.currency_code,
      client_transaction_id: `TXN-${Date.now()}`,
      customer_email: "customer@example.com",
      customer_phone: "237233429972",
      description: `Payment for ${selectedProduct.name}`,
      channel: "WEB",
      metadata: {
        product_name: selectedProduct.name,
        product_id: selectedProduct.product_id,
        test: true,
      },
      webhook_url: "https://merchant.example.com/webhook",
      redirect_url: "https://merchant.example.com/success",
    };

    console.log("Request Payload:");
    console.log(JSON.stringify(paymentPayload, null, 2));
    console.log("");

    const response = await fetch(
      `${BASE_URL}/transactions-service/paygate/generate-payment-link`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-merchant-id": MERCHANT_ID,
          "x-public-key": PUBLIC_KEY,
        },
        body: JSON.stringify(paymentPayload),
      }
    );

    console.log(`Response Status: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error Response:", errorText);
      return;
    }

    const paymentData = await response.json();

    console.log("✅ Payment Link Generated Successfully!\n");
    console.log(
      "╔════════════════════════════════════════════════════════════╗"
    );
    console.log(
      "║  PAYMENT DETAILS                                          ║"
    );
    console.log(
      "╚════════════════════════════════════════════════════════════╝\n"
    );
    console.log(`Transaction ID:    ${paymentData.data.transaction_id}`);
    console.log(`Payment Code:      ${paymentData.data.payment_code}`);
    console.log(
      `Amount:            ${paymentData.data.amount} ${paymentData.data.currency}`
    );
    console.log(`Expires At:        ${paymentData.data.expires_at}`);
    console.log("");
    console.log("Payment Link:");
    console.log(`🔗 ${paymentData.data.payment_link}`);
    console.log("");
    console.log("✨ Customer can use this link to complete the payment!\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }

  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  TEST COMPLETED                                           ║");
  console.log(
    "╚════════════════════════════════════════════════════════════╝\n"
  );
}

// Run the test
testCompleteFlow().catch(console.error);
