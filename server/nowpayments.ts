import axios from 'axios';
import { Transaction } from '../shared/schema';
import { config } from './config';

const API_BASE_URL = 'https://api.nowpayments.io/v1';
const CHECKOUT_API_BASE_URL = 'https://nowpayments.io';
const API_KEY = config.nowpayments.apiKey;

// Function to check if NOWPayments API key is configured
export const isNOWPaymentsConfigured = (): boolean => {
  return !!API_KEY; // Simply check if the API key exists
};

// Function to check if NOWPayments IPN secret is configured
export const isIPNSecretConfigured = (): boolean => {
  const ipnSecret = config.nowpayments.ipnSecret;
  return !!ipnSecret; // Simply check if the IPN secret exists
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
  readonly isMockMode: boolean; // Make this public so we can check it from routes

  constructor() {
    if (!API_KEY) {
      console.warn('NOWPayments API key is not provided - using restricted dev mode');
      this.apiKey = '';
      this.isMockMode = true;
    } else {
      this.apiKey = API_KEY;
      this.isMockMode = false;
      console.log('NOWPayments service initialized with production API key');
    }
  }

  private getHeaders() {
    return {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  async getStatus(): Promise<{ status: string }> {
    if (this.isMockMode) {
      console.log('Using mock mode for payment status check');
      return { status: 'DEV_MODE' };
    }
    
    try {
      // Connect to real NOWPayments API
      const response = await axios.get(`${API_BASE_URL}/status`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error checking NOWPayments status:', error);
      // In production mode, throw the real error
      throw error;
    }
  }

  async getAvailableCurrencies(): Promise<AvailableCurrency[]> {
    // If in mock mode, return mock currencies
    if (this.isMockMode) {
      console.log('Using mock mode for available currencies');
      return [
        {
          id: 1,
          name: 'Tether',
          currency: 'USDT',
          is_fiat: false,
          enabled: true,
          min_amount: 10,
          max_amount: 100000,
          image: 'https://nowpayments.io/images/coins/usdt.svg',
          network: 'TRC20'
        },
        {
          id: 2,
          name: 'Bitcoin',
          currency: 'BTC',
          is_fiat: false,
          enabled: true,
          min_amount: 0.001,
          max_amount: 10,
          image: 'https://nowpayments.io/images/coins/btc.svg',
          network: 'BTC'
        },
        {
          id: 3,
          name: 'Ethereum',
          currency: 'ETH',
          is_fiat: false,
          enabled: true,
          min_amount: 0.01,
          max_amount: 100,
          image: 'https://nowpayments.io/images/coins/eth.svg',
          network: 'ETH'
        }
      ];
    }
    
    try {
      console.log('Fetching available currencies from NOWPayments API');
      const response = await axios.get(`${API_BASE_URL}/currencies`, {
        headers: this.getHeaders(),
      });
      
      const currencies = response.data.currencies || [];
      console.log(`Retrieved ${currencies.length} currencies from NOWPayments API`);
      
      // Log the enabled currencies for debugging
      const enabledCurrencies = currencies.filter((c: any) => c.enabled);
      console.log(`Found ${enabledCurrencies.length} enabled currencies`);
      
      if (enabledCurrencies.length > 0) {
        console.log('Available currencies:');
        enabledCurrencies.forEach((currency: any) => {
          console.log(`- ${currency.currency} (${currency.network || 'default network'})`);
        });
      }
      
      return currencies;
    } catch (error: any) {
      console.error('Error getting available currencies:', error);
      
      // Log more detailed error information
      if (error.response) {
        console.error('Error response from NOWPayments API:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      throw error;
    }
  }
  
  /**
   * Checks if USDT is available for payments
   * If not, finds an alternative currency
   */
  async findAvailablePaymentCurrency(preferredCurrency: string = 'USDT'): Promise<string> {
    try {
      const currencies = await this.getAvailableCurrencies();
      
      // Filter to enabled currencies only
      const enabledCurrencies = currencies.filter(c => c.enabled);
      
      // First check if preferred currency is available
      const isPreferredAvailable = enabledCurrencies.some(
        c => c.currency.toUpperCase() === preferredCurrency.toUpperCase()
      );
      
      if (isPreferredAvailable) {
        console.log(`Preferred currency ${preferredCurrency} is available`);
        return preferredCurrency;
      }
      
      // If preferred currency is not available, pick another common one
      console.log(`Preferred currency ${preferredCurrency} is not available, looking for alternatives`);
      
      // List of fallback currencies in order of preference
      const fallbackCurrencies = ['BTC', 'ETH', 'DOGE', 'LTC', 'BNB'];
      
      for (const fallback of fallbackCurrencies) {
        const isAvailable = enabledCurrencies.some(
          c => c.currency.toUpperCase() === fallback.toUpperCase()
        );
        
        if (isAvailable) {
          console.log(`Found alternative currency: ${fallback}`);
          return fallback;
        }
      }
      
      // If none of our preferred options are available, just pick the first enabled one
      if (enabledCurrencies.length > 0) {
        const fallbackCurrency = enabledCurrencies[0].currency;
        console.log(`Using fallback currency: ${fallbackCurrency}`);
        return fallbackCurrency;
      }
      
      // If no currencies are available at all, return the original preference
      // This will likely fail but is better than returning null/undefined
      console.warn('No enabled currencies found, returning original preference');
      return preferredCurrency;
    } catch (error) {
      console.error('Error finding available payment currency:', error);
      // In case of error, return the original preference
      return preferredCurrency;
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
      
      throw error;
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    // In mock mode, return a mocked payment status
    if (this.isMockMode) {
      console.log(`Using mock mode for payment status check for payment ID: ${paymentId}`);
      
      // If this is a DEV- payment ID, it's from our mock invoice
      if (paymentId.startsWith('DEV-')) {
        return {
          payment_id: paymentId,
          payment_status: 'waiting',
          pay_address: '0xMockCryptoAddress123456789',
          price_amount: 100,
          price_currency: 'USD',
          pay_amount: 100,
          pay_currency: 'USDT',
          order_id: `ORDER-${paymentId}`,
          order_description: 'Mock payment for development',
          ipn_callback_url: `${config.urls.api}/api/payments/callback`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          purchase_id: 'mock-purchase',
          payment_extra_id: 'mock-extra'
        };
      }
      
      // For other payment IDs in mock mode, simulate a "not found" scenario
      throw new Error(`Payment with ID ${paymentId} not found in mock mode`);
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
      
      throw error;
    }
  }

  async getMinimumPaymentAmount(currency: string = 'USDT'): Promise<number> {
    // In mock mode, return mock minimum amounts for different currencies
    if (this.isMockMode) {
      console.log(`Using mock mode for minimum payment amount for currency: ${currency}`);
      
      const mockMinAmounts: Record<string, number> = {
        'USDT': 10,
        'BTC': 0.001,
        'ETH': 0.01,
        'DOGE': 50,
        'LTC': 0.1,
        'BNB': 0.1
      };
      
      return mockMinAmounts[currency.toUpperCase()] || 1;
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
      
      // For this specific error, we can safely default to 1 as a reasonable minimum
      // This is not a mock, but a fallback for production when the API doesn't respond
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
    payCurrency: string = 'USDT', // Default pay currency, will be checked for availability
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

    // If in mock mode, return a development invoice URL
    if (this.isMockMode) {
      console.log('Using mock mode for payment invoice creation');
      
      // Create a mock invoice ID
      const mockInvoiceId = `DEV-${userId}-${Date.now()}`;
      
      // Create a mock invoice URL that will simulate a payment flow
      // Using a special HTML page that simulates a payment popup
      const mockInvoiceUrl = `${config.urls.app}/dev-payment.html?invoice=${mockInvoiceId}&amount=${amount}&currency=${currency}&success=${encodeURIComponent(successUrl)}&cancel=${encodeURIComponent(cancelUrl)}`;
      
      return {
        id: mockInvoiceId,
        token_id: 'mock-token',
        invoice_url: mockInvoiceUrl,
        success: true,
        status: 'dev_mode'
      };
    }

    try {
      // Find an available payment currency - first checking if the requested one is available
      console.log(`Checking if ${payCurrency} is available for payments...`);
      const availablePayCurrency = await this.findAvailablePaymentCurrency(payCurrency);
      
      if (availablePayCurrency !== payCurrency) {
        console.log(`Requested currency ${payCurrency} is not available, using ${availablePayCurrency} instead`);
      }
      
      // Using the NOWPayments /v1/invoice endpoint
      const payload = {
        price_amount: amount,
        price_currency: currency,
        pay_currency: availablePayCurrency, // Use the available currency instead of hardcoded USDT
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