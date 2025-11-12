/**
 * Test with all possible x-headers
 */

const MERCHANT_ID = "yFhi7ApMr";
const PUBLIC_KEY = "XCLPUBK_LIVE-aa88b4d983f51b0c6164d40669490b04ec8f2205";
const BASE_URL = "https://api.xcelapp.com";

async function testWithAllHeaders() {
  console.log("=== Testing with comprehensive headers ===\n");

  const variations = [
    {
      name: "Standard headers",
      headers: {
        "Content-Type": "application/json",
        "x-merchant-id": MERCHANT_ID,
        "x-public-key": PUBLIC_KEY,
      },
    },
    {
      name: "With x-api-key",
      headers: {
        "Content-Type": "application/json",
        "x-merchant-id": MERCHANT_ID,
        "x-public-key": PUBLIC_KEY,
        "x-api-key": PUBLIC_KEY,
      },
    },
    {
      name: "With x-client-id",
      headers: {
        "Content-Type": "application/json",
        "x-merchant-id": MERCHANT_ID,
        "x-public-key": PUBLIC_KEY,
        "x-client-id": MERCHANT_ID,
      },
    },
    {
      name: "With all x-headers",
      headers: {
        "Content-Type": "application/json",
        "x-merchant-id": MERCHANT_ID,
        "x-public-key": PUBLIC_KEY,
        "x-api-key": PUBLIC_KEY,
        "x-client-id": MERCHANT_ID,
      },
    },
  ];

  for (const variation of variations) {
    console.log(`--- ${variation.name} ---`);
    console.log("Headers:", JSON.stringify(variation.headers, null, 2));

    try {
      const response = await fetch(
        `${BASE_URL}/xas/v1/products/${MERCHANT_ID}`,
        {
          method: "GET",
          headers: variation.headers,
        }
      );

      console.log("Status:", response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log("SUCCESS! Response:", JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.log("Error Response:", errorText);
      }
    } catch (error) {
      console.error("Error:", error.message);
    }

    console.log("\n");
  }
}

testWithAllHeaders().catch(console.error);
