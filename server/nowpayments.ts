import axios from 'axios';
import { Transaction } from '../shared/schema';

const API_BASE_URL = 'https://api.nowpayments.io/v1';
const API_KEY = process.env.NOWPAYMENTS_API_KEY;

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

interface PaymentStatusResponse {
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
  }

  private getHeaders() {
    return {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  async getStatus(): Promise<{ status: string }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/status`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error checking NOWPayments status:', error);
      throw error;
    }
  }

  async getAvailableCurrencies(): Promise<AvailableCurrency[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/currencies`, {
        headers: this.getHeaders(),
      });
      return response.data.currencies || [];
    } catch (error) {
      console.error('Error getting available currencies:', error);
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
    try {
      // Generate a unique order ID if not provided
      if (!orderId) {
        orderId = `CHICKFARMS-${userId}-${Date.now()}`;
      }

      // Generate a description if not provided
      if (!orderDescription) {
        orderDescription = `Deposit to ChickFarms account (User ID: ${userId})`;
      }

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
      throw error;
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/payment/${paymentId}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error getting payment status for payment ID ${paymentId}:`, error);
      throw error;
    }
  }

  async getMinimumPaymentAmount(currency: string = 'USDT'): Promise<number> {
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