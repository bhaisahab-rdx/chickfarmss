import axios from 'axios';
import { Transaction } from '../shared/schema';
import { config } from './config';

const API_BASE_URL = 'https://api.nowpayments.io/v1';
const CHECKOUT_API_BASE_URL = 'https://nowpayments.io';
const API_KEY = config.nowpayments.apiKey;

// Function to check if NOWPayments API key is configured
export const isNOWPaymentsConfigured = (): boolean => {
  return !!API_KEY && API_KEY !== 'dev_test_key_for_ui_testing';
};

// Function to check if NOWPayments IPN secret is configured
export const isIPNSecretConfigured = (): boolean => {
  const ipnSecret = config.nowpayments.ipnSecret;
  return !!ipnSecret && ipnSecret !== 'dev_test_secret';
};

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

// A standardized payment status interface for internal use
export interface StandardizedPaymentStatus {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  created_at: string; // Always string in ISO format
  actually_paid: number | null; // Always number or null, never undefined
  actually_paid_at: string | null; // Always string or null, never undefined
  updated_at: string | null; // Always string or null, never undefined
}

/**
 * Helper function to convert a transaction to a standardized payment status object
 * This ensures consistent types throughout the application
 */
export function createStandardizedPaymentStatus(
  paymentId: string,
  transaction: any, // Use any to avoid circular dependencies
  apiPaymentStatus?: PaymentStatusResponse
): StandardizedPaymentStatus {
  // Create base payment status from transaction
  const base: StandardizedPaymentStatus = {
    payment_id: paymentId,
    payment_status: transaction.status === 'pending' ? 'waiting' : transaction.status,
    pay_address: '',
    price_amount: parseFloat(transaction.amount),
    price_currency: 'USDT',
    pay_amount: parseFloat(transaction.amount),
    pay_currency: 'USDT',
    created_at: transaction.createdAt instanceof Date 
      ? transaction.createdAt.toISOString() 
      : String(transaction.createdAt),
    actually_paid: null,
    actually_paid_at: null,
    updated_at: null
  };
  
  // Merge with API payment status if provided
  if (apiPaymentStatus) {
    return {
      ...base,
      ...apiPaymentStatus,
      // Ensure these fields are always properly typed
      created_at: apiPaymentStatus.created_at || base.created_at,
      actually_paid: apiPaymentStatus.actually_paid !== undefined ? apiPaymentStatus.actually_paid : null,
      actually_paid_at: apiPaymentStatus.actually_paid_at || null,
      updated_at: apiPaymentStatus.updated_at || null
    };
  }
  
  return base;
}

export interface CreateInvoiceResponse {
  id: string;
  token_id: string;
  invoice_url: string;
  success: boolean;
  status: string;
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
  private readonly isMockMode: boolean;

  constructor() {
    if (!API_KEY) {
      throw new Error('NOWPayments API key is not provided');
    }
    this.apiKey = API_KEY;
    
    // Check if we're in mock mode (dev testing key)
    this.isMockMode = (this.apiKey === 'dev_test_key_for_ui_testing');
    
    // Log initialization for debugging purposes
    if (this.isMockMode) {
      console.log('NOWPayments service initialized in MOCK MODE - payments will be simulated');
    } else {
      console.log('NOWPayments service initialized with real API key');
    }
  }

  private getHeaders() {
    return {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  async getStatus(): Promise<{ status: string }> {
    try {
      // Even in mock mode, try to connect - it allows better diagnostics
      const response = await axios.get(`${API_BASE_URL}/status`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error checking NOWPayments status:', error);
      
      // If we're in mock mode or development, return a fake status
      if (this.isMockMode || process.env.NODE_ENV !== 'production') {
        console.log('Returning mock status due to API error or mock mode');
        return { status: 'ok' };
      }
      
      // In production with a real key, we should get a real error
      throw error;
    }
  }

  async getAvailableCurrencies(): Promise<AvailableCurrency[]> {
    const mockCurrencies = [
      { id: 1, name: 'Tether ERC20', currency: 'USDT', is_fiat: false, enabled: true, min_amount: 1, max_amount: 10000, image: '', network: 'ETH' },
      { id: 2, name: 'Tether TRC20', currency: 'USDT', is_fiat: false, enabled: true, min_amount: 1, max_amount: 10000, image: '', network: 'TRX' },
      { id: 3, name: 'Bitcoin', currency: 'BTC', is_fiat: false, enabled: true, min_amount: 0.001, max_amount: 5, image: '', network: 'BTC' },
      { id: 4, name: 'Ethereum', currency: 'ETH', is_fiat: false, enabled: true, min_amount: 0.01, max_amount: 50, image: '', network: 'ETH' }
    ];
    
    // If we're in mock mode, return mock currencies immediately
    if (this.isMockMode) {
      console.log('Using mock NOWPayments currencies response (mock mode)');
      return mockCurrencies;
    }
    
    try {
      const response = await axios.get(`${API_BASE_URL}/currencies`, {
        headers: this.getHeaders(),
      });
      return response.data.currencies || [];
    } catch (error) {
      console.error('Error getting available currencies:', error);
      
      // In development or if there's an API error, return mock currencies
      if (process.env.NODE_ENV !== 'production') {
        console.log('Returning mock currencies due to API error');
        return mockCurrencies;
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
    
    // If we're in mock mode, return a mock payment
    if (this.isMockMode) {
      console.log('Using mock NOWPayments create payment response (mock mode)');
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

      console.log('Creating NOWPayments payment with payload:', {
        ...payload,
        api_key: '[REDACTED]' // Don't log the actual API key
      });

      const response = await axios.post(
        `${API_BASE_URL}/payment`,
        payload,
        { headers: this.getHeaders() }
      );

      console.log('Successfully created NOWPayments payment:', {
        payment_id: response.data.payment_id,
        payment_status: response.data.payment_status,
        price_amount: response.data.price_amount
      });

      return response.data;
    } catch (error: any) {
      console.error('Error creating payment:', error);
      
      // Log more detailed error information
      if (error.response) {
        console.error('Error response from NOWPayments API:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('Returning mock payment due to API error in development');
        return {
          payment_id: `mock_error_${Date.now()}`,
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
    // If we're in mock mode, return a mock payment status
    if (this.isMockMode) {
      console.log('Using mock NOWPayments payment status response (mock mode)');
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
      console.log(`Checking status for payment ID: ${paymentId}`);
      
      const response = await axios.get(
        `${API_BASE_URL}/payment/${paymentId}`,
        { headers: this.getHeaders() }
      );
      
      console.log(`Payment status for ${paymentId}:`, {
        status: response.data.payment_status,
        updated_at: response.data.updated_at
      });
      
      return response.data;
    } catch (error: any) {
      console.error(`Error getting payment status for payment ID ${paymentId}:`, error);
      
      // Log more detailed error information
      if (error.response) {
        console.error('Error response from NOWPayments API:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('Returning mock payment status due to API error in development');
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
    // If we're in mock mode, return a mock minimum amount
    if (this.isMockMode) {
      console.log('Using mock NOWPayments minimum payment amount (mock mode)');
      return 1;
    }
    
    try {
      console.log(`Getting minimum payment amount for currency: ${currency}`);
      
      const response = await axios.get(
        `${API_BASE_URL}/min-amount?currency_from=${currency}`,
        { headers: this.getHeaders() }
      );
      
      const minAmount = response.data.min_amount || 1;
      console.log(`Minimum payment amount for ${currency}: ${minAmount}`);
      
      return minAmount;
    } catch (error: any) {
      console.error(`Error getting minimum payment amount for ${currency}:`, error);
      
      // Log more detailed error information
      if (error.response) {
        console.error('Error response from NOWPayments API:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      // Return a default value if the API call fails
      return 1;
    }
  }
  
  /**
   * Creates an invoice using NOWPayments checkout form
   * This generates a URL that opens the NOWPayments popup checkout
   */
  async createInvoice(
    amount: number,
    userId: number,
    currency: string = 'USD',
    successUrl?: string,
    cancelUrl?: string,
    orderId?: string,
    orderDescription?: string,
    callbackUrl?: string
  ): Promise<CreateInvoiceResponse> {
    // Generate a unique order ID if not provided
    if (!orderId) {
      orderId = `CHICKFARMS-${userId}-${Date.now()}`;
    }

    // Generate a description if not provided
    if (!orderDescription) {
      orderDescription = `Deposit to ChickFarms account (User ID: ${userId})`;
    }
    
    // Set success URL if not provided
    if (!successUrl) {
      successUrl = `${config.urls.app}/wallet?payment=success`;
    }
    
    // Set cancel URL if not provided
    if (!cancelUrl) {
      cancelUrl = `${config.urls.app}/wallet?payment=cancelled`;
    }
    
    // Set callback URL if not provided - this is where NOWPayments sends payment updates
    if (!callbackUrl) {
      callbackUrl = `${config.urls.api}/api/payments/callback`;
    }
    
    // If we're in mock mode, return a mock invoice
    if (this.isMockMode) {
      console.log('Using mock NOWPayments create invoice response (mock mode)');
      const mockToken = `mock_invoice_${Date.now()}`;
      
      // For testing purposes, create a URL that at least opens a test page
      // In actual production, this would be a real NOWPayments URL
      const testUrl = `${CHECKOUT_API_BASE_URL}/payment-invoice/${mockToken}`;
      
      return {
        id: mockToken,
        token_id: mockToken,
        invoice_url: testUrl,
        success: true,
        status: 'active'
      };
    }

    try {
      // Using the NOWPayments /v1/invoice endpoint
      const payload = {
        price_amount: amount,
        price_currency: currency,
        order_id: orderId,
        order_description: orderDescription,
        ipn_callback_url: callbackUrl,
        success_url: successUrl,
        cancel_url: cancelUrl,
        is_fee_paid_by_user: true // Having the user pay the network fee
      };

      console.log('Creating NOWPayments invoice with payload:', {
        ...payload,
        api_key: '[REDACTED]' // Don't log the actual API key
      });

      const response = await axios.post(
        `${API_BASE_URL}/invoice`,
        payload,
        { headers: this.getHeaders() }
      );

      console.log('Successfully created NOWPayments invoice:', {
        id: response.data.id,
        status: response.data.status,
        invoice_url: response.data.invoice_url
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error creating NOWPayments invoice:', error);
      
      // Log more detailed error information to help with debugging
      if (error.response) {
        console.error('Error response from NOWPayments API:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      // In development, return a mock invoice for testing purposes
      if (process.env.NODE_ENV !== 'production') {
        console.log('Returning mock invoice due to API error in development');
        const mockToken = `mock_error_${Date.now()}`;
        
        // Generate a URL to a demo payment page
        const testUrl = `${CHECKOUT_API_BASE_URL}/payment-invoice/${mockToken}`;
        
        return {
          id: mockToken,
          token_id: mockToken,
          invoice_url: testUrl,
          success: true,
          status: 'active'
        };
      }
      
      // In production, throw the error to be handled by the calling code
      throw error;
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