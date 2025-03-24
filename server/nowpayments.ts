import axios from 'axios';
import { Transaction } from '../shared/schema';
import { config } from './config';

const API_BASE_URL = 'https://api.nowpayments.io/v1';
const API_KEY = config.nowpayments.apiKey;

interface CreatePaymentResponse {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id?: string;
  order_description?: string;
  ipn_callback_url?: string;
  created_at?: string;
  updated_at?: string;
  purchase_id?: string;
  payment_extra_id?: string;
}

export interface PaymentStatusResponse {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id?: string;
  order_description?: string;
  ipn_callback_url?: string;
  created_at?: string;
  updated_at?: string;
  purchase_id?: string;
  payment_extra_id?: string;
  actually_paid?: number;
  actually_paid_at?: string;
  outcome_amount?: number;
  outcome_currency?: string;
}

interface AvailableCurrency {
  id: number;
  name: string;
  currency: string;
  is_fiat: boolean;
  enabled: boolean;
  min_amount: number;
  max_amount: number;
  image: string;
  network: string;
}

class NOWPaymentsService {
  private apiKey: string;

  constructor() {
    if (!API_KEY) {
      throw new Error('NOWPayments API key is not provided');
    }
    this.apiKey = API_KEY;
    
    // Log initialization for debugging purposes
    console.log('NOWPayments service initialized with key present');
  }

  private getHeaders() {
    return {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  async getStatus(): Promise<{ status: string }> {
    // Check if we're using the test key
    if (this.apiKey === 'dev_test_key_for_ui_testing') {
      console.log('Using mock NOWPayments status response');
      return { status: 'active' };
    }
    
    try {
      const response = await axios.get(`${API_BASE_URL}/status`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error checking NOWPayments status:', error);
      // Return mock status in development
      if (process.env.NODE_ENV !== 'production') {
        return { status: 'active' };
      }
      throw error;
    }
  }

  async getAvailableCurrencies(): Promise<AvailableCurrency[]> {
    // Check if we're using the test key
    if (this.apiKey === 'dev_test_key_for_ui_testing') {
      console.log('Using mock NOWPayments currencies response');
      return [
        { id: 1, name: 'Tether ERC20', currency: 'USDT', is_fiat: false, enabled: true, min_amount: 1, max_amount: 10000, image: '', network: 'ETH' },
        { id: 2, name: 'Tether TRC20', currency: 'USDT', is_fiat: false, enabled: true, min_amount: 1, max_amount: 10000, image: '', network: 'TRX' }
      ];
    }
    
    try {
      const response = await axios.get(`${API_BASE_URL}/currencies`, {
        headers: this.getHeaders(),
      });
      return response.data.currencies || [];
    } catch (error) {
      console.error('Error getting available currencies:', error);
      if (process.env.NODE_ENV !== 'production') {
        return [
          { id: 1, name: 'Tether ERC20', currency: 'USDT', is_fiat: false, enabled: true, min_amount: 1, max_amount: 10000, image: '', network: 'ETH' },
          { id: 2, name: 'Tether TRC20', currency: 'USDT', is_fiat: false, enabled: true, min_amount: 1, max_amount: 10000, image: '', network: 'TRX' }
        ];
      }
      throw error;
    }
  }

  async createPayment(
    amount: number, 
    userId: number,
    currency: string = 'USD',
    payCurrency: string = 'USDT',
    orderId?: string,
    orderDescription?: string,
    callbackUrl?: string
  ): Promise<CreatePaymentResponse> {
    // Generate a unique order ID if not provided
    if (!orderId) {
      orderId = `CHICKFARMS-${userId}-${Date.now()}`;
    }

    // Generate a description if not provided
    if (!orderDescription) {
      orderDescription = `Deposit to ChickFarms account (User ID: ${userId})`;
    }
    
    // Check if we're using the test key
    if (this.apiKey === 'dev_test_key_for_ui_testing') {
      console.log('Using mock NOWPayments create payment response');
      return {
        payment_id: `mock_${Date.now()}`,
        payment_status: 'waiting',
        pay_address: 'TRX8nHHo2Jd7H9ZwKhh6h8h',
        price_amount: amount,
        price_currency: currency,
        pay_amount: amount,
        pay_currency: payCurrency,
        order_id: orderId,
        order_description: orderDescription,
        ipn_callback_url: callbackUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    try {
      const payload = {
        price_amount: amount,
        price_currency: currency,
        pay_currency: payCurrency,
        order_id: orderId,
        order_description: orderDescription,
        ipn_callback_url: callbackUrl,
      };

      const response = await axios.post(
        `${API_BASE_URL}/payment`,
        payload,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating payment:', error);
      if (process.env.NODE_ENV !== 'production') {
        return {
          payment_id: `mock_${Date.now()}`,
          payment_status: 'waiting',
          pay_address: 'TRX8nHHo2Jd7H9ZwKhh6h8h',
          price_amount: amount,
          price_currency: currency,
          pay_amount: amount,
          pay_currency: payCurrency,
          order_id: orderId,
          order_description: orderDescription,
          ipn_callback_url: callbackUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      throw error;
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    // Check if we're using the test key
    if (this.apiKey === 'dev_test_key_for_ui_testing') {
      console.log('Using mock NOWPayments payment status response');
      // If the payment ID starts with 'mock_', it's one of our mock payments
      const isMockPayment = paymentId.startsWith('mock_');
      
      return {
        payment_id: paymentId,
        payment_status: isMockPayment ? 'waiting' : 'finished',
        pay_address: 'TRX8nHHo2Jd7H9ZwKhh6h8h',
        price_amount: 100,
        price_currency: 'USD',
        pay_amount: 100,
        pay_currency: 'USDT',
        order_id: `CHICKFARMS-1-${Date.now()}`,
        order_description: 'Mock payment for testing',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/payment/${paymentId}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error getting payment status for payment ID ${paymentId}:`, error);
      if (process.env.NODE_ENV !== 'production') {
        return {
          payment_id: paymentId,
          payment_status: 'waiting',
          pay_address: 'TRX8nHHo2Jd7H9ZwKhh6h8h',
          price_amount: 100,
          price_currency: 'USD',
          pay_amount: 100,
          pay_currency: 'USDT',
          order_id: `CHICKFARMS-1-${Date.now()}`,
          order_description: 'Mock payment for testing',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      throw error;
    }
  }

  async getMinimumPaymentAmount(currency: string = 'USDT'): Promise<number> {
    // Check if we're using the test key
    if (this.apiKey === 'dev_test_key_for_ui_testing') {
      console.log('Using mock NOWPayments minimum payment amount');
      return 1;
    }
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/min-amount?currency_from=${currency}`,
        { headers: this.getHeaders() }
      );
      return response.data.min_amount || 1;
    } catch (error) {
      console.error(`Error getting minimum payment amount for ${currency}:`, error);
      // Return a default value if the API call fails
      return 1;
    }
  }

  // Helper function to map NOWPayments status to our transaction status
  mapPaymentStatusToTransactionStatus(paymentStatus: string): string {
    const statusMap: Record<string, string> = {
      'waiting': 'pending',
      'confirming': 'pending',
      'confirmed': 'pending',
      'sending': 'pending',
      'partially_paid': 'partial',
      'finished': 'completed',
      'failed': 'failed',
      'refunded': 'refunded',
      'expired': 'expired'
    };

    return statusMap[paymentStatus] || 'pending';
  }
}

export const nowPaymentsService = new NOWPaymentsService();