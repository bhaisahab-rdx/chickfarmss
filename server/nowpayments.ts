import axios from 'axios';
import { Transaction } from '../shared/schema';
import { config } from './config';

const API_BASE_URL = 'https://api.nowpayments.io/v1';
const CHECKOUT_API_BASE_URL = 'https://nowpayments.io';
const API_KEY = config.nowpayments.apiKey;

export const isNOWPaymentsConfigured = (): boolean => {
  return !!API_KEY;
};

export const isIPNSecretConfigured = (): boolean => {
  const ipnSecret = config.nowpayments.ipnSecret;
  return !!ipnSecret;
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

export interface StandardizedPaymentStatus {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  created_at: string;
  actually_paid: number | null;
  actually_paid_at: string | null;
  updated_at: string | null;
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

  async getStatus(): Promise<{ status: string, message?: string }> {
    if (this.isMockMode) {
      console.log('Using mock mode for payment status check');
      return { status: 'DEV_MODE' };
    }
    
    try {
      console.log('[NOWPayments] Checking API status with key:', this.apiKey ? `${this.apiKey.substring(0, 4)}...` : 'NOT_SET');
      
      // Connect to real NOWPayments API with timeout to prevent hanging
      const response = await axios.get(`${API_BASE_URL}/status`, {
        headers: this.getHeaders(),
        timeout: 5000 // 5 second timeout to prevent long waits
      });
      
      console.log('[NOWPayments] API Status check response:', response.data);
      return response.data;
    } catch (error: any) {
      // Enhanced error logging with more details
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('[NOWPayments] API Error Response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        // The request was made but no response was received
        console.error('[NOWPayments] No response received:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('[NOWPayments] Request setup error:', error.message);
      }
      
      // Return a status that indicates the error instead of throwing
      return { status: 'error', message: error.message };
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
    // Special case for USDT - use USDTTRC20 (USDT on Tron network) by default
    if (preferredCurrency.toUpperCase() === 'USDT') {
      console.log('Converting USDT to USDTTRC20 for Tron network compatibility');
      preferredCurrency = 'USDTTRC20';
    }
    
    // Common fallback currencies in order of preference
    const fallbackCurrencies = ['BTC', 'ETH', 'DOGE', 'LTC', 'BNB'];

    try {
      // Proceed with standard availability check
      const currencies = await this.getAvailableCurrencies();
      const enabledCurrencies = currencies.filter(c => c.enabled);
      
      // Log available currencies for debugging
      console.log(`Available currencies: ${enabledCurrencies.map(c => c.currency).join(', ')}`);
      
      // Check if preferred currency (now USDTTRC20 if it was USDT) is available
      const isPreferredAvailable = enabledCurrencies.some(
        c => c.currency.toUpperCase() === preferredCurrency.toUpperCase()
      );
      
      if (isPreferredAvailable) {
        console.log(`Preferred currency ${preferredCurrency} is available`);
        return preferredCurrency;
      }
      
      // If preferred currency is not available, try fallbacks
      console.log(`Preferred currency ${preferredCurrency} is not available, looking for alternatives`);
      
      // If USDTTRC20 wasn't available, try regular USDT again
      if (preferredCurrency.toUpperCase() === 'USDTTRC20') {
        const isUSDTAvailable = enabledCurrencies.some(
          c => c.currency.toUpperCase() === 'USDT'
        );
        
        if (isUSDTAvailable) {
          console.log('USDTTRC20 not available, but regular USDT is. Using USDT.');
          return 'USDT';
        }
      }
      
      // Try other fallback currencies
      for (const fallback of fallbackCurrencies) {
        const isAvailable = enabledCurrencies.some(
          c => c.currency.toUpperCase() === fallback.toUpperCase()
        );
        
        if (isAvailable) {
          console.log(`Found alternative currency: ${fallback}`);
          return fallback;
        }
      }
      
      // If none of our preferred options are available, pick the first enabled one
      if (enabledCurrencies.length > 0) {
        const fallbackCurrency = enabledCurrencies[0].currency;
        console.log(`Using fallback currency: ${fallbackCurrency}`);
        return fallbackCurrency;
      }
      
      // If no currencies are available at all, return BTC as a last resort
      console.warn('No enabled currencies found, returning BTC as last resort');
      return 'BTC';
    } catch (error) {
      console.error('Error finding available payment currency:', error);
      
      // If we ran into an error, use USDTTRC20 as the preferred option
      console.log('Defaulting to USDTTRC20 due to error');
      return 'USDTTRC20'; 
    }
  }

  async createPayment(
    amount: number, 
    userId: number,
    currency: string = 'USD',
    payCurrency: string = 'USDTTRC20',
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
          pay_currency: 'USDTTRC20',
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
    // Convert USDT to USDTTRC20 for consistency
    if (currency.toUpperCase() === 'USDT') {
      console.log('Converting USDT to USDTTRC20 for minimum payment amount check');
      currency = 'USDTTRC20';
    }
    
    // In mock mode, return mock minimum amounts for different currencies
    if (this.isMockMode) {
      console.log(`Using mock mode for minimum payment amount for currency: ${currency}`);
      
      const mockMinAmounts: Record<string, number> = {
        'USDTTRC20': 10,
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
      
      // The API requires both currency_from and currency_to parameters
      // NOWPayments needs to know what currency you're converting from and to
      const response = await axios.get(
        `${API_BASE_URL}/min-amount?currency_from=${currency}&currency_to=usd`,
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
      
      // Try with a different approach if the first attempt failed
      try {
        console.log(`Retrying with different parameters for currency: ${currency}`);
        
        // Try with both parameters explicitly set
        const retryResponse = await axios.get(
          `${API_BASE_URL}/min-amount/${currency}?currency_to=usd`,
          { headers: this.getHeaders() }
        );
        
        const minAmount = retryResponse.data.min_amount || 1;
        console.log(`Retry successful - Minimum payment amount for ${currency}: ${minAmount}`);
        
        return minAmount;
      } catch (retryError) {
        console.error(`Retry also failed for ${currency}:`, retryError);
        
        // For this specific error, we can safely default to 1 as a reasonable minimum
        // This is not a mock, but a fallback for production when the API doesn't respond
        return 1;
      }
    }
  }
  
  async createInvoice(
    amount: number,
    userId: number,
    currency: string = 'USD',
    payCurrency: string = 'USDTTRC20',
    successUrl?: string,
    cancelUrl?: string,
    orderId?: string,
    orderDescription?: string,
    callbackUrl?: string
  ): Promise<CreateInvoiceResponse> {
    orderId = orderId || `CHICKFARMS-${userId}-${Date.now()}`;
    orderDescription = orderDescription || `Deposit to ChickFarms account (User ID: ${userId})`;
    successUrl = successUrl || `${config.urls.app}/wallet?payment=success`;
    cancelUrl = cancelUrl || `${config.urls.app}/wallet?payment=cancelled`;
    callbackUrl = callbackUrl || `${config.urls.api}/api/payments/callback`;

    if (this.isMockMode) {
      console.log('Using mock mode for payment invoice creation');
      const mockInvoiceId = `DEV-${userId}-${Date.now()}`;
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
      console.log(`Checking if ${payCurrency} is available for payments...`);
      const availablePayCurrency = await this.findAvailablePaymentCurrency(payCurrency);
      
      if (availablePayCurrency !== payCurrency) {
        console.log(`Requested currency ${payCurrency} is not available, using ${availablePayCurrency} instead`);
      }
      
      const payload = {
        price_amount: amount,
        price_currency: currency,
        pay_currency: availablePayCurrency,
        order_id: orderId,
        order_description: orderDescription,
        ipn_callback_url: callbackUrl,
        success_url: successUrl,
        cancel_url: cancelUrl,
        is_fee_paid_by_user: true
      };

      console.log('Creating NOWPayments invoice with payload:', {
        ...payload,
        api_key: '[REDACTED]'
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

  /**
   * Helper method to convert a transaction to a standardized payment status object
   * This ensures consistent types throughout the application
   */
  createStandardizedPaymentStatus(
    paymentId: string,
    transaction: any, // Use any to avoid circular dependencies
    apiPaymentStatus?: PaymentStatusResponse
  ): StandardizedPaymentStatus {
    // Ensure created_at is always a string in ISO format
    const createdAt = transaction.createdAt
      ? transaction.createdAt instanceof Date
        ? transaction.createdAt.toISOString()
        : typeof transaction.createdAt === 'string'
          ? transaction.createdAt
          : new Date(transaction.createdAt).toISOString()
      : new Date().toISOString();
    
    // Create base payment status from transaction
    const base: StandardizedPaymentStatus = {
      payment_id: paymentId,
      payment_status: transaction.status === 'pending' ? 'waiting' : transaction.status,
      pay_address: '',
      price_amount: parseFloat(transaction.amount),
      price_currency: 'USDTTRC20',
      pay_amount: parseFloat(transaction.amount),
      pay_currency: 'USDTTRC20',
      created_at: createdAt, // Always a string in ISO format
      actually_paid: null,
      actually_paid_at: null,
      updated_at: null
    };
    
    // Merge with API payment status if provided
    if (apiPaymentStatus) {
      // Ensure dates are always strings in ISO format
      const apiCreatedAt = apiPaymentStatus.created_at
        ? typeof apiPaymentStatus.created_at === 'string'
          ? apiPaymentStatus.created_at
          : new Date(apiPaymentStatus.created_at).toISOString()
        : base.created_at;
        
      const apiUpdatedAt = apiPaymentStatus.updated_at
        ? typeof apiPaymentStatus.updated_at === 'string'
          ? apiPaymentStatus.updated_at
          : new Date(apiPaymentStatus.updated_at).toISOString()
        : null;
        
      const apiActuallyPaidAt = apiPaymentStatus.actually_paid_at
        ? typeof apiPaymentStatus.actually_paid_at === 'string'
          ? apiPaymentStatus.actually_paid_at
          : new Date(apiPaymentStatus.actually_paid_at).toISOString()
        : null;
    
      return {
        ...base,
        pay_address: apiPaymentStatus.pay_address || base.pay_address,
        payment_status: apiPaymentStatus.payment_status || base.payment_status,
        price_amount: apiPaymentStatus.price_amount || base.price_amount,
        price_currency: apiPaymentStatus.price_currency || base.price_currency,
        pay_amount: apiPaymentStatus.pay_amount || base.pay_amount,
        pay_currency: apiPaymentStatus.pay_currency || base.pay_currency,
        created_at: apiCreatedAt,
        actually_paid: apiPaymentStatus.actually_paid !== undefined ? apiPaymentStatus.actually_paid : null,
        actually_paid_at: apiActuallyPaidAt,
        updated_at: apiUpdatedAt
      };
    }
    
    return base;
  }
}

export const nowPaymentsService = new NOWPaymentsService();