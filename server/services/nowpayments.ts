import axios from 'axios';
import CryptoJS from 'crypto-js';
import { storage } from '../storage';
import { Transaction } from '../../shared/schema';
import { config } from '../config';

// Interfaces for NOWPayments API
export interface CreatePaymentResponse {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  ipn_callback_url: string;
  created_at: string;
  updated_at: string;
  purchase_id: string;
  payment_url: string;
  invoice_id?: string; // Added for invoice method
}

export interface IPNPayload {
  // All required IPN fields
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  ipn_callback_url: string;
  created_at: string;
  updated_at: string;
  purchase_id: string;
  amount_received: number;
  payin_hash: string;
  currency_sent: string;
  amount_sent: number;
}

export interface PaymentStatusResponse {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  ipn_callback_url: string;
  created_at: string;
  updated_at: string;
  purchase_id: string;
}

export interface MinimumPaymentAmountResponse {
  currency: string;
  min_amount: number;
}

export interface AvailableCurrenciesResponse {
  currencies: string[];
}

/**
 * NOWPayments Service
 * Handles communication with NOWPayments API for cryptocurrency payments
 */
export class NOWPaymentsService {
  private readonly apiKey: string;
  private readonly ipnSecret: string;
  private readonly baseUrl: string;
  private readonly isMockMode: boolean;

  constructor() {
    this.apiKey = process.env.NOWPAYMENTS_API_KEY || '';
    this.ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET_KEY || '';
    
    // Always use production mode
    this.isMockMode = false;
    this.baseUrl = 'https://api.nowpayments.io/v1';
    
    if (!this.apiKey) {
      console.error('[NOWPayments] API key is missing');
    }
    
    if (!this.ipnSecret) {
      console.error('[NOWPayments] IPN secret key is missing');
    }
  }

  /**
   * Get API request headers
   */
  private getHeaders() {
    return {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Check if API keys are configured
   */
  public isConfigured(): boolean {
    return !!this.apiKey && !!this.ipnSecret;
  }

  /**
   * Get API status
   */
  public async getStatus(): Promise<any> {
    try {
      if (!this.apiKey) {
        return { status: 'error', message: 'API key not configured' };
      }

      const response = await axios.get(`${this.baseUrl}/status`, {
        headers: this.getHeaders()
      });
      
      return response.data;
    } catch (error: any) {
      console.error('[NOWPayments] Error checking status:', error.response?.data || error.message);
      return { 
        status: 'error', 
        message: error.response?.data?.message || error.message 
      };
    }
  }

  /**
   * Get minimum payment amount for a specific currency
   */
  public async getMinimumPaymentAmount(currency: string): Promise<number> {
    try {
      const response = await axios.get(`${this.baseUrl}/min-amount?currency=${currency}`, {
        headers: this.getHeaders()
      });
      
      return response.data.min_amount || 1; // Default to 1 if not returned
    } catch (error: any) {
      console.error('[NOWPayments] Error getting minimum amount:', error.response?.data || error.message);
      return 1; // Default minimum amount
    }
  }

  /**
   * Get available currencies
   */
  public async getAvailableCurrencies(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/currencies`, {
        headers: this.getHeaders()
      });
      
      return response.data.currencies || [];
    } catch (error: any) {
      console.error('[NOWPayments] Error getting currencies:', error.response?.data || error.message);
      return ['usdttrc20']; // Default to USDT TRC20
    }
  }

  /**
   * Create a payment using the invoice API
   */
  public async createPayment(
    userId: number, 
    amount: number, 
    description: string, 
    currency: string = 'USDT'
  ): Promise<CreatePaymentResponse> {
    // Convert currency to lowercase for NOWPayments API
    currency = currency.toLowerCase();
    
    // Convert USDT to usdttrc20 for consistency with NOWPayments API
    if (currency === 'usdt') {
      currency = 'usdttrc20';
    }
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Calculate API URLs - Use our production domain for callbacks
      const baseURL = config.nowpayments.callbackDomain || config.urls.productionDomain || config.urls.api || 'http://localhost:5000';
      const callbackUrl = `${baseURL}/api/ipn/nowpayments`;
      const successUrl = `${baseURL}/wallet?payment=success`;
      const cancelUrl = `${baseURL}/wallet?payment=cancelled`;
      const orderId = `user_${userId}_${Date.now()}`;
      
      console.log('[NOWPayments] Creating invoice with NOWPayments API', { 
        amount, 
        currency,
        callbackUrl,
        orderId,
        successUrl,
        cancelUrl
      });
      
      try {
        // Create an invoice - IMPORTANT: Only use supported parameters
        const invoiceResponse = await axios.post(
          `${this.baseUrl}/invoice`,
          {
            price_amount: amount,
            price_currency: currency.toLowerCase(),
            // No pay_currency parameter to allow user to pay in any cryptocurrency
            order_id: orderId,
            order_description: description,
            ipn_callback_url: callbackUrl,
            success_url: successUrl,
            cancel_url: cancelUrl,
            is_fee_paid_by_user: true,
            is_fixed_rate: true  // Fixes exchange rate
          },
          { headers: this.getHeaders() }
        );
        
        console.log('[NOWPayments] Invoice response:', invoiceResponse.data);
        
        // Convert invoice response to payment response format
        // This ensures backward compatibility with existing code
        const paymentResponse: CreatePaymentResponse = {
          payment_id: invoiceResponse.data.id,
          payment_status: 'waiting',
          pay_address: invoiceResponse.data.pay_address || '',
          price_amount: invoiceResponse.data.price_amount,
          price_currency: invoiceResponse.data.price_currency,
          pay_amount: invoiceResponse.data.pay_amount || 0,
          pay_currency: invoiceResponse.data.pay_currency,
          order_id: orderId,
          order_description: description,
          ipn_callback_url: callbackUrl,
          created_at: invoiceResponse.data.created_at,
          updated_at: invoiceResponse.data.created_at,
          purchase_id: invoiceResponse.data.id,
          payment_url: invoiceResponse.data.invoice_url,  // Use invoice_url here
          invoice_id: invoiceResponse.data.id
        };
        
        return paymentResponse;
      } catch (apiError: any) {
        console.error('[NOWPayments] API error:', apiError.response?.data || apiError.message);
        throw new Error(`NOWPayments API error: ${apiError.response?.data?.message || apiError.message}`);
      }
    } catch (error: any) {
      console.error('[NOWPayments] Error creating payment invoice:', error);
      throw new Error(error.message || 'Failed to create payment invoice');
    }
  }

  /**
   * Process IPN notification
   */
  public async processIPNNotification(payload: IPNPayload): Promise<any> {
    try {
      // Extract order ID to get user ID
      const orderIdParts = payload.order_id.split('_');
      if (orderIdParts.length < 2) {
        throw new Error('Invalid order ID format');
      }
      
      const userId = parseInt(orderIdParts[1], 10);
      if (isNaN(userId)) {
        throw new Error('Invalid user ID in order ID');
      }
      
      // Get the user
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      // Check if we already have a transaction for this payment
      const existingTransaction = await this.findTransactionByPaymentId(payload.payment_id);
      
      // Process based on payment status
      let status = 'pending';
      
      switch (payload.payment_status) {
        case 'finished':
        case 'confirmed':
          status = 'completed';
          
          // Only update user balance if this is a new completion
          if (!existingTransaction || existingTransaction.status !== 'completed') {
            // Update user balance
            await storage.updateUserBalance(userId, payload.price_amount);
            console.log(`[NOWPayments] Updated user balance for user ${userId} with amount ${payload.price_amount}`);
          }
          break;
          
        case 'failed':
        case 'expired':
        case 'refunded':
          status = 'failed';
          break;
          
        default:
          // Keep as pending
          break;
      }
      
      if (existingTransaction) {
        // Update the existing transaction
        await storage.updateTransactionStatus(payload.payment_id, status);
        return existingTransaction;
      } else {
        // Create a new transaction record
        const transaction = await storage.createTransaction(
          userId,
          'deposit',
          payload.price_amount,
          payload.payment_id,
          0,
          JSON.stringify(payload)
        );
        return transaction;
      }
    } catch (error: any) {
      console.error('[NOWPayments] Error processing IPN notification:', error);
      throw new Error('Failed to process IPN notification: ' + error.message);
    }
  }

  /**
   * Find transaction by payment ID
   */
  private async findTransactionByPaymentId(paymentId: string): Promise<any> {
    try {
      const transaction = await storage.getTransactionByTransactionId(paymentId);
      return transaction;
    } catch (error) {
      console.error('[NOWPayments] Error finding transaction:', error);
      return null;
    }
  }

  /**
   * Verify IPN signature
   */
  public verifyIPNSignature(payload: string, signature: string): boolean {
    try {
      const hmac = CryptoJS.HmacSHA512(payload, this.ipnSecret);
      const calculatedSignature = hmac.toString(CryptoJS.enc.Hex);
      
      return calculatedSignature === signature;
    } catch (error) {
      console.error('[NOWPayments] Error verifying IPN signature:', error);
      return false;
    }
  }

  /**
   * Get payment status
   */
  public async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/payment/${paymentId}`, {
        headers: this.getHeaders()
      });
      
      return response.data;
    } catch (error: any) {
      console.error('[NOWPayments] Error getting payment status:', error.response?.data || error.message);
      throw new Error(`Failed to get payment status: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Map NOWPayments status to our transaction status
   */
  public mapPaymentStatusToTransactionStatus(paymentStatus: string): string {
    switch (paymentStatus) {
      case 'finished':
      case 'confirmed':
        return 'completed';
      case 'waiting':
      case 'confirming':
      case 'sending':
        return 'pending';
      case 'failed':
      case 'expired':
      case 'refunded':
        return 'failed';
      default:
        return 'pending';
    }
  }
}

// Create singleton instance
export const nowPaymentsService = new NOWPaymentsService();