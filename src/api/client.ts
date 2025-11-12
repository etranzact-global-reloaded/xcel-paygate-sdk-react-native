import type {
  CreateXcelTransactionRequest,
  GenerateDynamicLinkRequest,
  GenerateDynamicLinkResponse,
  GeneratePaymentLinkRequest,
  GeneratePaymentLinkResponse,
  MerchantDetails,
  MerchantFeesResponse,
  MerchantProductsResponse,
  TransactionDataResponse,
  XcelAccountVerificationResponse,
  XcelPayGateConfig,
  XcelTransactionResponse,
} from "../types";

const DEFAULT_BASE_URL = "https://api.xcelapp.com";
const PAYGATE_BASE_URL = "https://paygate.xcelapp.com";

export class XcelPayGateClient {
  private config: Required<XcelPayGateConfig>;

  constructor(config: XcelPayGateConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || DEFAULT_BASE_URL,
    };
  }

  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "x-merchant-id": this.config.merchantId,
      "x-public-key": this.config.publicKey,
    };
  }

  async generatePaymentLink(
    request: GeneratePaymentLinkRequest
  ): Promise<GeneratePaymentLinkResponse> {
    const headers = this.getHeaders();
    const url = `${this.config.baseUrl}/transactions-service/paygate/generate-payment-link`;

    console.log('=== [XcelPayGate] Generate Payment Link Request ===');
    console.log('URL:', url);
    console.log('Headers:', JSON.stringify(headers, null, 2));
    console.log('Payload:', JSON.stringify(request, null, 2));

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
    });

    console.log('=== [XcelPayGate] Generate Payment Link Response ===');
    console.log('Status Code:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Response Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error Response Body:', errorText);
      let errorMessage = `Failed to generate payment link: ${response.statusText}`;
      try {
        const errorData = JSON.parse(errorText);
        console.log('Parsed Error Data:', JSON.stringify(errorData, null, 2));
        errorMessage =
          errorData.message || errorData.status_reason || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    console.log('Success Response Body:', JSON.stringify(responseData, null, 2));

    if (responseData.data) {
      console.log('--- Response Data Details ---');
      console.log('Transaction ID:', responseData.data.transaction_id);
      console.log('Payment Code:', responseData.data.payment_code);
      console.log('Payment Link:', responseData.data.payment_link);
      console.log('Amount:', responseData.data.amount);
      console.log('Currency:', responseData.data.currency);
      console.log('Expires At:', responseData.data.expires_at);
    }

    console.log('=== End Generate Payment Link Response ===\n');

    return responseData;
  }

  async getTransactionData(
    paymentCode: string
  ): Promise<TransactionDataResponse> {
    const headers = this.getHeaders();
    console.log('[XcelPayGate] Get Transaction Data - Headers:', JSON.stringify(headers, null, 2));
    console.log('[XcelPayGate] Get Transaction Data - Payment Code:', paymentCode);

    const response = await fetch(
      `${this.config.baseUrl}/transactions-service/paygate/get-transaction-data/${paymentCode}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get transaction data: ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('[XcelPayGate] Get Transaction Data - Response:', JSON.stringify(responseData, null, 2));
    return responseData;
  }

  async getMerchantDetails(merchantId?: string): Promise<MerchantDetails> {
    const id = merchantId || this.config.merchantId;
    const headers = this.getHeaders();
    console.log('[XcelPayGate] Get Merchant Details - Headers:', JSON.stringify(headers, null, 2));
    console.log('[XcelPayGate] Get Merchant Details - Merchant ID:', id);

    const response = await fetch(
      `${this.config.baseUrl}/business-api/merchant/details/${id}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get merchant details: ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('[XcelPayGate] Get Merchant Details - Response:', JSON.stringify(responseData, null, 2));
    return responseData;
  }

  async getMerchantProducts(merchantId?: string): Promise<MerchantProductsResponse> {
    const id = merchantId || this.config.merchantId;
    const headers = this.getHeaders();
    console.log('[XcelPayGate] Get Merchant Products - Headers:', JSON.stringify(headers, null, 2));
    console.log('[XcelPayGate] Get Merchant Products - Merchant ID:', id);

    const response = await fetch(
      `${this.config.baseUrl}/business-api/merchant/products/${id}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get merchant products: ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('[XcelPayGate] Get Merchant Products - Response:', JSON.stringify(responseData, null, 2));

    if (responseData.data?.data && Array.isArray(responseData.data.data)) {
      console.log('--- Merchant Products ---');
      responseData.data.data.forEach((product: any, index: number) => {
        console.log(`Product ${index + 1}:`);
        console.log('  Product ID:', product.product_id);
        console.log('  Product Name:', product.name);
        console.log('  Active:', product.active.status);
        console.log('  Web Enabled:', product.web);
        console.log('  Payment Code:', product.payment_code);
      });
    }

    return responseData;
  }

  async getMerchantFees(merchantId?: string): Promise<MerchantFeesResponse> {
    const id = merchantId || this.config.merchantId;
    const headers = this.getHeaders();
    console.log('[XcelPayGate] Get Merchant Fees - Headers:', JSON.stringify(headers, null, 2));
    console.log('[XcelPayGate] Get Merchant Fees - Merchant ID:', id);

    const response = await fetch(
      `${this.config.baseUrl}/transactions-service/merchant/charge-customer/${id}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get merchant fees: ${response.statusText}`);
    }

    return response.json();
  }

  async getMerchantAccounts(merchantId?: string): Promise<any> {
    const id = merchantId || this.config.merchantId;
    const headers = this.getHeaders();
    console.log('[XcelPayGate] Get Merchant Accounts - Headers:', JSON.stringify(headers, null, 2));
    console.log('[XcelPayGate] Get Merchant Accounts - Merchant ID:', id);

    const response = await fetch(
      `${this.config.baseUrl}/business-api/merchant/pos/${id}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get merchant accounts: ${response.statusText}`
      );
    }

    return response.json();
  }

  async verifyXcelAccount(
    countryCode: string,
    phoneNumber: string
  ): Promise<XcelAccountVerificationResponse> {
    const headers = this.getHeaders();
    console.log('[XcelPayGate] Verify Xcel Account - Headers:', JSON.stringify(headers, null, 2));
    console.log('[XcelPayGate] Verify Xcel Account - Country Code:', countryCode, 'Phone Number:', phoneNumber);

    const response = await fetch(
      `${this.config.baseUrl}/xas/v1/accounts/users/${countryCode}/${phoneNumber}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to verify XCEL account: ${response.statusText}`);
    }

    return response.json();
  }

  async generateDynamicLink(
    request: GenerateDynamicLinkRequest
  ): Promise<GenerateDynamicLinkResponse> {
    const headers = this.getHeaders();
    console.log('[XcelPayGate] Generate Dynamic Link - Headers:', JSON.stringify(headers, null, 2));
    console.log('[XcelPayGate] Generate Dynamic Link - Payload:', JSON.stringify(request, null, 2));

    const response = await fetch(
      `${this.config.baseUrl}/esa/otp/generate/dynamic-link`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to generate dynamic link: ${response.statusText}`
      );
    }

    return response.json();
  }

  async createXcelTransaction(
    request: CreateXcelTransactionRequest
  ): Promise<XcelTransactionResponse> {
    const headers = this.getHeaders();
    console.log('[XcelPayGate] Create Xcel Transaction - Headers:', JSON.stringify(headers, null, 2));
    console.log('[XcelPayGate] Create Xcel Transaction - Payload:', JSON.stringify(request, null, 2));

    const response = await fetch(
      `${this.config.baseUrl}/xas/v1/pos/create_transaction`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to create XCEL transaction: ${response.statusText}`
      );
    }

    return response.json();
  }

  async getXcelTransactionStatus(
    merchantId: string,
    externalReference: string
  ): Promise<XcelTransactionResponse> {
    const headers = this.getHeaders();
    console.log('[XcelPayGate] Get Xcel Transaction Status - Headers:', JSON.stringify(headers, null, 2));
    console.log('[XcelPayGate] Get Xcel Transaction Status - Merchant ID:', merchantId, 'External Reference:', externalReference);

    const response = await fetch(
      `${this.config.baseUrl}/xas/v1/pos/transaction/${merchantId}/${externalReference}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to get transaction status: ${response.statusText}`
      );
    }

    return response.json();
  }

  getCheckoutUrl(merchantId?: string): string {
    const id = merchantId || this.config.merchantId;
    return `${PAYGATE_BASE_URL}/pay/${id}`;
  }

  getFullPaymentUrl(paymentCode: string, merchantId?: string): string {
    const checkoutUrl = this.getCheckoutUrl(merchantId);
    return `${checkoutUrl}?code=${paymentCode}`;
  }
}
