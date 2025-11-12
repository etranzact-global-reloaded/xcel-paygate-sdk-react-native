// Core Types
export interface XcelPayGateConfig {
  merchantId: string;
  publicKey: string;
  baseUrl?: string;
}

export interface PaymentProduct {
  product_id: string;
  amount: string;
}

export interface CustomTransactionInput {
  label: string;
  placeHolder: string;
  type: 'input' | 'select';
  options?: { k: string; v: string }[];
  required: boolean;
}

export interface CustomTransaction {
  editAmt?: boolean;
  minAmt?: number;
  maxAmt?: number;
  borderTheme?: string;
  receiptSxMsg?: string;
  receiptFeedbackPhone?: string;
  receiptFeedbackEmail?: string;
  payLinkExpiryInDays?: number;
  payLinkCanPayMultipleTimes?: boolean;
  displayPicture?: string;
  xtraCustomerInput?: CustomTransactionInput[];
}

export interface GeneratePaymentLinkRequest {
  amount: string;
  currency: string;
  client_transaction_id: string;
  customer_email: string;
  customer_phone: string;
  description: string;
  channel: 'WEB' | 'MOBILE';
  metadata?: Record<string, any>;
  redirect_url: string;
  webhook_url?: string;
  products?: PaymentProduct[];
  customTxn?: CustomTransaction;
}

export interface GeneratePaymentLinkResponse {
  status: string;
  status_reason: string;
  data: {
    transaction_id: string;
    client_transaction_id: string;
    payment_code: string;
    payment_link: string;
    amount: number;
    metadata?: Record<string, any>;
    currency: string;
    public_key: string;
    expires_at: string;
  };
}

export interface TransactionData {
  _id: string;
  transaction_id: string;
  payment_code: string;
  merchant_id: string;
  expires_at: string;
  amount: number;
  products: PaymentProduct[];
  currency: string;
  country_code: string;
  client_transaction_id: string;
  customer_email: string;
  customer_phone: string;
  description: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  channel: string;
  redirect_url: string;
  public_key: string;
  webhook_url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionDataResponse {
  status: string;
  status_reason: string;
  data: TransactionData;
}

export interface MerchantBank {
  country_code: string;
  bank_code: string;
  sort_code: string;
  account_no: string;
  bank_name: string;
}

export interface MerchantCurrency {
  country: string;
  calling_code: string;
  currency_code: string;
  numeric_code: string;
  iso_code_2: string;
  iso_code_3: string;
  currency_sign: string;
}

export interface MerchantDirector {
  idCard: string;
  proofOfAddress: string;
  name: string;
  phone: string;
  email: string;
}

export interface MerchantUtility {
  utility: boolean;
  type: string;
}

export interface MerchantDetailsData {
  _id: string;
  merchant_id: string;
  inc_no: string;
  country_code: string;
  reg_name: string;
  reg_address: string;
  street_name: string;
  town: string;
  state: string;
  zip_code: string;
  ent_type: string;
  nature: string;
  remote: boolean;
  trans_type: string;
  volume: string;
  value: string;
  merchant_default_wallet: string;
  date: string;
  org_no: string;
  bank: MerchantBank;
  currency: MerchantCurrency;
  director: MerchantDirector;
  utility: MerchantUtility;
  activate: boolean;
  closed: boolean;
  payment_options: string[];
  payment_option_fees: any[];
}

export interface MerchantDetails {
  status: boolean;
  meta: Record<string, any>;
  data: {
    data: MerchantDetailsData;
  };
}

export interface MerchantProductActive {
  status: boolean;
  action: string;
  user: string;
  updated_at: string;
  created_at: string;
}

export interface MerchantProductAccount {
  type: string;
  account_id: string;
  accountNumber: string;
  currency: string;
  sortCode: string;
  providerExtraInfo: string;
}

export interface MerchantProductFees {
  percentage: number;
  flat: number;
  minimum_cap: number;
  maximum_cap: number;
}

export interface MerchantProduct {
  _id: string;
  product_id: string;
  name: string;
  wallet: string;
  card_num: string;
  scheme_code: string;
  country_code: string;
  type_code: string;
  level_code: string;
  organization_no: string;
  payment_code: string;
  merchant_id: string;
  callback: string;
  hide: boolean;
  pos: boolean;
  web: boolean;
  active: MerchantProductActive;
  account: MerchantProductAccount;
  bank: MerchantBank;
  fees: MerchantProductFees;
  ussd: boolean;
  channels: string[];
  product_type: string;
  investmentData: any;
  charge_customer: boolean;
  default_product: boolean;
  created_at: string;
  updated_at: string;
  __v: number;
}

export interface MerchantFeesConfig {
  fees_account: string;
  fees: MerchantProductFees;
  _id: string;
  country_code: string;
  level: string;
  type: string;
}

export interface MerchantProductsResponse {
  status: boolean;
  meta: Record<string, any>;
  data: {
    data: MerchantProduct[];
    merchant_fees: MerchantFeesConfig;
  };
}

export interface MerchantFeesProduct {
  product_id: string;
  name: string;
  amount: string;
  fee: number;
  net_amount: number;
}

export interface MerchantFeesResponse {
  data: {
    productDetails: MerchantFeesProduct[];
    totalAmount: number;
  };
  message: string;
  success: boolean;
  status: number;
}

export interface XcelAccount {
  _id: string;
  card_num: string;
  user_id: string;
  identifier: string;
  scheme_code: string;
  account_id: string;
  first_name: string;
  last_name: string;
  email: string;
  currency: string;
  currency_symbol: string;
  country: string;
}

export interface XcelAccountVerificationResponse {
  success: boolean;
  message: string;
  data: XcelAccount[];
}

export interface GenerateDynamicLinkRequest {
  config_preset: string;
  transaction_params: {
    src_amount: number;
    des_amount: number;
    payerId: string;
    payeeId: string;
  };
}

export interface GenerateDynamicLinkResponse {
  status: boolean;
  otp_sid: string;
  message: string;
}

export interface CreateXcelTransactionRequest {
  merchant_id: string;
  payer_wallet_no: string;
  pos_wallet_no: string;
  pos_scheme_code: string;
  description: string;
  international: boolean;
  merchant_country_code: string;
  payer_country_code: string;
  merchant_currency: string;
  payer_currency: string;
  trans_type: string;
  metadata?: Record<string, any>;
  reference_id: string;
  amount: string;
  fees: string;
  products: {
    product_id: string;
    amount: string;
    merchant_fees: string;
  }[];
}

export interface XcelTransactionProduct {
  product_id: string;
  product_name: string;
  merchant_fees: string;
  amount: string;
  des_card_num: string;
}

export interface XcelTransaction {
  _id: string;
  international: boolean;
  isMultipleProductPayment: boolean;
  fees: boolean;
  description: string;
  merchant_id: string;
  merchant_fees: string;
  merchant: boolean;
  amount: string;
  destinationAccountId: string;
  external_reference: string;
  src_wallet_no: string;
  src_scheme: string;
  currency: string;
  dest_wallet_no: string;
  dest_scheme: string;
  des_card_num: string;
  type: string;
  des_currency: string;
  channel_id: string;
  product_id: string;
  products: XcelTransactionProduct[];
  dest_country: string;
  name: string;
  interbank: boolean;
  alias: string;
  src_country: string;
  dest_person: string;
  src_person: string;
  paid: boolean;
  originator_wallet: string;
  originator_scheme_code: string;
  removed: string;
  date: string;
}

export interface XcelTransactionResponse {
  success: boolean;
  message: string;
  data: XcelTransaction;
}

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'PROCESSING';

export interface PaymentResult {
  status: PaymentStatus;
  transaction_id?: string;
  payment_code?: string;
  message: string;
  data?: any;
}

export interface WebhookPayload {
  transaction_id: string;
  client_transaction_id: string;
  payment_code: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  customer_email: string;
  customer_phone: string;
  description: string;
  payment_method?: string;
  paid_at?: string;
  metadata?: Record<string, any>;
  products?: PaymentProduct[];
}

export interface WebViewMessageData {
  type: 'payment_success' | 'payment_failed' | 'payment_pending' | 'close_clicked' | 'dom_check';
  url?: string;
  detected?: string;
  bodyText?: string;
  title?: string;
  hasSuccessIndicator?: boolean;
  hasFailureIndicator?: boolean;
}
