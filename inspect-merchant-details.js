/**
 * Inspect merchant details response for product information
 */

const MERCHANT_ID = "yFhi7ApMr";
const PUBLIC_KEY = "XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205";
const BASE_URL = "https://api.xcelapp.com";

async function inspectMerchantDetails() {
  console.log("=== Fetching and Inspecting Merchant Details ===\n");

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
      throw new Error(`Request failed: ${response.statusText}`);
    }

    const data = await response.json();

    console.log("Full Response Structure:");
    console.log(JSON.stringify(data, null, 2));
    console.log("\n");

    // Look for product-related fields
    console.log("=== Searching for Product-Related Fields ===\n");

    const merchantData = data.data?.data;

    // Check various possible product fields
    const productFields = [
      "products",
      "product",
      "default_product",
      "product_list",
      "services",
      "offerings",
      "items",
      "payment_options",
      "payment_config",
    ];

    productFields.forEach((field) => {
      if (merchantData && merchantData[field] !== undefined) {
        console.log(`Found field "${field}":`);
        console.log(JSON.stringify(merchantData[field], null, 2));
        console.log("\n");
      }
    });

    // Check feature_permissions
    if (merchantData?.feature_permissions?.product) {
      console.log(
        "Product Permissions:",
        merchantData.feature_permissions.product
      );
      console.log("\n");
    }

    // Check payment_options and payment_option_fees
    if (merchantData?.payment_options) {
      console.log("Payment Options:", merchantData.payment_options);
      console.log("Payment Option Fees:", merchantData.payment_option_fees);
      console.log("\n");
    }

    // Check if there's a products endpoint hint
    console.log("=== Key Merchant Information ===");
    console.log("Merchant Name:", merchantData?.reg_name);
    console.log("Nature:", merchantData?.nature);
    console.log("Transaction Type:", merchantData?.trans_type);
    console.log("Utility:", merchantData?.utility);
    console.log("Default Product:", merchantData?.default_product);
    console.log("\n");

    // Try to access other potential endpoints
    console.log("=== Attempting Alternative Product Endpoints ===\n");

    // Try merchant/products endpoint
    const endpoints = [
      `/business-api/merchant/products/${MERCHANT_ID}`,
      `/business-api/products/${MERCHANT_ID}`,
      `/xas/v1/merchant/${MERCHANT_ID}/products`,
    ];

    for (const endpoint of endpoints) {
      console.log(`Trying: ${endpoint}`);
      try {
        const testResponse = await fetch(`${BASE_URL}${endpoint}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-merchant-id": MERCHANT_ID,
            "x-public-key": PUBLIC_KEY,
          },
        });

        console.log(
          `  Status: ${testResponse.status} ${testResponse.statusText}`
        );

        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log(
            "  SUCCESS! Response:",
            JSON.stringify(testData, null, 2)
          );
        } else {
          const errorText = await testResponse.text();
          console.log("  Error:", errorText.substring(0, 100));
        }
      } catch (err) {
        console.log("  Error:", err.message);
      }
      console.log("\n");
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

inspectMerchantDetails().catch(console.error);
