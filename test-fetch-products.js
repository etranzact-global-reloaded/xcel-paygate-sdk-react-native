/**
 * Test script to fetch merchant details and products
 * This will log the actual structure from the API
 */

const MERCHANT_ID = "yFhi7ApMr";
const PUBLIC_KEY = "XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205";
const BASE_URL = "https://api.xcelapp.com";

async function fetchMerchantProducts() {
  console.log("=== Fetching Merchant Details ===\n");

  try {
    // Fetch merchant details
    const merchantResponse = await fetch(
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

    if (!merchantResponse.ok) {
      throw new Error(
        `Merchant details request failed: ${merchantResponse.statusText}`
      );
    }

    const merchantData = await merchantResponse.json();
    console.log("Merchant Details Response:");
    console.log(JSON.stringify(merchantData, null, 2));
    console.log("\n");

    console.log("Merchant Name:", merchantData.data?.data?.reg_name);
    console.log("Currency:", merchantData.data?.data?.currency?.currency_code);
    console.log("\n");
  } catch (error) {
    console.error("Error fetching merchant details:", error.message);
  }

  console.log("=== Fetching Merchant Products ===\n");

  try {
    // Fetch products
    const productsResponse = await fetch(
      `${BASE_URL}/xas/v1/products/${MERCHANT_ID}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-merchant-id": MERCHANT_ID,
          "x-public-key": PUBLIC_KEY,
        },
      }
    );

    if (!productsResponse.ok) {
      throw new Error(
        `Products request failed: ${productsResponse.statusText}`
      );
    }

    const productsData = await productsResponse.json();

    console.log("Products Response:");
    console.log(JSON.stringify(productsData, null, 2));
    console.log("\n");

    if (productsData.data && Array.isArray(productsData.data)) {
      console.log(`\nFound ${productsData.data.length} products:\n`);

      productsData.data.forEach((product, index) => {
        console.log(`Product ${index + 1}:`);
        console.log("  Raw Product Data:", JSON.stringify(product, null, 2));
        console.log("");
      });

      // Show first product structure in detail
      if (productsData.data.length > 0) {
        console.log("\n=== First Product Structure (for reference) ===");
        console.log(JSON.stringify(productsData.data[0], null, 2));
      }
    } else {
      console.log("No products found or unexpected response structure");
    }
  } catch (error) {
    console.error("Error fetching products:", error.message);
  }
}

// Run the test
fetchMerchantProducts().catch(console.error);
