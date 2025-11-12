import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, ScrollView, Pressable, Alert, ActivityIndicator, View, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useCheckout, usePaymentPolling } from '@/src/hooks/use-xcel-paygate';
import { getXcelConfig } from '@/src/config';
import { XcelPayGateClient } from '@/src/api/client';
import type { MerchantProduct, PaymentProduct } from '@/src/types';

export default function PaymentScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('1000');
  const [email, setEmail] = useState('customer@example.com');
  const [phone, setPhone] = useState('237233429972'); // Cameroon format
  const [description, setDescription] = useState('Payment for electricity bill');

  // Products state
  const [products, setProducts] = useState<MerchantProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [merchantName, setMerchantName] = useState<string>('');
  const [showProductModal, setShowProductModal] = useState(false);

  // Get config from background
  const config = getXcelConfig();

  const { initiatePayment, checkStatus, loading, error, paymentLink, paymentCode, transaction } =
    useCheckout(config);

  // Polling is disabled - we're only monitoring the generate-payment-link response
  const { result: pollingResult, isPolling } = usePaymentPolling(config, paymentCode, {
    enabled: false,
    maxAttempts: 24,
    intervalMs: 5000,
  });

  // Fetch merchant details and products on mount
  useEffect(() => {
    const fetchMerchantData = async () => {
      setLoadingProducts(true);
      const client = new XcelPayGateClient(config);

      try {
        console.log('=== Fetching Merchant Details ===');
        const merchantDetails = await client.getMerchantDetails();
        setMerchantName(merchantDetails.data.data.reg_name);
        console.log('Merchant Name:', merchantDetails.data.data.reg_name);

        console.log('\n=== Fetching Merchant Products ===');
        const productsResponse = await client.getMerchantProducts();

        if (productsResponse.data?.data && productsResponse.data.data.length > 0) {
          setProducts(productsResponse.data.data);
          console.log(`Found ${productsResponse.data.data.length} products`);

          // Auto-select first active product
          const firstActive = productsResponse.data.data.find(p => p.active.status && p.web);
          if (firstActive) {
            setSelectedProductId(firstActive.product_id);
            console.log('Auto-selected product:', firstActive.name);
          }
        }
      } catch (err) {
        console.error('Error fetching merchant data:', err);
        Alert.alert('Warning', 'Could not load merchant products');
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchMerchantData();
  }, []);

  const handleInitiatePayment = async () => {
    try {
      // Build products array if a product is selected
      const paymentProducts: PaymentProduct[] = selectedProductId
        ? [
            {
              product_id: selectedProductId,
              amount: amount,
            }
          ]
        : [];

      console.log('=== Initiating Payment ===');
      console.log('Amount:', amount);
      console.log('Products:', JSON.stringify(paymentProducts, null, 2));

      const response = await initiatePayment({
        amount,
        products: paymentProducts, // Include products in payment request
        currency: 'XAF', // Cameroon uses XAF
        client_transaction_id: `TXN-${Date.now()}`,
        customer_email: email,
        customer_phone: phone,
        description,
        channel: 'WEB',
        metadata: {
          cart_id: `CART${Date.now()}`,
          product_id: selectedProductId || 'none',
        },
        redirect_url: 'https://business.xcelapp.com/#/auth',
        webhook_url: 'https://merchant.example.com/webhook',
      });

      // Get the payment link from the response
      const generatedLink = response.data.payment_link;

      console.log('✓ Payment Link Generated:', generatedLink);

      // Navigate directly to payment webview with payment details
      router.push({
        pathname: '/payment-webview',
        params: {
          paymentLink: generatedLink,
          paymentCode: response.data.payment_code,
          amount: amount,
          currency: 'XAF',
          description: description,
        },
      });
    } catch (err) {
      console.error('Payment Error:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create payment link');
    }
  };

  const handleCheckStatus = async () => {
    if (!paymentCode) {
      Alert.alert('Error', 'No payment code available');
      return;
    }

    try {
      const txn = await checkStatus();
      Alert.alert('Payment Status', `Status: ${txn.status}\nAmount: ${txn.amount} ${txn.currency}`);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to check status');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          XCEL PayGate
        </ThemedText>

        {merchantName && (
          <ThemedView style={styles.merchantBanner}>
            <ThemedText style={styles.merchantText}>{merchantName}</ThemedText>
          </ThemedView>
        )}

        {loadingProducts && (
          <ThemedView style={styles.loadingSection}>
            <ActivityIndicator size="small" color="#007AFF" />
            <ThemedText style={styles.loadingText}>Loading products...</ThemedText>
          </ThemedView>
        )}

        {products.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Select Product Type
            </ThemedText>
            <ThemedText style={styles.label}>Electricity Type</ThemedText>

            {/* Pressable selector that opens bottom sheet */}
            <Pressable
              style={styles.pickerButton}
              onPress={() => setShowProductModal(true)}>
              <ThemedText style={styles.pickerButtonText}>
                {selectedProductId
                  ? products.find(p => p.product_id === selectedProductId)?.name || 'Select Product'
                  : 'Select Product'}
              </ThemedText>
              <ThemedText style={styles.pickerButtonIcon}>▼</ThemedText>
            </Pressable>

            {selectedProductId && (
              <ThemedView style={styles.selectedProductInfo}>
                <ThemedText style={styles.infoLabel}>Payment Code:</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {products.find(p => p.product_id === selectedProductId)?.payment_code}
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        )}

        {/* Bottom Sheet Modal for Product Selection */}
        <Modal
          visible={showProductModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowProductModal(false)}>
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowProductModal(false)}>
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <ThemedText type="subtitle" style={styles.modalTitle}>
                  Select Electricity Type
                </ThemedText>
                <Pressable onPress={() => setShowProductModal(false)}>
                  <ThemedText style={styles.modalClose}>✕</ThemedText>
                </Pressable>
              </View>

              <ScrollView style={styles.modalProductList}>
                {products
                  .filter(p => p.active.status && p.web)
                  .map((product) => (
                    <Pressable
                      key={product.product_id}
                      style={[
                        styles.modalProductItem,
                        selectedProductId === product.product_id && styles.modalProductItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedProductId(product.product_id);
                        setShowProductModal(false);
                        console.log('Selected product:', product.name);
                      }}>
                      <View style={styles.modalProductContent}>
                        <ThemedText style={styles.modalProductName}>
                          {product.name.trim()}
                        </ThemedText>
                        <ThemedText style={styles.modalProductCode}>
                          {product.payment_code}
                        </ThemedText>
                      </View>
                      {selectedProductId === product.product_id && (
                        <ThemedText style={styles.modalProductCheck}>✓</ThemedText>
                      )}
                    </Pressable>
                  ))}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Payment Details
          </ThemedText>

          <ThemedText style={styles.label}>Amount (XAF)</ThemedText>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor="#999"
            keyboardType="decimal-pad"
          />

          <ThemedText style={styles.label}>Customer Email</ThemedText>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="customer@example.com"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <ThemedText style={styles.label}>Customer Phone</ThemedText>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="233244000000"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
          />

          <ThemedText style={styles.label}>Description</ThemedText>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Payment description"
            placeholderTextColor="#999"
          />
        </ThemedView>

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleInitiatePayment}
          disabled={loading}>
          <ThemedText style={styles.buttonText}>
            {loading ? 'Processing...' : 'Generate Payment Link'}
          </ThemedText>
        </Pressable>

        {paymentCode && (
          <ThemedView style={styles.resultSection}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Payment Created
            </ThemedText>

            <ThemedText style={styles.resultLabel}>Payment Code:</ThemedText>
            <ThemedText style={styles.resultValue}>{paymentCode}</ThemedText>

            {isPolling && (
              <ThemedText style={styles.pollingText}>Checking payment status...</ThemedText>
            )}

            {transaction && (
              <>
                <ThemedText style={styles.resultLabel}>Status:</ThemedText>
                <ThemedText style={[styles.resultValue, styles.statusText]}>
                  {transaction.status}
                </ThemedText>

                <ThemedText style={styles.resultLabel}>Transaction ID:</ThemedText>
                <ThemedText style={styles.resultValue}>{transaction.transaction_id}</ThemedText>
              </>
            )}

            {pollingResult && pollingResult.status === 'SUCCESS' && (
              <ThemedView style={styles.successBanner}>
                <ThemedText style={styles.successText}>✓ Payment Successful</ThemedText>
              </ThemedView>
            )}

            <Pressable style={styles.secondaryButton} onPress={handleCheckStatus}>
              <ThemedText style={styles.secondaryButtonText}>Check Status Manually</ThemedText>
            </Pressable>

            {paymentLink && (
              <Pressable
                style={styles.secondaryButton}
                onPress={() =>
                  router.push({
                    pathname: '/payment-webview',
                    params: {
                      paymentLink,
                      paymentCode: paymentCode || '',
                      amount: amount,
                      currency: 'XAF',
                      description: description,
                    },
                  })
                }>
                <ThemedText style={styles.secondaryButtonText}>Open Payment Page</ThemedText>
              </Pressable>
            )}
          </ThemedView>
        )}

        {error && (
          <ThemedView style={styles.errorBox}>
            <ThemedText style={styles.errorText}>{error.message}</ThemedText>
          </ThemedView>
        )}

        <ThemedView style={styles.infoSection}>
          <ThemedText style={styles.infoText}>
            Merchant ID: {config.merchantId}
          </ThemedText>
          <ThemedText style={styles.infoText}>
            Configure credentials in src/config/index.ts
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    marginBottom: 24,
    textAlign: 'center',
  },
  merchantBanner: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  merchantText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  loadingText: {
    marginLeft: 12,
    color: '#666',
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  sectionTitle: {
    marginBottom: 16,
  },
  pickerButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  pickerButtonIcon: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  selectedProductInfo: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalClose: {
    fontSize: 24,
    color: '#666',
    padding: 4,
  },
  modalProductList: {
    paddingHorizontal: 20,
  },
  modalProductItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  modalProductItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  modalProductContent: {
    flex: 1,
  },
  modalProductName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000',
  },
  modalProductCode: {
    fontSize: 12,
    color: '#666',
  },
  modalProductCheck: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: 'bold',
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  resultSection: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#e8f5e9',
    marginBottom: 16,
  },
  resultLabel: {
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 14,
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  pollingText: {
    marginTop: 12,
    fontStyle: 'italic',
    color: '#666',
  },
  successBanner: {
    backgroundColor: '#4caf50',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  successText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorBox: {
    backgroundColor: '#ffebee',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    color: '#c62828',
  },
  infoSection: {
    marginTop: 24,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
});
