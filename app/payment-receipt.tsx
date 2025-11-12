import React from 'react';
import { StyleSheet, View, Pressable, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { PaymentReceiptData, PaymentStatus } from '@/src/types';
import {
  formatCurrency,
  getStatusColor,
  getStatusText,
  getStatusMessage,
} from '@/src/utils/payment-helpers';

export default function PaymentReceiptScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  // Parse receipt data from route params
  const receiptData: PaymentReceiptData = {
    transaction_id: (params.transaction_id as string) || '',
    client_transaction_id: params.client_transaction_id as string | undefined,
    payment_code: (params.payment_code as string) || '',
    status: (params.status as PaymentStatus) || 'PENDING',
    amount: parseFloat((params.amount as string) || '0'),
    currency: (params.currency as string) || 'XAF',
    customer_email: params.customer_email as string | undefined,
    customer_phone: params.customer_phone as string | undefined,
    description: params.description as string | undefined,
    payment_method: (params.payment_method as string) || 'XcelPOS',
    payment_date: (params.payment_date as string) || new Date().toISOString(),
    metadata: params.metadata ? JSON.parse(params.metadata as string) : undefined,
    products: params.products ? JSON.parse(params.products as string) : undefined,
  };

  const statusColor = getStatusColor(receiptData.status);
  const statusText = getStatusText(receiptData.status);
  const statusMessage = getStatusMessage(
    receiptData.status,
    receiptData.amount,
    receiptData.currency
  );

  const handleClose = () => {
    // Navigate back to home or previous screen
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleDownloadReceipt = () => {
    // TODO: Implement receipt download functionality
    // This would typically generate a PDF or share the receipt
    console.log('Download receipt:', receiptData);
    alert('Receipt download feature coming soon!');
  };

  const renderStatusIcon = () => {
    switch (receiptData.status) {
      case 'SUCCESS':
        return (
          <View style={[styles.statusIcon, { backgroundColor: statusColor }]}>
            <ThemedText style={styles.statusIconText}>✓</ThemedText>
          </View>
        );
      case 'FAILED':
        return (
          <View style={[styles.statusIcon, { backgroundColor: statusColor }]}>
            <ThemedText style={styles.statusIconText}>✕</ThemedText>
          </View>
        );
      case 'PENDING':
      case 'PROCESSING':
        return (
          <View style={[styles.statusIcon, { backgroundColor: statusColor }]}>
            <ThemedText style={styles.statusIconText}>⏱</ThemedText>
          </View>
        );
      default:
        return (
          <View style={[styles.statusIcon, { backgroundColor: statusColor }]}>
            <ThemedText style={styles.statusIconText}>i</ThemedText>
          </View>
        );
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Status Icon */}
          <View style={styles.iconContainer}>{renderStatusIcon()}</View>

          {/* Status Title */}
          <ThemedText style={[styles.statusTitle, { color: statusColor }]}>
            Payment {statusText}
          </ThemedText>

          {/* Status Message */}
          <ThemedText style={styles.statusMessage}>{statusMessage}</ThemedText>

          {/* Transaction Details */}
          <View style={styles.divider} />

          <View style={styles.detailsContainer}>
            {/* Transaction Type */}
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Transaction Type</ThemedText>
              <ThemedText style={styles.detailValue}>{receiptData.payment_method}</ThemedText>
            </View>

            {/* Transaction Reference */}
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Transaction Reference</ThemedText>
              <ThemedText style={styles.detailValue} numberOfLines={1}>
                {receiptData.transaction_id || receiptData.payment_code}
              </ThemedText>
            </View>

            {/* Customer Email */}
            {receiptData.customer_email && (
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Email</ThemedText>
                <ThemedText style={styles.detailValue} numberOfLines={1}>
                  {receiptData.customer_email}
                </ThemedText>
              </View>
            )}

            {/* Customer Phone */}
            {receiptData.customer_phone && (
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Phone</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {receiptData.customer_phone}
                </ThemedText>
              </View>
            )}

            {/* Description */}
            {receiptData.description && (
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Description</ThemedText>
                <ThemedText style={styles.detailValue} numberOfLines={2}>
                  {receiptData.description}
                </ThemedText>
              </View>
            )}

            {/* Amount */}
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Amount</ThemedText>
              <ThemedText style={[styles.detailValue, styles.amountText]}>
                {formatCurrency(receiptData.amount, receiptData.currency)}
              </ThemedText>
            </View>

            {/* Status */}
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Status</ThemedText>
              <ThemedText style={[styles.detailValue, { color: statusColor }]}>
                {statusText}
              </ThemedText>
            </View>

            {/* Date */}
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Date</ThemedText>
              <ThemedText style={styles.detailValue}>{receiptData.payment_date}</ThemedText>
            </View>
          </View>

          {/* Products List (if available) */}
          {receiptData.products && receiptData.products.length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.productsContainer}>
                <ThemedText style={styles.productsTitle}>Products</ThemedText>
                {receiptData.products.map((product, index) => (
                  <View key={index} style={styles.productRow}>
                    <ThemedText style={styles.productId}>{product.product_id}</ThemedText>
                    <ThemedText style={styles.productAmount}>
                      {formatCurrency(parseFloat(product.amount), receiptData.currency)}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.button, styles.downloadButton]}
              onPress={handleDownloadReceipt}
            >
              <ThemedText style={styles.downloadButtonText}>Download Receipt</ThemedText>
            </Pressable>

            <Pressable style={[styles.button, styles.closeButton]} onPress={handleClose}>
              <ThemedText style={styles.closeButtonText}>Close</ThemedText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIconText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  statusMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666666',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 24,
  },
  detailsContainer: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productsContainer: {
    marginTop: 8,
  },
  productsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productId: {
    fontSize: 14,
    color: '#666666',
  },
  productAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 32,
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  downloadButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  closeButton: {
    backgroundColor: '#007AFF',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
