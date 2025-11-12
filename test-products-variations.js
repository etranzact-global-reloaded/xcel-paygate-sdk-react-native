/**
 * Test different variations to fetch products
 */

const MERCHANT_ID = 'yFhi7ApMr';
const PUBLIC_KEY = 'XCLPUBK_LIVE-9d3fc6d0c281d646b4f4d3d70acf260216da47fe';
const BASE_URL = 'https://api.xcelapp.com';

async function testVariation1() {
  console.log('=== Variation 1: With both headers ===');
  try {
    const response = await fetch(
      `${BASE_URL}/xas/v1/products/${MERCHANT_ID}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-merchant-id': MERCHANT_ID,
          'x-public-key': PUBLIC_KEY,
        },
      }
    );

    console.log('Status:', response.status, response.statusText);
    const data = await response.text();
    console.log('Response:', data);
    console.log('\n');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function testVariation2() {
  console.log('=== Variation 2: Without authentication ===');
  try {
    const response = await fetch(
      `${BASE_URL}/xas/v1/products/${MERCHANT_ID}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Status:', response.status, response.statusText);
    const data = await response.text();
    console.log('Response:', data);
    console.log('\n');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function testVariation3() {
  console.log('=== Variation 3: Only merchant ID header ===');
  try {
    const response = await fetch(
      `${BASE_URL}/xas/v1/products/${MERCHANT_ID}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-merchant-id': MERCHANT_ID,
        },
      }
    );

    console.log('Status:', response.status, response.statusText);
    const data = await response.text();
    console.log('Response:', data);
    console.log('\n');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function testVariation4() {
  console.log('=== Variation 4: Try Authorization header ===');
  try {
    const response = await fetch(
      `${BASE_URL}/xas/v1/products/${MERCHANT_ID}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PUBLIC_KEY}`,
        },
      }
    );

    console.log('Status:', response.status, response.statusText);
    const data = await response.text();
    console.log('Response:', data);
    console.log('\n');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function runAllTests() {
  await testVariation1();
  await testVariation2();
  await testVariation3();
  await testVariation4();
}

runAllTests().catch(console.error);
